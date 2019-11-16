import React from 'react';
import ReactDOM from 'react-dom';
import './grid.css';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import { makeStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';
import {BootstrapTable, TableHeaderColumn, InsertButton, DeleteButton} from 'react-bootstrap-table';
//import 'react-bootstrap-table/dist/react-bootstrap-table-all.min.css';
import ReactModal from 'react-modal';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import TextField from '@material-ui/core/TextField';
import { renderToString } from 'react-dom/server'

import myData from './quotes.json';
import testChars from './chars.json'

//console.log(myData);
//console.log(testChars);
// const useStyles = makeStyles({
//     root: {
//         '&:hover': {
//             backgroundColor: 'transparent',
//         },
//     },
//     icon: {
//         borderRadius: '50%',
//         width: 16,
//         height: 16,
//         boxShadow: 'inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)',
//         backgroundColor: '#f5f8fa',
//         backgroundImage: 'linear-gradient(180deg,hsla(0,0%,100%,.8),hsla(0,0%,100%,0))',
//         '$root.Mui-focusVisible &': {
//             outline: '2px auto rgba(19,124,189,.6)',
//             outlineOffset: 2,
//         },
//         'input:hover ~ &': {
//             backgroundColor: '#ebf1f5',
//         },
//         'input:disabled ~ &': {
//             boxShadow: 'none',
//             background: 'rgba(206,217,224,.5)',
//         },
//     },
//     checkedIcon: {
//         backgroundColor: '#137cbd',
//         backgroundImage: 'linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))',
//         '&:before': {
//             display: 'block',
//             width: 16,
//             height: 16,
//             backgroundImage: 'radial-gradient(#fff,#fff 28%,transparent 32%)',
//             content: '""',
//         },
//         'input:hover ~ &': {
//             backgroundColor: '#106ba3',
//         },
//     },
// });



class Tool extends React.Component {

    // constructor(props) {
    //     super(props);
    //     this.state = {
    //         file_loaded: true,
    //
    //     };
    // }

    render() {
        return (
            <div className="loader">

                <div className="row">
                    <div className="heading">
                        <h1>Quote Annotation Tool </h1>
                    </div>
                    <TextLoader />
                </div>
            </div>
        );
    }
}

class TextLoader extends React.Component {
    // Checks if file is selected and loads it into the text box
    constructor(props) {
        super(props);
        this.state = {
            cur_file: '',
            file_ext: '',
            content: '',
        };
        this.handleUpload = this.handleUpload.bind(this);
    }

    handleUpload(event) {
        const file_reader = new FileReader();
        let self = this;
        const file_name = event.target.files[0].name;
        this.setState({cur_file: file_name});
        file_reader.onloadend = function () {
            const content = file_reader.result;
            //console.log(content);
            self.setState({file_ext: '.txt', content: content});
            //console.log(this.state);
        };
        file_reader.readAsText(event.target.files[0]);
    }

    render() {

        if (this.state.cur_file === '') {
            return (
                <div className="content">
                    <LoadButton handleUpload={(event) => this.handleUpload(event)}/>
                </div>
            )
        }
        else {
            return (
                <div className="content">
                    <TextHeading value={this.state.cur_file}/>
                    <ContentBox value={this.state.content}
                    />
                </div>
            )
        }
    }

}

function LoadButton(props) {
    return (
        <div id="load" className="default">
            Load a text file:
            <input type="file" id="loadfiles"
                   accept=".txt"
                   onChange={props.handleUpload}
                   multiple/>
        </div>
    )
}

function TextHeading(props) {
    return (
        <div id="text-heading">
            <h1>{props.value}</h1>
        </div>
    )

}

class ContentBox extends React.Component {

    //The mitochondria of this application.

    constructor(props) {
        super(props);
        //console.log("Constructor called");
        this.state = {
            charList: testChars,
            ranges: myData.ranges,
            current_sel: '',
            sel_type: '',
            cur_start: Number.POSITIVE_INFINITY,
            cur_end: Number.POSITIVE_INFINITY,
            locked: false,
            confirmed: false,
            quote_infos: myData.quote_infos,
            cur_info: {},
            selectedRows: [],
            cur_mode: 'normal',
            cur_ref_exp: '',
        }
        ;

        this.clearSel = this.clearSel.bind(this);
        this.addToRanges = this.addToRanges.bind(this);
        this.setSelection = this.setSelection.bind(this);
        this.processSelection = this.processSelection.bind(this);
        this.updateChars = this.updateChars.bind(this);
        this.infoSubmit = this.infoSubmit.bind(this);
        this.onPrevClick = this.onPrevClick.bind(this);
        this.confirmSelection = this.confirmSelection.bind(this);
        this.setField = this.setField.bind(this);
        this.updateSelectedRows = this.updateSelectedRows.bind(this);
        this.updateMode = this.updateMode.bind(this);
        this.setSelectionType = this.setSelectionType.bind(this);

    }


    onPrevClick(event) {
        if (this.state.cur_start === Number.POSITIVE_INFINITY) {
            console.log("Span clicked: " + event.currentTarget.id);

            const span_id = event.currentTarget.id;
            const span_info = this.state.quote_infos[span_id];
            const span_range = this.state.ranges[span_id];
            const text = this.props.value;
            //const selected_text = this.props.value
            //event.stopPropagation();
            //alert("The following span ID was clicked: " + event.currentTarget.id);
            const selected_text = text.substring(span_range[0], span_range[1]);

            const cur_ranges = this.state.ranges;
            cur_ranges.splice(span_id, 1);

            const cur_infos = this.state.quote_infos;
            cur_infos.splice(span_id, 1);

            this.setState({
                ranges: cur_ranges, quote_infos: cur_infos,
                current_sel: selected_text,
                cur_start: span_range[0],
                cur_end: span_range[1],
                locked: true,
                confirmed: true,
                cur_info: span_info
            })

        }

    }

    processSelection() {

        let texts = [];
        let classes = [];
        let ids = [];

        const cur_ranges = this.state.ranges;
        const cur_infos = this.state.quote_infos;

        //let cur_html = '<span>';
        const text = this.props.value;
        const normal_class = 'normal-text';
        let current_color = 'highlight';
        if(this.state.confirmed === true) {
            current_color = 'highlight-green';
        }

        const start = this.state.cur_start;
        const end = this.state.cur_end;

        const len = cur_ranges.length;

        const last_end = (len > 0) ? Math.max(cur_ranges[len-1][1], end) : end;

        const begin = 0;

        const last = Math.min(text.length, last_end);
        let cur = begin;

        let i = 0;

        let cur_done = false;

        while ((cur < last) && ((i <= len) || (len === 0))) {
            let min_is_element = false;
            let min_start = start;
            let min_end = end;

            if (len !== 0 && i<len) {
                let element = cur_ranges[i];
                //console.log("Element: ", element);
                //console.log("Cur: ", cur);
                min_is_element = true;
                min_start = element[0];
                min_end = element[1];
                if ((start < min_start) && cur_done === false) {
                    min_start = start;
                    min_end = end;
                    min_is_element = false;
                }
            }
            //console.log("min_start: " + String(min_start)+ " Cur: " + String(cur));
            if (cur < min_start) {
                //console.log("Normal text.");
                //subs = '<span class = '+normal_class+'>' + text.substring(cur, min_start) + '</span>';
                //cur_html += subs;
                texts.push(text.substring(cur, min_start));
                classes.push(normal_class);
                ids.push('');
                cur = min_start;
            }
            else if (cur === min_start) {
                let id = '';
                let min_class = current_color;
                if (min_is_element === true) {
                    min_class = 'highlight-yellow';
                    if (cur_infos[i].speaker !== '') {
                        min_class = 'highlight-yellow-border';
                    }

                    if (cur_infos[i].sel_type === 'Mention') {
                        if (cur_infos[i].speakee.length === 0){
                            min_class = 'mention';
                        }
                        else {
                            min_class = 'mention-resolved';
                        }
                    }

                    id = i;
                    i = i + 1;
                }
                else {
                    cur_done = true;
                }
                //console.log("Found a selection! Color: " + min_class);

                //subs = '<span class = '+min_class+'>' + text.substring(min_start, min_end) + '</span>';
                if (min_class === 'highlight-yellow' || min_class === 'highlight-yellow-border' || min_class === 'mention' || min_class === 'mention-resolved') {
                    //subs = this.clickableSpan(text.substring(min_start, min_end), min_class, String(i-1));
                    texts.push(text.substring(min_start, min_end));
                    classes.push(min_class);
                    ids.push(i-1);
                    //console.log(subs);
                }
                else {
                    texts.push(text.substring(min_start, min_end));
                    classes.push(min_class);
                    ids.push('');
                }
                //cur_html += subs;
                //console.log("Adding highlights: ", subs);
                cur = min_end;

            }
        }
        if (cur < text.length) {
            //subs = subs = '<span class = '+normal_class+'>' + text.substring(cur, text.length) + '</span>';
            //cur_html+=subs;
            texts.push(text.substring(cur, text.length));
            classes.push(normal_class);
            ids.push('');
        }
        //cur_html += '</span>';
        return {
            texts: texts,
            classes: classes,
            ids: ids
        }
    }

    addToRanges(info) {
        console.log("Adding selection to ranges: ");
        let cur_ranges = this.state.ranges;
        let cur_infos = this.state.quote_infos;

        cur_ranges.push([this.state.cur_start, this.state.cur_end]);
        cur_infos.push(info);

        let indices = new Array(cur_ranges.length);
        for (var i = 0; i < cur_ranges.length; ++i) indices[i] = i;

        indices.sort(function (a, b) { return cur_ranges[a][0] < cur_ranges[b][0] ? -1 : cur_ranges[a] > cur_ranges[b] ? 1 : 0; });

        cur_ranges.sort(function(a,b) {
                return a[0] - b[0]
            }
        );

        const new_infos = indices.map((value, i) => {return cur_infos[value]});

        this.setState({ranges: cur_ranges, quote_infos: new_infos, cur_info: {},
            cur_start: Number.POSITIVE_INFINITY, cur_end: Number.POSITIVE_INFINITY,
            locked:false, current_sel:'', confirmed: false, cur_mode:'normal'});
    }

    confirmSelection(event) {
        if (this.state.confirmed === false) {
            this.setState({confirmed: true});
        }
        event.preventDefault();
    }

    // addToSelection(start, end) {
    //
    // }

    setSelection(start, end) {
        //console.log(selection, before, after);
        const text = this.props.value;

        const cur_sel = text.substring(start, end);

        if (this.state.cur_mode !== 'ref_exp') {
            const cur_info = {
                quote_type: '',
                speaker: '',
                speakee: [],
                ref_exp: '',
            };

            this.setState({current_sel: cur_sel, cur_start: start, cur_end: end, locked: true, cur_info: cur_info});
        }

        else {
            this.setState({cur_ref_exp: cur_sel});
        }


    }

    clearSel(event) {

        // let cur_ranges = this.state.ranges;
        //
        // let new_ranges = [];
        // let modified =false;
        //
        // let index_found = -1;
        //
        // for (let i=0; i< cur_ranges.length; i = i+1) {
        //     let element = cur_ranges[i];
        //     if (element[0] === this.state.cur_start && element[1] === this.state.cur_end) {
        //         modified = true;
        //         index_found = i;
        //     }
        //     else {
        //         new_ranges.push([element[0], element[1]]);
        //     }
        // }
        //
        // if (modified === true) {
        //     cur_ranges = new_ranges;
        //     cur_ranges.sort(function(a,b) {
        //             return a[0] - b[0]
        //         }
        //     );
        //
        //
        //
        // }

        this.setState({locked: false, current_sel: '', cur_start:Number.POSITIVE_INFINITY, cur_end: Number.POSITIVE_INFINITY, confirmed: false, cur_info:{}});
        event.preventDefault();
    }

    infoSubmit() {
        alert("Info submitted!");
        this.addToRanges(this.state.cur_info);
    }

    updateSelectedRows(newRows) {
        this.setState({selectedRows: newRows});
    }

    setField(field, value) {
        //for speaker and speakee -- take selected boxes from character list
        let cur_info = this.state.cur_info;

        if (field === 'speaker') {
            cur_info.speaker = this.state.selectedRows;
            this.setState({cur_info: cur_info, cur_mode: 'normal', selectedRows: []});
        }

        else if (field === 'speakee') {
            cur_info.speakee = this.state.selectedRows;
            this.setState({cur_info: cur_info, cur_mode: 'normal', selectedRows: []});
        }

        else if (field === 'ref_exp') {
            cur_info.ref_exp = this.state.cur_ref_exp;
            this.setState({locked: true, cur_mode: 'normal', cur_info: cur_info, cur_ref_exp: ''});
            window.getSelection().empty();
        }

        else if (field === 'quote_type') {
            cur_info.quote_type = value;
            if (value === 'Implicit') {
                cur_info.ref_exp = '';
            }
            this.setState({cur_info: cur_info, cur_mode: 'normal'});
        }

    }

    updateMode(mode) {
        let selectedRows = this.state.selectedRows;
        if (mode === 'speaker') {
            selectedRows = this.state.cur_info.speaker;
            this.setState({cur_mode: mode, selectedRows: selectedRows});
        }
        else if (mode === 'speakee') {
            selectedRows = this.state.cur_info.speakee;
            this.setState({cur_mode: mode, selectedRows: selectedRows});
        }
        else {
            selectedRows = [];
            if (mode === 'ref_exp') {
                this.setState({cur_mode: mode, selectedRows: selectedRows, locked: false, cur_ref_exp: ''});
            }
            else {
                this.setState({cur_mode: mode, selectedRows: selectedRows});
            }
        }
    }

    updateChars(new_chars) {
        console.log("Updating charList in ContentBox.");
        //console.log(new_chars);
        this.setState({charList: new_chars});
    }

    setSelectionType(event) {
        const type = event.target.value;
        let cur_info = this.state.cur_info;
        cur_info.sel_type = type;
        this.setState({cur_info: cur_info})
    }

    render() {

        if (this.props.value === '') {
            return (
                <div id="annotationareacontainer">
                    <div id="annotationarea">
                        <pre id="input-text" className="lined">
                            {this.props.value}
                        </pre>
                    </div>
                </div>
            )
        }
        else {
            const display_obj = this.processSelection();
            const save_dis = (this.state.cur_start !== Number.POSITIVE_INFINITY);

            return (
                <div id={'save-option'}>

                    <div id="annotationareacontainer">

                        <Collect
                            updateChars={this.updateChars}
                            charList={this.state.charList}
                            selectedRows={this.state.selectedRows}
                            updateSelectedRows={this.updateSelectedRows}

                            setSelectionType={this.setSelectionType}

                            selected_text={this.state.current_sel}
                            clearSel={this.clearSel}
                            confirmSelection={this.confirmSelection}
                            confirmed={this.state.confirmed}
                            cur_info={this.state.cur_info}
                            infoSubmit={this.infoSubmit}
                            setField={this.setField}
                            cur_mode={this.state.cur_mode}
                            updateMode={this.updateMode}
                        />

                        <TextArea
                            value={display_obj}
                            locked={this.state.locked}
                            setSelection={(start, end) => this.setSelection(start, end)}
                            onPrevClick={this.onPrevClick}
                            clickEnabled = {this.state.cur_start === Number.POSITIVE_INFINITY}
                        />

                    </div>

                    <div id={'save-button'}>
                        <button type={'submit'} name={'save-current'}
                                disabled={save_dis}
                                //onClick={this.saveCurrent}
                                >
                            Save Progress
                        </button>
                    </div>
                </div>
            )
        }
    }
}

class Collect extends React.Component{

    render() {
        console.log("Collect: ");
        console.log(this.props.cur_info);
        if (Object.keys(this.props.cur_info).length !== 0) {
            if (this.props.cur_info.sel_type === 'Quote') {
                return (
                    <div id={'collect'}>
                        <div id="charnames">
                            <h3>Characters</h3>
                            <CharacterList
                                charList={this.props.charList}
                                updateChars={this.props.updateChars}
                                mode={this.props.cur_mode}
                                selectedRows={this.props.selectedRows}
                                updateSelectedRows={this.props.updateSelectedRows}
                            />
                        </div>
                        <div id={'middle-disp'}>
                            <div id="current-selection">
                                <h3>Current Selection</h3>
                                <SelectedText value={this.props.selected_text}
                                              lockSel={this.props.confirmSelection}
                                              clearSel={this.props.clearSel}
                                              confirmed={this.props.confirmed}
                                />
                            </div>

                            <div id={'collect-information'}>

                                <CollectInfo
                                    cur_info={this.props.cur_info}
                                    infoSubmit={this.props.infoSubmit}
                                    cur_mode={this.props.cur_mode}
                                    updateMode={this.props.updateMode}
                                    setField={this.props.setField}
                                />
                            </div>
                        </div>
                    </div>
                )
            }

            else if (this.props.cur_info.sel_type === 'Mention') {
                return (
                    <div id={'collect'}>
                        <div id="charnames">
                            <h3>Characters</h3>
                            <CharacterList
                                charList={this.props.charList}
                                updateChars={this.props.updateChars}
                                mode={this.props.cur_mode}
                                selectedRows={this.props.selectedRows}
                                updateSelectedRows={this.props.updateSelectedRows}
                            />
                        </div>
                        <div id={'middle-disp'}>
                            <div id="current-selection">
                                <h3>Current Selection</h3>
                                <SelectedText value={this.props.selected_text}
                                              lockSel={this.props.confirmSelection}
                                              clearSel={this.props.clearSel}
                                              confirmed={this.props.confirmed}
                                />
                            </div>

                            <div id={'collect-information'}>

                                <CollectMentionInfo
                                    cur_info={this.props.cur_info}
                                    infoSubmit={this.props.infoSubmit}
                                    cur_mode={this.props.cur_mode}
                                    updateMode={this.props.updateMode}
                                    setField={this.props.setField}
                                />
                            </div>
                        </div>
                    </div>
                )
            }

            else {
                return (
                    <div id={'collect'}>
                        <div id="charnames">
                            <h3>Characters</h3>
                            <CharacterList
                                charList={this.props.charList}
                                updateChars={this.props.updateChars}
                                mode={this.props.cur_mode}
                                selectedRows={this.props.selectedRows}
                                updateSelectedRows={this.props.updateSelectedRows}
                            />
                        </div>
                        <div id={'middle-disp'}>
                            <div id="current-selection">
                                <h3>Current Selection</h3>
                                <SelectedText value={this.props.selected_text}
                                              lockSel={this.props.confirmSelection}
                                              clearSel={this.props.clearSel}
                                              confirmed={this.props.confirmed}
                                />
                            </div>

                            <div id={'collect-information'}>
                                <SelectionType
                                    setSelectionType={this.props.setSelectionType}
                                />
                            </div>
                        </div>
                    </div>

                )
            }

        }

        else {
            return (
                <div id={'collect'}>
                    <div id="charnames">
                        <h3>Characters</h3>
                        <CharacterList
                            charList={this.props.charList}
                            updateChars={this.props.updateChars}
                            mode={this.props.cur_mode}
                            selectedRows={this.props.selectedRows}
                            updateSelectedRows={this.props.updateSelectedRows}
                        />
                    </div>
                    <div id={'middle-disp'}>
                    </div>
                </div>
            )
        }


    }
}

class SelectionType extends React.Component {

    render() {

        return (
            <div id={'selection-type'}>
                <h3>
                    Select the type of the selection:
                </h3>
                <FormControl  id={'selection-type'}
                              m={-2}
                >
                    <RadioGroup aria-label="position" name="position" value={this.props.value} row
                                onChange={(event) => this.props.setSelectionType(event)}
                                fontSize={'fontSize'}
                    >
                        <FormControlLabel
                            value="Quote"
                            control={<Radio color="primary" />}
                            label="Quote"
                            labelPlacement="start"
                        />
                        <FormControlLabel
                            value="Mention"
                            control={<Radio color="primary" />}
                            label="Mention"
                            labelPlacement="start"
                        />
                    </RadioGroup>

                </FormControl>
            </div>
        )

    }
}

class TextArea extends React.Component {

    constructor(props) {
        super(props);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.convertToHtml = this.convertToHtml.bind(this);
    }

    getSelectionCharacterOffsetWithin(element) {

            var start = 0;
            var end = 0;
            var doc = element.ownerDocument || element.document;
            var win = doc.defaultView || doc.parentWindow;
            var sel;
            if (typeof win.getSelection != "undefined") {
                sel = win.getSelection();
                if (sel.rangeCount > 0) {
                    var range = win.getSelection().getRangeAt(0);
                    var preCaretRange = range.cloneRange();
                    preCaretRange.selectNodeContents(element);
                    preCaretRange.setEnd(range.startContainer, range.startOffset);
                    start = preCaretRange.toString().length;
                    preCaretRange.setEnd(range.endContainer, range.endOffset);
                    end = preCaretRange.toString().length;
                }
            } else if ( (sel = doc.selection) && sel.type !== "Control") {
                var textRange = sel.createRange();
                var preCaretTextRange = doc.body.createTextRange();
                preCaretTextRange.moveToElementText(element);
                preCaretTextRange.setEndPoint("EndToStart", textRange);
                start = preCaretTextRange.text.length;
                preCaretTextRange.setEndPoint("EndToEnd", textRange);
                end = preCaretTextRange.text.length;
            }

            return { start: start, end: end };

    }

    onMouseUp(event) {

        if (this.props.locked === false && event.currentTarget.className === 'input-text') {
            //console.log("Text selected.");
            const target = event.currentTarget;
            const offSets = this.getSelectionCharacterOffsetWithin(target);
            if (offSets.start !== offSets.end) {
                console.log("Offsets: ", offSets.start, offSets.end);
                this.props.setSelection(offSets.start, offSets.end);
            }
        }
    }

    convertToHtml(display_obj) {
        const texts = display_obj.texts;
        const classes = display_obj['classes'];
        const ids = display_obj.ids;

        const spans = texts.map((value, i) => {
            if (ids[i] !== '') {
                return (
                    <span className={classes[i]} id={ids[i]} onClick={this.props.onPrevClick}>{value}</span>
                )
            }
            else {
                return (
                    <span className={classes[i]}>{value}</span>
                )
            }
        });

        return spans;
    }

   render() {

        let class_name = 'input-text';
        // if (this.props.locked === true) {
        //     class_name = 'input-text disable-selection';
        // }
        const spans = this.convertToHtml(this.props.value);
        return (
            <div id={'annotationarea'}
                 className={class_name}
                 onMouseUp={(event) => this.onMouseUp(event)}
                 //onClick={this.props.onPrevClick}
                 >
                <span>
                {spans}
                </span>
            </div>
        )
   }


}

class CharacterList extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            expandedRows: [],
        };

        this.handleRowClick = this.handleRowClick.bind(this);
        this.renderItem = this.renderItem.bind(this);
        this.deleteIcon = this.deleteIcon.bind(this);
        this.handleDeleteIcon = this.handleDeleteIcon.bind(this);
        this.checkBox = this.checkBox.bind(this);
        this.handleCheckBox = this.handleCheckBox.bind(this);
        this.radioBox = this.radioBox.bind(this);
        this.handleRadioBox = this.handleRadioBox.bind(this);
        this.addButton = this.addButton.bind(this);
        this.handleAddChar = this.handleAddChar.bind(this);
        this.handleDeleteAlias = this.handleDeleteAlias.bind(this);
        this.addAliasButton = this.addAliasButton.bind(this);
        this.handleAddAlias = this.handleAddAlias.bind(this);
    }

    handleRowClick(rowId) {
        const currentExpandedRows = this.state.expandedRows;
        const isRowCurrentlyExpanded = currentExpandedRows.includes(rowId);

        const newExpandedRows = isRowCurrentlyExpanded ?
            currentExpandedRows.filter(id => id !== rowId) :
            currentExpandedRows.concat(rowId);

        this.setState({expandedRows : newExpandedRows});
    }

    handleDeleteIcon(name) {

        const confirm = window.confirm("Deleting the following character with all aliases: "+name);

        if (confirm === true) {
            const oldChars = this.props.charList;

            const newChars = oldChars.filter((el) => {
                return el.name !== name;
            });
            //this.setState({charList: newChars});
            this.props.updateChars(newChars);
        }
    }

    deleteIcon(name) {
        return (
            <span id={'delete-button-' + name}>
                <button name={'D'} onClick={() => this.handleDeleteIcon(name)}>Del</button>
            </span>
        )
    }

    handleCheckBox(name) {
        const currentSelectedRows = this.props.selectedRows;
        const isRowCurrentlySelected = currentSelectedRows.includes(name);

        if (isRowCurrentlySelected === true) {
            console.log("Handle checkBox " + name);
        }

        const newSelectedRows = isRowCurrentlySelected ?
            currentSelectedRows.filter((el) => el !== name) :
            currentSelectedRows.concat(name);
        console.log("New selected rows: " + newSelectedRows);
        this.props.updateSelectedRows(newSelectedRows);
    }

    checkBox(name) {
        let disabled = false;
        let checked = this.props.selectedRows.includes(name);

        if (checked === true) {
            console.log(name);
        }

        if (this.props.mode === 'normal' || this.props.mode == 'ref_exp') {
            disabled = true;
            checked = false;
        }
        //console.log(this.props.selectedRows);


        return (
            <input type={'checkbox'} disabled={disabled}
                   checked={checked} onClick={() => this.handleCheckBox(name)} />
        )
    }

    handleRadioBox(name) {
        const currentSelectedRows = [];
        //const isRowCurrentlySelected = (currentSelectedRows.length > 0);

        const newSelectedRows = currentSelectedRows.concat(name);

        this.props.updateSelectedRows(newSelectedRows);
    }

    radioBox(name) {
        const checked = this.props.selectedRows.includes(name);

        return (
            <input type={'radio'}
                   checked={checked} onClick={() => this.handleRadioBox(name)} />
        )
    }

    handleDeleteAlias(item, aliasName) {

        const old_chars = this.props.charList;

        const old_expand = item.expand;
        const new_expand = old_expand.filter((el) => el.name !== aliasName);

        old_chars.forEach((el) => {
            if (el.name === item.name) {
                el.expand = new_expand;
            }
        });

        this.props.updateChars(old_chars);
    }

    addAliasButton(item) {
        return (
            <span>
                <button name={'add-alias'} onClick={() => this.handleAddAlias(item)}>New</button>
            </span>
        )
    }

    handleAddAlias(item) {
        const aliasName = window.prompt("Enter new alias name for "+item.name+" : ");

        const old_chars = this.props.charList;
        old_chars.forEach((el) => {
            if (el.name === item.name) {
                item.expand.push({
                    name: aliasName,
                });
            }
        });

        this.props.updateChars(old_chars);
    }

    renderItem(item) {
        const clickCallback = () => this.handleRowClick(item.name);
        const deleteIcon = this.deleteIcon(item.name);

        let icon = null;

        if (this.props.mode !== 'speaker') {
            icon = this.checkBox(item.name)
        }
        else {
            icon = this.radioBox(item.name)
        }


        const itemRows = [
            <tr key={"row-data-" + item.name}>
                <td className={'td-normal'}>{icon}</td>
                <td onClick={clickCallback} className={'td-normal row-name'}>{item.name}</td>
                <td className={'td-normal'}>{deleteIcon}</td>
            </tr>
        ];

        if (this.state.expandedRows.includes(item.name)) {
            itemRows.push(
                <tr>
                    <td></td>
                    <td><b>Aliases</b></td>
                    <td>{this.addAliasButton(item)}</td>
                </tr>
            );
            item.expand.forEach((el) => {
                itemRows.push(
                    <SubTable
                        item={item}
                        alias={el}
                        handleDeleteAlias={this.handleDeleteAlias}

                    />
                );
            });
            }

        return itemRows;
    }

    handleAddChar() {
        const name = window.prompt("Enter character name: ");

        const old_chars = this.props.charList;
        old_chars.push({
            name: name,
            expand: []
        });
        //this.setState({charList: old_chars}); //is this needed?? Just use props.
        this.props.updateChars(old_chars);
    }

    addButton() {
        return (
            <span>
                <button name={'Add-char'} onClick={this.handleAddChar}>Add</button>
            </span>
        )
    }

    render() {

        console.log("Rendering character list with: " + this.props.selectedRows);
        let allItemRows = [];

        this.props.charList.forEach(item => {
            const perItemRows = this.renderItem(item);
            allItemRows = allItemRows.concat(perItemRows);
        });

        return (
            <div id={'character-list'}>
                <table>
                    <thead>
                        <tr>
                            <td>
                                Characters
                            </td>
                            <td>
                                {this.addButton()}
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        {allItemRows}
                    </tbody>
                </table>
            </div>
        );
    }

}

