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
console.log(testChars);
const useStyles = makeStyles({
    root: {
        '&:hover': {
            backgroundColor: 'transparent',
        },
    },
    icon: {
        borderRadius: '50%',
        width: 16,
        height: 16,
        boxShadow: 'inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)',
        backgroundColor: '#f5f8fa',
        backgroundImage: 'linear-gradient(180deg,hsla(0,0%,100%,.8),hsla(0,0%,100%,0))',
        '$root.Mui-focusVisible &': {
            outline: '2px auto rgba(19,124,189,.6)',
            outlineOffset: 2,
        },
        'input:hover ~ &': {
            backgroundColor: '#ebf1f5',
        },
        'input:disabled ~ &': {
            boxShadow: 'none',
            background: 'rgba(206,217,224,.5)',
        },
    },
    checkedIcon: {
        backgroundColor: '#137cbd',
        backgroundImage: 'linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))',
        '&:before': {
            display: 'block',
            width: 16,
            height: 16,
            backgroundImage: 'radial-gradient(#fff,#fff 28%,transparent 32%)',
            content: '""',
        },
        'input:hover ~ &': {
            backgroundColor: '#106ba3',
        },
    },
});

// const testChars =
//     [
//         {
//             id: 1,
//             name: 'A',
//             expand: [
//                 {
//                     id: 2,
//                     name: 'aa',
//                 },
//                 {
//                     id: 3,
//                     name: 'aaA',
//                 }],
//         },
//         {
//             id: 4,
//             name: 'B',
//             expand: [{
//                 id: 5,
//                 name: 'bb',
//             }]
//         },
//         {
//             id: 6,
//             name:'C',
//             expand: []
//         },
//         {
//             id: 7,
//             name:'D',
//             expand:[{
//                 id: 8,
//                 name:'Dd',
//             }]
//         },
//         {
//             id: 9,
//             name:'E',
//             expand: [{
//                 id: 10,
//                 name:'eeee',
//             }]
//
//         },
//     ];

const columns = [{
    dataField: 'name',
    text: 'Name'
}];

// function XmlToHtml(props) {
//     //parse the xml file and return a html <span> with highlights.
// }
//
// function HtmlToXml(props) {
//     //parse the innerHTML with <span>s and return an xml to write to file.
// }

