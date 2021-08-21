let ccode, pr, uid, un, cnd;
const local = window.localStorage;

const today = Math.floor((Date.now()-(new Date('2021-01-01T00:00:00').getTime()))/1000/86400);

function loader(code, pwd_req) {
    let cvt = local.getItem('cv');
    let cv;
    if(cvt == undefined) {
        cvt = '{}';
        local.setItem('cv', "{}");
    }
    try {
        cv = JSON.parse(cvt);
    } catch {
        cv = {};
        local.setItem('cv', "{}");
    }
    ccode = code;
    pr = pwd_req;
    if(!cv.hasOwnProperty(ccode)) {
        noAuth();
    }
    else {
        $.ajax({
            url: '/class/loader',
            method: 'POST',
            cache: true,
            data: {
                code: ccode,
                uid: cv[ccode]
            },
            success: function(data) {
                const jsn = JSON.parse(data);
                un = jsn.un, uid = jsn.uid;
                document.getElementById('user-name-region').innerText = un;
                document.getElementById('user-id').innerText = uid;
                Authed();
            },
            error: function(err) {
                if(err.responseText=='no-iden') {
                    document.getElementById('iden-checking').innerText = 'INVALID IDENTIFICATION\nREFRESH TO REAUTHENTICATE';
                    delete cv.code;
                    local.setItem('cv', cv);
                }
                else {
                    document.getElementById('iden-checking').innerText = 'SERVER ERROR\nPLEASE TRY AGAIN LATER';
                }
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
            notice(0, '작업 성공', '숙제를 추가했습니다.')
            loadTable();
        },
        error: function(error) {
            switch(error.responseText) {
                case 'expire':
                    notice(1, '숙제를 추가할 수 없습니다', '만료일이 잘못되었습니다.');
                    break;
                case 'db':
                    notice(1, '숙제를 추가할 수 없습니다', '데이터베이스 처리를 수행할 수 없습니다.');
                    break;
                case 'blk_cont':
                    notice(1, '작업을 완료하지 못했습니다', '숙제 내용이 유효하지 않습니다.');
                    break;
                default:
                    notice(1, '숙제를 추가할 수 없습니다', '예기치 못한 이유로 처리에 실패했습니다.');
            }
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
            if(op.uc == undefined) {
                cnd = [];
            }
            else {
                let cLst = op.uc.split(';');
                cnd=cLst;
            }
            let ignore_comp = document.getElementById('hide-complete').checked;
            op.hws.forEach((ele)=>{
                if(ignore_comp && !cnd.includes(ele.code)) {
                    return;
                }
                let tr = document.createElement('tr');
                let n = document.createElement('td'); n.innerText = cnt;
                let c = document.createElement('td'); c.id = `hwc${ele.code}`; c.innerText = ele.content; c.setAttribute('onclick', `updateContent(${ele.code})`);
                let e = document.createElement('td');
                if(today == ele.expires) {
                    e.innerText = `오늘까지`;
                }
                else if(today < ele.expires) {
                    e.innerText = `${ele.expires-today}일 남음`;
                }
                else {
                    e.innerText = `${today-ele.expires}일 초과됨`;
                }
                let d = document.createElement('td');
                if(cnd.includes(ele.code)) {
                    d.innerText = '미완료'; d.classList.add('td-nfin');
                    d.setAttribute('onclick', `markChange(${ele.code}, ${false})`);
                }
                else {
                    d.innerText = '완료'; d.classList.add('td-fin');
                    d.setAttribute('onclick', `markChange(${ele.code}, ${true})`);
                }
                d.id = `hws${ele.code}`;
                tr.appendChild(n);
                tr.appendChild(c);
                tr.appendChild(e);
                tr.appendChild(d);
                toadd.appendChild(tr);
                cnt++;
            });
        },
        error: function(err) {
            switch(err.responseText) {
                case 'db':
                    notice(1, '그룹에 접속하지 못했습니다', '데이터베이스에 문제가 발생하였습니다.');
                    break;
                case 'no-iden':
                    notice(1, '그룹에 접속하지 못했습니다', '신원을 확인할 수 없습니다.');
                    break;
                default:
                    notice(1, '그룹에 접속하지 못했습니다', '예기치 못한 이유로 처리에 실패했습니다.');
            }
        }
    })
}

function updateContent(code) {
    let to = prompt("숙제 내용 변경", document.getElementById(`hwc${code}`).innerText);
    if(to!=undefined) {
        $.ajax({
            url: '/class/hw/update',
            method: 'POST',
            data: {
                code: ccode,
                uid: uid,
                hcode: code,
                new: to
            },
            success: function(data) {
                notice(0, '작업 성공', '숙제를 수정했습니다.')
                loadTable();
            },
            error: function(err) {
                switch(err.responseText) {
                    case 'db':
                        notice(1, '작업을 완료하지 못했습니다', '데이터베이스에 문제가 발생하였습니다.');
                        break;
                    case 'auth':
                        notice(1, '작업을 완료하지 못했습니다', '신원을 확인할 수 없습니다.');
                        break;
                    case 'blk_cont':
                        notice(1, '작업을 완료하지 못했습니다', '숙제 내용이 유효하지 않습니다.');
                        break;
                    default:
                        notice(1, '작업을 완료하지 못했습니다', '예기치 못한 이유로 처리에 실패했습니다.');
                }
            }
        });
    }
}

function markChange(code, now) {
    let from = !now;
    let elem = document.getElementById(`hws${code}`);
    if(from) {
        const index = cnd.indexOf(code+'');
        if (index > -1) {
            cnd.splice(index, 1);
        }
        $.ajax({
            url: '/class/clear',
            method: 'POST',
            data: {
                code: ccode,
                uid: uid,
                stat: cnd.join(';')
            },
            success: function() {
                elem.classList.replace('td-nfin', 'td-fin');
                elem.innerText = '완료';
                loadTable();
            },
            error: function(err) {
                switch(err.responseText) {
                    case 'db':
                        notice(1, '작업을 완료하지 못했습니다', '데이터베이스에 문제가 발생하였습니다.');
                        break;
                    default:
                        notice(1, '작업을 완료하지 못했습니다', '예기치 못한 이유로 처리에 실패했습니다.');
                }
            }
        })
    }
    else {
        cnd.push(code+'');
        $.ajax({
            url: '/class/clear',
            method: 'POST',
            data: {
                code: ccode,
                uid: uid,
                stat: cnd.join(';')
            },
            success: function() {
                elem.classList.replace('td-fin', 'td-nfin');
                elem.innerText = '미완료';
                loadTable();
            },
            error: function(err) {
                switch(err.responseText) {
                    case 'db':
                        notice(1, '작업을 완료하지 못했습니다', '데이터베이스에 문제가 발생하였습니다.');
                        break;
                    default:
                        notice(1, '작업을 완료하지 못했습니다', '예기치 못한 이유로 처리에 실패했습니다.');
                }
            }
        })
    }
    elem.setAttribute('onclick', `markChange(${code}, ${from})`);
}

let notSerial = 0;
function notice(level, title, content) {
    let parent = document.getElementById('alert-orig');
    let clone = parent.cloneNode(true);
    clone.style.display = 'block';
    clone.id = `not${notSerial}`;
    notSerial++;
    for (var i = 0; i < clone.childNodes.length; i++) {
        if (clone.childNodes[i].className == "alert-title") {
            clone.childNodes[i].innerText = title;
        }
        else if (clone.childNodes[i].className == "alert-content") {
            clone.childNodes[i].innerText = content;
        }
    }
    if(level == 1) {
        clone.classList.add('alert-error');
    }
    clone.style.opacity = 0;
    document.getElementById('alert-queue').appendChild(clone);
    setTimeout(()=>{
        clone.style.opacity = 1;
    }, 2);
    setTimeout(()=>{
        clone.style.opacity = 0;
        setTimeout(()=>{
            clone.remove();
        }, 200);
    }, 4000);
}