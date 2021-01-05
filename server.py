from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS, cross_origin
import backend.xml_process as xml
import json
import os, csv, re
import sys
import pickle as pkl
#from backend import xml_process
from backend import char_disagreement, ann_disagreement

app = Flask(__name__, static_folder="build/static", template_folder="build")
CORS(app, resources={r"/*": {"origins": "*"}})

def load_json(file_name):
    folder_path = os.path.join('./data', file_name)
    #path = './test_results/alice_p2/beck/' + file_name

    char_file = file_name + '_chars.json'
    char_path = os.path.join(folder_path, char_file)
    with open(char_path, 'r') as f:
        charList = json.load(f)

    q_file = file_name + '_quotes.json'
    q_path = os.path.join(folder_path, q_file)
    with open(q_path, 'r') as f:
        data = json.load(f)

    txt_file = file_name + '.txt'
    txt_path = os.path.join(folder_path, txt_file)
    with open(txt_path, 'r') as f:
        content = f.read().strip()

    #make compatible: change speaker from empty str to list
    for key, val in data['quote_infos'].items():
        cur = val['speaker']
        if isinstance(cur, str):
            data['quote_infos'][key]['speaker'] = [cur]

    return (data, charList, content)

def save_progress(file_name, chars, quote_infos, quote_ranges, quote_span_ids, men_infos, men_ranges, men_span_ids):
    folder_path = os.path.join('./data', file_name)

    char_file = file_name + '_chars.json'
    char_path = os.path.join(folder_path, char_file)

    q_file = file_name + '_quotes.json'
    q_path = os.path.join(folder_path, q_file)

    with open(char_path, 'w') as f:
        json.dump(chars, f)

    data_ob = {
        'quote_ranges': quote_ranges,
        'quote_infos': quote_infos,
        'quote_span_ids': quote_span_ids,
        'men_infos': men_infos,
        'men_ranges': men_ranges,
        'men_span_ids': men_span_ids
    }

    with open(q_path, 'w') as f:
        json.dump(data_ob, f)

def pickle_dump(data, name):
    pkl.dump(data, open('./test_results/'+name+'.pkl', 'wb'))

def getCharStatus(charLists):
    nameLists = {}
    charLists = eval(charLists)
    for key in charLists:
        for file_name in charLists[key]:
            if 'chars.json' in file_name:
                nameLists[key] = eval(charLists[key][file_name])
    
    statusLists, indicator = char_disagreement.get_status(nameLists)
    return statusLists, indicator
    #return {'statusLists': statusLists, 'indicator': indicator}

def getDisagreements(data):
    #process
    #pickle_dump(data, 'folder_data')
    #return 'success'
    content, title = ann_disagreement.get_disagreements(data)
    return content, title

@app.route("/charStatus", methods=['GET'])
def get_charStatus():
    charLists = request.args.get('charLists')
    statusLists, indicator = getCharStatus(charLists)
    return {'statusLists': statusLists, 'indicator': indicator}

@app.route("/getDisDoc", methods=['POST'])
def get_DisDoc():
    data = request.get_json()
    content, title = getDisagreements(data)
    return {'content': content, 'title': title}
    
@app.route("/annotated_image")
def serve_image():
    return send_from_directory('public/', 'annotated_image.png')

@app.route("/")
def serve_index():
    return render_template('index.html')

@app.route("/instructions")
def return_page():
    return send_from_directory('public/', 'instructions.html')

@app.route("/data", methods=['GET'])
def get_data():
    file_name = request.args.get('file_name')
    file_name = file_name.replace(".txt","")
    print("Data for: ", file_name)
    data, charList, content = load_json(file_name)
    return {'title': file_name, 'content': content, 'data': data, 'charList': charList}
    #pass

@app.route("/read", methods=['GET'])
def read_file():
    file_name = request.args.get('file_name')
    #print(file_name)
    path = os.path.join('./data', file_name)
    with open(path, 'r') as f:
        data = json.load(f)
    
    return {'data': data}

@app.route("/data", methods=['POST'])
def save_data():
    data = request.get_json()
    #print(data.keys())
    sys.stdout.flush()
    chars = data['charList']
    file_name = data['file_name']
    quote_ranges = data['quote_ranges']
    quote_infos = data['quote_infos']
    quote_span_ids = data['quote_span_ids']

    men_ranges = data['men_ranges']
    men_infos = data['men_infos']
    men_span_ids = data['men_span_ids']

    #save the state variables received from react.
    save_progress(file_name, chars, quote_infos, quote_ranges, quote_span_ids, men_infos, men_ranges, men_span_ids)

    return {'message': 'Success'}
    #pass

print('Starting Flask!')
app.debug=True
app.run(port=8080)