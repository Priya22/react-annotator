import os, re, csv, sys, json
import pandas as pd
import numpy as np
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--source', help='path to source folder', metavar='FOLDER', required=True)
parser.add_argument('--dest', help='path to destination folder', metavar="FOLDER", required=True)
parser.add_argument('--name', help='name of novel',type=str, required=True)

def find_duplicates(charList):
    index = 0
    dups = []
    names = set()
    for c in charList:
        if c['name'] in names:
            dups.append((c, c['name'], 'main'))
        else:
            names.add(c['name'])
            
        for a in c['expand']:
            if a['name'] in names:
                dups.append((c, a['name'],'alias'))
            else:
                names.add(a['name'])
    
    return dups, names
                

def get_new_charlist(charList):
    index = 0
    for i in range(len(charList)):
        charList[i]['id'] = index
        charList[i]['parent'] = index
        charList[i]['name'] = charList[i]['name'].title()
        for alias in charList[i]['expand']:
            alias['parent'] = index 
            alias['name'] = alias['name'].title()
        index += 1
    
    charList.sort(key=lambda x: x['name'])
    return charList

def get_char_info(nameLists):

	# parent2id = {}
    id2name = {}
    name2id = {}
# 	for key in nameLists:
#     id2name[key] = {}
#     name2id[key] = {}

    for char in nameLists:
        main_name = char['name']
        id_ = char['parent']

        id2name[id_] = main_name
        name2id[main_name] = id_
        for alias in char['expand']:
            name2id[alias['name']] = id_

    return id2name, name2id

def clean_str(s):
#     return ''.join([c for c in s if ord(c)<128])
    return s

def make_folder(source, dest):
    folder_name = os.path.split(os.path.normpath(source))[-1]
    dest_path = os.path.join(dest, folder_name)

    if not os.path.isdir(dest_path):
        os.mkdir(dest_path)

    return dest_path, folder_name

def make_compatible(source_folder, dest_folder, name):
    charList = []
    annotations = {}

    with open(os.path.join(source_folder, name+'_chars.json'),'r') as f:
        charList = json.load(f)

    with open(os.path.join(source_folder, name+'_quotes.json'), 'r') as f:
        annotations = json.load(f)

    with open(os.path.join(source_folder, name+'.txt'), 'r') as f:
        text = f.read().strip()

    dups, names = find_duplicates(charList)

    if len(dups) > 0:
        print("FOUND CHARACTER DUPLICATES: SKIPPING")
        print(dups)
        sys.exit("Re-run after fixing. ")
    
    newCharList = get_new_charlist(charList)
    
    id2name, name2id = get_char_info(charList)
    
    id2name[-1] = "None"
    name2id["None"] = -1
    
    
    quote_infos = annotations['quote_infos']
    skip_qids = set()
    skip_mids = set()
    #speakers
    for qind, qinf in quote_infos.items():
        speaker = quote_infos[qind]['speaker']
        speaker = [s for s in speaker if s!='']
        speaker = [s for s in speaker if s is not None]
        speaker = [s for s in speaker if clean_str(s).title() in name2id]
#                     if (speaker == '') or (speaker is None) or (speaker[0] is None):
#                         speaker = []
#                     assert len(speaker) == 1, print(qinf)
#                     if clean_str(speaker[0]).title() not in name2id:
#                         print("Speaker: ", qind, qinf)
#                         speaker = []
        quote_infos[qind]['speaker'] = speaker
#                         skip_qids.add(qind)

            
    #speakees
    for qind, qinf in quote_infos.items():
        speakee = quote_infos[qind]['speakee']

        if speakee == '' or (speakee is None):
            speakee = []

#                     assert len(speakee) > 0, print(qinf)

#                     for i,s in enumerate(speakee):
#                         if s == '' or s == None or s=='None':
#                             speakee[i] = 'None'
        speakee = [s for s in speakee if s!='']
        speakee = [s for s in speakee if s is not None]
        speakee = [s for s in speakee if clean_str(s).title() in name2id]
