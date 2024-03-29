import os, csv, json, re, sys 
import string 
from collections import defaultdict
import pickle as pkl
from backend import men_disagreement

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
					ann_data[ann]['quote_data'] = eval(val.replace("null", "''"))
				except:
					ann_data[ann]['quote_data'] = val
			
			elif 'chars.json' in key:
				try:
					ann_data[ann]['char_data'] = eval(val.replace("null", "''"))
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

def get_char_info(nameLists):

	# parent2id = {}
	id2name = {}
	name2id = {}
	for key in nameLists:
		id2name[key] = {}
		name2id[key] = {}
		
		for char in nameLists[key]:
			main_name = char['name']
			id_ = char['parent']
			
			id2name[key][id_] = main_name
			name2id[key][main_name] = id_
			for alias in char['expand']:
				name2id[key][alias['name']] = id_

	return id2name, name2id

def match_quote_mentions(qr, mr):

	ordered_quotes = sorted(list(qr.keys()), key=lambda x: int(x.split("_")[0]))
	ordered_mentions = sorted(list(mr.keys()), key=lambda x: int(x.split("_")[0]))

	mentions = defaultdict(list)

	i = 0
	j = 0
    
	while i<len(ordered_quotes) and j<len(ordered_mentions):
		m_start, m_end = ordered_mentions[j].split("_")
		q_start, q_end = ordered_quotes[i].split("_")
		
	#         print(m_start, m_end, q_start, q_end)
		
		if (int(m_start) >= int(q_start)) and (int(m_end)<= int(q_end)):
			#add to array at index
			qind = ordered_quotes[i]
			mind = ordered_mentions[j]
			
			# if qind not in mentions:
			# 	mentions[qind] = []

			mentions[qind].append(mind)
			j += 1
		else:
			i += 1

	return mentions


def check_character_equivalent(id1, id2, name2id, annotator_names):

	id2names = {}
	for ann in annotator_names:
		id2names[ann] = defaultdict(list)
		for name,id_ in name2id[ann].items():
			id2names[ann][id_].append(name)
	
	names1 = set(id2names[annotator_names[0]][id1])
	names2 = set(id2names[annotator_names[1]][id2])

	common = names1.intersection(names2)
	if len(common) > 0:
		return True, list(common)[0]
	else:
		return False, ''

def check_group_equivalent(speakees1, speakees2, name2id, annotator_names):

	if len(speakees1) == len(speakees2) == 0:
		return True

	id2names = {}
	ids1 = set(speakees1[:])
	ids2 = set(speakees2[:])

	for ann in annotator_names:
		id2names[ann] = defaultdict(list)
		for name,id_ in name2id[ann].items():
			id2names[ann][id_].append(name)
	
	if len(ids1) != len(ids2):
		return False
	
	s2id1 = {}
	s2id2 = {}
	for a_name, slist, s2id in zip(annotator_names, [ids1, ids2], [s2id1, s2id2]):
		for s in slist:
			for n in id2names[a_name][s]:
				s2id[n] = s 
	
	common_names = set(s2id1.keys()).intersection(set(s2id2.keys()))

	for com in common_names:
		id1 = s2id1[com]
		id2 = s2id2[com]

		if id1 in ids1:
			ids1.remove(id1)
		if id2 in ids2:
			ids2.remove(id2)
	
	if len(ids1) == 0 and len(ids2) == 0:
		return True 
	
	return False

def strip_punct(s):
	return ''.join([x for x in s if x not in string.punctuation])

def text_close(t1, t2):
	
	t1_ = "".join([x for x in t1 if x.isalpha()])
	t2_ = "".join([x for x in t2 if x.isalpha()])
#     print(t1_[2:-2])
#     print(t2_[2:-2])
	
	return (t1_[3:-3] in t2_) or (t2_[3:-3] in t1_)

def close(r1, r2, text1, text2):
	s1, e1 = [int(x) for x in r1.split("_")]
	s2, e2 = [int(x) for x in r2.split("_")]
	
	if (((s1 == s2) or (e1==e2)) and text_close(text1, text2)) or \
	(((abs(s1-s2)<3) or (abs(e1-e2)<3)) and text_close(text1, text2)) or \
	((abs(s1-s2)==abs(e1-e2) and text_close(text1, text2))):
		return True

def get_text(text, key):
	s = [int(x) for x in key.split("_")]
	s, e = s[0], s[1]
	return text[s:e]

