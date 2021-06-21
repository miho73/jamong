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
const classctrl = require('./modules/class_control');

const HTTP_PORT = 8800
const HTTPS_PORT = 4400

const app = express();
//app.use(favicon(__dirname + '/library/resources/favicon.ico'));
app.set("view engine", "ejs");
app.use('/lib', express.static('./lib'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.disable('x-powered-by');

app.get('/', (req, res)=>{
    res.render('main.ejs');
});
classmgr.class_manage_router(app);
classctrl.class_ctrl_router(app);

app.listen(HTTP_PORT);
console.log("HTTP server listening on port " + HTTP_PORT);

app.get('*', (req, res)=>{
    res.status(404).send("404");
});