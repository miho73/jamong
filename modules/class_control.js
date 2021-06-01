const crypto = require('crypto');
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
                    cmanage.clinfDbQuery(`INSERT INTO u${code} (name, uid) VALUES ('', $1)`, [codec], (err3)=>{
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
                if(err1 || res1.rowCount == 0) {
                    console.log('class_control: /class/authenticate select user query failure: '+err1);
                    res.sendStatus(500);
                    return
                }
                if(res1.rowCount == 1) {
                    res.send(res1.rows[0].uid);
                }
                else res.sendStatus(401);
            });
        });
    }
}