class SubTable extends React.Component {

    constructor(props) {
        super(props);

    }

    deleteAliasIcon(item, aliasName) {
        return (
            <span id={'delete-button-' + aliasName}>
                <button name={'D'} onClick={() => this.props.handleDeleteAlias(item, aliasName)}>Del</button>
            </span>
        )
    }

    render() {
        //console.log(this.props.item.expand);
        const el = this.props.alias;
        return (
            <tr key={el.name}>
                <td></td>
                <td className={'td-alias'}>
                    {el.name}
                </td>
                <td>
                    {this.deleteAliasIcon(this.props.item, el.name)}
                </td>
            </tr>
        )
    }
}

class CollectInfo extends React.Component {

    constructor(props) {
        super(props);
        this.setQuoteType = this.setQuoteType.bind(this);
        this.onRefExpSubmit = this.onRefExpSubmit.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.onReviewEdit = this.onReviewEdit.bind(this);
    }

    setQuoteType(event) {
        const quote_type = event.target.value;
        this.props.setField('quote_type', quote_type);
    }


    onRefExpSubmit() {
        this.props.setField('ref_exp', this.state.ref_exp);
    }

    onSubmit() {
        //this.props.onSubmit();
        console.log("Info submitted");
        this.props.updateMode('done');
    }

