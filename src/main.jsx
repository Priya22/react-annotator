import React from 'react';
import ReactDOM from 'react-dom';
import './grid.css';
import {Link} from "react-router-dom";

class Navigation extends React.Component {

    render() {
        return (
            <div>
                <h1>Quote Annotation Tool</h1>
                <div id={'main-navigation'}>
                    <span className={'navig-button'}><Link to={'/annotation'}>Annotation</Link></span>

                    <span className={'navig-button'}><Link to={"/disagreements"}>Disagreements</Link></span>
                </div>
            </div>
        )
    }
}

export default Navigation;