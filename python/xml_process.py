import xml.etree.ElementTree as ET
import json
import numpy as np

def parseTxt(text):
    quotes = []
    positions = []

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
                positions.append([[start, end]])
                begin = False
        else:
            if begin == True:
                cur_str += char

    positions, quote_infos = getJsonObjects(quotes, positions)
    return (positions, quote_infos)

def getJsonObjects(quotes, positions):

    quote_infos = []
    for quote in quotes:
        quote_infos.append({
            'speaker': '',
            'speakee': [],
            'quote_type': '',
            'ref_exp': '',
            'sel_type': 'quote'
        })

    return (positions, quote_infos)

def getCharacters(root):
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

    return charList


if __name__ == '__main__':
    f = open('./test.txt')
    text = f.read()
    positions, quote_infos = parseTxt(text)
    json_obj = {'ranges': positions, 'quote_infos': quote_infos}
    with open('../src/quotes.json', 'w') as fp:
        json.dump(json_obj, fp)

    tree = ET.parse('PrideandPrejudicebyJaneAusten42671.xml')
    root = tree.getroot()
    charList = getCharacters(root)

    with open('../src/chars.json', 'w') as f:
        json.dump(charList, f)


