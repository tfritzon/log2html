function elem(id) {
    return document.getElementById(id);
}

function hide(id) {
    elem(id).style.visibility = 'hidden';
}

function show(id) {
    elem(id).style.visibility = 'visible';
}

start = null;
end = null;
function walkSel(sel, f, x) {
    if (sel.rangeCount < 1) return;
    
    start = sel.anchorNode.parentElement;
    end = sel.focusNode.parentElement;

    walk(start, end, f, x);
}

function walk(start, end, f, x) {
    if (start != null && start.tagName == 'SPAN')
        f(start, x);

    if (start == end) return;

    for (var e= end; e != start && e != null; e= e.previousElementSibling) {
        if (e.tagName == 'SPAN')
            f(e, x);
    }
}
    
function addTextElement(ele, tag, txt, cls) {
    var e = document.createElement(tag);
    var t = document.createTextNode(txt);
    e.className = cls;
    e.appendChild(t);
    ele.appendChild(e);
}

function createComment() {
    console.log('createComment');
    console.log(start);
    console.log(end);
    var e = document.createElement('li');
    var d = document.createElement('span');
    d.id = 'd' + end.id.substring(1);
    d.textContent = "\u2612 ";
    d.className = 'del';
    var t = document.createElement('span');
    t.id = 'c' + start.id.substring(1);
    t.textContent = 'Line ' + Number(start.id.substring(1));
    e.appendChild(d);
    e.appendChild(t);
    e.id = 'foo';

    var n = Number(start.id.substring(1));
    var p = elem('list');

    var inserted = false;
    for (var i = 0; i < p.childNodes.length; i++) {
	var x = Number(p.childNodes[i].lastChild.id.substring(1));
	if (x > n) {
	    p.insertBefore(e, p.childNodes[i]);
	    inserted = true;
	    break;
	}
    }

    if (! inserted) {
	p.appendChild(e);
	inserted = true;
    }
}

function setComment() {
    var s = elem('cmnt').value;
    walk(start, end, (e,x) => { e.title = x; }, s);

    elem('cmnt').value = "";
    elem('cmnt').blur();
}

function jump(event) {
    t = event.target;
    if (t.className == 'del') {
        var p = t.parentElement;
        console.log(t.id);
        console.log(p.id);
        var end = elem('l' + t.id.substring(1));
        var start = elem('l' + p.lastElementChild.id.substring(1));
        console.log("start: " + start);
        console.log("end: " + end);
        walk(start, end, (e,x) => { console.log(e); e.className = 'def'; e.title = ''; }, 'hl');
        p.hidden = true;
    } else {
        id = 'l' + event.target.id.substring(1);
        var e = elem(id);
	var y = e.offsetTop - 100;
	window.scroll({ top: y, behavior: "auto" });
	elem('cmnt').value = e.title;
    }
}

function pickColor(event) {
    t = event.target;
    if (t.tagName != "TD")
	return;
    col = t.style.color;

    var v = col.split(',');
    var rgb = (Number(v[0].substring(4)) << 16) |
        (Number(v[1]) << 8) |
        Number(v[2].substring(0,v[2].length-1));

    elem('colval').textContent = '#' + (0x1000000 + rgb).toString(16).slice(1);
    elem('catlbl').focus();
}

function saveCategory() {
    console.log('saveCategory');
    var name = elem('catlbl').value;
    var cls = name.replace(' ', '_');
    var style = document.createElement('style');
    style.type = 'text/css';
    var col = elem('colval').textContent;
    style.innerHTML = '.' + cls + ' { color: ' + col + ' }';
    document.getElementsByTagName('head')[0].appendChild(style);

    addTextElement(elem('leg'), 'span',
                   '\u25a3 ' + name + ' ', cls);

    var e = elem('catplist').lastElementChild
    console.log(e);
    var s = e.textContent;
    console.log(s);
    var n = parseInt(s.substring(0,1), 16)+1;
    console.log(n);
    addTextElement(elem('catplist'), 'li',
                   n.toString(16).toUpperCase() + '. ' + name + ' ', cls);
    hide('colpick');
    document.getElementsByTagName('body')[0].focus();
    elem('catlbl').value = '';
}

pick_cat = false;
function key(event) {
    console.log(event);
    var key = event.key;
    var target = event.target;

    console.log(target.nodeName);
    console.log(event.ctrlKey);

    if (target.nodeName == 'TEXTAREA') {
        if (key == 'Enter' && event.ctrlKey == true) {
            setComment();
            return false;
        }
	elem('c' + start.id.substring(1)).textContent = target.value;
    }

    if (target.nodeName == 'INPUT' && key == 'Enter') {
            saveCategory();
            return false;
    }

    if (target.nodeName != 'BODY')
        return true;

    if (key == 'Escape') {
        hide('colpick');
        hide('catpick');
        pick_cat = false;
    }

    if (key == 'n') {
        show('colpick');
        return false;
    }

    var sel = document.getSelection();
    if (sel.rangeCount > 0) {
	if (key == 'c' && !pick_cat) {
	    walkSel(sel, (e,x) => { e.className = x; }, 'hl');
	    createComment();
	    event.preventDefault();
	    elem('cmnt').focus();
	    return false;
	}
	
	if (key == 'a' && !pick_cat) {
            show('catpick');
	    pick_cat = true;
	    return false;
	}

	keyn = parseInt(key.toUpperCase(), 16);
	if (pick_cat && keyn >= 0 && keyn < 16) {
	    var catplist = elem('catplist');
	    var cls = catplist.children[keyn].textContent.substring(3);
	    walkSel(sel, (e,x) => { e.className = x; }, cls);
            hide('catpick');
	    pick_cat = false;
	    return false;
	}
    }
}

function _init() {
    initColMap();
    initLegend();
}

function initColMap() {
    tab = elem('colmap');
    if(tab.childElementCount <= 0) {
	for (l = 24; l < 99; l += 16) {
            var tr = document.createElement('tr');
            for (h = 0; h < 359; h += 45) {
		var td = document.createElement('td');
		td.style.cssText = 'color: hsl(' + h + ', 100%, ' + l + '%);';
		var t = document.createTextNode('\u25a3')
		td.appendChild(t);
		tr.appendChild(td);
            }
            tab.appendChild(tr);
	}
    }
}

function initLegend() {
    var legend = elem('leg');
    var catplist = elem('catplist');

    if(legend.childElementCount <= 1) {
	for (var i = 1; i < catplist.childElementCount; i++) {
	    var s = catplist.children[i].textContent.substring(3);
	    var e = document.createElement('span');
	    e.className = s;
	    var t = document.createTextNode(' \u25a3 ' + s + ' ');
	    e.appendChild(t);
	    legend.appendChild(e);
	}
    }
}
