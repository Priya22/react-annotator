import os, re, sys, json
from collections import defaultdict

def get_char_info(nameLists):
	#note: returns separate dicts for each annotator. 

	parent2id = {}
	id2names = {}

	for key in nameLists:
		parent2id[key] = {}
		id2names[key] = defaultdict(list)
		
		for char in nameLists[key]:
			main_name = char['name']
			id_ = char['parent']
			
			parent2id[key][main_name] = id_
			
			id2names[key][id_].append(main_name)
			for alias in char['expand']:
				id2names[key][id_].append(alias['name'])

	return parent2id, id2names


def get_status(nameLists):
	'''
	returns an id2status dictionary that has 0 if a character an aliases
	match up for both lists, and 1 otherwise. 
	'''
	ann_names = sorted(nameLists.keys())
	parent2id, id2names = get_char_info(nameLists)

	indicator = 1

	id2status = {}
	for ann in nameLists.keys():
		other_ann = [k for k in nameLists.keys() if k!=ann][0]
		other_list = parent2id[other_ann]
		
		id2status[ann] = {}
		
		for parent, pid in parent2id[ann].items():
			if parent not in other_list:
				id2status[ann][pid] = 0
				indicator = 0
			else:
				other_pid = parent2id[other_ann][parent]
				aliasList1 = id2names[ann][pid]
				aliasList2 = id2names[other_ann][other_pid]
				
				if set(aliasList1) != set(aliasList2):
					id2status[ann][pid] = 1
					indicator = 0
				else:
					id2status[ann][pid]= 2
	for key in nameLists.keys():
		for i, char in enumerate(nameLists[key]):
			char['status'] = id2status[key][char['id']]
			nameLists[key][i] = char
	#aliases
	#maybe later
	#sort by fist name

	# for ann in ann_names:
		# id2status[ann] = sorted(id2status[ann], key=lambda k: k['name'])

	return nameLists, indicator