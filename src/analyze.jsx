import React from 'react';
import axios from 'axios';
import './analyze.css'
// import { render } from 'react-dom';

// const path = require('path')
// const fs = require('fs')

const ANN_NAMES = ['Alanna', 'Beck', 'Bisman', 'Jovana','Leah', 'Sanghoon', 'Sofia', 'Sol']; //ADD
const AXIOS_HEADER = {  
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'}


function Footer(props) {
    return (
        <div id='clear-button'>
            {/* <button className={'css-button'}
                    //ref={this.simulateClick}
                    type={'submit'}
                    name={'clear-all'}
                    //disabled={save_dis}
                   
            >
            Clear 
        </button> */}


        </div>
    )
    
}

class Analyze extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            status: 'names',
            name_1: '',
            name_2: '',
        }
        this.handleNameChange = this.handleNameChange.bind(this);
    }

    handleNameChange(event) {
        let target_name = event.target.id;
        let value = event.target.value;
        console.log(target_name);

        if (target_name==='name_1') {
            this.setState({name_1: value})
        }
        else if (target_name==='name_2') {
            this.setState({name_2: value})
        }
    }

    render() {
        return (
            <div className='analyze-main'>
                <h1>Analyze Disagreements</h1>
                <div id='get-names'>
                    <h2>Step 1: Choose Annotator Names: </h2>
                    <AnnNames 
                    name_1={this.state.name_1}
                    name_2={this.state.name_2}
                    handleNameChange={this.handleNameChange}
                    />
                </div>
                <div id='steps'>
                    <span>
                        <h2>Step 2: Check Character Agreement:</h2>
                        <CharacterList 
                        name_1={this.state.name_1}
                        name_2={this.state.name_2}
                        />
                    </span>
                    <span>
                        <h2>Step 3: Generate Disagreement Document: </h2>
                        <GenDis 
                        name_1={this.state.name_1}
                        name_2={this.state.name_2}
                        />
                    </span>
                </div>

                {/* <div>
                    <Footer />
                </div> */}
            </div>
        )
    }
}

class AnnNames extends React.Component {

    constructor(props) {
        super(props);
        this.renderItem = this.renderItem.bind(this);
    }


    renderItem(names) {

        let items = [<option value=''></option>]

        names.forEach((name) => {
            let item = <option value={name}>{name}</option>
            items.push(item);
        })

        return items;
    }

    render() {

        let itemRows = this.renderItem(ANN_NAMES);
        return (
            <div id='input-names'>
                <span className='name-select'>
                <h3 className={'init-heading'}> Annotator 1: </h3>
                    <select 
                     id='name_1'
                    value={this.props.name_1}
                    onChange={this.props.handleNameChange}
                    >
                        {itemRows}
                        {/* <option value=''></option>
                        <option value='Beck'>Beck</option>
                        <option value='Leah'>Leah</option>
                        <option value='Jovana'>Jovana</option>
                        <option value='Sanghoon'>Sanghoon</option> */}
                    </select>
                </span>
                <span className='name-select' >
                <h3 className={'init-heading'}> Annotator 2: </h3>
                    <select 
                    id='name_2'
                    value={this.props.name_2}
                    onChange={this.props.handleNameChange}
                    >
                        {itemRows}
                    </select>
                </span>
            </div>
        )
    }
}

function LoadFolderButton(props) {
    return (
        <span className="loadChar">
            <h3 className={'init-heading'}> {props.msg} </h3>
            <input type="file"
                name={props.name}
                directory=""
                webkitdirectory=""
                onChange={props.handleUpload}
            />
            
        </span>
    )
}

function LoadFileButton(props) {
    return (
        <span className="loadFolder">
            <h3 className={'init-heading'}> {props.msg} </h3>
            <input type="file"
                name={props.name}
                accept='.json'
                onChange={props.handleUpload}
            />
        </span>
    )
}


