import os, re, sys, json

def get_char_info(character_anns):
    #note: returns separate dicts for each annotator. 

	char_ids = {}
	id_ = 0
	for ann in character_anns:
        char_id = {}
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
        char_ids[ann] = char_id

	id_chars = {}
    for ann, char_id in char_ids.items():
        for key, val in char_id.items():
            id_char = {}
            if val not in id_char:
                id_char[val] = []
            id_char[val].append(key)
        id_chars[ann] = id_char
        
	return char_ids, id_chars

def get_status(charLists):
    '''
    returns an id2status dictionary that has 0 if a character an aliases
    match up for both lists, and 1 otherwise. 
    '''
    ann_names = sorted(charLists.keys())
    #char_ids, id_chars = get_char_info(charLists)

    name_dicts = {}

    for ann in ann_names:
        name_dicts[ann] = {}
        chars = charLists[ann]

        for char in chars:
            main = char['name']
            name_dicts[ann][main] = char['expand']

    statusLists = {}

    indicator = 1
    
    for ann in ann_names:
        statusLists[ann] = []

        other_ann = [x for x in ann_names if x!=ann]

        for i, _ in enumerate(charLists[ann]):
            char = charLists[ann][i]

            cname = char['name']
            #og_list = id_chars[ann][char_ids[ann][cname]]
            status = 0

            for oa in other_ann:
                # for n in og_list:
                #     if n in char_ids[ann]:
                # oa_list = id_chars[ann][char_ids[ann][cname]]
                if cname in name_dicts[oa]:
                    status = 1
            
            char['status'] = status

            if status == 0:
                indicator = 0
            
            statusLists[ann].append(char)
    
    #aliases
    #maybe later
    #sort by fist name

    for ann in ann_names:
        statusLists[ann] = sorted(statusLists[ann], key=lambda k: k['name'])

    return statusLists, indicator