    onConfirm() {
        this.props.infoSubmit();
    }

    onReviewEdit() {
        this.props.updateMode('normal');
    }




    render() {

        const ref_disable = (this.props.cur_info.quote_type === 'Implicit') || (this.props.cur_info.quote_type === '');

        //console.log("CollectInfo");
        //console.log(this.props.cur_info);
        if (this.props.cur_mode !== 'done') {

            return (
                <div id={'quote-info'}>
                    <QuoteType
                        setQuoteType={this.setQuoteType}
                        value={this.props.cur_info.quote_type}
                        mode={this.props.cur_mode}
                    />

                    <SpeakerInfo
                        updateMode={this.props.updateMode}
                        value={this.props.cur_info.speaker}
                        mode={this.props.cur_mode}
                        setField={this.props.setField}
                    />

                    <SpeakeeInfo
                        updateMode={this.props.updateMode}
                        value={this.props.cur_info.speakee}
                        mode={this.props.cur_mode}
                        setField={this.props.setField}
                        message={"Select Addressee"}
                    />

                    <RefExpInfo
                        updateMode={this.props.updateMode}
                        value={this.props.cur_info.ref_exp}
                        mode={this.props.cur_mode}
                        setField={this.props.setField}
                        active={ref_disable}
                        />

                    <SubmitInfoButton
                        onSubmit={this.onSubmit}
                        />
                </div>
            )


        }


        else {
            return (
                <DisplayInfo speaker={this.props.cur_info.speaker}
                             speakee={this.props.cur_info.speakee}
                             ref_exp={this.props.cur_info.ref_exp}
                             onConfirm={this.onConfirm}
                             onBack={this.onReviewEdit}
                />
            )
        }
    }
}

