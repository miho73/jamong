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

const HTTP_PORT = 8880
const HTTPS_PORT = 4430

const app = express();
app.use(favicon(__dirname + '/lib/resources/favicon.ico'));
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

/*
var options = {
    ca: fs.readFileSync('/etc/letsencrypt/live/sdream.r-e.kr/fullchain.pem'),
    key: fs.readFileSync('/etc/letsencrypt/live/sdream.r-e.kr/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/sdream.r-e.kr/cert.pem')
};
*/
app.listen(HTTP_PORT);
console.log("HTTP server listening on port " + HTTP_PORT);
/*
https.createServer(options, app).listen(HTTPS_PORT, function() {
    console.log("HTTPS server listening on port " + HTTPS_PORT);
});
*/
console.log("HTTPS server listening on port " + HTTPS_PORT);

/*
app.all('*', (req, res, next) => {
    let protocol = req.headers['x-forwarded-proto'] || req.protocol;
    if (protocol == 'https') next();
    else { let from = `${protocol}://${req.hostname}${req.url}`; 
        let to = `https://${req.hostname}${req.url}`;
        res.redirect(to); 
    }
});
*/

app.get('/robots.txt', (req, res)=>{
    res.sendFile(__dirname + '/lib/resources/robots.txt');
});

app.get('/resources/img/:code', (req, res)=>{
    res.sendFile(__dirname+`/lib/resources/photos/img${req.params.code}.png`, (err)=>{
        if(err) {
            res.status(500).send('file error');
        }
    });
});

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

app.get('*', (req, res)=>{
    res.status(404).render('404.ejs', {
        img_code: getRandomInt(3)
    });
});