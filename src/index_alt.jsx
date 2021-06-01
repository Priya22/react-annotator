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



const testChars = {
    'A': ['a', 'aa'],
    'B': [],
    'C': ['c'],
    'D': ['dd'],
    'E': []
};

function XmlToHtml(props) {
    //parse the xml file and return a html <span> with highlights.
}

function HtmlToXml(props) {
    //parse the innerHTML with <span>s and return an xml to write to file.
}

const defaultListSelect = 'A';

class TextLoader extends React.Component {
    // Checks if file is selected and loads it into the text box
    constructor(props) {
        super(props);
        this.state = {
            cur_file: '',
            file_ext: '',
            content: '',
            content_html: ''
        };
        this.handleUpload = this.handleUpload.bind(this);
        this.saveSel = this.saveSel.bind(this);
    }

    handleUpload(event) {
        const file_reader = new FileReader();
        let self = this;
        const file_name = event.target.files[0].name;
        this.setState({cur_file: file_name});
        file_reader.onloadend = function () {
            const content = file_reader.result;
            const content_html = <span>
                {content}
            </span>;

            //console.log(content);
            self.setState({file_ext: '.txt', content: content, content_html: content_html});
            //console.log(this.state);
        };
        file_reader.readAsText(event.target.files[0]);
    }

    saveSel(arg) {
        this.setState({content_html: arg});
    }

    render() {

        if (this.state.cur_file === '') {
            return (
                <div className="content">
                    <LoadButton handleUpload={(event) => this.handleUpload(event)}/>
                    <ContentBox value={this.state.content_html}
                                saveSel={(arg) => {this.saveSel(arg)}}
                    />
                </div>
            )
        }
        else {
            return (
                <div className="content">
                    <TextHeading value={this.state.cur_file}/>
                    <ContentBox value={this.state.content_html}
                                saveSel={(arg) => {this.saveSel(arg)}}
                    />
                </div>
                )
            }
        }

}

class ContentBox extends React.Component {

    constructor(props) {
        super(props);
        // const value = <span
        //     className="input-text"
        //     onMouseUp={this.props.mouseUp}
        // >
        //             {this.props.value}
        //         </span>;

        this.state = {
            current_sel : '',
            before: '',
            after: '',
            locked: false,
            //state of the quote selection box to modify character box.
            cur_state: ''
        };

    }


    getSelection(event) {
        console.log("Called");
        //const target = event.target;
        console.log(event.currentTarget);
        //&& target.className === 'input-text'
        if (this.state.locked === false && event.currentTarget.className === 'input-text') {
            const target = event.currentTarget;
            //console.log(target);
            const selection_obj = document.getSelection();
            const start = selection_obj.anchorOffset;
            const end = selection_obj.focusOffset;
            const selection = target.textContent.substring(start, end);
            const before = target.textContent.substring(0, start);
            const after = target.textContent.slice(end);
            // console.log("Sel: " + selection);
            //
            // console.log("Before: " + before);
            // console.log("After" + after);
            if (selection !== '') {
                //alert(selection);
                this.setState({current_sel: selection, before: before, after: after});
            }
            else {
                this.setState({current_sel: '', before:'', after:''});
            }
        }

    }

    lockSel(event) {
        console.log(event.target);
        this.setState({locked: true});
        event.preventDefault();
    }

    clearSel(event) {
        this.setState({locked: false, current_sel: '', before:'', after:''});
        event.preventDefault();
    }

    parentSet(arg) {

        this.setState({cur_state: arg});
        //alert(arg);

    }

    resetSel(arg) {
        //console.log("The HTML: ", arg);
        this.setState({locked:false, current_sel: '', before: '', after: ''});
        this.props.saveSel(arg);

    }

    render() {
        //console.log("Current value: "+this.props.value);
        //const listitems = testChars.map((char) => <li key={char}>char</li>);
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

            return (

                    <div id="annotationareacontainer">

                        <div id="charnames">
                            <h3>Characters</h3>
                            <CharacterList charList={testChars}
                                           annState={this.state.cur_state}
                            />
                        </div>

                        <div id="current-selection">
                            <h3>Current Selection</h3>
                            <CurrentSel value={this.state.current_sel}
                                        parentSet={(arg) => this.parentSet(arg)}
                                        lockSel={(event) => this.lockSel(event)}
                                        clearSel={(event) => this.clearSel(event)}
                                        saveSel={(arg) => this.resetSel(arg)}
                                        text = {{'before': this.state.before,'after': this.state.after, 'selection': this.state.current_sel}}
                            />
                        </div>

                        <TextArea
                            value={this.props.value}
                            selection={this.state.current_sel}
                            before={this.state.before}
                            after={this.state.after}
                            selStatus={this.state.locked}
                            mouseUp={(event) => this.getSelection(event)}
                        />

                    </div>
            )
        }
    }
}

