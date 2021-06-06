import os, re, sys, json
from collections import defaultdict

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

def get_common_ids(name2id, id2parent):
	annotators = sorted(name2id.keys())

	common = []
	resolved = set()

	# for ann in annotators:
	name2id1 = name2id[annotators[0]]
	name2id2 = name2id[annotators[1]]

	names1 = set(name2id1.keys())
	names2 = set(name2id2.keys())

	common_names = names1.intersection(names2)

	for name in common_names:
		id1 = name2id1[name]
		id2 = name2id2[name]

		if (id1, id2) in resolved:
			continue 
		else:
			resolved.add((id1, id2))
			common.append([(id1, id2parent[annotators[0]][id1]),(id2, id2parent[annotators[1]][id2])])

	return common

def get_status(nameLists):
	'''
	returns an id2status dictionary that has 0 if a character an aliases
	match up for both lists, and 1 otherwise. 
	'''
	ann_names = sorted(nameLists.keys())
	ann1, ann2 = ann_names
	id2parent, name2id = get_char_info(nameLists)

	indicator = 1

	common = get_common_ids(name2id, id2parent)

	id2match = {ann1: {}, ann2: {}}

	for c in common:
		id1, id2 = c 
		id1 = id1[0]
		id2 = id2[0]
		id2match[ann1][id1] = id2 
		id2match[ann2][id2] = id1

	for ann in ann_names:
		other_ann = [x for x in ann_names if x!=ann][0]
		for i, char in enumerate(nameLists[ann]):
			if char['id'] in id2match[ann]:
				id1 = char['id']
				id2 = id2match[ann][id1]
				#match
				if id2parent[ann][id1] == id2parent[other_ann][id2]:
					char['status'] = 2
				else:
					char['status'] = 1
			else:
				char['status'] = 0
				indicator = 0
				

	return nameLists, indicator

	# for i, ann in ann_names:
	# 	other_ann = [k for k in ann_names if k!=ann][0]
	# 	other_list = parent2id[other_ann]
		
	# 	id2status[ann] = {}
		
	# 	for parent, pid in parent2id[ann].items():
	# 		if parent not in other_list:
	# 			id2status[ann][pid] = 0
	# 			indicator = 0
	# 		else:
	# 			other_pid = parent2id[other_ann][parent]
	# 			aliasList1 = id2names[ann][pid]
	# 			aliasList2 = id2names[other_ann][other_pid]
				
	# 			if set(aliasList1) != set(aliasList2):
	# 				id2status[ann][pid] = 1
	# 				indicator = 0
	# 			else:
	# 				id2status[ann][pid]= 2
	# for key in nameLists.keys():
	# 	for i, char in enumerate(nameLists[key]):
	# 		char['status'] = id2status[key][char['id']]
	# 		nameLists[key][i] = char
	#aliases
	#maybe later
	#sort by fist name

	# for ann in ann_names:
		# id2status[ann] = sorted(id2status[ann], key=lambda k: k['name'])
