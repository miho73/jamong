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
const dbconfigc = JSON.parse(dbconfig_json).clinf;
const ClinfDb = new pg.Client(dbconfigc);
ClinfDb.connect(err => {
    if (err) {
        console.log('Failed to connect to clinf db: ' + err);
    }
    else {
        console.log('Connected to clinf db');
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
            const preparePromise = function(res) {
                return new Promise(function(resolve, reject) {
                    ClassDb.query('SELECT code FROM class ORDER BY code DESC LIMIT 1;', (err2, rex2)=>{
                        if(err2) {
                            ClassDb.query('ROLLBACK', (errr)=>{if(errr){console.log('class_manage: /class/new DB transaction rollback failure: '+errr)};});
                            res.status(500).render('result.ejs', {msg: "DB 오류, 그룹에 접근할 수 없습니다."});
                            reject('class_manage: /class/new DB SELECT error: '+err2);
                            return;
                        }
                        const code = rex2.rows[0].code;
                        ClinfDb.query(`CREATE TABLE IF NOT EXISTS u${code}(`+
                                      'code BIGSERIAL NOT NULL PRIMARY KEY,'+
                                      'name TEXT NOT NULL,'+
                                      'uid TEXT NOT NULL UNIQUE,'+
                                      'not_done NOT NULL TEXT)', (err3)=>{
                            if(err3) {
                                ClassDb.query('ROLLBACK', (errr)=>{if(errr){console.log('class_manage: /class/new DB transaction rollback failure: '+errr)};});
                                res.status(500).render('result.ejs', {msg: "DB 오류, 그룹을 준비할 수 없습니다."});
                                reject('class_manage: /class/new DB CREATE TABLE 1 error: '+err3);
                                return;
                            }
                            ClinfDb.query(`CREATE TABLE IF NOT EXISTS h${code}(`+
                                          `code BIGSERIAL NOT NULL PRIMARY KEY,`+
                                          `content TEXT NOT NULL,`+
                                          `expires TEXT NOT NULL)`, (err4)=>{
                                if(err4) {
                                    ClassDb.query('ROLLBACK', (errr)=>{if(errr){console.log('class_manage: /class/new DB transaction rollback failure: '+errr)};});
                                    res.status(500).render('result.ejs', {msg: "DB 오류, 그룹을 준비할 수 없습니다."});
                                    reject('class_manage: /class/new DB CREATE TABLE 2 error: '+err4);
                                    return;
                                }
                                ClassDb.query('COMMIT', (errr)=>{if(errr){console.log('class_manage: /class/new DB transaction commit failure: '+errr)};});
                                resolve();
                            });
                        });
                    });
                });
            };
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
                };
                makeSaltPromise().then((salt)=>{
                    hashPwdPromise(salt).then((hash)=>{
                        ClassDb.query('BEGIN', (err0)=>{
                            if(err0) {
                                console.log('class_manage: /class/new cannot begin transaction: '+err0);
                                ClassDb.query('ROLLBACK', (errr)=>{if(errr){console.log('class_manage: /class/new DB transaction rollback failure: '+errr)};});
                                return;
                            }
                            ClassDb.query('INSERT INTO class '+
                                          '(class_name, class_message, class_greeting, class_has_pwd, class_pwd, class_pwd_salt) '+
                                          'VALUES ($1, $2, $3, $4, $5, $6);', [cname, cmsg, cgreet, true, hash.toString('base64'), salt.toString('base64')], (err, rex)=>{
                                if(err) {
                                    console.log('class_manage: /class/new DB INSERT error: '+err);
                                    ClassDb.query('ROLLBACK', (errr)=>{if(errr){console.log('class_manage: /class/new DB transaction rollback failure: '+errr)};});
                                    res.status(500).render('result.ejs', {msg: "DB 오류. 그룹을 만들 수 없습니다."});
                                }
                                else {
                                    preparePromise().then(()=>{
                                        res.render('result.ejs', {msg: "그룹이 생성되었습니다."});
                                    }, (err)=>{
                                        console.log(err);
                                    });
                                }
                            });
                        });
                    }, (err)=>{
                        console.log('class_manage: /class/new get hash error: '+err);
                        res.status(500).render('result.ejs', {msg: "보안 처리 오류. 그룹을 만들 수 없습니다."});
                    });
                });
            }
            else {
                ClassDb.query('BEGIN', (err0)=>{
                    if(err0) {
                        console.log('class_manage: /class/new cannot begin transaction: '+err0);
                        ClassDb.query('ROLLBACK', (errr)=>{if(errr){console.log('class_manage: /class/new DB transaction rollback failure: '+errr)};});
                        return;
                    }
                    ClassDb.query('INSERT INTO class '+
                                  '(class_name, class_message, class_greeting, class_has_pwd) '+
                                  'VALUES ($1, $2, $3, $4)', [cname, cmsg, cgreet, false], (err)=>{
                        if(err) {
                            res.status(500).render('result.ejs', {msg: "DB 오류. 그룹을 만들 수 없습니다."});
                        }
                        else {
                            preparePromise(res).then(()=>{
                                res.render('result.ejs', {msg: "그룹이 생성되었습니다."});
                            }, (err)=>{
                                console.log(err);
                            });
                        }
                    });
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
        app.post('/class/getclass', (req, res)=>{
            let hrefs = JSON.parse(req.body['href']);
            let condi = '';
            const number = new RegExp(`^[0-9]{1,6}$`);  
            if(hrefs.length == 0) {
                res.status(200).send([]);
                return;
            }
            Array.from(hrefs).forEach(ele => {
                if(number.test(ele)) {
                    condi += (ele + ',');
                }
            });
            condi = condi.substr(0, condi.length-1);
            ClassDb.query(`SELECT code,class_name, class_message FROM class WHERE code IN (${condi})`, (err1, db1)=>{
                if(err1) {
                    console.log('class_manage: /class/getclass DB query error: '+err1);
                    res.sendStatus(500);
                }
                else res.send(db1.rows);
            });
        });
    },
    ClassDbQuery: function(query, params, callback) {
        ClassDb.query(query, params, callback);
    },
    clinfDbQuery: function(query, params, callback) {
        ClinfDb.query(query, params, callback);
    }
}