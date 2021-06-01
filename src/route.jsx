import React from 'react';
import {Switch, Route, Link} from 'react-router-dom';
import Tool from './annotate';
import Analyze from './analyze';
import './main.css'


class App extends React.Component { 
    render() {
        return (
            <div>
                <div id='main-navbar'>
                    {/* <h1>Main Navigation Bar</h1> */}
                    <span className='nav-el'>
                        <Link to='/'>Home</Link>
                    </span>
                    <span className='nav-el'>
                        <Link to='/annotate'>Annotate</Link>
                    </span>
                    <span className='nav-el'>
                        <Link to='/analyze'>Analyze</Link>
                    </span>
                    <span className='nav-el'>
                    <a href={"https://docs.google.com/document/d/1eBsX2rjdLBkmA-kWB_jHCxC1nmbzinH04WUg9PeN_2A/edit?usp=sharing"} target="_blank">Instructions</a>
                    </span>
                </div>


                <div className='home'>
                    <Switch>
                        <Route exact path='/' component={Home}/>
                        <Route exact path='/annotate' component={Tool}/>
                        <Route exact path='/analyze' component={Analyze}/>
                    </Switch>
                </div>
            </div>
        )
    }
}

class Home extends React.Component {
    render () {
        return (
            <div id='home-content'>
                <h1>Annotation Tool</h1>
                <p className='normal-p'>
                    Welcome! You can go from here to the main annotation page, or analyze previous annotations. 
                <br />
                    These options are also available on the top navigation bar at all times. 
                </p>

                <div className='main-options'>
                <span className='main-option'>
                   <Link to='/annotate'>Annotate</Link>
                </span>
                <span className='main-option'>
                    <Link to='/analyze'>Analyze Disagreements</Link>
                </span>
                </div>

            </div>
        )
    }
} 

export default App;
