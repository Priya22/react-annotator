# Instructions
### Requirements
This app was created using the React framework for the front-end and python Flask backend. You will need the 
following libraries to run it:
1. Make sure you have a recent version of Node installed (https://nodejs.org/en/).
2. Clone this repo onto your local machine. 
3. Open a terminal and in the project root, run `npm install` to install all the required dependencies. 
Then run `npm run build`. This should create a `build` folder within the project root. 
4. **Backend**: The server runs with Python 3 and uses the Flask library. Run `pip3 install -U flask` to install the latest version.

### Start the application
1. Open a terminal window. In the project root, run `python3 server.py` to start the application. The console should display a message 
along the lines of `Running on http://127.0.0.1:8080/ (Press CTRL+C to quit)`.
2. In your browser (preferably Chrome), navigate to `localhost:8080`. This should display the landing page. 
3. Currently, I have the preprocessed data for a snippet of Pride and Prejudice. Click on the `Load Files` button
 and navigate to the `data/` folder from the project root. Select file `test.txt`.
4. The tool should display the current status of the file! Some of the initial quotes have already been annotated. 
There is also a draft version of the instructions page (click on the `Instructions` link) that specify how to 
use the tool. 
5. Close the browser window and kill the terminal process (CTRL + C) to exit.