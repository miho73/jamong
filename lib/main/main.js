function loader() {
    const ls = window.localStorage;
    const avlRoom = ls.getItem('roomHis');
    if(avlRoom == null) {
        ls.setItem('roomHis', JSON.stringify({history:[]}));
    }
}