from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import backend.xml_process as xml
import json
import sys

app = Flask(__name__, static_folder="build/static", template_folder="build")
CORS(app)

def load_json():
    with open('./data/chars.json', 'r') as f:
        charList = json.load(f)

    with open('./data/quotes.json', 'r') as f:
        data = json.load(f)

    with open('./data/test.txt', 'r') as f:
        content = f.read().strip()

    return (data, charList, content)

def save_progress(chars, quote_infos, quote_ranges, quote_span_ids, men_infos, men_ranges, men_span_ids):
    with open('./data/chars.json', 'w') as f:
        json.dump(chars, f)

    data_ob = {
        'quote_ranges': quote_ranges,
        'quote_infos': quote_infos,
        'quote_span_ids': quote_span_ids,
        'men_infos': men_infos,
        'men_ranges': men_ranges,
        'men_span_ids': men_span_ids
    }

    with open('./data/quotes.json', 'w') as f:
        json.dump(data_ob, f)
        

@app.route("/")
def serve_index():
    return render_template('index.html')

@app.route("/data", methods=['GET'])
def get_data():
    #return data extracted from file.
    #print("Get method called.")
    file_name = request.args.get('file_name')
    #print(file_name)
    data, charList, content = load_json()
    return {'title': file_name, 'content': content, 'data': data, 'charList': charList}
    #pass

@app.route("/data", methods=['POST'])
def save_data():
    data = request.get_json()
    print(data.keys())
    sys.stdout.flush()
    chars = data['charList']

    quote_ranges = data['quote_ranges']
    quote_infos = data['quote_infos']
    quote_span_ids = data['quote_span_ids']

    men_ranges = data['men_ranges']
    men_infos = data['men_infos']
    men_span_ids = data['men_span_ids']

    #save the state variables received from react.
    save_progress(chars, quote_infos, quote_ranges, quote_span_ids, men_infos, men_ranges, men_span_ids)

    return {'message': 'Success'}
    #pass

print('Starting Flask!')
app.debug=True
app.run(port=8080)