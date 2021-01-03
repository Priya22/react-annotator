import os, re, sys, json

def get_status(charLists):
    '''
    returns an id2status dictionary that has 0 if a character an aliases
    match up for both lists, and 1 otherwise. 
    '''
    ann_names = sorted(charLists.keys())

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
            status = 0

            for oa in other_ann:
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