class CollectMentionInfo extends React.Component {

    constructor(props) {
        super(props);
        this.onReviewEdit = this.onReviewEdit.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onConfirm() {
        this.props.infoSubmit();
    }

    onReviewEdit() {
        this.props.updateMode('normal');
    }

    onSubmit() {
        //this.props.onSubmit();
        console.log("Info submitted");
        this.props.updateMode('done');
    }


    render() {

        if (this.props.cur_mode != 'done') {
            return (
                <div id={'collect-mention'}>
                    <SpeakeeInfo
                        updateMode={this.props.updateMode}
                        value={this.props.cur_info.speakee}
                        mode={this.props.cur_mode}
                        setField={this.props.setField}
                        message={"Select Entity being referred to "}
                    />
                    <SubmitInfoButton
                        onSubmit={this.onSubmit}
                />
                </div>
            )
        }

        else {
            return (
                <DisplayInfo
                             speakee={this.props.cur_info.speakee}
                             onConfirm={this.onConfirm}
                             onBack={this.onReviewEdit}
                />
            )
        }

    }
}

class QuoteType extends React.Component {

    render() {
        return (
            <div>
                <FormControl  id={'quote-type'}
                              m={-2}
                >
                    <RadioGroup aria-label="position" name="position" value={this.props.value} row
                                onChange={(event) => this.props.setQuoteType(event)}
                                fontSize={'fontSize'}
                    >
                        <FormControlLabel
                            value="Implicit"
                            control={<Radio color="primary" />}
                            label="Implicit"
                            labelPlacement="start"
                        />
                        <FormControlLabel
                            value="Anaphoric"
                            control={<Radio color="primary" />}
                            label="Anaphoric"
                            labelPlacement="start"
                        />
                        <FormControlLabel
                            value="Explicit"
                            control={<Radio color="primary" />}
                            label="Explicit"
                            labelPlacement="start"
                            fontSize={'fontSize'}
                        />
                    </RadioGroup>

                    <FormHelperText>Select Quote Type</FormHelperText>

                </FormControl>
            </div>
        )
    }
}

class SpeakerInfo extends React.Component {