class CurrentSel extends React.Component {

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
                            onSubmit={this.props.lockSel}
                        >
                            <span>
                                <input type="submit" value="OK" name="submit" id='lock-sel'/>
                            </span>

                            <span>
                                <Button color='primary' variant='contained'
                                        type='submit' onClick={this.props.clearSel}>
                                    Clear
                                </Button>
                            </span>
                        </form>
                    </div>

                    <TypeOptions parentSet={this.props.parentSet}
                                 saveSel = {this.props.saveSel}
                                 text = {this.props.text}
                    />

                </div>

            )
        }
    }
}

class TypeOptions extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selected_value: '',
        };

        this.handleOptionChange = this.handleOptionChange.bind(this);
        this.parentSet = props.parentSet;
    }

    handleOptionChange(event) {
        this.setState({selected_value: event.target.value});
    }

    render() {

        if (this.state.selected_value === '') {

            return (
                <TextType
                    onChange={(event) => this.handleOptionChange(event)}
                    selected_value={this.state.selected_value}
                />
            )
        }

        else if (this.state.selected_value === 'Quote') {
            return (
                <div id="quote-div" >
                    <TextType
                        onChange={(event) => this.handleOptionChange(event)}
                        selected_value={this.state.selected_value}
                    />

                    <QuoteOptions
                        parentSet={this.parentSet}
                        saveSel = {this.props.saveSel}
                        text = {this.props.text}
                    />

                </div>

            )
        }

        else if (this.state.selected_value === 'Mention') {
            return (
                <div id="mention-div" >
                    <TextType
                        onChange={(event) => this.handleOptionChange(event)}
                        selected_value={this.state.selected_value}
                    />

                    <MentionOptions
                        saveSel = {this.props.saveSel}
                        text = {this.props.text}
                    />

                </div>

            )
        }


    }
}

class MentionOptions extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            character: '',
            character_done: false
        };
        this.onChange = this.onChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onSubmit(event) {
        console.log(event.target);
        this.setState({character_done: true});
    }

    onChange(event) {
        this.setState({character: event.target.value});
    }

    render() {
        const options = Object.keys(testChars).map((key, value) => {
            return (
                <option value={key} key={key}>{key}</option>
            )
        });

            if (this.state.character_done === false) {
                return (
                    <div id='mention-options'>
                        <form id="mention"
                              onSubmit={(event) => this.onSubmit(event)}
                        >
                            <h3>Select speaker:</h3>

                            <span>
                                    <label>

                                        <select
                                            name='speaker'
                                            value={this.state.character}
                                            onChange={(event) => this.onChange(event)}
                                        >
                                            {options}
                                        </select>

                                    </label>
                                </span>

                            <span>
                                    <input type="submit" value="Submit" id="mention"/>
                                </span>

                        </form>

                    </div>
                )
            }
            else {
                return (
                    <div id = 'mention-options'>
                        <p>
                            Mention Resolution: {this.state.character}
                        </p>
                    </div>
                )
            }
    }
}


function TextType(props) {

    return (
            <div className="type-options">
                <ul className="type-options">
                    <div className="selection-type">
                        <label>
                            <input
                                type="radio"
                                value="Quote"
                                onChange={props.onChange}
                                checked={props.selected_value === 'Quote'}
                            /> Quote
                        </label>
                    </div>

                    <div className="selection-type">
                        <label>
                            <input
                                type="radio"
                                value="Mention"
                                onChange={props.onChange}
                                checked={props.selected_value === 'Mention'}
                            /> Mention
                        </label>
                    </div>

                </ul>
            </div>
    )
}