class Tool extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            file_loaded: true,

        };
    }

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

    constructor(props) {
        super(props);
        //console.log("Constructor called");
        this.state = {
            charList: testChars,
            ranges: myData.ranges,
            current_sel: '',
            cur_start: Number.POSITIVE_INFINITY,
            cur_end: Number.POSITIVE_INFINITY,
            locked: false,
            confirmed: false,
            quote_infos: myData.quote_infos,
            cur_info: {}
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

    }

    onPrevClick(event) {
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

    // onEditPrevious() {
    //
    // }


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
        let subs = '';
        let i = 0;

        let cur_done = false;

        while ((cur < last) && ((i <= len) || (len === 0))) {
            let min_is_element = false;
            let min_start = start;
            let min_end = end;

            if (len !== 0 && i<len) {
                let element = cur_ranges[i];
                console.log("Element: ", element);
                console.log("Cur: ", cur);
                min_is_element = true;
                min_start = element[0];
                min_end = element[1];
                if ((start < min_start) && cur_done === false) {
                    min_start = start;
                    min_end = end;
                    min_is_element = false;
                }
            }
            console.log("min_start: " + String(min_start)+ " Cur: " + String(cur));
            if (cur < min_start) {
                console.log("Normal text.");
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

                    id = i;
                    i = i + 1;
                }
                else {
                    cur_done = true;
                }
                console.log("Found a selection! Color: " + min_class);

                //subs = '<span class = '+min_class+'>' + text.substring(min_start, min_end) + '</span>';
                if (min_class === 'highlight-yellow' || min_class === 'highlight-yellow-border') {
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
            locked:false, current_sel:'', confirmed: false});
    }

    confirmSelection(event) {
        if (this.state.confirmed === false) {
            this.setState({confirmed: true});
        }
        event.preventDefault();
    }

    setSelection(start, end) {
        //console.log(selection, before, after);
        const text = this.props.value;

        const cur_sel = text.substring(start, end);

        this.setState({current_sel: cur_sel, cur_start: start, cur_end: end, locked: true});
    }

    clearSel(event) {
        let cur_ranges = this.state.ranges;
        let new_ranges = [];
        let modified =false;
        for (let i=0; i< cur_ranges.length; i = i+1) {
            let element = cur_ranges[i];
            if (element[0] === this.state.cur_start && element[1] === this.state.cur_end) {
                modified = true;
            }
            else {
                new_ranges.push([element[0], element[1]]);
            }
        }

        if (modified === true) {
            cur_ranges = new_ranges;
            cur_ranges.sort(function(a,b) {
                    return a[0] - b[0]
                }
            );

        }

        this.setState({ranges: cur_ranges, locked: false, current_sel: '', cur_start:Number.POSITIVE_INFINITY, cur_end: Number.POSITIVE_INFINITY, confirmed: false});
        event.preventDefault();
    }

    infoSubmit(info) {
        alert("Info submitted!");
        this.addToRanges(info);
    }

    updateChars(new_chars) {
        this.setState({charList: new_chars});
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

                        <div id="charnames">
                            <h3>Characters</h3>
                            <CharacterList
                                charList={this.state.charList}
                                updateChars={this.updateChars}
                            />
                        </div>

                        <div id="current-selection">
                            <h3>Current Selection</h3>
                            <CurrentSel value={this.state.current_sel}
                                        lockSel={this.confirmSelection}
                                        clearSel={this.clearSel}
                                        confirmed={this.state.confirmed}
                                        charList={this.state.charList}
                                        infoSubmit={this.infoSubmit}
                                        cur_info={this.state.cur_info}
                                //text = {{'before': this.state.before,'after': this.state.after, 'selection': this.state.current_sel}}
                            />
                        </div>

                        <TextArea
                            value={display_obj}
                            // selection={this.state.current_sel}
                            // before={this.state.before}
                            // after={this.state.after}
                            locked={this.state.locked}
                            setSelection={(start, end) => this.setSelection(start, end)}
                            onPrevClick={this.onPrevClick}
                            //mouseUp={(event) => this.getSelection(event)}
                        />

                    </div>

                    <div id={'save-button'}>
                        <button type={'submit'} name={'save-current'}
                                disabled={save_dis}
                                onClick={this.saveCurrent}
                                >
                            Save Progress
                        </button>
                    </div>
                </div>
            )
        }
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
            } else if ( (sel = doc.selection) && sel.type != "Control") {
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

        const chars = this.props.charList;
        this.state = {
            charList: chars,
            insertMode: false,
            deleteMode: false,
        };
        this.handleInsertButtonClick = this.handleInsertButtonClick.bind(this);
        //this.handleDeleteButtonClick = this.handleDeleteButtonClick.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.onAddChar = this.onAddChar.bind(this);
        //this.onAfterDeleteRow = this.onAfterDeleteRow.bind(this);
        this.isExpandableRow = this.isExpandableRow.bind(this);
        this.deleteIcon = this.deleteIcon.bind(this);
        this.deleteChar = this.deleteChar.bind(this);
        this.deleteAlias = this.deleteAlias.bind(this);
        this.expandComponent = this.expandComponent.bind(this);
        this.addAlias = this.addAlias.bind(this);
    }

    isExpandableRow(row) {
        // if ('expand' in row) return true;
        // else return false;
        return true;
    }

    expandComponent(row) {
        return (
            <SubTable
                parentRow={row}
                data={ row.expand }
                deleteAlias={this.deleteAlias}
                addAlias={this.addAlias}
            />
        );
    }

    deleteAlias(parentRow, aliasRow) {
        let confirm = window.confirm('The following alias for ' + parentRow.name + ' will be deleted: ' + aliasRow.name);
        if (confirm === true) {
            const charList = this.state.charList;
            loop1:
                for (let i=0; i<charList.length; i=i+1) {
                    //console.log(this.state.charList[i] === row);
                    if (charList[i] === parentRow) {
                        //new_chars.push(this.state.charList[i]);
                        loop2:
                            for (let j = 0; j < charList[i].expand.length; j=j+1) {
                                if (charList[i].expand[j] === aliasRow) {
                                    charList[i].expand.splice(j, 1);
                                    break loop1;
                                }
                            }
                    }
                }
            this.setState({charList: charList});
            this.props.updateChars(this.state.charList);
        }

    }

    addAlias(parentRow, alias) {
        //alert("Adding alias triggered: ")
        let new_alias = {
            'name': alias,
        };

        let charList = this.state.charList;

        for (let i=0; i<charList.length; i=i+1) {
            //console.log(this.state.charList[i] === row);
            if (charList[i] === parentRow) {
                charList[i].expand.push(new_alias);
                break;
            }
        }

        this.setState({charList: charList});
        this.props.updateChars(this.state.charList);

    }

    expandColumnComponent({ isExpandableRow, isExpanded }) {
        let content = '';

        if (isExpandableRow) {
            content = (isExpanded ? '(-)' : '(+)' );
        } else {
            content = ' ';
        }
        return (
            <div className={'clickable'}> { content } </div>
        );
    }

    createCustomInsertButton = (onClick) => {
        return (
            <InsertButton
                btnText='Add'
                btnContextual='btn-warning'
                className='clickable'
                btnGlyphicon='glyphicon-edit'
                onClick={ () => this.handleInsertButtonClick(onClick) }/>
        );
    };

    handleInsertButtonClick = (event) => {
        // Custom your onClick event here,
        // it's not necessary to implement this function if you have no any process before onClick
        // console.log('This is my custom function for InserButton click event');
        // this.setState({insertMode: true});
        let name = window.prompt("Enter new character name:  ");
        //let test = window.prompt("Testing multiple fields: ");
        if (name !== null) {
            this.onAddChar(name);
        }

    };

    closeModal() {
        this.setState({insertMode: false});
    }

    onAddChar(name) {
        //console.log(event.target);
        //const name = event.target.value;
        let old_chars = this.state.charList;
        const new_char = {
            name: name,
            expand: []
        };
        old_chars.splice(0, 0, new_char);
        this.setState({charList: old_chars, insertMode: false});
        this.props.updateChars(this.state.charList);
    }


    deleteIcon(cell, row) {
        //console.log(row === this.state.charList[0]);
        //const cur_row = row;
        return (
            <button name={'D'} value='D' onClick={() => this.deleteChar(row)}>Del</button>
        )
    }

    deleteChar(row) {

        alert("The following character and all aliases are being deleted: " + String(row.name));
        let new_chars = [];
        console.log(row);
        for (let i=0; i<this.state.charList.length; i=i+1) {
            console.log(this.state.charList[i] === row);
            if (this.state.charList[i] !== row) {
                new_chars.push(this.state.charList[i]);
            }
        }
        this.setState({charList: new_chars});
        this.props.updateChars(this.state.charList);
    }


    render() {
        const options = {
            //expandRowBgColor: 'rgb(242, 255, 163)',
            insertBtn: this.createCustomInsertButton,
            //deleteBtn: this.createCustomDeleteButton,
            //afterDeleteRow: this.onAfterDeleteRow,
            expandBy: 'column'
        };

        const selectRowProp = {
            mode: 'radio'
        };

        return (
            <div id={'character-list'}>
                <BootstrapTable data={ this.state.charList} condensed
                                class={'bts-table'}
                                insertRow={true}
                                //deleteRow={true}
                                //selectRow={ selectRowProp }
                                options={ options }
                                height={400}
                                scrollTop={'bottom'}
                                expandableRow={ this.isExpandableRow }
                                expandComponent={ this.expandComponent }
                                expandColumnOptions={ {
                                    expandColumnVisible: true,
                                    expandColumnComponent: this.expandColumnComponent,
                                    columnWidth: 50
                                } }>
                    <TableHeaderColumn class='bts-table' dataField='name' isKey={true}>Name</TableHeaderColumn>
                    <TableHeaderColumn dataField={'delete'} dataFormat={this.deleteIcon} expandable={false}></TableHeaderColumn>

                </BootstrapTable>
                <Modal show={this.state.insertMode} handleClose={this.closeModal} onSubmit={(event)=> this.onAddChar(event)}>
                    <p>Insert Data Here</p>
                </Modal>


            </div>
        );
    }
}

