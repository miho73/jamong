let hrefs = [];

function loader() {
    const ls = window.localStorage;
    try {
        const avlRoom = ls.getItem('roomHis');
        if(avlRoom == null) {
            avlRoom = JSON.stringify({history:[]});
            ls.setItem('roomHis', avlRoom);
        }
        let javl = JSON.parse(avlRoom);
        hrefs = javl.history;
        $.ajax({
            url: '/class/getclass',
            method: 'POST',
            data: {
                href: JSON.stringify(hrefs)
            },
            cache: true,
            success: function(data) {
                const cont = document.getElementById('room-region');
                cont.innerHTML = "";
                if(data.length == 0) return;
                data.forEach(ele=>{
                    let ar = document.createElement('a');
                    let div = document.createElement('div');
                    let title = document.createElement('h3');
                    let span = document.createElement('span');
                    ar.classList.add('a-room'); div.classList.add('room');
                    title.classList.add('room-title'); title.innerText = ele.class_name;
                    span.classList.add('room-msg'); span.innerText = ele.class_message;
                    div.appendChild(title); div.appendChild(span);
                    ar.appendChild(div); ar.href = `/class/${ele.code}`
                    cont.insertBefore(ar, cont.firstChild);
                })
            },
            error: function(err) {

            }
        });
    }
    catch {
        ls.setItem('roomHis', JSON.stringify({history:[]}));
        loader();
    }
}
function saveLocal() {
    const ls = window.localStorage;
    ls.setItem('roomHis', JSON.stringify({history: hrefs}));
    loader();
}
function addHref(code, name) {
    let add = confirm(name+"을 바로가가에 추가할까요?");
    if(!add) return;
    if(hrefs.includes(code)) return;
    hrefs.push(code);
    saveLocal();
}

function search() {
    const toAdd = document.getElementById('search-res');
    toAdd.style.transform = 'scaleY(0)';
    setTimeout(()=>{
        $.ajax({
            url: '/find',
            method: 'POST',
            data: {
                name: document.getElementById('searchq').value
            },
            cache: false,
            success: function(data) {
                const rows = data.data;
                toAdd.innerHTML = "";
                if(rows.length == 0){
                    const h3 = document.createElement('h3');
                    h3.classList.add('room-title');
                    h3.innerText = "Nothing was found";
                    h3.style.textAlign = 'center';
                    toAdd.appendChild(h3);
                    toAdd.style.transform = 'scaleY(1)';
                    return;
                }
                rows.forEach(ele => {
                    const aRoot = document.createElement('a');
                    const rdiv = document.createElement('div');
                    const h3 = document.createElement('h3');
                    const greet = document.createElement('span');
                    h3.classList.add('room-title');
                    h3.innerText = ele.class_name;
                    greet.innerText = ele.class_greeting;
                    greet.classList.add('room-msg');
                    aRoot.classList.add('a-room');
                    rdiv.classList.add('room');
                    aRoot.appendChild(rdiv);
                    aRoot.onclick = function() {addHref(ele.code, ele.class_name)};
                    rdiv.appendChild(h3);
                    rdiv.appendChild(greet);
                    toAdd.appendChild(aRoot);
                });
                toAdd.style.transform = 'scaleY(1)';
            },
            error: function(err) {
                document.getElementById('search-error-display').innerText = err.statusText;
            },
        });
    }, 300);
}