    constructor(props) {
        super(props);
        this.onEdit = this.onEdit.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onEdit() {
        this.props.updateMode('speaker');
    }

    onSubmit() {
        this.props.setField('speaker');
    }

    render() {
        const display_message = (this.props.value === '') ? "None set." : this.props.value;

        return (
            <div id={'select-speaker'}>
                <div>Select the speaker from the character list on the left, and press Submit when done.</div>
                <span>Speaker: {display_message} </span>
                <span>
                    <button type={'submit'} name={'speaker-edit'} onClick={this.onEdit}>Edit</button>
                </span>
                <span>
                    <button type={'submit'} name={'speaker-ok'} onClick={this.onSubmit}>Submit</button>
                </span>
            </div>
        )

    }
}

class SpeakeeInfo extends React.Component {

    constructor(props) {
        super(props);
        this.onEdit = this.onEdit.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onEdit() {
        this.props.updateMode('speakee');
    }

    onSubmit() {
        this.props.setField('speakee');
    }

    render() {
        // console.log("Speakee: ");
        // console.log(this.props.value);
        const message = (this.props.value === '') ? 'None set' : this.props.value.join('; ');
        return (
            <div id={'select-speakee'}>
                <div>{this.props.message} from the character list on the left, and press Submit when done. If there are multiple, select all possible ones.</div>
                <span>Addressee(s): {message} </span>
                <span>
                    <button type={'submit'} name={'speakee-edit'} onClick={this.onEdit}>Edit</button>
                </span>
                <span>
                    <button type={'submit'} name={'speakee-ok'} onClick={this.onSubmit}>Submit</button>
                </span>
            </div>
        )

    }

}

class SelectedText extends React.Component {