class QuoteOptions extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            quote_type: '',
            speaker : '',
            speakee: '',
            speaker_done: '',
            ref_exp: '',
            ref_exp_done: false,
            quoteDone: false,
            cur_state: ''

        };

        this.onInput = this.onInput.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onQuoteSubmit = this.onQuoteSubmit.bind(this);
        this.parentSet = this.props.parentSet;
    }

    onInput(event) {
        //console.log("onInput");
        //console.log(event.target, event.target.value);
        if (event.target.name !== '') {
            const field = event.target.name;
            const value = event.target.value;
            //const cur_state = '';
            this.setState({[field]: value});
        }

        //event.preventDefault();

    }

    onSubmit(event) {

        const field = event.target.id + "_done";
        console.log(field);
        this.setState({
            [field]: true,
        });
        //console.log(this.state);


        event.preventDefault();
    }

    onQuoteSubmit(event) {
        //console.log("onQuoteSubmit");
        this.setState({quoteDone: true});
        //console.log(this.props.text);
        const new_text = <span>
                            <span className="input-text">{this.props.text.before}</span>
                            <span className="input-text" id='highlight-yellow'>{this.props.text.selection}</span>
                            <span className="input-text">{this.props.text.after}</span>
                        </span>;
        this.props.saveSel(new_text);

        event.preventDefault();
    }



    render() {

        if (this.state.quote_type === '') {
            console.log("Quote Type");

            return (
                <div id="quote-options">
                    <SelectQuoteType
                        selected_type = {this.state.quote_type}
                        onChange={(event) => this.onInput(event)}
                    />
                </div>
            )
        }

        else  if (this.state.quoteDone === false) {
            if (this.state.quote_type === 'Explicit') {
                return (
                    <div id="quote-options">
                        <SelectQuoteType
                            selected_type={this.state.quote_type}
                            onChange={(event) => this.onInput(event)}
                        />
                        <SelectSpeaker
                            value={this.state.speaker}
                            done={this.state.speaker_done}
                            charList={testChars}
                            onChange={(event) => this.onInput(event)}
                            //onSubmit={(event) => this.onSubmit(event)}

                        />
                        <SelectSpeakee
                            value={this.state.speakee}
                            done={this.state.speakee_done}
                            charList={testChars}
                            onChange={(event) => this.onInput(event)}
                            //onSubmit={(event) => this.onSubmit(event)}

                        />
                        <
                        <SelectRefExp
                            value={this.state.ref_exp}
                            done={this.state.ref_exp_done}
                            charList={testChars}
                            onChange={(event) => this.onInput(event)}
                            onSubmit={(event) => this.onSubmit(event)}
                        />
                        <QuoteSubmit
                            onSubmit={(event) => this.onQuoteSubmit(event)}
                        />

                    </div>
                )
            } else {
                return (
                    <div id="quote-options">
                        <SelectQuoteType
                            selected_type={this.state.quote_type}
                            onChange={(event) => this.onInput(event)}
                        />
                        <SelectSpeaker
                            value={this.state.speaker}
                            done={this.state.speaker_done}
                            charList={testChars}
                            onChange={(event) => this.onInput(event)}
                            onSubmit={(event) => this.onSubmit(event)}

                        />
                        <SelectSpeakee
                            value={this.state.speakee}
                            done={this.state.speakee_done}
                            charList={testChars}
                            onChange={(event) => this.onInput(event)}
                            onSubmit={(event) => this.onSubmit(event)}

                        />
                        <QuoteSubmit
                            onSubmit={(event) => this.onQuoteSubmit(event)}
                        />

                    </div>
                )
            }
        }


        else {//if (this.state.quoteDone === 'true') {
            return (
                <DisplayInfo
                    speaker={this.state.speaker}
                    speakee={this.state.speakee}
                    refexp={this.state.ref_exp}
                />
            )

        }
        }


}

function DisplayInfo(props) {

    return (
        <div id="display-quote-info">
            <ul>
                <li><b>Speaker: </b>{props.speaker}</li>
                <li><b>Speakee: </b>{props.speakee}</li>
                <li><b>Referring Expression: </b>{props.refexp}</li>
            </ul>
        </div>
    )
}

function SelectQuoteType(props) {

        const types = ['Implicit', 'Explicit'];

        const type_select = types.map((value,i) => {
            //console.log(value, this.state.selected_type);
            //console.log({value} === this.state.selected_type);
            return (

                <div id="quote_type" key={value}>
                    <label key={value}>
                        <input
                            type='radio'
                            name='quote_type'
                            value={value}
                            onChange={props.onChange}
                            checked={value === props.selected_type}
                        />{value}
                    </label>
                </div>
            )
        });


        return (
            <div id='quote_type'>
                {type_select}
            </div>
        );

}

class SelectSpeaker extends React.Component {