class SubTable extends React.Component {

    constructor(props) {
        super(props);
        this.deleteIcon = this.deleteIcon.bind(this);
        this.deleteAlias = this.props.deleteAlias;
        this.addAlias = this.addAlias.bind(this);
        this.createCustomInsertButton = this.createCustomInsertButton.bind(this);

    }

    createCustomInsertButton = (onClick) => {
        return (
            <InsertButton
                btnText='Add'
                btnContextual='btn-warning'
                className='clickable'
                btnGlyphicon='glyphicon-edit'
                onClick={ () => this.addAlias(onClick) }/>
        );
    };

    deleteIcon(cell, row) {
        //console.log(row);
        //const cur_row = row;
        return (
            <button name={'D'} value='D'
                    onClick={() => this.deleteAlias(this.props.parentRow, row)}
            >
                Del
            </button>
        )
    }

    addAlias(event) {

        let alias = window.prompt("Enter new alias for " + this.props.parentRow.name);
        //let test = window.prompt("Testing multiple fields: ");
        if (alias !== null) {
            this.props.addAlias(this.props.parentRow, alias);
        }

    }

    render() {


        const options = {
            insertBtn: this.createCustomInsertButton
        };

        return (
            <BootstrapTable data={ this.props.data }
                            class={'bts-table'}
                            insertRow={true}
                            options={options}
              >
                <TableHeaderColumn dataField='name' isKey={true}>Aliases</TableHeaderColumn>
                <TableHeaderColumn dataField={'delete'} dataFormat={this.deleteIcon}></TableHeaderColumn>
            </BootstrapTable>
        )
    }

}

