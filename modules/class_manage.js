const crypto = require('crypto');
const pg = require('pg');
const fs = require('fs');
const sanitizeHtml = require('sanitize-html');

const dbconfig_json = fs.readFileSync(__dirname+'/privates/db_config.json');
const dbconfig = JSON.parse(dbconfig_json).class;

const ClassDb = new pg.Client(dbconfig);
ClassDb.connect(err => {
    if (err) {
        console.log('Failed to connect to class db: ' + err);
    }
    else {
        console.log('Connected to class db');
    }
});

ClassDb.query('CREATE TABLE IF NOT EXISTS class('+
              'code BIGSERIAL NOT NULL PRIMARY KEY,'+
              'class_name TEXT NOT NULL,'+
              'class_message TEXT NOT NULL,'+
              'class_greeting TEXT NOT NULL,'+
              'class_has_pwd BOOLEAN NOT NULL,'+
              'class_pwd TEXT,'+
              'class_pwd_salt TEXT);', (err)=>{
                  if(err) {
                    console.log('Failed to create class table: '+err.message);
                  }
              });

module.exports = {
    class_manage_router: function(app) {
        app.get('/class/new', (req, res)=>{
            res.render('class/new_class.ejs');
        });
        app.post('/class/new', (req, res)=>{
            let cname = sanitizeHtml(req.body.cname),
                cmsg = sanitizeHtml(req.body.cmsg), 
                cgreet = sanitizeHtml(req.body.cgreet), 
                pwd = req.body.pwd;
            if(pwd == undefined) pwd = '';
            if(cgreet == undefined) cgreet = '';
            if(cmsg == undefined) cmsg = '';
            if(pwd != '') {
                const makeSaltPromise = function() {
                    return new Promise(function(resolve) {
                        resolve(crypto.randomBytes(64));
                    });
                };
                const hashPwdPromise = function(salt) {
                    return new Promise(function(resolve, reject) {
                        crypto.pbkdf2(pwd, salt.toString('base64'), 12495, 64, 'sha512', (err, hash)=>{
                            if(err) reject(err);
                            else resolve(hash);
                        });
                    });
                }
                makeSaltPromise().then((salt)=>{
                    hashPwdPromise(salt).then((hash)=>{
                        ClassDb.query('INSERT INTO class '+
                                      '(class_name, class_message, class_greeting, class_has_pwd, class_pwd, class_pwd_salt) '+
                                      'VALUES ($1, $2, $3, $4, $5, $6)', [cname, cmsg, cgreet, true, hash.toString('base64'), salt.toString('base64')], (err)=>{
                            if(err) {
                                res.status(500).render('result.ejs', {msg: "DB 오류. 그룹을 만들 수 없습니다."});
                            }
                            else {
                                res.render('result.ejs', {msg: "그룹이 생성되었습니다."});
                            }
                        });
                    }, (err)=>{
                        res.status(500).render('result.ejs', {msg: "보안 처리 오류. 그룹을 만들 수 없습니다."});
                    });
                });
            }
            else {
                ClassDb.query('INSERT INTO class '+
                          '(class_name, class_message, class_greeting, class_has_pwd) '+
                          'VALUES ($1, $2, $3, $4)', [cname, cmsg, cgreet, false], (err)=>{
                    if(err) {
                        res.status(500).render('result.ejs', {msg: "DB 오류. 그룹을 만들 수 없습니다."});
                    }
                    else {
                        res.render('result.ejs', {msg: "그룹이 생성되었습니다."});
                    }
                });
            }
        });
        app.post('/find', (req, res)=>{
            try {
                const query = req.body.name;
                ClassDb.query('SELECT code,class_name,class_greeting FROM class WHERE class_name LIKE $1;', [`%${query}%`], (err, resp)=>{
                    if(err) {
                        res.sendStatus(500);
                    }
                    else {
                        const rows = resp.rows;
                        res.send({
                            data: rows
                        });
                    }
                });
            }
            catch {
                res.sendStatus(500);
            }
        });
    },
}