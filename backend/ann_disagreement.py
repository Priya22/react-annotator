import os, csv, json, re, sys 
import string 
from collections import defaultdict


def read_data(data):
	try:
		data = eval(data)
	except:
		data = data 

	ann_names = data.keys()

	ann_data = {}

	for ann in ann_names:
		ann_data[ann] = {}

		for key, val in data[ann].items():
			if 'quotes.json' in key:
				try:
					ann_data[ann]['quote_data'] = eval(val)
				except:
					ann_data[ann]['quote_data'] = val
			
			elif 'chars.json' in key:
				try:
					ann_data[ann]['char_data'] = eval(val)
				except:
					ann_data[ann]['char_data'] = val

			elif '.txt' in key:
				title = "".join(key.split(".")[:-1])
				ann_data[ann]['text'] = val.strip()
			else:
				pass 

				
	
	return ann_data, title


def read_single(data):
	ann_data = {}

	data = eval(data)
	title=''

	for key, val in data.items():
		if 'quotes.json' in key:
			ann_data['quote_data'] = eval(val)
		
		elif 'chars.json' in key:
			ann_data['char_data'] = eval(val)

		elif '.txt' in key:
			title = "".join(key.split(".")[:-1])
			ann_data['text'] = val.strip()
		else:
			pass 

	return ann_data, title

def get_char_info(character_anns):

	char_id = {}
	id_ = 0
	for ann in character_anns:
		for char in character_anns[ann]:
			cur_names = [char['name']]
			for alias in char['expand']:
				cur_names.append(alias['name'])
			present = []
			dup_names = []
			for name in cur_names:
				if name in char_id:
					present.append(char_id[name])
					dup_names.append(name)
					
			if len(present) > 0:
				#pick id
				cur_id = present[0]
				#remove the rest
				
				for dup in dup_names:
					del char_id[dup]
				
				#add 
				for name in cur_names:
					if name not in char_id:
						char_id[name] = cur_id
			else:
				for name in cur_names:
					char_id[name] = id_
				id_ = id_ + 1

	char_id['None'] = -1
	char_id[''] = -1
	id_chars = {}
	for key, val in char_id.items():
		if val not in id_chars:
			id_chars[val] = []
		id_chars[val].append(key)
		
	print("Number of characters: ", len(id_chars))
	#id_chars[-1] = ['None']

	return char_id, id_chars

