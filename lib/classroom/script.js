let ccode, pr, uid, un;
const local = window.localStorage;

function loader(code, pwd_req) {
    let cv = local.getItem('cv');
    if(cv == undefined) {
        cv = "{}";
        local.setItem('cv', cv);
    }
    ccode = code;
    pr = pwd_req;
    if(!cv.includes(code)) {
        noAuth();
    }
    else {
        $.ajax({
            url: '/class/loader',
            method: 'POST',
            cache: true,
            data: {
                code: ccode,
                uid: JSON.parse(cv)[ccode]
            },
            success: function(data) {
                const jsn = JSON.parse(data);
                un = jsn.un, uid = jsn.uid;
                document.getElementById('user-name-region').innerText = un;
                document.getElementById('user-id').innerText = uid;
                Authed();
            },
            fail: function(err) {

            }
        })
    }
}

function noAuth() {
    document.getElementById('identity-checker').style.display = 'none';
    document.getElementById('req-auth').style.display = 'block';
    document.getElementById('goback').style.display = 'block';
}

function Authed() {
    document.getElementById('identity-checker').style.display = 'none';
    document.getElementById('realworld').style.display = 'block';
    loadTable();
}

function addIden(code, codex) {
    let cv = local.getItem('cv');
    if(cv == undefined) {
        cv = "{}";
        local.setItem('cv', cv);
    }
    let obj = JSON.parse(cv);
    obj[code] = codex;
    local.setItem('cv', JSON.stringify(obj));
}

/** Auth Script **/
function newIden() {
    document.getElementById('pre').style.display = 'none';
    if(pr) {
        document.getElementById('aft-new').style.display = 'block';
        document.getElementById('prx').style.display = 'block';
    }
    else {
        document.getElementById('aft-new').style.display = 'block';
        reqAuth();
    }
}

function auth() {
    document.getElementById('pre').style.display = 'none';
    document.getElementById('aft-auth').style.display = 'block';
}

function authNow() {
    let coed = document.getElementById('class-auth').value;
    if(coed.length != 5) {
        document.getElementById('class-auth').value = '';
    }
    $.ajax({
        url: '/class/authenticate',
        method: 'POST',
        data: {
            pass: coed,
            code: ccode
        },
        cache: true,
        success: function(data) {
            addIden(ccode, data);
            document.getElementById('errorspx').innerText = "인증되었습니다. 새로고침하세요.";
            document.getElementById('auth-confirm').disabled = true;
        },
        error: function() {
            document.getElementById('errorspx').innerText = "인증할 수 없습니다.";
        }
    });
}

function reqAuth() {
    let pwd = document.getElementById('class-pwd').value;
    if(pr && pwd=='') {
        document.getElementById('class-pwd').value = '';
        return;
    }
    $.ajax({
        url: '/class/new-iden',
        method: 'POST',
        data: {
            pass: pwd,
            code: ccode
        },
        cache: true,
        success: function(data) {
            document.getElementById('prx').style.display = 'none';
            document.getElementById('afx').style.display = 'block';
            document.getElementById('new-code').innerText = data;
            addIden(ccode, data);
        },
        error: function(err) {
            document.getElementById('errorsp').innerText = "인증할 수 없습니다.";
        }
    });
}

function openAddTask() {
    document.getElementById('add-task-region').style.display = 'table-row';
    setTimeout(()=>{
        document.getElementById('add-task-region').style.opacity = 1;
    }, 100);
}

function iSubmit() {
    $.ajax({
        url: '/class/treg',
        method: 'POST',
        data: {
            rc: ccode,
            uid: uid,
            cont: document.getElementById('add-task-name').value,
            expi: $("input[type='radio'][name='expi']:checked").val()
        },
        success: function(data) {
            document.getElementById('add-task-region').style.opacity = 0;
            setTimeout(()=>{
                document.getElementById('add-task-region').style.display = 'none';
            }, 300);
            loadTable();
        },
        error: function(error) {

        }
    });
}

String.prototype.string = function(len){var s = '', i = 0; while (i++ < len) { s += this; } return s;};
String.prototype.zf = function(len){return "0".string(len - this.length) + this;};
Number.prototype.zf = function(len){return this.toString().zf(len);};

function loadTable() {
    $.ajax({
        url: '/class/hws',
        method: 'POST',
        data: {
            code: ccode,
            uid: uid,
            len: 20
        },
        cache: true,
        success: function(data) {
            const op = JSON.parse(data);
            let cnt = 1, toadd = document.getElementById('taskhere');
            toadd.innerHTML = '';
            op.forEach((ele)=>{
                console.log(ele);
                let tr = document.createElement('tr');
                let n = document.createElement('td'); n.innerText = cnt;
                let c = document.createElement('td'); c.innerText = ele.content;
                let ll = new Date(ele.expires*1000-Date.now());
                let e = document.createElement('td'); e.innerText = `${ll.getDate()-1}일 남음`;
                let d = document.createElement('td'); d.innerText = '미완료'; d.classList.add('td-nfin');
                tr.appendChild(n);
                tr.appendChild(c);
                tr.appendChild(e);
                tr.appendChild(d);
                toadd.appendChild(tr);
                cnt++;
            })
        },
        error: function(error) {

        }
    })
}