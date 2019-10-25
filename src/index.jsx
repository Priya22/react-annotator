import React from 'react';
import ReactDOM from 'react-dom';
import './grid.css';


const testChars = {
    'A': 'original',
    'B': 'original',
    'C': 'alias',
    'D': 'original',
    'E': 'alias'
};

const defaultListSelect = 'A';

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
                    <ContentBox value={this.state.content} />
                </div>
            )
        }
        else {
            return (
                <div className="content">
                    <TextHeading value={this.state.cur_file}/>
                    <ContentBox value={this.state.content} />
                </div>
                )
            }
        }

}

class ContentBox extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            current_sel : '',
            before: '',
            after: '',
            //state of the quote selection box to modify character box.
            cur_state: ''
        };
    }


    getSelection(event) {
        console.log("Called");
        const target = event.target;
        console.log(target);
        if (target.className === 'input-text') {

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

    parentSet(arg) {

        this.setState({cur_state: arg});
        //alert(arg);

    }

    render() {
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
                            />
                        </div>

                        <TextArea
                            value={this.props.value}
                            selection={this.state.current_sel}
                            before={this.state.before}
                            after={this.state.after}
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
                    </div>

                    <TypeOptions parentSet={this.props.parentSet}/>

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
                    />

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
            speaker_done: false,
            speakee: '',
            speakee_done: false,
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
        //console.log(event.target.name);
        const field = event.target.name;
        //const cur_state = '';
        this.setState({[field]: event.target.value});
        if (field === 'speaker' || field === 'speakee') {
            this.parentSet('character');

        }
        else if (event.target.id === 'ref_exp') {
            this.parentSet('Text');
        }
    }

    onSubmit(event, arg) {

        const field = event.target.id + "_done";
        const speaker_field = event.target.id;
        let speaker_value = "";

        if (speaker_field === "ref_exp") {
            console.log(event.target);
            speaker_value = event.target.value;
        }
        else {
            speaker_value = arg;
        }

        console.log(field + speaker_value);
        this.setState({
            [field]: true,
            [speaker_field]: speaker_value,
        });
        //console.log(this.state);
        this.parentSet('');

        event.preventDefault();
    }

    onQuoteSubmit(event) {
        //console.log("onQuoteSubmit");
        this.setState({quoteDone: true});
        event.preventDefault();
    }



    render() {

        if (this.state.speaker_done === false) {

            return (
                <div id="quote-options">
                    <SelectSpeaker
                        value={this.state.speaker}
                        done={this.state.speaker_done}
                        charList={testChars}
                        onChange={(event) => this.onInput(event)}
                        onSubmit={(event, arg) => this.onSubmit(event, arg)}
                    />
                </div>
            )

        }
        // else {
        //     return (
        //         <div id='temp'>
        //             <h3>Speaker Done</h3>
        //         </div>
        //     )
        // }

        else if (this.state.speakee_done === false) {

            return (
                <div id="quote-option">
                    <SelectSpeaker
                        value={this.state.speaker}
                        done={this.state.speaker_done}
                        charList={testChars}
                        onChange={(event) => this.onInput(event)}
                        onSubmit={(event, arg) => this.onSubmit(event, arg)}
                    />
                    <SelectSpeakee
                        value={this.state.speakee}
                        done={this.state.speakee_done}
                        charList={testChars}
                        onChange={(event) => this.onInput(event)}
                        onSubmit={(event, arg) => this.onSubmit(event, arg)}
                    />
                </div>
            )
        }

        else if (this.state.ref_exp_done === false) {

            return (
                <div id="quote-options">
                    <SelectSpeaker
                        value={this.state.speaker}
                        done={this.state.speaker_done}
                        charList={testChars}
                        onChange={(event) => this.onInput(event)}
                        onSubmit={(event, arg) => this.onSubmit(event, arg)}
                    />
                    <SelectSpeakee
                        value={this.state.speakee}
                        done={this.state.speakee_done}
                        charList={testChars}
                        onChange={(event) => this.onInput(event)}
                        onSubmit={(event, arg) => this.onSubmit(event, arg)}
                    />
                    <SelectRefExp
                        value={this.state.ref_exp}
                        done={this.state.ref_exp_done}
                        onChange={(event) => this.onInput(event)}
                        onSubmit={(event, arg) => this.onSubmit(event, arg)}
                    />
                </div>

            )
        }

        if (this.state.quoteDone === false) {

            return (
                <div id="quote-options">
                    <SelectSpeaker
                        value={this.state.speaker}
                        done={this.state.speaker_done}
                        charList={testChars}
                        onChange={(event) => this.onInput(event)}
                        onSubmit={(event, arg) => this.onSubmit(event, arg)}
                    />
                    <SelectSpeakee
                        value={this.state.speakee}
                        done={this.state.speakee_done}
                        charList={testChars}
                        onChange={(event) => this.onInput(event)}
                        onSubmit={(event, arg) => this.onSubmit(event, arg)}
                    />
                    <SelectRefExp
                        value={this.state.ref_exp}
                        done={this.state.ref_exp_done}
                        charList={testChars}
                        onChange={(event) => this.onInput(event)}
                        onSubmit={(event, arg) => this.onSubmit(event, arg)}
                    />
                    <QuoteSubmit
                        done={this.state.ref_exp_done}
                        onSubmit={(event) => this.onQuoteSubmit(event)}
                    />
                </div>
            )
        }

        else {

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


class SelectSpeaker extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            types: ['Implicit', 'Explicit'],
            selected_type: 'Explicit',
            selected_char: defaultListSelect
        };

        this.onSubmit = this.onSubmit.bind(this);
        this.handleCharChange = this.handleCharChange.bind(this);
        this.onTypeSubmit = this.onTypeSubmit.bind(this);
    }

    onSubmit(event) {
        //console.log(event.target);
        this.setState({selected_char: this.state.selected_char});
        this.props.onSubmit(event, this.state.selected_char);
        //event.preventDefault();
    }

    handleCharChange(event) {
        //console.log(event.target.value);
        this.setState({selected_char: event.target.value});
        event.preventDefault();
    }

    onTypeSubmit(event) {
        //console.log(event.target.value);
        this.setState({selected_type: event.target.value});
        //event.preventDefault();
    }

    render() {

        const type_select = this.state.types.map((value,i) => {
            //console.log(value, this.state.selected_type);
            //console.log({value} === this.state.selected_type);
            return (
                <div className="selection-type" key={value}>
                    <label key={value}>
                        <input
                            type='radio'
                            value={value}
                            onChange={this.onTypeSubmit}
                            checked={value === this.state.selected_type}
                            />{value}
                    </label>
                </div>
            )
        });
        //console.log(type_select);

        const options = Object.keys(this.props.charList).map((key, i) => {
           return (
               <option value={key} key={key}>{key}</option>
           )
        });
            return (
                <div id="select-speaker">
                    <h3>Select Quote Type: </h3>
                    <ul>
                        {type_select}
                    </ul>

                <form id="speaker"
                      onSubmit={this.onSubmit}
                >
                    <h3>Select speaker:</h3>

                    <span>
                        <label>

                            <select
                                value = {this.state.selected_char}
                                onChange = {this.handleCharChange}
                            >
                                {options}
                            </select>

                        </label>
                    </span>

                    <span>
                        <input type="submit" value="Submit" id="speaker"/>
                    </span>

                </form>
            </div>
        )
    }

}

class SelectSpeakee extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selected_char: defaultListSelect
        };

        this.onSubmit = this.onSubmit.bind(this);
        this.handleCharChange = this.handleCharChange.bind(this);

    }

    onSubmit(event) {

        this.setState({selected_char: this.state.selected_char});
        console.log("Selected speakee: " + this.state.selected_char);
        this.props.onSubmit(event, this.state.selected_char);
        //event.preventDefault();
    }

    handleCharChange(event) {
        //console.log(event.target.value);
        this.setState({selected_char: event.target.value});
        event.preventDefault();
    }


    render() {

        const options = Object.keys(this.props.charList).map((key, i) => {
            return (
                <option value={key} key={key}>{key}</option>
            )
        });
        return (
            <div id="select-speakee">
                <form id="speakee"
                      onSubmit={this.onSubmit}
                >
                    <h3>Select speakee:</h3>
                    <span>
                        <label>

                            <select
                                value = {this.state.selected_char}
                                onChange = {this.handleCharChange}
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

    constructor(props) {
        super(props);
        this.state = {
            types: ['Implicit', 'Explicit'],
            selected_type: 'Explicit',
            selected_text: '',
        };

        this.onSubmit = this.onSubmit.bind(this);
        this.handleCharChange = this.handleCharChange.bind(this);
        this.onTypeSubmit = this.onTypeSubmit.bind(this);
    }

    onSubmit(event) {
        //console.log(event.target);
        this.setState({selected_char: this.state.selected_char});
        this.props.onSubmit(event, this.state.selected_char);
        //event.preventDefault();
    }

    handleCharChange(event) {
        //console.log(event.target.value);
        this.setState({selected_char: event.target.value});
        event.preventDefault();
    }

    onTypeSubmit(event) {
        //console.log(event.target.value);
        this.setState({selected_type: event.target.value});
        //event.preventDefault();
    }

    render() {

        const type_select = this.state.types.map((value,i) => {
            //console.log(value, this.state.selected_type);
            //console.log({value} === this.state.selected_type);
            return (
                <div className="selection-type" key={value}>
                    <label key={value}>
                        <input
                            type='radio'
                            value={value}
                            onChange={this.onTypeSubmit}
                            checked={value === this.state.selected_type}
                        />{value}
                    </label>
                </div>
            )
        });

        if (this.state.selected_type == 'Implicit') {

            return (
                <div id="select-speaker">
                    <h3>Select Quote Type: </h3>
                    <ul>
                        {type_select}
                    </ul>

                    <form id="speaker"
                          onSubmit={this.onSubmit}
                    >
                        <h3>Select speaker:</h3>

                        <span>
                            <label>

                                <select
                                    value={this.state.selected_char}
                                    onChange={this.handleCharChange}
                                >
                                    {options}
                                </select>

                            </label>
                        </span>

                        <span>
                            <input type="submit" value="Submit" id="speaker"/>
                        </span>

                    </form>
                </div>
            )
        }

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
            return (
                <div id="annotationarea">
                    <div
                        className="input-text"
                        onMouseUp={this.props.mouseUp}
                    >
                        <span>
                            <span className="input-text">{this.props.before}</span>
                            <span className="input-text" id="highlight">{this.props.selection}</span>
                            <span className="input-text">{this.props.after}</span>
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
        if (this.props.annState === '') {
            const char_list = Object.keys(this.state.charList).map((key, i) => {
                //console.log(key);
                return (
                    <li key={key}>
                        <label>
                            {key}
                        </label>
                    </li>

                )
            });

            return (
                //html
                <div id="char-form">
                    <ul>
                        {char_list}
                    </ul>
                </div>
            )

        }

        else if (this.props.annState === 'character') {
            const type_map = {'original': 1, 'alias': 0};
            const binary_map = {0:false, 1:true};
            const char_list = Object.keys(this.state.charList).map((key, i) => {
                //console.log(key);
                return (
                    <li key={key}>
                        <label>
                            <input
                                type="radio"
                                value={key}
                                disabled={binary_map[type_map[this.state.charList[key]]]}
                            /> {key}
                        </label>
                    </li>

                )
            });

            return (
                //html
                <div id="char-form">
                    <ul>
                        {char_list}
                    </ul>
                </div>
            )
        }


        //const type_map = {0: true, 1: false};

        //console.log(char_list)
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