class Modal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            char_name: '',
        };
        this.onSubmit = this.onSubmit.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    onSubmit(event) {
        //console.log(event.target.value);
        //event.preventDefault();
        this.props.onSubmit(this.state.char_name);
        event.preventDefault();
    }

    onChange(event) {

        this.setState({char_name: event.target.value});
    }


    render() {
        const showHideClassName = this.props.show ? "modal display-block" : "modal display-none";
        return (
            <div className={showHideClassName}>

                <div>
                    <button className='close-button' onClick={this.props.handleClose}>X</button>
                </div>

                <div>
                    <form onSubmit={this.onSubmit}
                          id = 'add-char-modal'
                    >
                        <div id={'name-input'}>
                            <label className={'input-label'}>
                                Name:
                            </label>

                            <input type={'text'} name={'name'} onChange={this.onChange}/>
                        </div>

                        <div>
                            <input type={'submit'} name={'submit'} value={'Add'} />
                        </div>
                    </form>
                </div>
            </div>
        );
    }
}

class CurrentSel extends React.Component {
    render() {
        if (this.props.confirmed === false) {
            return (
                <SelectedText
                    value={this.props.value}
                    lockSel={this.props.lockSel}
                    clearSel={this.props.clearSel}
                />
            )
        }

        else {
            return (
                <div id={'select-data'}>

                    <SelectedText
                        value={this.props.value}
                        lockSel={this.props.lockSel}
                        clearSel={this.props.clearSel}
                    />

                    <CollectInfo
                        charList={this.props.charList}
                        onSubmit={this.props.infoSubmit}
                        cur_info={this.props.cur_info}
                    />

                </div>
                )
        }
    }
}

