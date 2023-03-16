import React from 'react';
// import ReactDOM from 'react-dom';
import './grid.css';

// import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';

//import 'react-bootstrap-table/dist/react-bootstrap-table-all.min.css';
// import ReactModal from 'react-modal';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import axios from 'axios';
import ErrorBoundary from "./ErrorBoundary";
// import ReactTooltip from "react-tooltip";

//import myData from './quotes.json';
//import testChars from './chars.json'

//const title = JSON.parse('{{ title | tojson | safe}}');
//console.log(title);
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
                    <ErrorBoundary>
                        <TextLoader />
                    </ErrorBoundary>
                </div>
            </div>
        );
    }
}

function toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }

function name2id(charList) {
    //map alias name to character ID
    let nameToMain = {}

    charList.forEach((value, index) => {
        //main name
        nameToMain[value.name] = value.id;

        value.expand.forEach((alias) => {
            nameToMain[alias.name] = value.id;
        })

    });

    return nameToMain;
}

function id2name(charList) {
    let id2name = {};

    charList.forEach((el) =>{
        id2name[el.id] = el.name;
    })

    return id2name;
}

function getCharId(x, charList) {
    let x2id = name2id(charList);
  
    if (!(x in x2id)){
        return -1;
    }
    else {
        return x2id[x];
    }
}

function getCharName(id, charList) {
    let id2n = id2name(charList);
    
    if (id in id2n) {
        return id2n[id];
    }
    else {
        return "None";
    }
}
// function getAllNames(charList) {
//     let names = []

//     charList.forEach((value, index) => {
//         //main name
//         names.push(value.name);

//         value.expand.forEach((alias) => {
//             names.push(alias.name) 
//         })

//     });

//     return names;
// }

class TextLoader extends React.Component {
    // Checks if file is selected and loads it into the text box
    constructor(props) {
        super(props);
        this.state = {
            cur_file: '',
            //file_ext: '',
            content: '',
            data: '',
            charList: ''
        };
        this.handleUpload = this.handleUpload.bind(this);
        this.reloadState = this.reloadState.bind(this);
    }

    reloadState(event) {
        const confirm = window.confirm("Please save before you proceed!");

        if (confirm === true) {
            this.setState({
                cur_file: '',
                content: '',
                data: '',
                charList: '',
               
            })
        }
    }

    handleUpload(event) {
        const file_reader = new FileReader();
        let self = this;
        const file_name = event.target.files[0].name;
        console.log(event.target.files[0]);

        //let json_req = {'file_name': file_name}
        axios.get('http://127.0.0.1:8080/data',
            {
               params: {
                   file_name: file_name,
               }
            }).then(res => {
                //console.log(res.data);
                this.setState({
                    cur_file: res.data.title,
                    content: res.data.content,
                    data: res.data.data,
                    charList: res.data.charList,

                })
        });
        // this.setState({cur_file: file_name});
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
                    <LoadButton 
                    
                    handleUpload={this.handleUpload}/>
                    <p style={{'background':'white', 'text-align':'center', 'border':'none'}}><i><strong>Note: </strong>This is a friendly reminder to keep your character lists updated!
                    <br /> Copy the </i> xx_chars.json <i>file over if you are starting the next part of a previously annotated text.</i></p>
                </div>
            )
        }
        else {
            return (
                <div className="content">
                    <TextHeading value={this.state.cur_file}/>
                    <ContentBox
                        value={this.state.content}
                        data={this.state.data}
                        charList={this.state.charList}
                        reloadState={this.reloadState}
                        fileName={this.state.cur_file}
                    />
                </div>
            )
        }
    }

}


