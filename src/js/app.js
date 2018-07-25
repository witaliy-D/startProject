svg4everybody();    // fix

//import "bootstrap";

import main from './main';



import React from 'react'
import {render} from 'react-dom'
import Articles from './components/Articles'



render(
    <Articles />,
    document.getElementById('content')
);