class CollectInfo extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            quote_type: '',
            speaker: '',
            speakee: '',
            speakers_done: false,
            ref_exp: '',
            ref_exp_done: false
        };
        this.setQuoteType = this.setQuoteType.bind(this);
        this.setSpeakerInfo = this.setSpeakerInfo.bind(this);
        this.onRefExpChange = this.onRefExpChange.bind(this);
        this.onRefExpSubmit = this.onRefExpSubmit.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.onReviewEdit = this.onReviewEdit.bind(this);
    }

    onConfirm() {
        const info = {
            quote_type: this.state.quote_type,
            speaker: this.state.speaker,
            speakee: this.state.speakee,
            ref_exp: this.state.ref_exp,
        };
        this.props.onSubmit(info);
        this.setState({quote_type: '',
            speaker: '',
            speakee: '',
            speakers_done: false,
            ref_exp: '',
            ref_exp_done: false
        });
    }

    setQuoteType(event) {
        const quote_type = event.target.value;
        if (quote_type === 'Implicit'){
            this.setState({quote_type: quote_type, ref_exp: ''});
        }
        else {
            this.setState({quote_type: quote_type})
        }

    }

    onReviewEdit(event) {

        this.setState({speakers_done: false, ref_exp_done: false});
        event.preventDefault();

    }

    setSpeakerInfo(speaker, speakee) {
        console.log("Setting speaker Info in CollectInfo: ");
        this.setState({speaker: speaker, speakee: speakee, speakers_done: true});
        // if (this.state.quote_type === 'Implicit') {
        //     this.props.onSubmit();
        // }
    }

    onRefExpChange(event) {
        this.setState({ref_exp: event.target.value});
    }

    onRefExpSubmit() {
        //this.props.onSubmit();
        console.log("Ref exp submitted");
        this.setState({ref_exp_done: true});
    }

    componentDidMount() {
        if ('speaker' in this.props.cur_info) {
            console.log("Component did mount with: ");
            console.log(this.props.cur_info);
            this.setState({
                quote_type: this.props.cur_info.quote_type,
                speaker: this.props.cur_info.speaker,
                speakee: this.props.cur_info.speakee,
                ref_exp: this.props.cur_info.ref_exp,
                speakers_done: false,
                ref_exp_done: false

            })
        }

        else {
            this.setState({
                quote_type: '',
                speaker: '',
                speakee: '',
                ref_exp: '',
                speakers_done: false,
                ref_exp_done: false

            })
        }
    }

    render() {

        if (this.state.quote_type === '') {
            return (
                <div id={'implicit-info'}>
                    <QuoteType
                        setQuoteType={this.setQuoteType}
                        value={this.state.quote_type}
                    />
                </div>
            )
        }


        else if (this.state.quote_type === 'Implicit') {
            if (this.state.speakers_done === false) {
                // console.log("Dog!");
                // console.log(this.state);
                return (
                    <div id={'implicit-info'}>
                        <QuoteType
                            setQuoteType={this.setQuoteType}
                            value={this.state.quote_type}
                        />
                        <SpeakerData
                            charList={this.props.charList}
                            onSubmit={this.setSpeakerInfo}
                            speaker={this.state.speaker}
                            speakee={this.state.speakee}
                        />
                    </div>

                )
            }

            else {
                return (
                    <DisplayInfo
                        speaker={this.state.speaker}
                        speakee={this.state.speakee}
                        onConfirm={this.onConfirm}
                        onBack={this.onReviewEdit}
                        />
                )
            }


        }

        else {
            if (this.state.speakee === '' || this.state.speaker === '') {
                return (
                    <div id={'explicit-speaker-info'}>
                        <QuoteType
                            setQuoteType={this.setQuoteType}
                            value={this.state.quote_type}
                        />
                        <SpeakerData charList={this.props.charList}
                                     onSubmit={this.setSpeakerInfo}
                                     speaker={this.state.speaker}
                                     speakee={this.state.speakee}
                        />

                    </div>
                )
            }

            else if (this.state.ref_exp_done === false) {
                return (
                    <div id={'explicit-ref-exp-info'}>
                        <QuoteType
                            setQuoteType={this.setQuoteType}
                            value={this.state.quote_type}
                        />
                        <SpeakerData charList={this.props.charList}
                                     onSubmit={this.setSpeakerInfo}
                                     speaker={this.state.speaker}
                                     speakee={this.state.speakee}
                        />
                        <SelectRefExp
                            onChange={this.onRefExpChange}
                            value={this.state.ref_exp}
                        />
                        <button name={'ref-submit'}
                                type='submit' onClick={this.onRefExpSubmit}>
                            Submit
                        </button>
                    </div>
                )
            }

            else {
                return (
                    <DisplayInfo speaker={this.state.speaker}
                                 speakee={this.state.speakee}
                                 ref_exp={this.state.ref_exp}
                                 onConfirm={this.onConfirm}
                                 onBack={this.onReviewEdit}
                    />
                )
            }
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

class SpeakerData extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            speaker: '',
            speakee: ''
        };
        this.onSpeakeeChange = this.onSpeakeeChange.bind(this);
        this.onSpeakerChange = this.onSpeakerChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    componentDidMount() {
        console.log("SpeakerData props arrive: ");
        console.log(this.props);

        this.setState({
            speaker: this.props.speaker,
            speakee: this.props.speakee,
        });
    }


    onSubmit() {
        console.log("Submitting to parent from SpeakerData: ");
        this.props.onSubmit(this.state.speaker, this.state.speakee);
    }

    onSpeakerChange(event) {
        this.setState({speaker: event.target.value});
    }

    onSpeakeeChange(event) {
        this.setState({speakee: event.target.value});
    }

    render() {

        let char_names = [];
        for (let i=0; i<this.props.charList.length; i=i+1) {
            char_names.push(this.props.charList[i].name);
        }

        return (
            <div id={'people-info'}>
                <SelectSpeaker
                    charList={char_names}
                    value={this.state.speaker}
                    onChange={this.onSpeakerChange}
                />
                <SelectSpeakee
                    charList={char_names}
                    value={this.state.speakee}
                    onChange={this.onSpeakeeChange}
                />
                <button name={'speaker-submit'}
                        type='submit' onClick={this.onSubmit}>
                    OK
                </button>
            </div>
        )
    }
}

