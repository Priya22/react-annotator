# Instructions
### Requirements
This app was created using the React framework for the front-end and python Flask backend. You will need the 
following libraries to run it:
1. Make sure you have a recent version of Node installed (https://nodejs.org/en/).
2. You also need to have Python version>=3.6 installed.
2. Clone this repo onto your local machine. 

### Start the application
3. Open a terminal and navigate to the project root. Run `chmod +x build.sh`, followed by `./build.sh`. This should install all the node and python dependencies,
and also start the server. 
4. The final few lines of the terminal output should indicate that the server is up and running, with a message along the lines of `Running on http://127.0.0.1:8080/ (Press CTRL+C to quit)`.
2. In your browser (preferably Chrome), navigate to `localhost:8080`. This should display the landing page. 
3. Currently, I have the preprocessed data for a snippet of Pride and Prejudice. Click on the `Load Files` button
 and navigate to the `data/` folder from the project root. Select file `test.txt`.
4. The tool should display the current status of the file! Some of the initial quotes have already been annotated. 
There is also a draft version of the instructions page (click on the `Instructions` link) that specify how to 
use the tool. 
5. Close the browser window and kill the terminal process (CTRL + C) to exit.