    render() {

        const options = Object.keys(this.props.charList).map((key, i) => {
           return (
               <MenuItem value={key} key={key}>{key}</MenuItem>
           )
        });
        return (
                <div id="select-speaker">
                    <FormControl id='speaker'
                                 onSubmit={this.props.onSubmit}
                    >
                        <InputLabel shrink id="demo-simple-select-placeholder-label-label">
                            Speaker
                        </InputLabel>
                        <Select
                            name='speaker'
                            labelId="demo-simple-select-placeholder-label-label"
                            id="demo-simple-select-placeholder-label"
                            value={this.props.value}
                            onChange={this.props.onChange}
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {options}
                        </Select>
                    </FormControl>
                </div>
        )
    }

}

class SelectSpeakee extends React.Component {

    render() {

        const options = Object.keys(this.props.charList).map((key, i) => {
            return (
                <option value={key} key={key}>{key}</option>
            )
        });
        return (
            <div id="select-speakee">
                <form id="speakee"
                      onSubmit={this.props.onSubmit}
                >
                    <h3>Select speakee:</h3>
                    <span>
                        <label>

                            <select
                                name='speakee'
                                value = {this.props.value}
                                onChange = {this.props.onChange}
                            >
                                {options}
                            </select>

                        </label>
                    </span>

                    <span>
                        <input type="submit" value="Submit" id="speakee"/>
                    </span>

                </form>
            </div>
        )
    }

}

class SelectRefExp extends React.Component {


    render() {
        return (
            <div id='ref_exp'>
                <h3>Select Referring Expression</h3>
            </div>
        )
    }
}

function QuoteSubmit(props) {

    return (
        <div id="quote-submit">
            <input type="button" value="Done with Quote!"
                   onClick={props.onSubmit}
            />
        </div>
    )
}

class TextArea extends React.Component {


    render() {
        //console.log("TextArea: " + this.props.value.toString());
        if (this.props.selection === '') {
            console.log("Rendering standard: ");
            return (
                <div id="annotationarea">
                    <div
                        className="input-text"
                        onMouseUp={this.props.mouseUp}
                    >
                        {this.props.value}
                    </div>
                </div>
            )
        }

        else {
            console.log("Rendering with : "+ this.props.selection);
            let id = 'highlight';
            let alt = 'input-text';
            if (this.props.selStatus === true) {
                id = 'highlight-yellow';
                alt = 'input-text disable-selection'
            }
            return (
                <div id="annotationarea">
                    <div
                        className={alt}
                        onMouseUp={this.props.mouseUp}
                    >
                        <span>
                            <span>{this.props.before}</span>
                            <span id={id}>{this.props.selection}</span>
                            <span>{this.props.after}</span>
                        </span>
                    </div>
                </div>
            )
        }

    }
}

class CharacterList extends React.Component {

    constructor(props) {
        super(props);

        // const charState = {};
        // for (const [key, value] of this.props.charList.entries()) {
        //     charState[key] = value;
        // }
        const chars = this.props.charList;
        this.state = {
            charList: chars,
        };
    }

    render() {
        //let char_list = {};

            const char_list = Object.keys(this.state.charList).map((key, value) => {
                //console.log(key);
                return (

                    <li key={key}>
                        <label>
                            {key}
                        </label>
                        {/*<ul>*/}
                        {/*    <li key='alias'><label>Alias</label></li>*/}
                        {/*    <li key='alias'><label>Alias</label></li>*/}
                        {/*</ul>*/}
                    </li>

                )
            });

            return (
                //html
                <div id="char-form">
                    <ul>
                        {char_list}
                    </ul>
                    <AddChar onChange={(event) => this.onChange(event)}
                             onSubmit={(event) => this.onSubmit(event)}
                             />
                </div>
            )

        }
}

class AddChar extends React.Component {

    render() {
        return (
            <div id='modify-chars'>
                <form
                    className='lockSel'
                    onSubmit={this.props.lockSel}
                >
                            <span>
                                <input type="submit" value="Add" name="submit" id='add-char'/>
                            </span>

                    <span>
                                <button type='submit' onClick={this.props.deleteChar}>Delete</button>
                            </span>
                </form>
            </div>
        )
    }
}

function TextHeading(props) {
    return (
        <div id="text-heading">
            <h1>{props.value}</h1>
        </div>
    )

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

// ========================================

ReactDOM.render(
  <Tool />,
  document.getElementById('root')
);
