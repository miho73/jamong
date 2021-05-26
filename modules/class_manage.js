const pg = require('pg');
const fs = require('fs');

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

        })
    },
}