def match_lones(wolfs, texts):
	new_wolfs = {}
	w2nw = {}
	
	try:
		keys = sorted(wolfs.keys())
		# print(keys)
		# w2nw = {}
		for k in keys:
			w2nw[k] = {}


		wolf1 = sorted(wolfs[keys[0]])
		wolf2 = sorted(wolfs[keys[1]])
		
		i=0
		j=0
		
		while (i<len(wolf1) and j<len(wolf2)):
			k1 = wolf1[i]
			k2 = wolf2[j]
			t1 = get_text(texts[keys[0]], k1)
			t2 = get_text(texts[keys[1]], k2)
			
			if close(k1, k2, t1, t2):
				# print("Match!", k1, k2)
				k = k1 if (len(t1)>=len(t2)) else k2
				t = t1 if (len(t1)>=len(t2)) else t2
				new_wolfs[k] = t
				w2nw[keys[0]][k1] = k
				w2nw[keys[1]][k2] = k
	#             del wolfs[keys[0]][k1]
	#             del wolfs[keys[1]][k2]
				
				i += 1
				j += 1
			
			elif (k1>k2):
				j += 1
			else:
				i += 1
		
		#remove
	#     wolfs[keys[0]] = [x for x in wolfs[keys[0]] if x not in remove[keys[0]]]
	#     wolfs[keys[1]] = [x for x in wolfs[keys[1]] if x not in remove[keys[1]]]
		
		return new_wolfs, w2nw
	except:
		return new_wolfs, w2nw

