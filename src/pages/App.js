/*App.js*/
import React, { Component } from "react";
import "./App.css";
import Tool from "./pages"
//Import all needed Component for this tutorial
import {
    BrowserRouter as Router,
    Route,
    Switch,
    Link,
    Redirect
} from "react-router-dom";

class App extends Component {
    render() {
        return (
            <Router>
            {/*All our Routes goes here!*/}
            <Route exact_path="/" component={Tool} />
        </Router>
    );
    }
}

export default App;