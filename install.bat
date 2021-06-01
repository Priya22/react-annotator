@ECHO OFF
ECHO Installing the annotation tool..
npm install
pip3 install -r requirements.txt
npm run build
python3 server.py