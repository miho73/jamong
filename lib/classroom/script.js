let ccode, pr;
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
        Authed();
        $.ajax({
            url: '/class/loader',
            method: 'POST',
            cache: true,
            data: {
                code: ccode,
                uid: JSON.parse(cv)[ccode]
            },
            success: function(data) {
                console.log(data);
                //Continue: make user data posted to apply on html actually.
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
