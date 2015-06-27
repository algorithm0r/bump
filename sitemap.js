var SiteSequence = function (sequence) {
    if (sequence) this.seq = sequence;
    else this.seq = [];
}

SiteSequence.prototype.levenshtein = function (other) {
    var d = [];
    var c = [];

    for(var i = 0; i <= this.seq.length; i++) {
        d.push([]);
        c.push([]);
        for(var j = 0; j <= other.seq.length; j++) {
            if (i === 0) d[i].push(j);
            else if (j === 0) d[i].push(i);
            else if (this.seq[i-1] === other.seq[j-1]) d[i].push(d[i - 1][j - 1]);
            else d[i].push(Math.min(d[i][j - 1], Math.min(d[i - 1][j - 1], d[i - 1][j])) + 1);

            if (i === 0) c[i].push(j);
            else if (j === 0) c[i].push(i);
            else if (this.seq[i - 1] === other.seq[j - 1]) c[i].push(c[i - 1][j - 1]);
            else c[i].push(Math.min(c[i][j - 1], c[i - 1][j]) + 1);
        }
    }

    return { lcs: c[this.seq.length][other.seq.length], levenshtein: d[this.seq.length][other.seq.length] };
}

var IntervalList = function () {
    this.ints = [];
}

IntervalList.prototype.insert = function (item) {
    var i = 0;
    while (i < this.ints.length && this.ints[i].start < item.start) {
        i++;
    }
    this.ints.splice(i, 0, item);
}

IntervalList.prototype.isEmpty = function () {
    return this.ints.length === 0;
}

IntervalList.prototype.findNextOverlap = function (index) {
    var i = index + 1;
    var overlaps = [];
    while (i < this.ints.length && this.ints[i].start < this.ints[index].end) {
        if (this.ints[i].site === this.ints[index].site) overlaps.push(this.ints[i].agent);
        i++;
    }
    return overlaps;
}

var Perm = function (size) {
    this.perm = [];
    this.size = size;
    var list = [];

    for (var i = 0; i < this.size; i++) {
        list.push(i);
    }

    for (var i = 0; i < this.size; i++) {
        var index = Math.floor(Math.random() * list.length);
        this.perm.push(list[index]);
        list.splice(index, 1);
    }
}

Perm.prototype.compare = function (other) {
    var count = 0;
    var score = 0;
    //console.log(this.perm + " ");
    //console.log(other.perm);
    while (count < this.perm.length) {
        if (contains(this.perm, other.perm[score]))
            count++;
        score++;
    }
    return score;
}

Perm.prototype.mutate = function () {
    if (this.perm.length === 1) return;
    var i = Math.floor(Math.random() * this.perm.length);
    var j = i;
    while (j === i) {
        j = Math.floor(Math.random() * this.perm.length);
    }

    swap(this.perm, i, j);
}

Perm.prototype.clone = function () {
    var np = new Perm(this.perm.length);
    for (var i = 0; i < this.perm.length; i++) {
        np.perm[i] = this.perm[i];
    }
    return np;
}

var GatheringSite = function (size, reward, yield, type, index, x, y) {
    this.perm = new Perm(size);
    this.perm.perm = this.perm.perm.splice(0, reward);
    //console.log(this.perm.perm);
    this.reward = reward;
    this.type = type;
    this.index = index;
    this.x = x;
    this.y = y;

    this.feedcount = 0;
    this.failcount = 0;
    this.totalvisits = 0;
    this.yield = yield;

    this.sex = 0;
    this.totalsex = 0;
    this.asex = 0;
    this.totalasex = 0;
    this.slept = 0;
}


GatheringSite.prototype.day = function () {
    this.totalvisits += this.feedcount + this.failcount;
    this.feedcount = 0;
    this.failcount = 0;
    this.totalsex += this.sex;
    this.totalasex += this.asex;
    this.sex = 0;
    this.asex = 0;
    this.slept = 0;
}

GatheringSite.prototype.cost = function (perm) {
    return this.perm.compare(perm);
}

GatheringSite.prototype.gather = function (perm) {
    if (this.feedcount++ < this.yield * this.reward)
        return { cost: this.perm.compare(perm), reward: this.reward };
    return { cost: this.perm.compare(perm), reward: 0, fail: this.failcount++ };
}



var SiteMap = function (params, sitelist) {
    this.params = params;
    this.thresholds = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    this.sitelist = [];
    this.totalsex = [];
    this.totalvisited = [];
    this.adjacencymatrix = [];
    this.visited = [];
    for (var i = 0; i < this.params.numsites; i++) {
        this.adjacencymatrix.push([]);
        this.visited.push([]);
        var row = this.adjacencymatrix[i];
        var vrow = this.visited[i];
        for (var j = 0; j < this.params.numsites; j++) {
            row.push(0);
            vrow.push(0);
        }
    }


    for (var i = 0; i < this.params.numsites; i++) {
        var type = Math.floor(Math.random() * 2) == 0 ? "FISH" : "NUTS";
        var reward = sitelist ? sitelist[i].reward : this.params.rewardmin + Math.floor(Math.random() * (this.params.rewardmax - this.params.rewardmin + 1));
        var x = sitelist ? sitelist[i].x : Math.random();
        var y = sitelist ? sitelist[i].y : Math.random();
        this.sitelist.push(new GatheringSite(this.params.permsize, reward, this.params.yield, type, i, x, y));
    }

    for (var i = 0; i < this.params.numsites; i++) {
        for (var j = i + 1; j < this.params.numsites; j++) {
            this.adjacencymatrix[i][j] = distance(this.sitelist[i], this.sitelist[j]) > this.params.reach ? 0 : 5 * distance(this.sitelist[i], this.sitelist[j]);
            this.adjacencymatrix[j][i] = distance(this.sitelist[i], this.sitelist[j]) > this.params.reach ? 0 : 5 * distance(this.sitelist[i], this.sitelist[j]);
        }
    }
}

SiteMap.prototype.reset = function () {
    for (var i = 0; i < this.params.numsites; i++) {
        this.sitelist[i].totalsex = 0;
        this.sitelist[i].totalasex = 0;
        this.sitelist[i].totalvisits = 0;
    }
}

SiteMap.prototype.day = function () {
//  console.log(this.thresholds);
    this.thresholds = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    this.visited = [];
    for (var i = 0; i < this.params.numsites; i++) {
        this.visited.push([]);
        var vrow = this.visited[i];
        for (var j = 0; j < this.params.numsites; j++) {
            vrow.push(0);
        }
        this.sitelist[i].day();
    }

    this.totalsex = [];
    var temp = [];
    for (var i = 0; i < this.params.numsites; i++) {
        temp.push(this.params.map.sitelist[i].totalsex);
    }

    for (var i = 0; i < this.params.numsites; i++) {
        var mindex = 0;
        for (var j = 0; j < temp.length; j++) {
            if (temp[j] > temp[mindex]) mindex = j;
        }
        this.totalsex.push(temp[mindex]);
        temp.splice(mindex, 1);
    }

    this.totalvisited = [];
    temp = [];
    for (var i = 0; i < this.params.numsites; i++) {
        temp.push(this.params.map.sitelist[i].totalvisits);
    }

    for (var i = 0; i < this.params.numsites; i++) {
        var mindex = 0;
        for (var j = 0; j < temp.length; j++) {
            if (temp[j] > temp[mindex]) mindex = j;
        }
        this.totalvisited.push(temp[mindex]);
        temp.splice(mindex, 1);
    }
}