def get_disagreements(data):

	ann_data, title = read_data(data)
	
	if not os.path.isdir('./temp'):
		os.mkdir('./temp')

	if not os.path.isfile(os.path.join('./temp', 'log.txt')):
		mode = 'w'
	else:
		mode = 'a'
	
	log_file = open(os.path.join('./temp', 'log.txt'), mode)

	# if not os.path.isdir(os.path.join('./temp', title)):
	# 	os.mkdir(os.path.join('./temp', title))

	character_anns = {}
	for ann in ann_data:
		character_anns[ann] = ann_data[ann]['char_data']

	quote_anns = {}
	for ann in ann_data:
		quote_anns[ann] = ann_data[ann]['quote_data']

	texts = {}
	for ann in ann_data:
		texts[ann] = ann_data[ann]['text']

	#check primary name match

	char_id, id_chars = get_char_info(character_anns)
	
	r_to_text = {}
	for key in quote_anns:
		for _, ranges in quote_anns[key]['quote_ranges'].items():
			start, end = ranges['start'], ranges['end']

			u = str(start) + "_" + str(end)

			#if u not in r_to_text:
			q_text = texts[key][start:end]
			
			if u not in r_to_text:
				r_to_text[u] = {}
			
			r_to_text[u][key] = q_text          


	lone_wolfs = {}
	for key in r_to_text:
		if len(r_to_text[key]) !=2:
			lone_wolfs[key] = 1
	

	range_starts_to_id = {}
	range_ends_to_id = {}
	range_to_id = {}
	for ann, quote_inf in quote_anns.items():
		for key, range_ in quote_inf['quote_ranges'].items():
			start = range_['start']
			end = range_['end']
			
			un = str(start) + "_" + str(end)
			
			
			if start not in range_starts_to_id:
				range_starts_to_id[start] = {}
			range_starts_to_id[start][ann] = key
			
			if end not in range_ends_to_id:
				range_ends_to_id[end] = {}
			range_ends_to_id[end][ann] = key
			
			if un not in range_to_id:
				range_to_id[un] = {}
			range_to_id[un][ann] = key
			
	print(title, file=log_file)
	print("range_starts_to_id, range_ends_to_id, range_to_id: ", len(range_starts_to_id), len(range_ends_to_id), len(range_to_id), file=log_file)
	
	assert len(r_to_text) == len(range_to_id)
	
	r_to_speakers = {} #character ids
	r_to_speakees = {}
	r_to_qtype = {}
	r_to_reftext = {}
	
	annotator_names = sorted(list(quote_anns.keys()))
	
	for r in range_to_id:
		if r not in r_to_speakers:
			r_to_speakers[r] = []
		if r not in r_to_speakees:
			r_to_speakees[r] = []
		if r not in r_to_qtype:
			r_to_qtype[r] = []
		if r not in r_to_reftext:
			r_to_reftext[r] = []
		
		for an_id, ann in enumerate(annotator_names):
			if ann in range_to_id[r]:
				
				qid = range_to_id[r][ann]
				qinfo = quote_anns[ann]['quote_infos'][qid]

				#speaker
				cur_info = []
				for speaker in qinfo['speaker']:
					cur_info.append(char_id[speaker])
				r_to_speakers[r].append(cur_info)

				#speakee
				cur_info = []
				for speakee in qinfo['speakee']:
					cur_info.append(char_id[speakee])
				r_to_speakees[r].append(cur_info)

				#quote type
				r_to_qtype[r].append(qinfo['quote_type'])

				#ref exp
				r_to_reftext[r].append(qinfo['ref_exp'])
			else:
				r_to_speakers[r].append([-1])
				r_to_speakees[r].append([-1])
				r_to_qtype[r].append('')
				r_to_reftext[r].append('')
				
				
	r_disagreements = {}
	
	print("len(range_to_id), len(r_to_text), len(r_to_qtype), len(r_to_reftext), len(r_to_speakees), len(r_to_speakers): ", len(range_to_id), len(r_to_text), len(r_to_qtype), len(r_to_reftext), len(r_to_speakees), len(r_to_speakers), file=log_file)
	
	mapping = {
	'quote_type': r_to_qtype,
	'ref_exp': r_to_reftext,
	'speaker': r_to_speakers,
	'speakee': r_to_speakees
	}

	print("Disagreements: Quote Type", file=log_file)
	for r, text in r_to_text.items():
		#quote type
		if (len(r_to_qtype[r]) <2) or len(set(r_to_qtype[r])) > 1:
	#         print(r, text)
	#         print(len(r_to_qtype[r]))
	#         for i, q in enumerate(r_to_qtype[r]):
	#             print(annotator_names[i], q, sep='\t')
			if r not in r_disagreements:
				r_disagreements[r] = []
			r_disagreements[r].append('quote_type')
			#print()


	print("Count: ", len(r_disagreements), file=log_file)

	print("Disagreements: ref Exp", file=log_file)
	for r, text in r_to_text.items():
		#ref exp
		exps = []
		for e in r_to_reftext[r]:
			e = e.replace("\n", " ")
			e = e.translate(str.maketrans('', '', string.punctuation))
			exps.append(e.strip())

		if (len(exps) < 2) or len(set(exps)) > 1:
			#print(r, text)
			#print(exps)
	#         for i, q in enumerate(r_to_reftext[r]):
	#             print(annotator_names[i], q.replace("\n", " "), sep='\t')
			if r not in r_disagreements:
				r_disagreements[r] = []
			r_disagreements[r].append('ref_exp')
			#print()


	print("Count: ", len(r_disagreements), file=log_file)


	#speaker
	print("Disagreements: Speaker", file=log_file)
	for r, text in r_to_text.items():
		#try:
			speaker_ids = []
		
			for s in r_to_speakers[r]:
				if len(s) == 0:
					speaker_ids.append(-1)
				else:
					speaker_ids.append(s[0])

			if len(set(speaker_ids)) > 1:
	#             print(r, text)

	#             for i, q in enumerate(speaker_ids):
	#                 print(annotator_names[i],  id_chars[q][0], sep='\t')
				if r not in r_disagreements:
					r_disagreements[r] = []
				r_disagreements[r].append('speaker')
				#print()

		# except Exception as e:
		# 		print("ERROR: ", r)

	print("Count: ", len(r_disagreements), file=log_file)

	#speakee
	print("Disagreements: Speakee", file=log_file)
	for r, text in r_to_text.items():
		speakee_str = []
		for s in r_to_speakees[r]:
			speakee_str.append('_'.join(id_chars[x][0] for x in sorted(s)))

		if len(set(speakee_str)) > 1:
			#print(r, text)

	#         for i, q in enumerate(speakee_str):
	#             print(annotator_names[i],  speakee_str[i].split("_"), sep='\t')
			if r not in r_disagreements:
				r_disagreements[r] = []
			r_disagreements[r].append('speakee')
			#print()

			
	print("Count: ", len(r_disagreements), file=log_file)
	
	print("Total ratio: ", len(r_disagreements)/len(r_to_text), file=log_file)

	field_mapping = {
		'SPEAKEE': 'ADDRESSEE'
	}

	value_mapping = {
		'Anaphoric': 'Pronominal',
		'Explicit': 'Named'
	}
	
	#all disagreements
	print("Writing disagreements: ")
	file_name = title + '_disagreements.txt'
	file_path = os.path.join('./temp', file_name)
	with open(file_path, 'w') as f:
		print("\t\t\t DISAGREEMENTS \t\t\t", file=f)
		print("--"*100, file=f)
		print("\n", file=f)
		for r in r_disagreements:
			r_text = ''
			if r in lone_wolfs:
				print("[UNMATCHED]", end='  ', file=f)
				k = list(r_to_text[r].keys())[0]
				r_text = r_to_text[r][k]
			else:
				#pick any annotator
				k = annotator_names[0]
				r_text = r_to_text[r][k]

			print('"' + r_text + '"', file=f)
			for field in r_disagreements[r]:
				if field.upper() in field_mapping:
					field_print = field_mapping[field.upper()]
				else:
					field_print = field
				print(field_print.upper(), file=f)
				#print("\t", end='')
				info = mapping[field]
				
				for ann_id, ann in enumerate(annotator_names):
					try:
						ann_info = info[r][ann_id]
						if field == 'ref_exp':
							ann_info = ann_info.replace("\n", " ")
						elif field == 'speaker':
							ann_info = id_chars[ann_info[0]][0]
						elif field == 'speakee':
							ann_info = sorted([id_chars[x][0] for x in ann_info])

						elif field == 'quote_type':
							if ann_info in value_mapping:
								ann_info = value_mapping[ann_info]

						print("\t", ann.capitalize()+": ", ann_info, file=f)
					except:
						pass
			print("-"*50, file=f)

	#read and return 
	print("--"*50, file=log_file)
	log_file.close()

	with open(file_path, 'r') as f:
		content = f.read().strip()

	os.remove(file_path)

	return content, title 
	
	#return os.path.join('./temp', title, file_name)



