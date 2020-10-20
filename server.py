from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import backend.xml_process as xml
import json
import sys

app = Flask(__name__, static_folder="build/static", template_folder="build")
CORS(app)

def load_json(file_name):

    #check if /annotat
    path = './data/' + file_name
    with open(path + '_chars.json', 'r') as f:
        charList = json.load(f)

    with open(path + '_quotes.json', 'r') as f:
        data = json.load(f)

    with open(path + '.txt', 'r') as f:
        content = f.read().strip()

    return (data, charList, content)

def save_progress(file_name, chars, quote_infos, quote_ranges, quote_span_ids, men_infos, men_ranges, men_span_ids):
    path = './data/' + file_name
    with open(path + '_chars.json', 'w') as f:
        json.dump(chars, f)

    data_ob = {
        'quote_ranges': quote_ranges,
        'quote_infos': quote_infos,
        'quote_span_ids': quote_span_ids,
        'men_infos': men_infos,
        'men_ranges': men_ranges,
        'men_span_ids': men_span_ids
    }

    with open(path + '_quotes.json', 'w') as f:
        json.dump(data_ob, f)
        
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
    #return data extracted from file.
    #print("Get method called.")
    file_name = request.args.get('file_name')
    file_name = file_name.replace(".txt","")
    print("Data for: ", file_name)
    data, charList, content = load_json(file_name)
    return {'title': file_name, 'content': content, 'data': data, 'charList': charList}
    #pass

@app.route("/data", methods=['POST'])
def save_data():
    data = request.get_json()
    print(data.keys())
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

@app.route('/disagreements', methods=['GET'])
def generate_doc():
    file_a = request.args.get('file_a')
    file_b = request.args.get('file_b')

    #unzip
    print(file_a)
    print(file_b)
    return 'Success'

#analyze results
# @app.route('/disagreements')
# def serve_analysis():
#     return render_template('analyze.html')

print('Starting Flask!')
app.debug=True
app.run(port=8080)