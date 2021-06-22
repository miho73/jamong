const crypto = require('crypto');
const sanitizeHtml = require('sanitize-html');
const cmanage = require('./class_manage');
const number = new RegExp(`^[0-9]{1,6}$`);

function randomString(length) {
    var result           = [];
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
   }
   return result.join('');
}

module.exports = {    
    class_ctrl_router: function(app) {
        app.get('/class/:code', (req, res)=>{
            if(!number.test(req.params.code)) {
                res.sendStatus(400);
                return;
            }
            cmanage.ClassDbQuery('SELECT class_name,class_has_pwd FROM class WHERE code=$1', [req.params.code], (err, resp)=>{
                if(err || resp.rowCount == 0) {
                    res.sendStatus(500);
                    console.log("class_control: /class/:code DB query error: "+err);
                    return;
                }
                const row = resp.rows[0];
                res.render('class/classroom.ejs', {
                    code: req.params.code,
                    cname: row.class_name,
                    cpwd: row.class_has_pwd
                });
            });
        });
        app.post('/class/loader', (req, res)=>{
            const code = req.body.code, uid = req.body.uid;
            if(!number.test(code) || code=='' || code == undefined || uid == undefined || uid.length != 5) {
                res.sendStatus(400);
                return;
            }
            cmanage.clinfDbQuery(`SELECT name,uid FROM u${code} WHERE uid=$1`, [uid], (err1, res1)=>{
                if(err1) {
                    console.log('class_control: /class/loader DB query error: '+err1);
                    res.sendStatus(500);
                    return;
                }
                else if(res1.rowCount == 0) {
                    res.status(401).send('no-iden');
                    return;
                }
                res.send(JSON.stringify({
                    un: res1.rows[0].name,
                    uid: res1.rows[0].uid
                }));
            });
        });
        app.post('/class/new-iden', (req, res)=>{
            const pwd = req.body.pass, code = req.body.code;
            if(!number.test(code) || code=='' || code == undefined) {
                res.sendStatus(400);
                return;
            }
            cmanage.ClassDbQuery('SELECT class_has_pwd,class_pwd,class_pwd_salt FROM class WHERE code=$1', [code], (derr1, db1)=>{
                if(derr1 || db1.rowCount == 0) {
                    console.log('class_control: /class/new-iden DB query error: '+derr1);
                    res.sendStatus(500);
                    return;
                }
                let row = db1.rows;
                if(row[0].class_has_pwd == false) {
                    const codec = randomString(5);
                    cmanage.clinfDbQuery(`INSERT INTO u${code} (name, uid, not_done) VALUES ('', $1, '')`, [codec], (err3)=>{
                        if(err3) {
                            console.log('class_control: /class/new-iden user insert failure: '+err3);
                            res.sendStatus(500);
                        }
                        else {
                            res.send(codec);
                        }
                    });
                    return;
                }
                const buf = Buffer.from(row[0].class_pwd_salt, 'base64');
                crypto.pbkdf2(pwd, buf.toString('base64'), 12495, 64, 'sha512', (cerr1, key) => {
                    if(cerr1) {
                        console.log('class_control: /class/new-iden get hash value failure: '+cerr1);
                        res.sendStatus(500);
                        return;
                    }
                    if(row[0].class_pwd == key.toString('base64')) {
                        const codec = randomString(5);
                        cmanage.clinfDbQuery(`INSERT INTO u${code} (name, uid) VALUES ('', $1)`, [codec], (err3)=>{
                            if(err3) {
                                console.log('class_control: /class/new-iden user insert failure: '+err3);
                                res.sendStatus(500);
                            }
                            else {
                                res.send(codec);
                            }
                        });
                    }
                    else {
                        res.sendStatus(401);
                    }
                });
            });
        });
        app.post('/class/authenticate', (req, res)=>{
            let code = req.body.code, codex = req.body.pass;
            if(!number.test(code) || code=='' || code == undefined || codex == undefined || codex.length != 5) {
                res.sendStatus(400);
                return;
            }
            cmanage.clinfDbQuery(`SELECT uid FROM u${code} WHERE uid=$1`, [codex], (err1, res1)=>{
                if(err1) {
                    console.log('class_control: /class/authenticate select user query failure: '+err1);
                    res.sendStatus(500);
                    return;
                }
                else if(res1.rowCount == 0) {
                    res.status(401).send('no-iden');
                    return;
                }
                if(res1.rowCount == 1) {
                    res.send(res1.rows[0].uid);
                }
                else res.sendStatus(401);
            });
        });
        app.post('/class/treg', (req, res)=>{
            //check permission
            let code = req.body.rc, codex = req.body.uid, probCont = req.body.cont;
            if(!number.test(code) || code=='' || code == undefined || codex == undefined || codex.length != 5 || probCont == undefined) {
                res.sendStatus(400);
                return;
            }
            if(probCont == '') {
                res.status(400).send('blk_cont');
                return;
            }
            let authed = function() {
                return new Promise(function(resolve, reject) {
                    let exp = Math.round(Date.now()/1000);
                    switch(req.body.expi) {
                        case "day":
                            exp+=86400;
                            break;
                        case "week":
                            exp+=604800;
                            break;
                        case "3week":
                            exp+=1814400;
                            break;
                        default:
                            res.status(400).send('expire');
                            reject('class_control: /class/treg unknown expire date');
                            return;
                    }
                    exp = exp-exp%86400+86399;
                    cmanage.clinfDbQuery(`BEGIN`);
                    cmanage.clinfDbQuery(`INSERT INTO h${code} (content, expires) VALUES ($1, $2)`, [sanitizeHtml(probCont), exp], (err1)=>{
                        if(err1) {
                            res.status(500).send('db');
                            reject('class_control: /class/treg db error: '+err1);
                            cmanage.clinfDbQuery('ROLLBACK');
                            return;
                        }
                        else {
                            cmanage.clinfDbQuery(`SELECT code FROM h${code} ORDER BY code DESC LIMIT 1`, [], (err5, res5)=>{
                                if(err5 || res5.rowCount != 1) {
                                    res.status(500).send('db');
                                    reject('class_control: /class/treg get added hw code: '+err5);
                                    cmanage.clinfDbQuery('ROLLBACK');
                                    return; 
                                }
                                cmanage.clinfDbQuery(`UPDATE u${code} SET not_done = CONCAT(not_done, ';${res5.rows[0].code}')`, [], (err2)=>{
                                    if(err2) {
                                        res.status(500).send('db');
                                        reject('class_control: /class/treg user not_done modify error: '+err2);
                                        cmanage.clinfDbQuery('ROLLBACK');
                                        return;
                                    }
                                    res.status(200).send('added');
                                    cmanage.clinfDbQuery('COMMIT');
                                    resolve();
                                });
                            });
                        }
                    });
                });
            };
            cmanage.clinfDbQuery(`SELECT uid FROM u${code} WHERE uid=$1`, [codex], (err1, res1)=>{
                if(err1) {
                    console.log('class_control: /class/treg select user auth query failure: '+err1);
                    res.sendStatus(500);
                    return
                }
                else if(res1.rowCount == 0) {
                    res.status(401).send('no-iden');
                    return
                }
                else if(res1.rowCount == 1) {
                    authed().then(()=>{},(err)=>{
                        console.log(err);
                    });
                }
                else res.sendStatus(500);
            });
        });
        app.post('/class/hws', (req, res)=>{
            let code = req.body.code, codex = req.body.uid, len = req.body.len;
            if(!number.test(code) || code=='' || code == undefined || codex == undefined || codex.length != 5 || !number.test(len) || len <= 0 || len > 100) {
                res.sendStatus(400);
                return;
            }
            let authed = function() {
                return new Promise(function(resolve, reject) {
                    cmanage.clinfDbQuery(`SELECT * FROM h${code} ORDER BY expires ASC LIMIT $1`, [len], (err, ress)=>{
                        if(err) {
                            res.status(500).send('db');
                            console.log('class_control: /class/hws get task list query failure: '+err);
                            return;
                        }
                        cmanage.clinfDbQuery(`SELECT * FROM u${code} WHERE uid=$1`, [codex], (err2, resx)=>{
                            if(err2) {
                                res.status(500).send('db');
                                console.log('class_control: /class/hws get not_done list query failure: '+err2);
                                return;
                            }
                            else if (resx.rowCount == 0) {
                                res.status(401).send('no-iden');
                                return;
                            }
                            res.send(JSON.stringify({
                                hws: ress.rows,
                                uc: resx.rows[0].not_done
                            }));
                            resolve();
                        });
                    });
                });
            };
            cmanage.clinfDbQuery(`SELECT uid FROM u${code} WHERE uid=$1`, [codex], (err1, res1)=>{
                if(err1) {
                    console.log('class_control: /class/treg select user auth query failure: '+err1);
                    res.sendStatus(500);
                    return
                }
                else if(res1.rowCount == 0) {
                    res.status(401).send('no-iden');
                    return
                }
                else if(res1.rowCount == 1) {
                    authed().then(()=>{},(err)=>{
                        console.log(err);
                    });
                }
                else res.sendStatus(500);
            });
        });
        app.post('/class/clear', (req, res)=>{
            let code = req.body.code, codex = req.body.uid;
            if(!number.test(code) || code=='' || code == undefined || codex == undefined || codex.length != 5 || req.body.stat == undefined) {
                res.sendStatus(400);
                return;
            }
            cmanage.clinfDbQuery(`UPDATE u${code} SET not_done=$1 WHERE uid=$2`, [req.body.stat, codex], (err1)=>{
                if(err1) {
                    console.log('class_control: /class/clear change status failrue: '+err1);
                    res.status(500).send("db");
                    return;
                }
                res.sendStatus(200);
            });
        });
        app.post('/class/hw/update', (req, res)=>{
            let code = req.body.code, codex = req.body.uid, hcode = req.body.hcode, ne = req.body.new;
            if(!number.test(code) || code=='' || code == undefined || codex == undefined || codex.length != 5 || hcode == undefined || !number.test(hcode) || ne == undefined) {
                res.sendStatus(400);
                return;
            }
            if(ne == '') {
                res.status(400).send('blk_cont');
                return;
            }
            let authed = function() {
                return new Promise(function(resolve, reject) {
                    cmanage.clinfDbQuery(`UPDATE h${code} SET content=$1 WHERE code=$2`, [ne, hcode], (err2)=>{
                        if(err2) {
                            reject('class_control: /class/hw/update update homework list error: '+err2);
                            res.status(500).send('db');
                        }
                        else {
                            res.sendStatus(200);
                            resolve();
                        }
                    });
                });
            }
            cmanage.clinfDbQuery(`SELECT uid FROM u${code} WHERE uid=$1`, [codex], (err1, res1)=>{
                if(err1) {
                    console.log('class_control: /class/hw/update select user auth query failure: '+err1);
                    res.sendStatus(500);
                    return
                }
                else if(res1.rowCount == 0) {
                    res.status(401).send('auth');
                    return
                }
                else if(res1.rowCount == 1) {
                    authed().then(()=>{},(err)=>{
                        console.log(err);
                    });
                }
                else res.sendStatus(500);
            });
        });
    }
}