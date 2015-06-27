// Fisher and Nutters simulation code below

var contains = function (lst, obj) {
    for (var i = 0; lst != null && i < lst.length; i++) {
        if (lst[i] === obj)
            return true;
    }
    return false;
}

var indexof = function (lst, obj) {
    for (var i = 0; lst != null && i < lst.length; i++) {
        if (lst[i] === obj)
            return i;
    }
    return -1;
}

var swap = function (list, i, j) {
    var temp = list[i];
    list[i] = list[j];
    list[j] = temp;
}

var distance = function (p, q) {
    return Math.sqrt((p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y));
}