class SelectSpeaker extends React.Component {
    render() {

        const options = this.props.charList.map((value, i) => {
            return (
                <option value={value} key={value}>{value}</option>
            )
        });

        return (
        <div id={'select-speaker'}>
            <FormControl id='speaker'
                         margin={'dense'}
                         m={-2}
                //onSubmit={this.props.onSubmit}
            >
                <InputLabel id="demo-simple-select-label">Speaker</InputLabel>
                <Select
                    name='speaker'
                    labelId="demo-simple-select-placeholder-label-label"
                    id="demo-simple-select-placeholder-label"
                    value={this.props.value}
                    onChange={this.props.onChange}
                >
                    <option value={''} key={''} />
                    {options}
                </Select>
                <FormHelperText>Select the speaker of the quotation</FormHelperText>
            </FormControl>
        </div>
        )

    }
}

class SelectSpeakee extends React.Component {

    render() {
        const options = this.props.charList.map((value, i) => {
            return (
                <option value={value} key={value}>{value}</option>
            )
        });
        return (
            <div id={'select-speakee'}>
                <FormControl id='speakee'
                    //onSubmit={this.props.onSubmit}
                             m={-2}
                             fontSize={'fontSize'}
                >
                    <InputLabel id="demo-simple-select-label">Addresee</InputLabel>
                    <Select
                        name='speakee'
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={this.props.value}
                        onChange={this.props.onChange}
                    >
                        <option value={''} key={''} />
                        {options}
                    </Select>
                    <FormHelperText>Select the character who is being spoken to</FormHelperText>
                </FormControl>
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

class SelectRefExp extends React.Component {

    render() {
        return (
            <div>
                <form id={'ref-exp'}>
                    <div>
                        <TextField id="outlined-basic"
                                   className={'ref-exp-text'}
                                   label="Referring Expression"
                                   margin="normal"
                                   variant="outlined"
                                   helperText={'Enter in the expression that indicates the speaker, addressee and speaking verb.'}
                                   value={this.props.value}
                                   onChange={(event) => this.props.onChange(event)}
                        />
                    </div>
                </form>
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
                                onClick={this.props.onConfirm}>
                            Confirm
                        </button>
                    </span>
                    <span>
                        <button type={'submit'} name={'edit-info'}
                                onClick={this.props.onBack}>
                            Back
                        </button>
                    </span>
                </div>
            </div>
        )
    }

}

ReactDOM.render(
    <Tool />,
    document.getElementById('root')
);
