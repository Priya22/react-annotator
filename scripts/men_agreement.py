import os, csv, json, re, sys 
import string 
from collections import defaultdict
import pickle as pkl

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

def check_group_equivalent(speakees1, speakees2, name2id, id2parent, annotator_names):

	if len(speakees1) == len(speakees2) == 0:
		return True, []

	if len(speakees1) == 0:
		return True, [id2parent[annotator_names[1]][s] for s in speakees2]
	if len(speakees2) == 0:
		return True, [id2parent[annotator_names[0]][s] for s in speakees1]

	id2names = {}
	ids1 = set(speakees1[:])
	ids2 = set(speakees2[:])

	for ann in annotator_names:
		id2names[ann] = defaultdict(list)
		for name,id_ in name2id[ann].items():
			id2names[ann][id_].append(name)
	
	# if len(ids1) != len(ids2):
	# 	return False
	
	s2id1 = {}
	s2id2 = {}
	for a_name, slist, s2id in zip(annotator_names, [ids1, ids2], [s2id1, s2id2]):
		for s in slist:
			for n in id2names[a_name][s]:
				s2id[n] = s 
	
	common_names = set(s2id1.keys()).intersection(set(s2id2.keys()))

	chars = []

	for com in common_names:
		id1 = s2id1[com]
		id2 = s2id2[com]

		name = id2parent[annotator_names[0]][id1]
		name2 = id2parent[annotator_names[1]][id2]

		if len(name2) > len(name):
			name = name2
		present1 = False
		present2 = False 

		if id1 in ids1:
			ids1.remove(id1)
			present1 = True
		if id2 in ids2:
			ids2.remove(id2)
			present2 = True 
		
		if present1 and present2:
			chars.append(name)
	
	if len(ids1) == 0 and len(ids2) == 0:
		return True, chars  
	
	return False, chars

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

def find_agreements(ann_data, title, dest):
	
	write_folder = os.path.join(dest, title)
	if not os.path.isfile(os.path.join(write_folder, 'log.txt')):
		mode = 'w'
	else:
		mode = 'a'

	log_file = open(os.path.join(write_folder, 'log.txt'), mode)

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
		
	print("MENTIONS: ", file=log_file)

	r_to_text = {}
	r_to_spanids = {}

	for key in quote_anns:
		for span_id, ranges in quote_anns[key]['men_ranges'].items():
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
	print("mention lone_wolfs: ", [len(x) for y, x in lone_wolfs.items()])
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

	range_starts_to_id = {}
	range_ends_to_id = {}
	range_to_id = {}
	for ann, quote_inf in quote_anns.items():
		for key, range_ in quote_inf['men_ranges'].items():
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

	r_to_speakees = {}
	
	for r in range_to_id:
	
		if r not in r_to_speakees:
			r_to_speakees[r] = []
		
		for an_id, ann in enumerate(annotator_names):
			if ann in range_to_id[r]:
				
				qid = range_to_id[r][ann]
				qinfo = quote_anns[ann]['men_infos'][qid]

				#speakee
				cur_info = [s for s in qinfo['speakee'] if s in id2char[ann]]
				# for speakee in qinfo['speakee']:
				# 	# cur_info.append(id2char[ann][speakee])
				# 	cur_info.append(speakee)
				# assert len(cur_info) > 0, print(ann, r)
				r_to_speakees[r].append(cur_info)

			else:
				r_to_speakees[r].append([])
				
				
	r_disagreements = {}
	r_agreements = {}
	
	print("len(range_to_id), len(r_to_text),len(r_to_speakees): ", len(range_to_id), len(r_to_text),len(r_to_speakees), file=log_file)
	
	mapping = {
	'speakee': r_to_speakees
	}

	#speakee
	print("Speakee", file=log_file)
	for r, text in r_to_text.items():
		is_eq = True
		speakees = []
		if len(r_to_speakees[r])==2:
		# if len(r_to_speakees[r]) <2 :
		# 	is_eq = False
		# else:
			speakees1, speakees2 = r_to_speakees[r][0], r_to_speakees[r][1]
			is_eq, speakees = check_group_equivalent(speakees1, speakees2, char2id, id2char, annotator_names)
		
		elif len(r_to_speakees[r])==1:
			is_eq, speakees = True, r_to_speakees[r][0]

		if not is_eq:
			if r not in r_disagreements:
				r_disagreements[r] = {}
			r_disagreements[r]['speakee'] = [[id2char[annotator_names[0]][s] for s in speakees1], [id2char[annotator_names[1]][s] for s in speakees2]]
			#print()
		if len(speakees) > 0:
			if r not in r_agreements:
				r_agreements[r] = {}
			r_agreements[r]['speakee'] = speakees

			
	print("Count: ", len(r_agreements), len(r_disagreements), file=log_file)
	
	print("Total ratio: ", len(r_agreements)/len(r_to_text), len(r_disagreements)/len(r_to_text), file=log_file)

	pkl.dump(r_agreements, open(os.path.join(write_folder, 'mentionr_agreements.dict.pkl'), 'wb'))
	pkl.dump(r_disagreements, open(os.path.join(write_folder, 'mentionr_disagreements.dict.pkl'), 'wb'))
	pkl.dump(r_to_text, open(os.path.join(write_folder, 'mentionr_to_text.dict.pkl'), 'wb'))
	pkl.dump(range_to_id, open(os.path.join(write_folder, 'mentionr_to_spanids.dict.pkl'), 'wb'))
	pkl.dump(unmatched, open(os.path.join(write_folder, 'mentionr_unmatched.dict.pkl'), 'wb'))

	return r_agreements, r_disagreements, r_to_text, range_to_id

def get_disagreements(data):
	ann_data, title = read_data(data)
	r_agreements, r_disagreements, r_to_text, range_to_id = find_agreements(ann_data, title)
	return r_agreements, r_disagreements, r_to_text, range_to_id