class CharacterList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            file_1: '',
            file_2: '',
            statusLists: '',
            indicator: 0
        }
        this.handleUpload = this.handleUpload.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        //this.readFile = this.readFile.bind(this);
    }

    // readFile(file) {
    //     let reader = new FileReader();
    //     reader.onload = async (e) => { 
    //         const text = (e.target.result)
    //         //console.log(text)
    //         return text;
            
    //         //alert(text)
    //       };
    //       reader.readAsText(file)

    // }

    handleUpload(event) {

        let button_id = event.target.name;
        let data = {}
        

        for (let i=0; i< event.target.files.length; i=i+1) {
            let file = event.target.files[i];
            let filename = event.target.files[i].name;
            let reader = new FileReader();

            if (filename[0] !== '.') {
                reader.readAsText(file, 'UTF-8');
                reader.onload = function(e) {
                    data[filename] = e.target.result;
                }
              
            }
        }

        if (button_id === 'file1') {
            this.setState({file_1:data})
        }
        else if (button_id === 'file2') {
            this.setState({file_2:data})
        }
    }

    handleSubmit(event) { 

        if (this.props.name_1 === '' || this.props.name_2 === '' || this.props.name_2 === this.props.name_1) {
            alert("Invalid annotator names selected.");
        }

        else if (this.state.file_1 === '' || this.state.file_2==='') {
            //alert("File(s) missing. ")
            
        }

        else {
            let n1 = this.props.name_1;
            let n2 = this.props.name_2;
            let charLists = {[n1]: this.state.file_1, [n2]: this.state.file_2}
            //send to server
            //alert("Generating Disagreements.")
            //check character agreements
            axios.get('http://127.0.0.1:8080/charStatus', 
                {
                    params: {
                        'charLists': charLists
                    }
                }).then(res => {
                    //console.log(res.data.statusLists);
                    //return res.data.statusLists;
                    this.setState({
                        statusLists: res.data.statusLists,
                        indicator: res.data.indicator
                    })
                });
        }
    }

    render() {

        return (
            <div id='charAnalyze'>
                <div id='charUpload'>
                
                    <LoadFileButton 
                    name='file1'
                    handleUpload={this.handleUpload}
                    msg={"JSON 1: " + this.props.name_1}
                    />
                
                
                    <LoadFileButton 
                    name='file2'
                    handleUpload={this.handleUpload}
                    msg={"JSON 2: " + this.props.name_2}
                    />

                    <button type='button' onClick={this.handleSubmit}>
                        Submit
                        </button>
                
                </div>

                <div id='charStatus'>
                    <DisplayCharStatus 
                    statusLists={this.state.statusLists}
                    indicator={this.state.indicator}
                    />
                </div>
            </div>
        )
    }
}

class DisplayCharStatus extends React.Component {

    constructor(props){
        super(props);
        
        this.colorMap = {
            0: 'red',
            1: 'orange',
            2: 'green'
        }
        this.state = {
            expandedRows: [],
            //mergeStatus: 'none';
            hidden: false
        };

        this.renderItem = this.renderItem.bind(this);
        this.handleRowClick = this.handleRowClick.bind(this);
        this.getAnnRows = this.getAnnRows.bind(this);
        this.toggleDisplay = this.toggleDisplay.bind(this);
    }

    handleRowClick(rowId) {
        const currentExpandedRows = this.state.expandedRows;
        const isRowCurrentlyExpanded = currentExpandedRows.includes(rowId);

        const newExpandedRows = isRowCurrentlyExpanded ?
            currentExpandedRows.filter(id => id !== rowId) :
            currentExpandedRows.concat(rowId);

        this.setState({expandedRows : newExpandedRows});


    }


    renderItem(item) {
        const clickCallback = () => this.handleRowClick(item.name);
        let cName = 'td-green';
        if (item.status === 0) {
            
            cName = 'td-red';
        }
        else if(item.status === 1){
            cName = 'td-orange';
        }

        cName = cName + ' row-name';
        const itemRows = [
            <tr key={"row-data-" + item.name}>
                {/* <td className={'td-normal'}>{icon}</td> */}
                <td onClick={clickCallback} className={cName}>{item.name}</td>
                {/* <td className={'td-left'}>{deleteIcon}</td> */}
            </tr>
        ];

        if (this.state.expandedRows.includes(item.name)) {
            itemRows.push(
                <tr>
                    <td><b>Aliases</b></td>
                </tr>
            );
            item.expand.forEach((el) => {
                itemRows.push(
                    <SubTable
                        item={item}
                        alias={el}
                    />
                );
            });
            }

        return itemRows;
    }

    getAnnRows() {
        let self = this;
        let statusList = this.props.statusLists;
        let ann_names = Object.keys(statusList);

        let ann_rows = {}

        // console.log(ann_names);
        // console.log(statusList);

        ann_names.forEach( function(ann_name, index) {
            let allItemRows = [];

            statusList[ann_name].forEach(item => {
                const perItemRows = self.renderItem(item);
                allItemRows = allItemRows.concat(perItemRows);
            });
            ann_rows[ann_name] = allItemRows
        })

        return {
            'annRows': ann_rows,
            'annNames': ann_names
        }

    }

    toggleDisplay(event) {
        this.setState({
            hidden: !this.state.hidden
        })
    }

