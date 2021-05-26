'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const favicon = require('serve-favicon');
const https = require('https');
const fs = require('fs');
const pg = require('pg');

const auth = require('./modules/auth');
const classmgr = require('./modules/class_manage');

const HTTP_PORT = 8800
const HTTPS_PORT = 4400

const app = express();
//app.use(favicon(__dirname + '/library/resources/favicon.ico'));
app.set("view engine", "ejs");
app.use('/lib', express.static('./lib'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', (req, res)=>{
    res.render('main.ejs');
});

app.listen(HTTP_PORT);
console.log("HTTP server listening on port " + HTTP_PORT);