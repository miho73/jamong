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
    }
    catch {
        ls.setItem('roomHis', JSON.stringify({history:[]}));
        loader();
    }
}
function saveLocal() {
    const ls = window.localStorage;
    ls.setItem('roomHis', JSON.stringify({history: hrefs}));
}
function addHref(code, name) {
    let add = confirm(name+"을 바로가가에 추가할까요?");
    if(!add) return;
    if(hrefs.includes(code)) return;
    hrefs.push(code);
    saveLocal();
}