    render() {
        
        //if empty statusLists
        if (this.props.statusLists === '') {
            return (
                <div>

        </div>
            )
        }

        else if (this.props.indicator === 1) {
            return (
                <div>
                    <h4 style={{color: 'darkgreen'}}>
                        All names match!
                    </h4>
                </div>
            )
        }

        else {
            let res = this.getAnnRows()
            let ann_rows = res['annRows'];
            let ann_names = res['annNames'];

            let divClassName="charTables";
            if (this.state.hidden===true){
                divClassName = divClassName + " hidden";
            }
          
            let buttonText = "minimize";
            if (this.state.hidden === true) {
                buttonText = "show";
            }
            
            return (
                <div>
                    <div id='minimize-button'>
                        <button type="button" onClick={this.toggleDisplay}>
                            {buttonText}

                        </button>

                    </div>
                    <div>
                            <p style={{'background': 'white', 'border':'none'}}>
                            <span style={{'color': 'darkred'}}>Red: Main name Mismatch&nbsp;&nbsp;</span><span style={{'color': 'orange'}}>Orange: Alias Mismatch&nbsp;&nbsp;</span>
                            <span style={{'color': 'green'}}>Green: All good!&nbsp;&nbsp;</span>
                            </p>
                        </div>
                    <div className={divClassName}>
                        
                    <div >
                        <div><h4 style={{'color': 'purple', 'height': '20px'}}>{ann_names[0]}</h4></div>
                        <div  className='char-table'>
                        <table>
                            <thead>
                                <tr>
                                    <td>
                                        ---
                                    </td>
                                </tr>
                            </thead>
                            <tbody>
                                {ann_rows[ann_names[0]]}
                            </tbody>
                        </table>
                        </div>
                </div>
                    <div>
                        <div><h4 style={{'color': 'purple', 'height': '20px'}}>{ann_names[1]}</h4></div>
                        <div className='char-table'>
                        <table>
                            <thead>
                                <tr>
                                    <td>
                                        ---
                                    </td>
                                </tr>
                            </thead>
                            <tbody>
                                {ann_rows[ann_names[1]]}
                            </tbody>
                        </table>     
                    </div>
                </div>
                </div>
                </div>
            )
        }     
    }

}

class SubTable extends React.Component {


    render() {
        //console.log(this.props.item.expand);
        const el = this.props.alias;
        return (
            <tr key={el.name}>
                <td className={'td-alias'}>
                    {el.name}
                </td>
            </tr>
        )
    }
}

class GenDis extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            file_1: '',
            file_2: '',
            message: ''
        }

        this.handleUpload = this.handleUpload.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.saveAsFile = this.saveAsFile.bind(this);
    }

    handleUpload(event) {

        let button_id = event.target.name;
        let data = {}
        

        for (let i=0; i< event.target.files.length; i=i+1) {
            let file = event.target.files[i];
            let filename = event.target.files[i].name;
            let reader = new FileReader();

            if (filename[0] !== '.') {
                reader.readAsText(file, 'UTF-8');
                reader.onload = function(e) {
                    data[filename] = e.target.result;
                }
              
            }
        }

        if (button_id === 'file1') {
            
            let msg = 'Annotations received for ' + this.props.name_1;
            msg = this.state.message + '\n' + msg
            this.setState({file_1:data, message: msg})
        }
        else if (button_id === 'file2') {

            let msg = 'Annotations received for ' + this.props.name_2;
            msg = this.state.message + '\n' + msg
            this.setState({file_2:data, message: msg})
        }
    }

    saveAsFile(text, filename) {
        // Step 1: Create the blob object with the text you received
        const type = 'application/text'; // modify or get it from response
        const blob = new Blob([text], {type});
      
        // Step 2: Create Blob Object URL for that blob
        const url = URL.createObjectURL(blob);
      
        // Step 3: Trigger downloading the object using that URL
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click(); // triggering it manually
      }

    handleSubmit(event) { 

        if (this.state.file_1 === '' || this.state.file_2==='') {
            //alert("File(s) missing. ")
            let msg = 'ERROR: Missing data.'
            msg = this.state.message + '\n' + msg;
            this.setState({message: {msg}})
        }

        else {
            let ann_names = [this.props.name_1, this.props.name_2]
            let data = {
                [ann_names[0]]: this.state.file_1,
                [ann_names[1]]: this.state.file_2
            }
            let msg = 'Processing...'
            msg = this.state.message + '\n' + msg;
            this.setState({message: msg})
            //send to server
            //alert("Generating Disagreements.")
            //check character agreements
            axios.post('http://127.0.0.1:8080/getDisDoc', 
               data,
                ).then(res => {
                    //console.log(res.data.statusLists);
                    //return res.data.statusLists;
                    // let text = res.data.content;
                    // let title = res.data.title;
                    // this.saveAsFile(text, title+'.txt');
                    let content = res.data.content;
                    let title = res.data.title;
                    this.saveAsFile(content, title+'.txt');
                    let msg = 'Processing Complete!';
                    msg = this.state.message + '\n' + msg;
                    this.setState({message: msg})
                })
        }
    }

    render() {

        let msg = this.state.message;

        return (
            <div id='zipUpload'>

                <LoadFolderButton 
                name='file1'
                handleUpload={this.handleUpload}
                msg={"Folder 1: " + this.props.name_1}
                />
             
               
                <LoadFolderButton 
                name='file2'
                handleUpload={this.handleUpload}
                msg={"Folder 2: " + this.props.name_2}
                />

                <button type='button' onClick={this.handleSubmit}>
                    Submit
                    </button>

                <div id='foot-msg'>
                {msg.split("\n").map((i,key) => {
            return <div key={key}>{i}</div>;
        })}
                </div>

            </div>
        )
    }
}


export default Analyze;