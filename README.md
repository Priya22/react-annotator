# Instructions
### Requirements
This app was created using the React framework for the front-end and python Flask backend. You will need the 
following libraries to run it:
1. Make sure you have a recent version of Node installed (https://nodejs.org/en/).
2. You also need to have Python version>=3.6 installed.
2. Clone this repo onto your local machine. 

### Start the application
3. This step should install all the node and python dependencies,
   and also start the server. \
Open a terminal and navigate to the project root. \
OS X and Linux machines: Run `chmod 777 build.sh`, followed by `./build.sh`. \
Windows users: Run the `cmd` program as administrator, navigate to project root, type in `install.bat` and press Enter. (NOTE: the Windows installation currently has some problems. Open the `build.sh` file and run each command individually on your terminal instead.)

4. The final few lines of the terminal output should indicate that the server is up and running, with a message along the lines of `Running on http://127.0.0.1:8080/ (Press CTRL+C to quit)`.
2. In your browser (preferably Chrome), navigate to `localhost:8080`. This should display the landing page.   

### Annotate
3. Click on the `Load Files` button
 and navigate to the `data/` folder from the project root. Select the `.txt` file you want to annotate from the apprpriate subfolder.
4. The tool should display the current status of the file!
5. Click on the `Instructions` link to learn how to 
use the tool. 

### Analyze Disagreements
6. Go to the Analyze tab 
7. **Step 1:** Select the relevant annotator names. 
8. **Step 2:** Upload the `<novel_name>_chars.json` files of each annotator to see disagreements in character lists. 
    - Resolve these by reloading the text in the `Annotate` tab, and modifying your character list.
9. **Step 3:** Upload the two annotation folders between which disagreements need to be identified. 
    - This will generate a `<novel_name>.txt` file with the disagreements. 
    - Resolve these by revising your annotations, and re-check for disagreements.

### Exiting the tool
- Close the browser window and kill the terminal process (CTRL + C) to exit.

### Data 
- The data files being annotated should be present in a folder called `data/`, inside the main the tool folder. 
- Each file being annotated should be in a separate subfolder inside `data/`. The names of the subfolder and the files inside it should be consistent.  
    For example, if you are annotating HowardsEnd_P2, the folder structure will be as follows:
    ```
    +--annotation_tool
    |   backend
    +-- data
        |   pp1_6
        +-- pp7_11
            |   pp7_11.txt
            |   pp7_11_chars.json
            |   pp7_11_quotes.json
        |   pp12_19
        .
        .
        +-- HowardsEnd_P2
            |   HowardsEnd_P2.txt
            |   HowardsEnd_P2_chars.json
            |   HowardsEnd_P2_quotes.json
        |   HowardsEnd_P3
        |   NightAndDay_P1
        .
        . 
    |   public
    |   src
    |   README.md
    ``` 
- [Starter files can be found at this Drive location.](https://drive.google.com/drive/folders/1wEkhvJuy5C_G7r8BUl4L8lGR412ZyDmo?usp=sharing)     
-  After all consensus exercises are done, upload your final annotations to the same Drive, under the `annotations` folder.  Uplaod them as a compressed ZIP file titled `<your_name>.zip` to the appropriate sub-folder (ex: HowardsEnd_P2).