def get_disagreements(data):

	# mr_to_text, mr_to_speakee, mr_unmatched, mr_disagreements = men_disagreement.get_disagreements(data)

	ann_data, title = read_data(data)
	
	if not os.path.isdir('./temp'):
		os.mkdir('./temp')

	if not os.path.isfile(os.path.join('./temp', 'log.txt')):
		mode = 'w'
	else:
		mode = 'a'
	
	log_file = open(os.path.join('./temp', 'log.txt'), mode)
	pkl.dump(ann_data, open('./temp/'+title+'_data.pkl', 'wb'))

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
	annotator_names = sorted(list(quote_anns.keys()))

	id2char, char2id = get_char_info(character_anns)
	# for ann in annotator_names:
	# 	id2char[ann][-1] = "None"
	# 	char2id[ann]["None"] = -1
		
	r_to_text = {}
	r_to_spanids = {}

	for key in quote_anns:
		for span_id, ranges in quote_anns[key]['quote_ranges'].items():
			start, end = ranges['start'], ranges['end']

			u = str(start) + "_" + str(end)

			# if span_id in quote_anns[key]['quote_infos']:

			#if u not in r_to_text:
			q_text = texts[key][start:end]
			
			if u not in r_to_text:
				r_to_text[u] = {}
				r_to_spanids[u] = {}
			
			r_to_text[u][key] = q_text    
			r_to_spanids[u][key] = span_id      

	print(len(r_to_text))

	lone_wolfs = {k: {} for k in quote_anns.keys()}
	for key in r_to_text:
		if len(r_to_text[key]) !=2:
			a = list(r_to_text[key].keys())[0]
			# if a not in lone_wolfs:
			# 	lone_wolfs[a] = {}
			lone_wolfs[a][key] = 1
	print("lone_wolfs: ", [len(x) for y, x in lone_wolfs.items()])
	ann_lone = {}
	for ann in lone_wolfs:
		ann_lone[ann]=list(lone_wolfs[ann].keys())
	
	new_wolfs, w2nw = match_lones(ann_lone, texts)
	for ann in w2nw:
		for k, k_ in w2nw[ann].items():
			del r_to_text[k]

	for k_, t in new_wolfs.items():
		if k_ not in r_to_text:
			r_to_text[k_] = {}
		for ann in w2nw:
			r_to_text[k_][ann] = new_wolfs[k_]

	unmatched = {}
	for ann in lone_wolfs:
		for k in lone_wolfs[ann]:
			if k not in w2nw[ann]:
				unmatched[k] = 1

	# qr2mr = match_quote_mentions(r_to_text, mr_to_text)

	range_starts_to_id = {}
	range_ends_to_id = {}
	range_to_id = {}
	for ann, quote_inf in quote_anns.items():
		for key, range_ in quote_inf['quote_ranges'].items():
			start = range_['start']
			end = range_['end']
			
			un = str(start) + "_" + str(end)
			
			# if key in quote_inf['quote_infos']:
			
			if start not in range_starts_to_id:
				range_starts_to_id[start] = {}
			range_starts_to_id[start][ann] = key
			
			if end not in range_ends_to_id:
				range_ends_to_id[end] = {}
			range_ends_to_id[end][ann] = key
			
			if un not in range_to_id:
				range_to_id[un] = {}
			range_to_id[un][ann] = key
	
	print(len(range_to_id))
	print(title, file=log_file)
	print("range_starts_to_id, range_ends_to_id, range_to_id: ", len(range_starts_to_id), len(range_ends_to_id), len(range_to_id), file=log_file)
	
	# assert len(r_to_text) == len(range_to_id), print("Len mismatch: ", len(r_to_text), len(range_to_id))
	for ann in w2nw:
		for k, k_ in w2nw[ann].items():
			if k_!=k:
				ann_id = range_to_id[k][ann]
				range_to_id[k_][ann] = ann_id
				del range_to_id[k]

	# for k_, t in new_wolfs.items():
	# 	if k_ not in r_to_text:
	# 		r_to_text[k_] = {}
	# 	for ann in w2nw:
	# 		r_to_text[k_][ann] = new_wolfs[k_]



	r_to_speakers = {} #character ids
	r_to_speakees = {}
	r_to_qtype = {}
	r_to_reftext = {}
	
	
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
				cur_info = [s for s in qinfo['speaker'] if s in id2char[ann]]
				# for speaker in qinfo['speaker']:
				# 	# cur_info.append(id2char[ann][speaker])  
				# 	cur_info.append(speaker)
				# assert len(cur_info) == 1, print(ann, r)
				r_to_speakers[r].append(cur_info)

				#speakee
				cur_info = [s for s in qinfo['speakee'] if s in id2char[ann]]
				# for speakee in qinfo['speakee']:
				# 	# cur_info.append(id2char[ann][speakee])
				# 	cur_info.append(speakee)
				# assert len(cur_info) > 0, print(ann, r)
				r_to_speakees[r].append(cur_info)

				#quote type
				r_to_qtype[r].append(qinfo['quote_type'])

				#ref exp
				r_to_reftext[r].append(qinfo['ref_exp'])
			else:
				r_to_speakers[r].append([])
				r_to_speakees[r].append([])
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
				r_disagreements[r] = {}
			r_disagreements[r]['quote_type'] = r_to_qtype[r]
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
				r_disagreements[r] = {}
			r_disagreements[r]['ref_exp'] =  exps
			#print()


	print("Count: ", len(r_disagreements), file=log_file)


	#speaker
	print("Disagreements: Speaker", file=log_file)
	for r, text in r_to_text.items():
		#try:
			is_eq = True
			speakers = []

			assert len(r_to_speakers[r])==2, print("Less than 2 annotations:", r)

			s1, s2 = r_to_speakers[r][0], r_to_speakers[r][1]

			assert len(s1) <=1, print("More than one speaker: ", r)
			assert len(s2) <=1, print("More than one speaker: ", r)

			if len(r_to_speakers[r][0]) == len(r_to_speakers[r][1]) == 0:
				is_eq = True

			elif len(r_to_speakers[r][0]) != len(r_to_speakers[r][1]):
				is_eq = False

			else:
				is_eq, _ = check_character_equivalent(s1[0], s2[0], char2id, annotator_names)

			if not is_eq:
				if r not in r_disagreements:
					r_disagreements[r] = {}
				r_disagreements[r]['speaker'] = [[id2char[annotator_names[0]][s] for s in s1], [id2char[annotator_names[1]][s] for s in s2]]


	print("Count: ", len(r_disagreements), file=log_file)

	#speakee
	print("Disagreements: Speakee", file=log_file)
	for r, text in r_to_text.items():
		is_eq = True

		assert len(r_to_speakees[r])==2, print("Less than 2 speakee annotations:", r)
		# if len(r_to_speakees[r]) <2 :
		# 	is_eq = False
		# else:
		speakees1, speakees2 = r_to_speakees[r][0], r_to_speakees[r][1]
		is_eq = check_group_equivalent(speakees1, speakees2, char2id, annotator_names)
		if not is_eq:
			if r not in r_disagreements:
				r_disagreements[r] = {}
			
			l1 = set([id2char[annotator_names[0]][s] for s in speakees1])
			l2 = set([id2char[annotator_names[1]][s] for s in speakees2])
			# ldiff = (l1 - l2).union(l2 - l1)
			r_disagreements[r]['speakee'] = [list(l1 - l2), list(l2 - l1)]
			#print()

			
	print("Count: ", len(r_disagreements), file=log_file)
	
	print("Total ratio: ", len(r_disagreements)/len(r_to_text), file=log_file)

	field_mapping = {
		'SPEAKEE': 'ADDRESSEE'
	}

	value_mapping = {
		'Anaphoric': 'Pronominal',
		'Explicit': 'Named',
		'Implicit': 'Implicit',
		'': 'Unannotated'
	}
	
	#all disagreements
	print("Writing disagreements: ")
	file_name = title + '_disagreements.txt'
	file_path = os.path.join('./temp', file_name)
	with open(file_path, 'w') as f:
		print("\t\t\t DISAGREEMENTS \t\t\t", file=f)
		print("--"*20, file=f)
		print("\n", file=f)
		for r in r_to_text:
			quote_dis = 0
			# men_dis = 0
			r_text = ''
			if r in unmatched:
				k = list(r_to_text[r].keys())[0]
				r_text = r_to_text[r][k]
			else:
				#pick any annotator
				k = annotator_names[0]
				r_text = r_to_text[r][k]
			if r in r_disagreements:
				quote_dis = 1
				if r in unmatched:
					if (r_to_qtype[r][0] == '') and (r_to_qtype[r][1] == ''):
						continue 
					else:
						print("[UNMATCHED]", end='  ', file=f)

				print('"' + r_text + '"', file=f)
				for field in r_disagreements[r]:
					if field.upper() in field_mapping:
						field_print = field_mapping[field.upper()]
					else:
						field_print = field
					print(field_print.upper(), file=f)
					info = r_disagreements[r][field]
					if field == 'ref_exp':
						info = [inf.replace("\n", " ") for inf in info]
					elif field == 'speaker':
						info = info 
					elif field == 'speakee':
						info = info

					elif field == 'quote_type':
						info = [value_mapping[s] for s in info]

					assert len(info) == len(annotator_names), print(info)
					for ann, ainf in zip(annotator_names, info):
						print(ann + ": " + str(ainf), file=f)

				print("\n", file=f)

			#mentions
			# r_m_ids = qr2mr[r]
			# r_m_ids = [x for x in r_m_ids if x in mr_disagreements]
			# if len(r_m_ids) > 0:
			# 	men_dis = 1
			# 	if quote_dis == 0:
			# 		print(r_text, file=f)

			# 	print("---MENTIONS---", file=f)
			# for mr in r_m_ids:
			# 	mr_text = ''
			# 	if mr in mr_unmatched:
			# 		k = list(mr_to_text[mr].keys())[0]
			# 		mr_text = mr_to_text[mr][k]
			# 		if (mr_to_speakee[mr][0] == []) and (mr_to_speakee[mr][1] == []):
			# 			continue 
			# 		else:
			# 			print("[UNMATCHED]", end='  ', file=f)
			# 	else:
			# 		#pick any annotator
			# 		k = annotator_names[0]
			# 		mr_text = mr_to_text[mr][k]
			# 	print('"' + mr_text + '"', file=f)
			# 	info = mr_disagreements[mr]['speakee']
			# 	assert len(info) == len(annotator_names), print(info)
			# 	for ann, ainf in zip(annotator_names, info):
			# 		print(ann + ": " + str(ainf), file=f)
			# 	print("\n", file=f)



				#print("\t", end='')
				# info = mapping[field]
				
				# for ann_id, ann in enumerate(annotator_names):
				# 	try:
				# 		ann_info = info[r][ann_id]
				# 		if field == 'ref_exp':
				# 			ann_info = ann_info.replace("\n", " ")
				# 		elif field == 'speaker':
				# 			ann_info = id_chars[ann_info[0]][0]
				# 		elif field == 'speakee':
				# 			ann_info = sorted([id_chars[x][0] for x in ann_info])

				# 		elif field == 'quote_type':
				# 			if ann_info in value_mapping:
				# 				ann_info = value_mapping[ann_info]

				# 		print("\t", ann.capitalize()+": ", ann_info, file=f)
					# except:
					# 	pass
			if quote_dis > 0:
				print("-"*15, file=f)

	#read and return 
	print("--"*50, file=log_file)
	log_file.close()

	with open(file_path, 'r') as f:
		content = f.read().strip()

	os.remove(file_path)

	return content, title 
	
	#return os.path.join('./temp', title, file_name)



