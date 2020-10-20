import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route } from 'react-router';
import {BrowserRouter} from 'react-router-dom';
import { createHashHistory } from 'history';

import Navigation from "./main";
import Tool from './annotate';
import Analyze from "./analyze";
//const appHistory = useRouterHistory(createHashHistory)({ queryKey: false })

ReactDOM.render(
    <BrowserRouter>
        <div>
            <Route exact path="/" component={Navigation} />
            <Route exact path="/annotation" component={ Tool } />
            <Route exact path="/disagreements" component={ Analyze } />
        </div>
    </BrowserRouter>,
    document.getElementById('root')
);