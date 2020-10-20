import React from 'react';
import ReactDOM from 'react-dom';
import './grid.css';

import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';

//import 'react-bootstrap-table/dist/react-bootstrap-table-all.min.css';
import ReactModal from 'react-modal';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import axios from 'axios';
import ErrorBoundary from "./ErrorBoundary";
import ReactTooltip from "react-tooltip";
import { SizePerPageDropDown } from 'react-bootstrap-table';


class Analyze extends React.Component {

    render() {
        return (
            <div className="upload-interface">
                
                <h1>Generate Disagreements</h1>

                <div id="main-container">
                    <FileLoader />
                </div>

            </div>
        )
    }
}

class FileLoader extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            folder_a: '',
            folder_b: ''
        };
        this.handleUpload = this.handleUpload.bind(this);
    }

    handleUpload(event) {

        let target = event.target.id
        const file_name = event.target.files[0]
        console.log(file_name)
        if (id === 'folder-a') {
            this.setState({folder_a: file_name})
        }
        else {
            this.setState({folder_b: file_name})
        }

    }

    render() {
            return (
                <div>
                    <div className="upload-buttons">
                        <UploadButtons
                             handleUpload={this.state.handleUpload}
                        />
                    </div>
                    {/*<div id='processing-box'>*/}
                    {/*    <ProcessingBox */}
                    {/*        folder_a={this.state.folder_a}*/}
                    {/*        folder_b={this.state.folder_b}*/}
                    {/*    />*/}
                    {/*</div>*/}

                </div>
                
            )
    }    
}

function UploadButtons(props) {

    return (
        <div>
            <h3>Upload First Annotation (.zip)</h3>
            <input type="file"
                   id="folder-a"
                   accept=".zip"
                   onChange={props.handleUpload}
            />

            <h3>Upload Second Annotation (.zip)</h3>
            <input type="file"
                   id="folder-b"
                   accept=".zip"
                   onChange={props.handleUpload}
            />
        </div>
    )

}

ReactDOM.render(
    <Analyze />,
    document.getElementById('root')
);