function LoadButton(props) {
    return (
        <div id="load" className="default">
            <h3 className={'init-heading'}> Load a text file: </h3>
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

function mapOrder (array, order, key) {

    array.sort( function (a, b) {
        var A = a[key], B = b[key];

        if (order.indexOf(A) > order.indexOf(B)) {
            return 1;
        } else {
            return -1;
        }

    });

    return array;
};

class ContentBox extends React.Component {

    //The mitochondria of this application.

    constructor(props) {
        super(props);
        //console.log("Constructor called");
        const myData = this.props.data;
        const charList = this.props.charList;
        const content = this.props.value;

        this.state = {
            content: content,

            charList: charList,
           
            current_sel: '',
            sel_type: 'quotes',
            locked: false,
            confirmed: false,
          
            cur_info: {},
            selectedRows: [],
            selectedSpanIds: [],
            cur_mode: 'normal',
            cur_ref_exp: '',
            cur_ref_exp_span: [],

            men_ranges: myData.men_ranges,
            men_infos: myData.men_infos,
            men_span_ids: myData.men_span_ids,

            quote_ranges: myData.quote_ranges,
            quote_infos: myData.quote_infos,
            quote_span_ids: myData.quote_span_ids,

        }
        ;

        this.clearSel = this.clearSel.bind(this);
        this.addToRanges = this.addToRanges.bind(this);
        this.setSelection = this.setSelection.bind(this);
        this.processSelection = this.processSelection.bind(this);
        this.updateChars = this.updateChars.bind(this);
        this.infoSubmit = this.infoSubmit.bind(this);
        this.onSpanClick = this.onSpanClick.bind(this);
        this.confirmSelection = this.confirmSelection.bind(this);
        this.setField = this.setField.bind(this);
        this.updateSelectedRows = this.updateSelectedRows.bind(this);
        this.updateMode = this.updateMode.bind(this);
        this.setSelectionType = this.setSelectionType.bind(this);
        this.handleSelChange = this.handleSelChange.bind(this);
        this.saveCurrent = this.saveCurrent.bind(this);
       // this.updateChars = this.updateChars.bind(this);
        this.checkCompatible = this.checkCompatible.bind(this);
        this.checkArrayEqual = this.checkArrayEqual.bind(this);
        this.mergeChars = this.mergeChars.bind(this);
        //this.simulateClick = this.simulateClick.bind(this);
        this.getSpanInfo = this.getSpanInfo.bind(this);
        //this.getCharValue = this.getCharValue.bind(this);
        //this.id2name = this.id2name.bind(this);
        this.getNumAnnotations = this.getNumAnnotations.bind(this);
        this.getCharDicts = this.getCharDicts.bind(this);
    }


    getCharDicts(){
        let qinfos = this.state.quote_infos;
        let minfos = this.state.men_infos;

        // console.log(qinfos);
        // console.log(minfos);

        let cn2qids = {};
        let cn2mids = {};

        for (const [key, value] of Object.entries(qinfos)) {
            value.speaker.forEach((s) => {
                if (s in cn2qids) {
                    cn2qids[s].push(key)
                }
                else {
                    cn2qids[s] = [key]
                }
            })

            value.speakee.forEach((s) => {
                if (s in cn2qids) {
                    cn2qids[s].push(key)
                }
                else {
                    cn2qids[s] = [key]
                }
            })
        }

        for (const [key, value] of Object.entries(minfos)) {
            value.speakee.forEach((s) => {
                if (s in cn2mids) {
                    cn2mids[s].push(key)
                }
                else {
                    cn2mids[s] = [key]
                }
            })
        }

        return {'quote': cn2qids, 'mention': cn2mids }

    }

    checkArrayEqual(a, b) {
        if (a.length === 0 && b.length === 0){
            return true;
        }

        else if (a.length !== b.length) {
            return false;
        }

        else  {
            a.sort();
            b.sort();
            for (var i = 0; i < a.length; i++) {
                if (a[i] !== b[i]) {
                    return false;
                }
            }

            return true;
        }

    }

    checkCompatible(selectedIds, spanId) {

        const infos = (this.state.sel_type === 'quotes') ? this.state.quote_infos : this.state.men_infos;

        if (selectedIds.length === 0) {
            return true;
        }

        else {
            const cur_info = infos[selectedIds[0]];
            const new_info = infos[spanId];
            console.log("Compatibility: ");
            console.log(cur_info);
            console.log(new_info);
            // console.log(this.checkArrayEqual(cur_info['speakee'], new_info['speakee']));
            // console.log(this.checkArrayEqual(cur_info['speaker'], new_info['speaker']));
            // console.log(cur_info['quote_type'] === new_info['quote_type']);
            // console.log(cur_info['ref_exp'] === new_info['ref_exp']);

           if ((this.checkArrayEqual(cur_info['speakee'], new_info['speakee'])) &&
                (this.checkArrayEqual(cur_info['speaker'], new_info['speaker'])) &&
                (cur_info['quote_type'] === new_info['quote_type']) &&
                (cur_info['ref_exp'] === new_info['ref_exp']))
            {
                return true;

            }
            else {
                return false;
            }
        }

        //cur_info = infos[selectedIds[0]]
    }

    onSpanClick(event) {
        //this.saveCurrent(event);
        const span_id = event.target.id;
        const exceprt = this.state.content;
        const ranges = (this.state.sel_type === 'quotes') ? this.state.quote_ranges : this.state.men_ranges;

        console.log("Span clicked");
        console.log(span_id, typeof(span_id));
        console.log(exceprt.substring(ranges[span_id].start, ranges[span_id].end));

        let selectedIds = this.state.selectedSpanIds;
        //const span_info = this.state.quote_infos[span_id];
        //const span_range = this.state.ranges[span_id];
        //console.log(selectedIds);
        if (selectedIds.includes(span_id)) {
            //console.log("Removing");
            selectedIds = selectedIds.filter((x) => x !== span_id);
        }
        else {
            if (this.checkCompatible(selectedIds, span_id)) {
                selectedIds.push(span_id);
            }
            //console.log("Pushing");
            //check if annotations are compatible
            else {
                tempAlert("Incompatible Selections!", 3000);
                return;
            }
        }
        //console.log(selectedIds);
        let text = '';

        for (const spanid of selectedIds){
            let cur_sub = exceprt.substring(ranges[spanid].start, ranges[spanid].end);
            console.log(spanid, cur_sub);
            text += cur_sub;
            text += '; ';
        }
        let last_info = {};
        let confirmed = this.state.confirmed;

        if (selectedIds.length > 0) {
            //last_info = infos[selectedIds[selectedIds.length - 1]];
            last_info = this.getSpanInfo(selectedIds[selectedIds.length - 1]);
            if (last_info.quote_type !== '') { //if it has already been annotated.
                confirmed = true;
            }
        }
        let locked = true;
        //to skip steps
        confirmed = true;
        if (selectedIds.length === 0) {
            locked = false;
        }

        this.setState({selectedSpanIds: selectedIds, current_sel: text, cur_info: last_info, confirmed: confirmed, locked: locked});

    }

    processSelection() {
        console.log("Processing selections");
        let texts = [];
        let classes = [];
        let ids = [];

        const ranges = (this.state.sel_type === 'quotes') ? this.state.quote_ranges : this.state.men_ranges;
        const infos = (this.state.sel_type === 'quotes') ? this.state.quote_infos : this.state.men_infos;
        const span_ids = (this.state.sel_type === 'quotes') ? this.state.quote_span_ids : this.state.men_span_ids;

        const span_ends = Object.keys(ranges).map((key) => ranges[key].end);
        //console.log(span_ends);
        const text = this.state.content;

        const last_end = Math.max.apply(null, span_ends);

        const begin = 0;

        const last = Math.min(text.length, last_end);
        let current = begin;

        let cur_span_index = 0;
        //console.log(last);
        while (current < last) {
            const cur_span_id = span_ids[cur_span_index];
            //console.log(cur_span_id, typeof(cur_span_id));
            //console.log(ranges[cur_span_id]);
            //console.log(current);
            if (current < ranges[cur_span_id].start) {
                //console.log("Normal range");
                let substr = text.substring(current, ranges[cur_span_id].start);

                let cur_class = "normal-text";
                texts.push(substr);
                classes.push(cur_class);
                ids.push('');
                current = ranges[cur_span_id].start;
            }

            else if (current === ranges[cur_span_id].start) {
                //console.log("Special range");
                let cur_class = '';
                let substr = text.substring(ranges[cur_span_id].start, ranges[cur_span_id].end);

                if (this.state.selectedSpanIds.includes(String(cur_span_id))) {
                    this.state.confirmed ? cur_class = 'confirmed-quote' : cur_class = 'selected-quote';
                }
                else if (infos[cur_span_id].sel_type === 'Quote' && infos[cur_span_id].quote_type === "") {
                    cur_class = 'identified-quote';
                }
                else {
                    // cur_class = 'annotated-quote';
                    if (infos[cur_span_id].sel_type === 'Mention') {
                        cur_class = 'identified-quote';
                        if (infos[cur_span_id].speakee.length > 0) {
                            cur_class = 'annotated-quote';
                        }
                    }
                    else {
                        cur_class = infos[cur_span_id].quote_type.toLowerCase() + '-quote';
                    }


                }
                //process mentions here
                texts.push(substr);
                classes.push(cur_class);
                ids.push(cur_span_id);
                current = ranges[cur_span_id].end;
                cur_span_index += 1;

            }
        }


        if (current < text.length) {
            //subs = subs = '<span class = '+normal_class+'>' + text.substring(cur, text.length) + '</span>';
            //cur_html+=subs;
            texts.push(text.substring(current, text.length));
            classes.push("normal-text");
            ids.push('');
        }

        return {
            texts: texts,
            classes: classes,
            ids: ids
        }
    }

    handleSelChange(event) {
        console.log(event.target.id);
        if (this.state.selectedSpanIds.length !== 0) {
            alert("Please finish current annotation to switch tabs!");
            event.preventDefault();
        }
        else {
            const target_class = event.target.id;
            if (target_class === this.state.sel_type) {
                event.preventDefault();
            }
            else {
                //this.setState({quote_infos: , span_ids: , ranges: , sel_type: });
                //alert("Changing tab to: " + target_class);
                this.setState({sel_type: target_class});
                event.preventDefault();
            }
        }
    }


    addToRanges(start, end) {
        console.log("Adding selection to ranges: ");
        let cur_ranges = (this.state.sel_type === 'quotes') ? this.state.quote_ranges : this.state.men_ranges;
        let cur_infos = (this.state.sel_type === 'quotes') ? this.state.quote_infos : this.state.men_infos;
        let span_ids = (this.state.sel_type === 'quotes') ? this.state.quote_span_ids : this.state.men_span_ids;
        const text = this.props.value;

        const susbtr = text.substring(start, end);

        const new_span_id = Math.max.apply(null, span_ids) + 1;
        console.log(new_span_id);
        cur_ranges[String(new_span_id)] = {
                                        start: start,
                                        end: end
                                    };

        const type = (this.state.sel_type === 'quotes') ? 'Quote' : 'Mention';
        const info = {
            speaker: [],
            speakee: [],
            ref_exp: '',
            quote_type: '',
            sel_type: type,
            text: susbtr,
            ref_exp_span: []
        };

        cur_infos[String(new_span_id)] = info;
        span_ids.push(String(new_span_id));
        span_ids.sort(function (a, b) { return cur_ranges[a].start - cur_ranges[b].start });

        if (this.state.sel_type === 'quotes') {
            this.setState({quote_ranges: cur_ranges, quote_infos: cur_infos, cur_info: {}, quote_span_ids: span_ids,
                locked:false, current_sel:'', confirmed: false, cur_mode:'normal'});
        }
        else {
            this.setState({men_ranges: cur_ranges, men_infos: cur_infos, cur_info: {}, men_span_ids: span_ids,
                locked:false, current_sel:'', confirmed: false, cur_mode:'normal'});
        }

    }

    confirmSelection(event) {
        if (this.state.confirmed === false) {
            const random_id = this.state.selectedSpanIds[0];
            const cur_info = (this.state.sel_type === 'quotes') ? this.state.quote_infos[random_id] : this.state.men_infos[random_id];
            this.setState({confirmed: true, locked: true, cur_info: cur_info});
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
        console.log(cur_sel);
        if (this.state.cur_mode !== 'ref_exp') {

            this.addToRanges(start, end);

        }

        else {
            this.setState({cur_ref_exp: cur_sel, cur_ref_exp_span: [start, end]});
        }


    }

    clearSel(event) {
        const currentSelectedSpans = this.state.selectedSpanIds;
        let ranges = (this.state.sel_type === 'quotes') ? this.state.quote_ranges : this.state.men_ranges;
        let infos = (this.state.sel_type === 'quotes') ? this.state.quote_infos : this.state.men_infos;
        let span_ids = (this.state.sel_type === 'quotes') ? this.state.quote_span_ids : this.state.men_span_ids;

        for (const spanid of currentSelectedSpans) {
            delete ranges[spanid];
            delete infos[spanid];
        }
        //console.log(span_ids[4]);
        //console.log(currentSelectedSpans);
        //console.log(currentSelectedSpans.includes(String(span_ids[4])));
        span_ids = span_ids.filter((x) => {
            return !currentSelectedSpans.includes(String(x))
        });
        console.log("Clearing filter: ");
        //console.log(span_ids);
        //console.log(span_ids[0]);
        //console.log(ranges[span_ids[0]]);
        if (this.state.sel_type === 'quotes') {
            this.setState({quote_ranges: ranges, quote_infos: infos, quote_span_ids: span_ids, selectedSpanIds: [], current_sel: '', cur_info: {},
                locked: false, cur_mode: 'normal'
            });
            event.preventDefault();
        }
        else {
            this.setState({men_ranges: ranges, men_infos: infos, men_span_ids: span_ids, selectedSpanIds: [], current_sel: '', cur_info: {},
                locked: false, cur_mode: 'normal'
            });
            event.preventDefault();
        }


    }


    // updateCharList() {
    //     //collect all annotated
    //     console.log("Updating character list: ");
    //     let qinfos = Object.values(this.state.quote_infos);
    //     let minfos = Object.values(this.state.men_infos);
    //     //console.log(typeof qinfos);
    //     //list of speakers
    //     let speakers = [];
    //     qinfos.forEach((obj, index) => {
    //         if ((obj.speaker.length !== 0) && !(speakers.includes(obj.speaker[0]))) {
    //             speakers.push(obj.speaker[0]);
    //         }
    //         if (obj.speakee.length > 0) {
    //             obj.speakee.forEach((name, ind) => {
    //                 if (!speakers.includes(name)) {
    //                     speakers.push(name);
    //                 }
    //             })
    //         }
    //     });

    //     minfos.forEach((obj, index) => {
    //         if (obj.speakee.length > 0) {
    //             obj.speakee.forEach((name, ind) => {
    //                 if (!speakers.includes(name)) {
    //                     speakers.push(name);
    //                 }
    //             })
    //         }
    //     });

    //     let order = speakers.reverse();
    //     console.log("Recent speakers: ", order);
    //     //rearrange to most recently used
    //     let cur_charlist = this.state.charList;

    //     //sort
    //     let new_charList = mapOrder(cur_charlist, order, 'name').reverse();
    //     return new_charList
    //     //this.setState({charList: new_charList.reverse()});
    // }

    infoSubmit(event) {
        //tempAlert("Info submitted!", 3000);        //make brief popup
        //this.addToRanges(this.state.cur_info);
        const currentSpanIDs  = this.state.selectedSpanIds;
        let infos = (this.state.sel_type === 'quotes') ? this.state.quote_infos : this.state.men_infos;

        const info = this.state.cur_info;
        for (const spanID of currentSpanIDs) {
            infos[spanID] = info;
        }

        //call character-list modification function
        //TODO
        // let new_char_list = this.updateCharList();

        if (this.state.sel_type === 'quotes') {
            this.setState({selectedSpanIds: [], quote_infos: infos, cur_info: {}, confirmed: false,
                locked: false, cur_mode: 'normal', current_sel: ''
            }, () => this.saveCurrent(event));
        }
        else {
            this.setState({selectedSpanIds: [], men_infos: infos, cur_info: {}, confirmed: false,
                locked: false, cur_mode: 'normal', current_sel: ''
            }, () => this.saveCurrent(event));
        }


    }

    updateSelectedRows(newRows) {
        this.setState({selectedRows: newRows});
    }

    setField(field, value) {
        //for speaker and speakee -- take selected boxes from character list
        let cur_info = this.state.cur_info;

        if (field === 'speaker') {
            //cur_info.speaker = this.state.selectedRows;
            let selectedROws = this.state.selectedRows; //names
            //let selectedIds = selectedROws.map((x) => this.getCharValue(x)); //check for undefined. //name 2 
            cur_info.speaker = selectedROws;
            this.setState({cur_info: cur_info, cur_mode: 'normal', selectedRows: []});
        }

        else if (field === 'speakee') {
            //cur_info.speakee = this.state.selectedRows;
            let selectedROws = this.state.selectedRows;
            //let selectedIds = selectedROws.map((x) => this.getCharValue(x));
            
             //check for undefined.
            cur_info.speakee = selectedROws;
            this.setState({cur_info: cur_info, cur_mode: 'normal', selectedRows: []});
        }

        else if (field === 'ref_exp') {
            cur_info.ref_exp = this.state.cur_ref_exp;
            cur_info.ref_exp_span = this.state.cur_ref_exp_span;
            this.setState({locked: true, cur_mode: 'normal', cur_info: cur_info, cur_ref_exp: '', cur_ref_exp_span:''});
            window.getSelection().empty();
        }

        else if (field === 'quote_type') {
            cur_info.quote_type = value;
            if (value === 'Implicit') {
                cur_info.ref_exp = '';
            }
            this.setState({cur_info: cur_info, cur_mode: 'normal'});
        }

        else if (field === 'merge-chars') {
            let selectedRows = this.state.selectedRows;
            let [newCharList, qinfos, minfos] = this.mergeChars(selectedRows);
            //let newCharToMain = aliasToChar(newCharList);
            this.setState({charList: newCharList, quote_infos: qinfos, men_infos: minfos, cur_mode: 'normal', selectedRows: []}, () => this.saveCurrent());
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
        else if (mode === 'merge') {
            //let newCharList = this.mergeChars(selectedRows);
            selectedRows = [];
            this.setState({cur_mode: mode, selectedRows: selectedRows})
        }
        else {
            selectedRows = [];
            if (mode === 'ref_exp') {
                this.setState({cur_mode: mode, selectedRows: selectedRows, locked: false, cur_ref_exp: '', cur_ref_exp_span:''});
            }
            else {
                this.setState({cur_mode: mode, selectedRows: selectedRows});
            }
        }
    }

    updateInfos(curChar, newChar, qinfos, minfos) {

        let qcount = 0;
        let mcount = 0;

        let cinfos = this.getCharDicts();
        let c2q = cinfos['quote'];
        let c2m = cinfos['mention'];

        if (curChar.id in c2q) {
            c2q[curChar.id].forEach((qid) => {
                qinfos[qid].speaker = qinfos[qid].speaker.map((s) => {
                    if (s === curChar.id) {
                        qcount += 1;
                        return newChar.id; 
                        
                    }
                    else {
                        return s;
                    }
                })
                qinfos[qid].speakee = qinfos[qid].speakee.map((s) => {
                    if (s === curChar.id) {
                        qcount += 1;
                        return newChar.id; 
                    }
                    else {
                        return s;
                    }
                })
            })
        }

        if (curChar.id in c2m) {
            c2m[curChar.id].forEach((mid) => {
               
                minfos[mid].speakee = minfos[mid].speakee.map((s) => {
                    if (s === curChar.id) {
                        mcount += 1;
                        return newChar.id; 
                    }
                    else {
                        return s;
                    }
                })
            })
        }

        return  [qinfos,  minfos, qcount, mcount];

    }

    mergeChars(selectedRows) {

        console.log("selected rows: ", selectedRows);

        let qinfos = JSON.parse(JSON.stringify(this.state.quote_infos));
        let minfos = JSON.parse(JSON.stringify(this.state.men_infos));

        let qcount = 0;
        let mcount = 0;

        let qc = 0;
        let mc = 0;

        let curCharList = this.state.charList;

        if ((selectedRows.length===0) || (selectedRows.length===1)) {
            return [curCharList, this.state.qinfos, this.state.minfos];
            
        }

        let mergeRows = [];
        let insIndex = [];
        let newCharList = curCharList.filter( function(el, index) {
            let val = selectedRows.includes(el.id);
            if (val) {
                insIndex.push(index);
                mergeRows.push(el);
            }
            return !(val)

        });

        console.log("Merge rows: ", mergeRows);
        
        insIndex = insIndex[0];
        //merge
        let main_char = mergeRows[0];

        for (var i=1; i<mergeRows.length; i++) {
            let cur_char = mergeRows[i];
            [qinfos, minfos, qc, mc] = this.updateInfos(cur_char, main_char, qinfos, minfos);
            qcount += qc;
            mcount += mc;

            let alias = {
                'name': cur_char.name,
                'parent': main_char.id
            };
            main_char.expand.push(alias);
            for (var j=0; j<cur_char.expand.length; j++) {
                let cur_alias = cur_char.expand[j];
                console.log("Cur alias: ", cur_alias);
                alias = {
                    'name': cur_alias.name, 
                    'parent': main_char.id
                };
                main_char.expand.push(alias);
            }
        }

        newCharList.splice(insIndex, 0, main_char);

        let confirm = true;
        if (qcount!==0 || mcount !==0) {
         confirm = window.confirm("Changing information for: "+qcount + " quotes, " + mcount+" mentions.");
        }
        if (confirm === true) {
            return [newCharList, qinfos, minfos];
        }
        else {
            return [curCharList, this.state.qinfos, this.state.minfos]; //check if this has been modified.
        }



        //return newCharList;
    }

    getNumAnnotations(charID) {
        let cinfos = this.getCharDicts();

        let count = 0;
        if (charID in cinfos['quote']) {
            count += cinfos['quote'][charID].length
        }

        if (charID in cinfos['mention']) {
            count += cinfos['mention'][charID].length
        }
        
        return count;

    }

    updateChars(new_chars) {
        console.log("Updating charList in ContentBox.");
        console.log("Sorting: ")
        new_chars.sort((a,b) => (a.name > b.name) ? 1: -1)
        //console.log(new_chars);
        this.setState({charList: new_chars}, () => this.saveCurrent());
    }

    getSpanInfo(spanID){
        let infos = (this.state.sel_type === 'quotes') ? this.state.quote_infos : this.state.men_infos;
        let curInfo = infos[spanID];
        // let spanInfo = {};

        // if (this.state.sel_type === 'quotes') {
        //     curInfo.speaker.forEach((value) => {
        //         spanInfo.push(this.state.charToMain[value]);
        //     })
        //     //let names = newVal.map((el) => id2name[el]);
        //     spanInfo.speaker = newVal;
    
        // }
        
        // let newSpeakeeVal = [];
        // spanInfo.speakee.forEach((value) => {
        //     newSpeakeeVal.push(this.state.charToMain[value]);
        // })
        // //let names = newSpeakeeVal.map((el) => id2name[el]);
        // spanInfo.speakee = newSpeakeeVal;

        return curInfo;
    }

    setSelectionType(event) {
        const type = event.target.value;
        let cur_info = this.state.cur_info;
        cur_info.sel_type = type;
        this.setState({cur_info: cur_info})
    }

    saveCurrent() {
        //send state to backend and clear state.
        const data_to_save = {
            file_name: this.props.fileName,
            charList: this.state.charList,
            men_ranges: this.state.men_ranges,
            men_infos: this.state.men_infos,
            men_span_ids: this.state.men_span_ids,
            quote_ranges: this.state.quote_ranges,
            quote_infos: this.state.quote_infos,
            quote_span_ids: this.state.quote_span_ids,
        };
        console.log("SAVING STATE: ");
        axios.post('http://127.0.0.1:8080/data', data_to_save)
            .then(res => {
                if (res.status === 200) {
                       tempAlert("Annotation Saved!", 3000);    //make brief popup
                }
                else {
                    alert('Save failed.');
                }
            });
        //event.preventDefault();
    }

    // simulateClick(e) {
    //     e.click();
    // }

    render() {
        let char2id = name2id(this.state.charList);
        let id2char = id2name(this.state.charList);

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
            const save_dis = (this.state.selectedSpanIds.length !== 0);
            const quote_class =  (this.state.sel_type === 'mentions') ? 'side-button' : 'side-button-selected';
            const mention_class =  (this.state.sel_type === 'quotes') ? 'side-button' : 'side-button-selected';
            return (
                <div id={'save-option'}>

                    <div id={'context-switch'}>
                        <span id={'instructions'}>
                            <a style={{display: "table-cell"}} href={"https://docs.google.com/document/d/1eBsX2rjdLBkmA-kWB_jHCxC1nmbzinH04WUg9PeN_2A/edit?usp=sharing"} target="_blank">Instructions</a>
                        </span>


                        <span id={'mentions-button'}>
                            <button name={'switch-mentions'} id={'mentions'} className={mention_class}

                                    onClick={this.handleSelChange}>
                                Mentions
                            </button>
                        </span>
                        <span id={'quotes-button'}>
                            <button name={'switch-quotes'} id={'quotes'}  className={quote_class}

                                    onClick={this.handleSelChange}>
                                Quotes
                            </button>
                        </span>


                    </div>

                    <div id="annotationareacontainer">

                        <Collect
                            updateChars={this.updateChars}
                            charList={this.state.charList}
                            id2char={id2char}
                            char2id={char2id}
                            selectedRows={this.state.selectedRows}
                            updateSelectedRows={this.updateSelectedRows}
                            getNumAnnotations={this.getNumAnnotations}

                            setSelectionType={this.setSelectionType}
                            sel_type={this.state.sel_type}
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
                            charList={this.props.charList}
                            id2char={id2char}
                            char2id={char2id}
                            locked={this.state.locked}
                            setSelection={(start, end) => this.setSelection(start, end)}
                            onSpanClick={this.onSpanClick}
                            clickEnabled = {this.state.confirmed !== true}
                            getSpanInfo = {this.getSpanInfo}
                        />

                    </div>

                    <div id={'save-button'}>
                        <span>
                            <button className={'css-button'}
                                    //ref={this.simulateClick}
                                    type={'submit'}
                                    name={'save-current'}
                                    disabled={save_dis}
                                    onClick={this.saveCurrent}
                            >
                            Save Progress
                        </button>
                        </span>
                        <span>
                            <button className={'css-button'}
                                type={'submit'} name={'clear-current'}
                                    disabled={save_dis}
                                    onClick={this.props.reloadState}
                            >
                            Reload Page
                        </button>
                        </span>

                    </div>
                </div>
            )
        }
    }
}

function tempAlert(msg,duration)
{
    var el = document.createElement("div");
    el.setAttribute("style","position:absolute;top:40%;left:20%;background-color:white;font-size:xx-large");
    el.innerHTML = msg;
    setTimeout(function(){
        el.parentNode.removeChild(el);
    },duration);
    document.body.appendChild(el);
}

// function hoverBox(info) {

// }

function displaySpanInfo(event, msg) {

    //console.log(event.target.offSets)
    const left = event.clientX + "px";
    const top = event.clientY + "px";

    var el = document.createElement("div");
    el.setAttribute("id", "spanModal")
    el.setAttribute("style","position:absolute; background-color:LightGray;");
    el.style.top = top;
    el.style.left = left;
    //console.log(msg);
    el.innerHTML = msg;
    // setTimeout(function(){
    //     el.parentNode.removeChild(el);
    // },duration);
    document.body.appendChild(el);
}

function removeModal(event) {
    var el = document.getElementById('spanModal');
    el.parentNode.removeChild(el);
}

class Collect extends React.Component{

    render() {
        console.log("Collect: ");
        console.log(this.props.cur_info);
        if (this.props.selected_text.length !== 0) {
            if (this.props.cur_info.sel_type === 'Quote') {
                return (
                    <div id={'collect'}>
                        <div id="charnames">
                            <h3>Characters</h3>
                            <CharacterList
                                charList={this.props.charList}
                                id2char={this.props.id2char}
                                char2id={this.props.char2id}
                                updateChars={this.props.updateChars}
                                mode={this.props.cur_mode}
                                selectedRows={this.props.selectedRows}
                                updateSelectedRows={this.props.updateSelectedRows}
                                updateMode={this.props.updateMode}
                                setField={this.props.setField}
                                getNumAnnotations={this.props.getNumAnnotations}
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
                                    charList={this.props.charList}
                                    id2char={this.props.id2char}
                                    char2id={this.props.char2id}
                                    infoSubmit={this.props.infoSubmit}
                                    cur_mode={this.props.cur_mode}
                                    updateMode={this.props.updateMode}
                                    setField={this.props.setField}
                                    confirmed={this.props.confirmed}

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
                                id2char={this.props.id2char}
                                char2id={this.props.char2id}
                                updateChars={this.props.updateChars}
                                mode={this.props.cur_mode}
                                selectedRows={this.props.selectedRows}
                                updateSelectedRows={this.props.updateSelectedRows}
                                updateMode={this.props.updateMode}
                                setField={this.props.setField}
                                getNumAnnotations={this.props.getNumAnnotations}
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
                                    charList={this.props.charList}
                                    id2char={this.props.id2char}
                                    char2id={this.props.char2id}
                                    infoSubmit={this.props.infoSubmit}
                                    cur_mode={this.props.cur_mode}
                                    updateMode={this.props.updateMode}
                                    setField={this.props.setField}
                                    confirmed={this.props.confirmed}

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
                                id2char={this.props.id2char}
                                char2id={this.props.char2id}
                                updateChars={this.props.updateChars}
                                mode={this.props.cur_mode}
                                selectedRows={this.props.selectedRows}
                                updateSelectedRows={this.props.updateSelectedRows}
                                updateMode={this.props.updateMode}
                                setField={this.props.setField}
                                getNumAnnotations={this.props.getNumAnnotations}
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
                                    confirmed={this.props.confirmed}
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
                            id2char={this.props.id2char}
                            char2id={this.props.char2id}
                            updateChars={this.props.updateChars}
                            mode={this.props.cur_mode}
                            selectedRows={this.props.selectedRows}
                            updateSelectedRows={this.props.updateSelectedRows}
                            updateMode={this.props.updateMode}
                            setField={this.props.setField}
                            getNumAnnotations={this.props.getNumAnnotations}
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
        if (this.props.confirmed === false) {
            return (
                <div></div>
            )
        }
        else {
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
}

class   TextArea extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            show: false,
        };
        this.onMouseUp = this.onMouseUp.bind(this);
        this.convertToHtml = this.convertToHtml.bind(this);
        this.getToolSpan = this.getToolSpan.bind(this);
        this.handleHoverEnter = this.handleHoverEnter.bind(this);
        this.handleHoverLeave = this.handleHoverLeave.bind(this);
        this.getDetailedQuoteInfo = this.getDetailedQuoteInfo.bind(this);
        this.getDetailedMentionInfo = this.getDetailedMentionInfo.bind(this);
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
            console.log("Text selected.");
            const target = event.currentTarget;
            const offSets = this.getSelectionCharacterOffsetWithin(target);
            //console.log(target, offSets);
            if (offSets.start !== offSets.end) {
                console.log("Offsets: ", offSets.start, offSets.end);
                this.props.setSelection(offSets.start, offSets.end);
            }
        }
    }



    handleHoverEnter(event) {
        //if (this.state.show === true) {
            let spanID = event.target.id;
            let info = this.props.getSpanInfo(spanID);
            //console.log(event.target);
            //console.log("Hovering over: ", spanID);
            //tempAlert(String(spanID), 1000);
            let msg = this.getToolSpan(info);
            //console.log(msg);
            this.setState({show: true}, displaySpanInfo(event, msg));
            //console.log(info);
            //tempAlert(info, 2000);
        //}
     }

    handleHoverLeave(event) {
        if (this.state.show === true) {
            this.setState({show: false}, removeModal(event))
        }
     };
    
    getDetailedQuoteInfo(cur_info) {
        const q_map = {
            'Anaphoric': 'Pronominal',
            'Implicit': 'Implicit',
            'Explicit': 'Named'
        }

        let type = q_map[cur_info.quote_type];
        let speaker = cur_info.speaker.map((el) => {return this.props.id2char[el]});
        let speakee = cur_info.speakee.map((el) => {return this.props.id2char[el]});
        let ref_exp = cur_info['ref_exp'];

        return {
            'sel_type': cur_info['sel_type'],
            'quote_type': type,
            'speaker': speaker,
            'speakee': speakee,
            'ref_exp': ref_exp
            }

    }

    getDetailedMentionInfo(cur_info) {
        // const q_map = {
        //     'Anaphoric': 'Pronominal',
        //     'Implicit': 'Implicit',
        //     'Explicit': 'Named'
        // }

        let type = cur_info.quote_type;
        let speaker = cur_info.speaker;
        let speakee = cur_info.speakee.map((el) => {return this.props.id2char[el]});
        let ref_exp = cur_info['ref_exp'];

        return {
            'sel_type': cur_info['sel_type'],
            'quote_type': type,
            'speaker': speaker,
            'speakee': speakee,
            'ref_exp': ref_exp
            }

    }

    getToolSpan(cur_info){
        //console.log(info);
        

        if (cur_info['sel_type'] === 'Quote') {
            let info = this.getDetailedQuoteInfo(cur_info);
            const type = info['quote_type']
            const speaker = info['speaker']
            const ref = info['ref_exp']
            const speakee = info['speakee'].join("; ");
            return (
                "<span> <ul><li>Type: " + type + "</li><li>Speaker: "+ speaker +"</li><li>Addressee(s): "+speakee+"</li><li>Ref Exp: "+ref+"</li></ul></span>"
                )
        }
        else if (cur_info['sel_type'] === 'Mention') {
            let info = this.getDetailedMentionInfo(cur_info);
            const speakee = info['speakee'].join("; ");
            return (
                "<span><ul><li>Mention(s): "+speakee+"</li></ul></span>"
            )
        }
        
    }

    convertToHtml(display_obj) {
        const texts = display_obj.texts;
        const classes = display_obj['classes'];
        const ids = display_obj.ids;

        const spans = texts.map((value, i) => {
            if (ids[i] !== '') {
                //let info = this.props.getSpanInfo(ids[i]);
                //let toolSpan = this.getToolSpan(info);
                //console.log(toolSpan);
                return (
                    // disable selection for these spans
                    // <span className="tooltip">
                        <span className={classes[i] + ' disable-selection'} 
                          id={ids[i]}
                          onMouseUp={this.props.onSpanClick}
                          onMouseEnter={(event) => this.handleHoverEnter(event)}
                          onMouseLeave={(event) => this.handleHoverLeave(event)}
                         >
                              {value}
                        </span>
                        //{/* <span className='tooltiptext'>
                          //  {toolSpan}
                        //</span> */}
                    // </span>
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
            //mergeStatus: 'none';
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
        this.mergeButton = this.mergeButton.bind(this);
        this.handleMergeClick = this.handleMergeClick.bind(this);
        this.handleMakeMainName = this.handleMakeMainName.bind(this);
    }

    handleMergeClick() {
        if (this.props.mode === 'normal') {
            this.props.updateMode('merge');
        }
        else if (this.props.mode === 'merge') {
            this.props.setField('merge-chars');
        }
    }


    handleRowClick(rowId) {
        console.log(rowId)
        const currentExpandedRows = this.state.expandedRows;
        const isRowCurrentlyExpanded = currentExpandedRows.includes(rowId);

        const newExpandedRows = isRowCurrentlyExpanded ?
            currentExpandedRows.filter(id => id !== rowId) :
            currentExpandedRows.concat(rowId);

        this.setState({expandedRows : newExpandedRows});
    }

    handleDeleteIcon(el) {

        console.log(el);
        let numAnnots = this.props.getNumAnnotations(el.id);
        if (numAnnots!==0){
            alert("Error! There are " + numAnnots + " annotations that still use this character.")
        }


        else {
            const confirm = window.confirm("Deleting the following character with all aliases: "+el.name);

            if (confirm === true) {

                const oldChars = this.props.charList;

                const newChars = oldChars.filter((c) => {
                    return c.name !== el.name;
                });
                //this.setState({charList: newChars});
                this.props.updateChars(newChars);
                }

        }
        
    }

    deleteIcon(el) {
        return (
            <span id={'delete-button-' + el.id}>
                <button name={'D'} onClick={() => this.handleDeleteIcon(el)}>Del</button>
            </span>
        )
    }

    handleCheckBox(el) {
        console.log(el.name, el.id);
        const currentSelectedRows = this.props.selectedRows;
        const isRowCurrentlySelected = currentSelectedRows.includes(el.id);
        console.log(currentSelectedRows, isRowCurrentlySelected, Array.isArray(currentSelectedRows));

        if (isRowCurrentlySelected === true) {
            console.log("Handle checkBox " + el.id + " " + el.name);
        }

        const newSelectedRows = isRowCurrentlySelected ?
            currentSelectedRows.filter((id) => ((id !== el.id))) :
            currentSelectedRows.concat(el.id);
        console.log("New selected rows: " + newSelectedRows, Array.isArray(newSelectedRows));
        this.props.updateSelectedRows(newSelectedRows);
    }

    checkBox(el) {
        let disabled = false;
        let currentSelectedRows = this.props.selectedRows;
        // console.log(currentSelectedRows, Array.isArray(currentSelectedRows));
        let checked = currentSelectedRows.includes(el.id);

        if (checked === true) {
            console.log(el.name + ": "+ el.id);
        }

        if (this.props.mode === 'normal' || this.props.mode === 'ref_exp' || this.props.mode === 'done') {
            disabled = true;
            checked = false;
        }
        //console.log(this.props.selectedRows);


        return (
            <input type={'checkbox'} disabled={disabled}
                   checked={checked} onClick={() => this.handleCheckBox(el)} />
        )
    }

    handleRadioBox(el) {
        const currentSelectedRows = [];
        //const isRowCurrentlySelected = (currentSelectedRows.length > 0);

        const newSelectedRows = currentSelectedRows.concat(el.id);

        this.props.updateSelectedRows(newSelectedRows);
    }

    radioBox(el) {
        const checked = this.props.selectedRows.includes(el.id);

        return (
            <input type={'radio'}
                   checked={checked} onClick={() => this.handleRadioBox(el)} />
        )
    }

    handleDeleteAlias(el, alias) {

        const old_chars = this.props.charList;

        const old_expand = el.expand;
        const new_expand = old_expand.filter((al) => al.name !== alias.name);

        old_chars.forEach((c) => {
            if (c.id === el.id) {
                c.expand = new_expand;
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

    handleAddAlias(el) {
        const old_chars = this.props.charList;
        // let ids = []

        // old_chars.forEach((value, index) => {
        //     //main name
        //     ids.push(value.id);
    
        //     value.expand.forEach((alias) => {
        //         ids.push(alias.id) 
        //     })
        // })

        // const next_id = Math.max(ids) + 1

        let aliasName = window.prompt("Enter new alias name for "+el.name+" : ");
        if (aliasName.length > 0) {

            aliasName = toTitleCase(aliasName);

            if (aliasName in this.props.char2id) {
                alert("Name already exists in character list.")
            }

            else{

                old_chars.forEach((c) => {
                    if (c.id === el.id) {
                        c.expand.push({
                            name: aliasName,
                            parent: el.id
                        });
                    }
                });

                this.props.updateChars(old_chars);
            }
        }
    }

    getAliasRow(alias){

    }

    handleMakeMainName(el, alias) {

        let oldCharList = this.props.charList;

        let newCharList = oldCharList.map((c) => {
            if (c.id === el.id) {
                let new_c = {'id': c.id, 'parent': c.parent, 'name': alias.name}
                let old_name = c.name;
                let new_expand = c.expand.map((oa) => {
                    if (oa.name === alias.name) {
                        return {'name': old_name, 'parent': oa.parent}
                    }
                    else{
                        return oa
                    }
                })

                new_c['expand'] = new_expand;
                return new_c;
            }
            else { return c }
        })

        this.props.updateChars(newCharList);
    }

    renderItem(item) {
        const clickCallback = () => this.handleRowClick(item.id);
        const deleteIcon = this.deleteIcon(item);

        let icon = null;

        if (this.props.mode !== 'speaker') {
            icon = this.checkBox(item)
        }
        else {
            icon = this.radioBox(item)
        }


        const itemRows = [
            <tr key={"row-data-" + item.id}>
                <td className={'td-normal'}>{icon}</td>
                <td onClick={clickCallback} className={'td-normal row-name'}>{item.name}</td>
                <td className={'td-left'}>{deleteIcon}</td>
            </tr>
        ];

        if (this.state.expandedRows.includes(item.id)) {
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
                        handleMakeMainName={this.handleMakeMainName}

                    />
                );
            });
            }

        return itemRows;
    }

    handleAddChar() {
        let name = window.prompt("Enter character name: ");
        if (name.length > 0) {
            name = toTitleCase(name);
            if (name in this.props.char2id) {
                alert("Name already exists in character list.")
            }
            else {
                const old_chars = this.props.charList;

                let ids = []

                old_chars.forEach((value, index) => {
                    //main name
                    ids.push(value.id);
                })

                let next_id = Math.max(...ids) + 1

                if (ids.length === 0) {
                    next_id = 1;
                }

                old_chars.push({
                    name: name,
                    id: next_id,
                    parent: next_id,
                    expand: []
                });
                //this.setState({charList: old_chars}); //is this needed?? Just use props.
                this.props.updateChars(old_chars);
            }

        }
    }

    addButton() {
        return (
            <span>
                <button name={'Add-char'}
                        onClick={this.handleAddChar}
                        className={'char-top-buttons'}
                >
                    Add
                </button>
            </span>
        )
    }

    mergeButton() {
        let text = 'Merge';
        if (this.props.mode === 'merge') {
            text = 'Submit';
        }
        return (
            <span>
                <button name={'Merge-char'}
                        onClick={this.handleMergeClick}
                        className={'char-top-buttons'}
                >{text}</button>
            </span>
        )
    }

    render() {

        console.log("Rendering character list with: " + this.props.selectedRows.length);
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
                                ---
                            </td>
                            <td style={{width: "50%"}}>
                                {this.addButton()}
                            </td>
                            <td style={{width: "75%"}}>
                                {this.mergeButton()}
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

    deleteAliasIcon(item, alias) {
        return (
            <span id={'delete-button-' + alias.name}>
                <button name={'D'} onClick={() => this.props.handleDeleteAlias(item, alias)}>Del</button>
            </span>
        )
    }

    makeMainNameIcon(item, alias) {
        return (
            <span id={'make-main-' + alias.name}>
                <button name={'Main'} onClick={() => {this.props.handleMakeMainName(item, alias)}}>Main</button>
            </span>
        )
    }

    render() {
        //console.log(this.props.item.expand);
        const el = this.props.alias;
        let icon = null;
        // if (this.props.mode !== 'speaker') {
        //     icon = this.checkBox(item.name)
        // }
        // else {
        //     icon = this.radioBox(item.name)
        // }

        return (
            <tr key={el.name}>
                <td></td>
                <td className={'td-normal'}>{
                    this.makeMainNameIcon(this.props.item, el)
                }</td>
                <td className={'td-alias'}>
                    {el.name}
                </td>
                <td>
                    {this.deleteAliasIcon(this.props.item, el)}
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
        this.getDetailedInfo = this.getDetailedInfo.bind(this);
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

    onConfirm(event) {
        this.props.infoSubmit(event);
    }

    onReviewEdit() {
        this.props.updateMode('normal');
    }

    getDetailedInfo(cur_info) {
        if (cur_info.sel_type === 'Quote') {
            let type = cur_info.quote_type;
            let speaker = cur_info.speaker.map((el) => {return this.props.id2char[el]});
            let speakee = cur_info.speakee.map((el) => {return this.props.id2char[el]});
            let ref_exp = cur_info['ref_exp'];

            return {
                'sel_type': cur_info['sel_type'],
                'quote_type': type,
                'speaker': speaker,
                'speakee': speakee,
                'ref_exp': ref_exp
                }
            }
        else {

            let type = cur_info.quote_type;
            let speaker = cur_info.speaker;
            let speakee = cur_info.speakee.map((el) => {return this.props.id2char[el]});
            let ref_exp = cur_info['ref_exp'];

            return {
                'sel_type': cur_info['sel_type'],
                'quote_type': type,
                'speaker': speaker,
                'speakee': speakee,
                'ref_exp': ref_exp
                }

        }
    }

    render() {

        const ref_disable = (this.props.cur_info.quote_type === 'Implicit') || (this.props.cur_info.quote_type === '');
        let info = this.getDetailedInfo(this.props.cur_info)
        //console.log("CollectInfo");
        //console.log(this.props.cur_info);
        if (this.props.confirmed === false) {
            return (
                <div>

                </div>
            )
        }
        else {
            if (this.props.cur_mode !== 'done') {

                return (
                    <div id={'quote-info'}>
                        <QuoteType
                            setQuoteType={this.setQuoteType}
                            value={info.quote_type}
                            mode={this.props.cur_mode}
                        />

                        <SpeakerInfo
                            updateMode={this.props.updateMode}
                            value={info.speaker}
                            mode={this.props.cur_mode}
                            setField={this.props.setField}
                        />

                        <SpeakeeInfo
                            updateMode={this.props.updateMode}
                            value={info.speakee}
                            mode={this.props.cur_mode}
                            setField={this.props.setField}
                            message={"Select Addressee"}
                            selType={info.sel_type}
                        />

                        <RefExpInfo
                            updateMode={this.props.updateMode}
                            value={info.ref_exp}
                            mode={this.props.cur_mode}
                            setField={this.props.setField}
                            active={ref_disable}
                        />

                        <SubmitInfoButton
                            //onSubmit={this.onSubmit}
                            onSubmit={this.onConfirm} //to skip steps
                        />
                    </div>
                )


            } else {
                return (
                    <DisplayInfo speaker={info.speaker}
                                 speakee={info.speakee}
                                 ref_exp={info.ref_exp}
                                 onConfirm={this.onConfirm}
                                 onBack={this.onReviewEdit}
                    />
                )
            }
        }
    }
}

class CollectMentionInfo extends React.Component {

    constructor(props) {
        super(props);
        this.onReviewEdit = this.onReviewEdit.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.getDetailedInfo = this.getDetailedInfo.bind(this);
    }

    onConfirm(event) {
        this.props.infoSubmit(event);
    }

    onReviewEdit() {
        this.props.updateMode('normal');
    }

    onSubmit() {
        //this.props.onSubmit();
        console.log("Info submitted");
        this.props.updateMode('done');
    }

    getDetailedInfo(cur_info) {
        if (cur_info.sel_type === 'Quote') {
            let type = cur_info.quote_type;
            let speaker = cur_info.speaker.map((el) => {return this.props.id2char[el]});
            let speakee = cur_info.speakee.map((el) => {return this.props.id2char[el]});
            let ref_exp = cur_info['ref_exp'];

            return {
                'sel_type': cur_info['sel_type'],
                'quote_type': type,
                'speaker': speaker,
                'speakee': speakee,
                'ref_exp': ref_exp
                }
            }
        else {

            let type = cur_info.quote_type;
            let speaker = cur_info.speaker;
            let speakee = cur_info.speakee.map((el) => {return this.props.id2char[el]});
            let ref_exp = cur_info['ref_exp'];

            return {
                'sel_type': cur_info['sel_type'],
                'quote_type': type,
                'speaker': speaker,
                'speakee': speakee,
                'ref_exp': ref_exp
                }

        }
    }


    render() {
        let info = this.getDetailedInfo(this.props.cur_info);

        if (this.props.confirmed === false) {
            return (
                <div>

                </div>
            )
        }

        else if (this.props.cur_mode !== 'done') {
            return (
                <div id={'collect-mention'}>
                    <SpeakeeInfo
                        updateMode={this.props.updateMode}
                        value={info.speakee}
                        mode={this.props.cur_mode}
                        setField={this.props.setField}
                        message={"Select Entity being referred to "}
                        selType={info.sel_type}
                    />
                    <SubmitInfoButton
                        //onSubmit={this.onSubmit}
                        onSubmit={this.onConfirm}
                />
                </div>
            )
        }

        else {
            return (
                <DisplayInfo
                             speakee={info.speakee}
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
            <div className={'border'}>
                <FormControl  id={'quote-type'}
                              m={-2}
                >
                    <h3>Select Quote Type</h3>
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
                            label="Pronominal"
                            labelPlacement="start"
                        />
                        <FormControlLabel
                            value="Explicit"
                            control={<Radio color="primary" />}
                            label="Named"
                            labelPlacement="start"
                            fontSize={'fontSize'}
                        />
                    </RadioGroup>

                    {/*<FormHelperText>Select Quote Type</FormHelperText>*/}

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
        this.onDivClick = this.onDivClick.bind(this);
    }

    onDivClick() {
        if (this.props.mode === 'speaker') {
            this.onSubmit()
        }
        else if (this.props.mode === 'normal') {
            this.onEdit()
        }
    }

    onEdit() {
        if (this.props.mode === 'normal') {
            this.props.updateMode('speaker');
        }  
    }

    onSubmit() {
        if (this.props.mode === 'speaker') {
            this.props.setField('speaker');
        }
        
    }

    render() {
        const display_message = (this.props.value === '') ? "None set." : this.props.value;
        const color = (this.props.mode === "speaker") ? "green" : "black";
        const disabled = (this.props.mode === "speaker") ? true : false;
        return (
            <div className={'border'}
                id={'select-speaker'}
                 onClick={this.onDivClick}
                 //disabled={disabled}
                 style={{ cursor: "pointer"}}
            >
                <h3 style={{ color: color }}>Select Speaker</h3>
                <div><i>Select the speaker from the character list on the left, and press Submit when done.</i></div>
                <span><b>Speaker:</b> {display_message} </span>
                <span>
                    <button type={'submit'}
                            name={'speaker-edit'}
                            onClick={this.onEdit}
                            disabled={disabled}>Edit</button>
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
        this.onDivClick = this.onDivClick.bind(this);
    }

    onEdit() {
        this.props.updateMode('speakee');
    }

    onSubmit() {
        this.props.setField('speakee');
    }

    onDivClick() {
        if (this.props.mode === 'speakee') {
            this.onSubmit()
        }
        else if (this.props.mode === 'normal') {
            this.onEdit()
        }
    }

    render() {
        // console.log("Speakee: ");
        // console.log(this.props.value);
        const message = (this.props.value === '') ? 'None set' : this.props.value.join('; ');
        const color = (this.props.mode === 'speakee') ? "green" : "black";
        const disabled = (this.props.mode === "speakee") ? true : false;

        const heading = (this.props.selType === 'Mention') ? "Mention(s)" : "Addressee(s)";

        return (
            <div className={'border'}
                id={'select-speakee'}
                 onClick={this.onDivClick}
                 style={{ cursor: "pointer"}}
            >
                <h3 style={{ color: color }}>Select {heading}</h3>
                <div><i>{this.props.message} from the character list on the left, and press Submit when done. If there are multiple, select all possible ones.</i></div>
                <span><b>{heading}:</b> {message} </span>
                <span>
                    <button type={'submit'}
                            name={'speakee-edit'}
                            onClick={this.onEdit}
                            disabled={disabled}
                    >Edit</button>
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
        this.onDivClick = this.onDivClick.bind(this)
    }

    onEdit() {
        this.props.updateMode('ref_exp');
    }

    onSubmit() {
        this.props.setField('ref_exp');
    }

    onDivClick() {
        if (this.props.mode === 'ref_exp') {
            this.onSubmit()
        }
        else if (this.props.mode === 'normal') {
            this.onEdit()
        }
    }

    render() {
        // console.log("Speakee: ");
        // console.log(this.props.value);
        const message = (this.props.value === '') ? 'None set' : this.props.value;
        const color = (this.props.mode === 'ref_exp') ? "green" : "black";
        const disabled = (this.props.mode === "ref_exp") ? true : false;
        if (this.props.active) {
            return null
        }
        else {
            return (

                <div className={'border'}
                    id={'select-ref_exp'}
                     onClick={this.onDivClick}
                     style={{ cursor: "pointer"}}
                >
                    <h3 style={{ color: color }}>Select Referring Expression</h3>
                    <div><i>Select the referring expression from the text area on the right and click Submit when done.</i></div>
                    <span><b>Referring Expression:</b> {message} </span>
                    <span>
                    <button type={'submit'} name={'speakee-edit'}
                            onClick={this.onEdit}
                            disabled={disabled}
                    >Edit</button>
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
                <button id={'submit-info-button'}
                    type="submit" value="Submit-info" onClick={this.props.onSubmit}>Submit Info </button>
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

        if ('speaker' in this.props) {
            const speakee = this.props.speakee.join("; ");
            return (
                <div id={'display-info'}>
                    <div id={'info'}>

                        <h3>Review Quote Information: </h3>
                        <ul>
                            <li><b>Speaker: </b>{this.props.speaker}</li>
                            <li><b>Addressee: </b>{speakee}</li>
                            <li><b>Referring Expression: </b>{ref_exp}</li>
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
                            <li><b>Entity: </b>{this.props.speakee.join('; ')}</li>
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

export default Tool;

// ReactDOM.render(
//     <Tool />,
//     document.getElementById('root')
// );
