# !/bin/bash
#install node requirements
npm install

#install python requirements
pip3 install -r requirements.txt

#build
npm run build

#launch server
python3 server.py