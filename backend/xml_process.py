import xml.etree.ElementTree as ET
import json
import numpy as np
from collections import Counter
import nltk

def parseTxt(text):
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
        q_pos, q_men = getMentions(q_info['text'], positions[i]['start'])
        mentions.extend(q_men)
        men_positions.extend(q_pos)

    men_pos, men_infos = getJsonObjects(mentions, men_positions, 'Mention')

    #sorted span ids
    quote_span_ids = list(quote_infos.keys())
    men_span_ids = list(men_infos.keys())

    quote_span_ids.sort(key=lambda x: positions[x]['start'])
    men_span_ids.sort(key=lambda x: men_pos[x]['start'])

    return (positions, quote_infos, quote_span_ids, men_pos, men_infos, men_span_ids)

mention_words = ['he', 'she', 'they', 'them', 'her', 'his', 'their', 'him']

def getMentions(str, str_start):
    mentions = []
    positions = []
    #print(str)
    cur_str = ''
    start = 0
    end = -1

    for i, c in enumerate(str):
        if c == ' ' or i==(len(str)-1):
            end = i
            #print(cur_str)
            if cur_str in mention_words:
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
            'speaker': '',
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
    f = open('../data/test.txt')
    text = f.read()
    positions, quote_infos, quote_span_ids, men_pos, men_infos, men_span_ids = parseTxt(text)
    json_obj = {'quote_ranges': positions, 'quote_infos': quote_infos, 'quote_span_ids': quote_span_ids,
        'men_ranges': men_pos, 'men_infos': men_infos, 'men_span_ids': men_span_ids
                }
    with open('../data/quotes.json', 'w') as fp:
        json.dump(json_obj, fp)

    tree = ET.parse('PrideandPrejudicebyJaneAusten42671.xml')
    root = tree.getroot()
    charList = getCharacters(root, tree)

    with open('../data/chars.json', 'w') as f:
        json.dump(charList, f)