    render() {
        if (this.props.value ==='') {
            return (
                <div id="current-text">

                </div>
            )
        }
        else {
            return (
                <div id="cur-sel">

                    <div id="current-text">
                        <p>{this.props.value}</p>
                        <form
                            className='lockSel'
                        >
                            <span>
                                <button type="submit" value="OK" name="submit" id='lock-sel' onClick={this.props.lockSel}>
                                    OK
                                </button>
                            </span>

                            <span>
                                <button type='submit' onClick={this.props.clearSel}>
                                    Clear
                                </button>
                            </span>
                        </form>
                    </div>


                </div>

            )
        }
    }
}

class RefExpInfo extends React.Component {

    constructor(props) {
        super(props);
        this.onEdit = this.onEdit.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onEdit() {
        this.props.updateMode('ref_exp');
    }

    onSubmit() {
        this.props.setField('ref_exp');
    }

    render() {
        // console.log("Speakee: ");
        // console.log(this.props.value);
        const message = (this.props.value === '') ? 'None set' : this.props.value;

        if (this.props.active) {
            return null
        }
        else {
            return (

                <div id={'select-ref_exp'}
                >
                    <div>Select the referring expression from the text area on the right.</div>
                    <span>Referring Expression: {message} </span>
                    <span>
                    <button type={'submit'} name={'speakee-edit'}
                            onClick={this.onEdit}>Edit</button>
                </span>
                    <span>
                    <button type={'submit'} name={'speakee-ok'}
                            onClick={this.onSubmit}>Submit</button>
                </span>
                </div>
            )
        }

    }
}

class SubmitInfoButton extends React.Component {
    render() {
        return (
            <div>
                <button type="submit" value="Submit-info" onClick={this.props.onSubmit}>Submit Info </button>
            </div>
            )

    }
}

class DisplayInfo extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        let ref_exp = '';
        if ('ref_exp' in this.props) {
            ref_exp = this.props.ref_exp;
        }