#                     for i, s in enumerate(speakee):    
#                         if clean_str(s).title() not in name2id:
#                             speakee[i] = 'None'
#                             print("Speakee: ", qind, qinf)
                
        quote_infos[qind]['speakee'] = speakee
#                             skip_qids.add(qind)
                
    men_infos = annotations['men_infos']
    #speakees
    for mind, minf in men_infos.items():
        speakee = men_infos[mind]['speakee']

        if speakee == '' or (speakee is None):
            speakee = []

        assert isinstance(speakee, list), print(minf)

        speakee = [s for s in speakee if s!='']
        speakee = [s for s in speakee if s is not None]
        speakee = [s for s in speakee if clean_str(s).title() in name2id]
        men_infos[mind]['speakee'] = speakee
#                             skip_mids.add(mind)
                
                
                
    new_quote_infos = {}
    new_men_infos = {}

    for qind, qinf in quote_infos.items():
        if qind in skip_qids:
            continue

        new_quote_infos[qind] = {}

        for key, val in qinf.items():
            new_quote_infos[qind][key] = val
    #         print(key, val)

        #speaker
        speaker_ids = []
#                     if (new_quote_infos[qind]['speaker'] in ['', []]) or (new_quote_infos[qind]['speaker'] is None)\
#                     or (new_quote_infos[qind]['speaker'][0] is None):
#                         new_quote_infos[qind]['speaker'] = ['None']
        for s in new_quote_infos[qind]['speaker']:
            speaker_ids.append(name2id[clean_str(s).title()])

        #speakee
        speakee_ids = []
#                     if (new_quote_infos[qind]['speakee'] == '') or (new_quote_infos[qind]['speakee'] is None):
#                         new_quote_infos[qind]['speakee'] = ['None']
#                     for i,s in enumerate(new_quote_infos[qind]['speakee']):
#                         if s == '' or s == None:
#                             new_quote_infos[qind]['speakee'][i] = 'None'

        for s in new_quote_infos[qind]['speakee']:
            speakee_ids.append(name2id[clean_str(s).title()])

        new_quote_infos[qind]['speaker'] = speaker_ids
        new_quote_infos[qind]['speakee'] = speakee_ids

    for mind, minf in men_infos.items():
        if mind in skip_mids:
            continue
        new_men_infos[mind] = {}
        for key, val in minf.items():
            new_men_infos[mind][key] = val

        #speakee
        speakee_ids = []
#                     if new_men_infos[mind]['speakee'] == '':
#                         new_men_infos[mind]['speakee'] = ['None']
#                     for i,s in enumerate(new_men_infos[mind]['speakee']):
#                         if s == '' or s == None:
#                             new_men_infos[mind]['speakee'][i] = 'None'

        for s in new_men_infos[mind]['speakee']:
            speakee_ids.append(name2id[clean_str(s).title()])

        new_men_infos[mind]['speakee'] = speakee_ids
    
    print("Skipping ", len(skip_qids), " quotes and ", len(skip_mids), " mentions.")
    print("Writing new data for: ", name)
    
    annotations['quote_infos'] = new_quote_infos
    annotations['men_infos'] = new_men_infos

    # prefix = dest_folder
    # destination = os.path.join('old_data/CompatibleAnnotations/', folder.name, part_folder.name, ann_folder.name)
    print("Destination: ", dest_folder)
    print()
    print()
    
    with open(os.path.join(dest_folder, name+'_chars.json'),'w') as f:
        json.dump(newCharList, f)

    with open(os.path.join(dest_folder, name+'_quotes.json'),'w') as f:
        json.dump(annotations, f)

    with open(os.path.join(dest_folder, name+'.txt'),'w') as f:
        f.write(text.strip())

if __name__=='__main__':
    args = parser.parse_args()

    source = args.source 
    dest = args.dest 

    dest_path, folder_name = make_folder(source, dest)

    make_compatible(source, dest_path, args.name)