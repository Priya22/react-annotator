import xml.etree.ElementTree as ET
import json, os
import numpy as np
from collections import Counter
import nltk
import argparse
import string
import re

def parseTxt(text, charList):

    charNames = []
    for c in charList:
        charNames.append(c['name'])
        for e in c['expand']:
            charNames.append(e['name'])


    quotes = []
    positions = []

    mentions = []
    men_positions = []

    start = 0
    end = 0

    begin = False
    done = False

    cur_str = ''

    for i, char in enumerate(text):
        if char == '"':
            if begin == False:
                start = i + 1
                begin = True
                cur_str = ''
            else:
                end = i
                quotes.append(cur_str)
                positions.append([start, end])
                begin = False
        else:
            if begin == True:
                cur_str += char
    assert len(positions) == len(quotes)
    positions, quote_infos = getJsonObjects(quotes, positions, 'Quote')

    for i, q_info in quote_infos.items():
        q_pos, q_men = getMentions(q_info['text'], positions[i]['start'], charNames)
        mentions.extend(q_men)
        men_positions.extend(q_pos)

    men_pos, men_infos = getJsonObjects(mentions, men_positions, 'Mention')

    #sorted span ids
    quote_span_ids = list(quote_infos.keys())
    men_span_ids = list(men_infos.keys())

    quote_span_ids.sort(key=lambda x: positions[x]['start'])
    men_span_ids.sort(key=lambda x: men_pos[x]['start'])

    return (positions, quote_infos, quote_span_ids, men_pos, men_infos, men_span_ids)

mention_words = ['he', 'she', 'they', 'them', 'her', 'his', 'their', 'him', 'you', 'us', 'we', 'yourself', 'herself', 'themselves', 'himself']
mention_words.extend([x.capitalize() for x in mention_words])
punct = list(string.punctuation)

def getMentions(str, str_start, charNames):
    mentions = []
    positions = []
    #print("INPUT STRING: ", str)
    cur_str = ''
    start = 0
    end = -1
    #charnames_str = " ".join(charNames)
    for i, c in enumerate(str):

        if (cur_str.lower() == 'let' and c == "'"):
            mentions.append("'s")
            positions.append([str_start+i, str_start+i+2])
            
        if (c == ' ') or (c in punct) or i==(len(str)-1):
            end = i
            #print(cur_str)
            if (cur_str in mention_words) or (cur_str in charNames):
                #print("positive hit. ")
                #print()
                mentions.append(cur_str)
                positions.append([str_start+start, str_start+end])
            start = i+1
            cur_str = ''

        else:
            cur_str += c
    assert len(mentions) == len(positions)
    #positions, mentions = getJsonObjects(mentions, positions, 'Mention')

    return (positions, mentions)


def getJsonObjects(quotes, positions, type):
    #print("Quotes")

    quote_infos = {}
    ranges = {}

    for i, quote in enumerate(quotes):
        quote_infos[i] = {
            'speaker': [],
            'speakee': [],
            'quote_type': '',
            'ref_exp': '',
            'text': quote,
            'sel_type': type
        }
        ranges[i] = {
            'start': positions[i][0],
            'end': positions[i][1]
        }

    return (ranges, quote_infos)

def getCharacters(root, tree):
    names = []
    aliases = []

    header = root.find('{http://www.tei-c.org/ns/1.0}teiHeader')
    prof_desc = header.find('{http://www.tei-c.org/ns/1.0}profileDesc')
    part_desc = prof_desc.find('{http://www.tei-c.org/ns/1.0}particDesc')
    person_list = part_desc.find('{http://www.tei-c.org/ns/1.0}listPerson')

    for child in person_list:
        name = child.attrib['{http://www.w3.org/XML/1998/namespace}id']
        name = name.replace("_"," ")
        names.append(name)
        aliases.append([])
        #aliases
        for child2 in child:
            children = child2.findall('{http://www.tei-c.org/ns/1.0}addName')
            if len(children) != 0:
                for add in children:
                    aliases[-1].append(add.text)

    args = np.argsort(names)

    names = [names[i] for i in args]
    aliases = [aliases[i] for i in args]



    charList = []
    for i, name in enumerate(names):
        expand = []
        for alias in aliases[i]:
            expand.append({
                'name': alias
            })

        charList.append({
            'id': i,
            'name': name,
            'expand': expand
        })


    whos = []
    for elem in tree.iter():
        if elem.tag == '{http://www.tei-c.org/ns/1.0}said':
            #print(elem.attrib)
            if 'who' in elem.attrib:
                char = elem.attrib['who']
                whos.append(char[1:])

    #sort by this frequency
    counter = Counter(whos)

    charList.sort(key=lambda elem: counter[elem['name']], reverse=True)

    return charList


if __name__ == '__main__':
#def main(txt_path, xml_path):
    parser = argparse.ArgumentParser(description='Extract novel data.')
    parser.add_argument('--txt', type=str, help='path to the txt file')
    parser.add_argument('--xml', type=str, help='path to the GutenTag XML file')
    #parser.add_argument('--out', type=str, help='path to the output folder')
    args = parser.parse_args()

    txt_path = args.txt
    xml_path = args.xml

    if xml_path == "None":
        charList = []
    
    else:
        tree = ET.parse(xml_path)
        root = tree.getroot()
        charList = getCharacters(root, tree)
    file_name = txt_path.split("/")[-1].replace(".txt","")
    write_path = os.path.join('../data', file_name)
    if not os.path.isdir(write_path):
        os.mkdir(write_path)
    print("Writing to: ", write_path)

    char_file = file_name + '_chars.json'
    with open(os.path.join(write_path, char_file), 'w') as f:
        json.dump(charList, f)

    
    with open(txt_path, 'r') as f:
        text = f.read()
    
    #replace quotes
    text = text.replace("“", '"')
    text = text.replace('”', '"')

    #text = "".join([x if ord(x) < 128 else '?' for x in text])
    text = re.sub(r'[^\x00-\x7f]',r' ',text)
    print(text[:20])

    txt_file = file_name + '.txt'
    with open(os.path.join(write_path, txt_file), 'w') as f:
        f.write(text.strip())

    
    with open(os.path.join(write_path, txt_file), 'r') as f:
        text = f.read().strip()

    positions, quote_infos, quote_span_ids, men_pos, men_infos, men_span_ids = parseTxt(text, charList)
    json_obj = {'quote_ranges': positions, 'quote_infos': quote_infos, 'quote_span_ids': quote_span_ids,
        'men_ranges': men_pos, 'men_infos': men_infos, 'men_span_ids': men_span_ids
                }

    #print("Writing quotes to: ", write_path + '_quotes.json')
    q_file = file_name + '_quotes.json'
    with open(os.path.join(write_path, q_file), 'w') as fp:
        json.dump(json_obj, fp)

   # return charList, json_obj, text