        if ('speaker' in this.props.speaker) {
            return (
                <div id={'display-info'}>
                    <div id={'info'}>

                        <h3>Review Quote Information: </h3>
                        <ul>
                            <li>Speaker: {this.props.speaker}</li>
                            <li>Addressee: {this.props.speakee}</li>
                            <li>Referring Expression: {ref_exp}</li>
                        </ul>
                    </div>

                    <div>
                    <span>
                        <button type={'submit'} name={'confirm-info'}
                                onClick={this.props.onConfirm}
                        >
                            Confirm
                        </button>
                    </span>
                        <span>
                        <button type={'submit'} name={'edit-info'}
                                onClick={this.props.onBack}
                        >
                            Back
                        </button>
                    </span>
                    </div>
                </div>
            )
        }

        else {
            return (
                <div id={'display-info'}>
                    <div id={'info'}>

                        <h3>Review Mention Information: </h3>
                        <ul>
                            <li>Entity: {'; '.join(this.props.speakee)}</li>
                        </ul>
                    </div>

                    <div>
                    <span>
                        <button type={'submit'} name={'confirm-info'}
                                onClick={this.props.onConfirm}
                        >
                            Confirm
                        </button>
                    </span>
                        <span>
                        <button type={'submit'} name={'edit-info'}
                                onClick={this.props.onBack}
                        >
                            Back
                        </button>
                    </span>
                    </div>
                </div>
            )
        }

    }

}

ReactDOM.render(
    <Tool />,
    document.getElementById('root')
);
