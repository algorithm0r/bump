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

var Gene = function (site, perm, params) {
    this.type = "Gather";
    this.site = site;
    this.params = params;
    this.perm = perm;
    this.breed = Math.random() < 0.5 ? 0.1*Math.floor(Math.random()*5) : 0;
}

Gene.prototype.cost = function () {
    if (this.site != null) return this.site.cost(this.perm);
    return 1;
}

Gene.prototype.reward = function () {
    if (this.site != null) return this.site.reward;
    return 0.01;
}

Gene.prototype.mutate = function () {
    var that = this;
    function mutation() {
        return Math.random() < that.params.mutationrate;
    }

    if (mutation() && this.perm != null) this.perm.mutate();
    if (mutation()) if (Math.random() > 0.5 || this.breed === 0) this.breed += 0.1;
    else this.breed -= 0.1;
}

Gene.prototype.clone = function () {
    var g = new Gene(this.site, this.perm.clone(), this.params);
    g.breed = this.breed;
    return g;
}

var Geneplex = function (params) {
    this.params = params;
    this.genes = [];
    this.breedsites = [];
    this.rewind = false;
    this.gene = -1;
    this.maxthreshold = 2;

    for (var i = 0; i < this.params.numsites; i++) {
        if (Math.random() < this.params.mutationrate) this.breedsites.push(0.1);
        this.breedsites.push(0);
    }

    var length = 0;
    var gene = new Gene(this.params.map.sitelist[Math.floor(Math.random() * this.params.map.sitelist.length)], new Perm(this.params.permsize), this.params);
    length += gene.cost();
    this.genes.push(gene);

    while (length < params.maxenergy * 4) {
        var adj = [];
        for (var i = 0; i < params.map.sitelist.length; i++) {
            if (params.map.adjacencymatrix[gene.site.index][i] !== 0) adj.push(i);
        }
        var j = adj[Math.floor(Math.random() * adj.length)];
        gene = new Gene(this.params.map.sitelist[j], new Perm(this.params.permsize), this.params);
        length += gene.cost();
        this.genes.push(gene);
    }

    this.updateStats();
    //console.log(Math.floor(this.length*100)/100 + " " + this.resources + " " + Math.floor(this.resourcesRatio*100)/100);
}

Geneplex.prototype.mutate = function () {
    // mutate random genes in the list
    var that = this;
    function mutation() {
        return Math.random() < that.params.mutationrate;
    }

    if (mutation()) {
        if (Math.random() < 0.5 || this.maxthreshold <= 2) this.maxthreshold++;
        else this.maxthreshold--;
    }

    for (var i = 0; i < this.genes.length; i++) {
        this.genes[i].mutate();
    }

    for (var i = 0; i < this.params.numsites; i++) {
        if (Math.random() < this.params.mutationrate) {
            if (Math.random() > 0.5 || this.breedsites[i] === 0) this.breedsites[i] += 0.1;
            else this.breedsites[i] -= 0.1;
        }
    }

    if (mutation()) {
        // grow
        // find a random cycle
        var sites = [];
        for (var i = 0; i < this.params.numsites; i++) {
            sites.push([]);
        }

        for (var i = 0; i < this.genes.length; i++) {
            sites[this.genes[i].site.index].push(i);
        }

        var cycles = [];
        var numCycles = 0;
        for (var i = 0; i < this.params.numsites; i++) {
            var len = sites[i].length;
            if (len > 1) {
                cycles.push(i);
                numCycles += len * (len - 1) / 2;
            }
        }

        var selection = Math.floor(Math.random() * numCycles);
        numCycles = 0;
        var start = -1;
        var end = -1;

        for (var i = 0; i < cycles.length; i++) {
            var lst = sites[cycles[i]];
            var len = lst.length;
            var last = numCycles;
            numCycles += len * (len - 1) / 2;
            if (numCycles > selection) {
                var diff = selection - last;
                start = 0;
                end = 1;
                while (diff-- > 0) {
                    end++;
                    if (end > lst.length - 1) {
                        start++;
                        end = start + 1;
                    }
                }
                start = lst[start];
                end = lst[end];
   //             console.log(start + " " + end + " " + (end - start));
                break;
            }
        }

        var cycle = Math.random() > 0.5 || start === -1 ? false : true;
        var deleted = Math.random() > 0.5 ? true : false;
 //       console.log("mutating cycle " + cycle + " deleted " + deleted);

        if (deleted) {
            if (cycle) {
      //          console.log("deleted cycle " + (end - start) + " at " + start);
                this.genes.splice(start, end - start);
            }
            else {
    //            console.log("shrunk");
                var rand = Math.floor(Math.random() * Math.min(this.params.mutationlength, this.genes.length)) + 1;

                Math.random > 0.5 ? this.genes.splice(this.genes.length - rand) : this.genes.splice(0, rand);
            }
        }
        else {
            if (cycle) {
                // add it somewhere else
                var tempLst = [];
                for (var i = start; i < end; i++) {
                    var gene = this.genes[i].clone();
                    if (mutation()) { gene.mutate(); }
                    tempLst.push(gene);
                }
                // console.log("added cycle " + (end - start + 1));
                var indexes = sites[this.genes[start].site.index];
                var insertAt = Math.floor(Math.random() * indexes.length);
         //       console.log("added " + (end - start) + " at " + indexes[insertAt]);
        //        console.log(this.genes[indexes[insertAt]].site.index + " " + tempLst[0].site.index);

                for (var i = 0; i < tempLst.length; i++) {
                    var index = indexes[insertAt] + i;
                    this.genes.splice(index, 0, tempLst[i]);
                }
                //var j = end;
                //while (start <= j) {
                //    this.genes.splice(indexes[insertAt], 0, this.genes[j].clone());
                //    if (indexes[insertAt] > start) j--;
                //    else start++;
                //}
            }
            else {
                //      console.log("grew");
                var front = Math.random() > 0.5 ? true : false;
                var gene = front ? this.genes[0] : this.genes[this.genes.length - 1];
                var rand = Math.floor(Math.random() * this.params.mutationlength) + 1;
                //console.log("rand " + rand);
                for (var k = 0; k < rand; k++) {
                    var adj = [];
                    for (var i = 0; i < this.params.map.sitelist.length; i++) {
                        //console.log(gene.site.index);
                        if (this.params.map.adjacencymatrix[gene.site.index][i] > 0) adj.push(i);
                    }
                    var j = adj[Math.floor(Math.random() * adj.length)];
                    //console.log(adj);
                    gene = new Gene(this.params.map.sitelist[j], new Perm(this.params.permsize), this.params);
                    front ? this.genes.splice(0, 0, gene) : this.genes.push(gene);
                }
            }
        }


        this.updateStats();

        return true;
    }
    this.updateStats();

    return false;
}

Geneplex.prototype.lcs = function (geneplex) {
    var s = [];
    var n = this.genes.length;
    var m = geneplex.genes.length;
    for (var i = 0; i < n + 1; i++) {
        s.push([]);
        for (var j = 0; j < m + 1; j++) {
            s[i].push(0);
        }
    }

    for (var i = 1; i < n + 1; i++) {
        for (var j = 1; j < m + 1; j++) {
            if (this.genes[i - 1].site.index === geneplex.genes[j - 1].site.index) {
                s[i][j] = s[i - 1][j - 1] + 1;
            }
            else {
                s[i][j] = Math.max(s[i - 1][j], s[i][j - 1]);
            }
        }
    }
    var that = this;
    function recover(i, j) {
        if (i < 1 || j < 1) return [];
        if (that.genes[i - 1].site.index === geneplex.genes[j - 1].site.index) {
            var list = recover(i - 1, j - 1);
            list.push({ i: i - 1, j: j - 1 });
            return list;
        }
        else {
            //if (i === 0) {
            //    return recover(i, j - 1);
            //}
            //if (j === 0) {
            //    return recover(i - 1, j);
            //}
            if (s[i - 1][j] > s[i][j - 1]) {
                return recover(i - 1, j);
            }
            else {
                return recover(i, j - 1);
            }
        }
    }

    return { max: s[n][m], list: recover(n, m) };
}

Geneplex.prototype.crossover = function (geneplex) {
    // add lcs dp solution here for crossover
    var crosspoints = this.lcs(geneplex);
    var toReturn = (Math.max(this.genes.length, geneplex.genes.length) - crosspoints.max);

    var genes = [];
    var mother = Math.random() > 0.5 ? true : false;
    var i = 0;
    var j = 0;

    if (!mother) this.maxthreshold = geneplex.maxthreshold;

    mother = Math.random() > 0.5 ? true : false;
    for (var k = 0; k < crosspoints.list.length; k++) {
        if (mother) {
            while (i < crosspoints.list[k].i) {
                genes.push(this.genes[i++].clone());
            }
            j = crosspoints.list[k].j;
        }
        else {
            while (j < crosspoints.list[k].j) {
                genes.push(geneplex.genes[j++].clone());
            }
            i = crosspoints.list[k].i;
        }
        mother = Math.random() > 0.5 ? true : false;
    }
    if (mother) {
        while (i < this.genes.length) {
            genes.push(this.genes[i++].clone());
        }
    }
    else {
        while (j < geneplex.genes.length) {
            genes.push(geneplex.genes[j++].clone());
        }
    }
    //console.log(crosspoints);
    //console.log("lcs: " + this.lcs(geneplex).max + " n: " + this.genes.length + " m: " + geneplex.genes.length + " g: " + genes.length);
    //console.log("mindif: " + (Math.min(this.genes.length, geneplex.genes.length) - this.lcs(geneplex).max) +
    //    " parentdif: " + Math.abs(this.genes.length - geneplex.genes.length) + " newdiff: " + Math.min(Math.abs(genes.length-this.genes.length),Math.abs(genes.length - geneplex.genes.length)));
    this.genes = genes;

    for (var i = 0; i < this.params.numsites; i++) {
        if (Math.random() > 0.5) {
            this.breedsites[i] = geneplex.breedsites[i];
        }
    }

    this.updateStats();

    return toReturn;
}

Geneplex.prototype.clone = function () {
    var gp = new Geneplex(this.params);
    gp.genes = [];
    for (var i = 0; i < this.genes.length; i++) {
        gp.genes.push(this.genes[i].clone());
    }
    for (var i = 0; i < this.params.numsites; i++) {
        gp.breedsites[i] = this.breedsites[i];
    }
    gp.maxthreshold = this.maxthreshold;

    gp.updateStats();

    return gp;
}

Geneplex.prototype.findBestDay = function (currentSite, energy, breeding) {
    var counts = [];
    var bestday = { index: -1, reward: -1 };

    if (energy < 0) return bestday;
    var maximizing = false;
    if (this.params.maximize && this.params.continue) {
        var threshold = 1 / this.maxthreshold;
        if (this.maxthreshold < this.params.map.thresholds.length) this.params.map.thresholds[this.maxthreshold-1]++;
        if (Math.random() < threshold) maximizing = true;
    }
    //console.log("find best day");

    // continue following genome from current site
    if (this.gene > -1 && this.params.continue && !maximizing) {
        //        console.log("continue from " + this.gene);
        bestday = {
            index: this.gene,
            intervals: [],
            indexlist: [],
            sitelist: "",
            energy: 0,
            reward: 0,
            rewind: this.rewind,
            last: this.gene
        };
        var duration = 0;
        for (var i = this.gene; duration < energy; this.rewind ? i-- : i++) {
            var breedcost = breeding === true ? (this.genes[i].breed + this.breedsites[this.genes[i].site.index]) : 0;
            if (this.rewind && (i + 2) > this.genes.length || !this.rewind && i - 1 < 0) {
                console.log(i + " " + this.genes.length + " " + this.rewind);
                this.rewind = !this.rewind;
            }
            if (this.genes.length < 5) {
                console.log("veryshort " + this.genes.length);
            }
            if (this.genes[i] === undefined || this.genes[this.rewind ? i + 1 : i - 1] === undefined) {
                console.log("undefined " + i + " " + this.genes + " " + this.genes[i] + " " + this.genes[this.rewind ? i + 1 : i - 1]);
            }
            var edgecost = this.params.map.adjacencymatrix[this.genes[this.rewind ? i + 1 : i - 1].site.index][this.genes[i].site.index];
            var cost = this.genes[i].cost() + edgecost + breedcost;
            if (duration + cost < energy) {
                bestday.indexlist.push({ geneindex: i, index: this.genes[i].site.index, start: bestday.energy });
                bestday.energy += cost;
                bestday.reward += this.genes[i].reward();
                if (breedcost > 0) {
                    bestday.intervals.push({ start: bestday.energy - breedcost, end: bestday.energy, site: this.genes[i].site.index });
                }
                bestday.last = i;


                if (i === this.genes.length - 1) {
                    this.rewind = true;
                }
                if (i === 0) {
                    this.rewind = false;
                }
            }
            duration += cost;
        }
        //console.log(bestday.last);
        bestday.indexlist.push({ geneindex: bestday.last, index: this.genes[bestday.last].site.index, start: this.params.maxenergy * 2 });
        bestday.rewind = this.rewind;
    }
    else {
        //       console.log("maximizing");
        this.rewind = false;
        // find best possible segment of genplex that starts at the current site
        for (var i = 0; i >= 0; this.rewind ? i-- : i++) {
            if (i === this.genes.length) {
                if (i === 0 || i === 1) {
                    //console.log("panic! " + i + " " + bestday.index);
                    return bestday;
                }
                i -= 2;
                this.rewind = true;
            }
            // if we have counts on the go
            if (counts.length > 0) {
                var breedcost = breeding === true ? (this.genes[i].breed + this.breedsites[this.genes[i].site.index]) : 0;
                var edgecost = this.params.map.adjacencymatrix[this.genes[this.rewind ? i + 1 : i - 1].site.index][this.genes[i].site.index];
                var cost = this.genes[i].cost() + edgecost + breedcost;

                for (var j = 0; j < counts.length; j++) {
                    if (counts[j].energy + cost <= energy) {
                        counts[j].indexlist.push({ geneindex: i, index: this.genes[i].site.index, start: counts[j].energy });
                        counts[j].energy += cost;
                        counts[j].reward += this.genes[i].reward();
                        if (breedcost > 0) {
                            counts[j].intervals.push({ start: counts[j].energy - breedcost, end: counts[j].energy, site: this.genes[i].site.index });
                        }
                    }
                    else {
                        //console.log(counts[j]);
                        if (bestday.reward < counts[j].reward) {
                            counts[j].last = i;
                            counts[j].indexlist.push({ geneindex: i, index: this.genes[i].site.index, start: counts[j].energy });
                            counts[j].indexlist.push({ geneindex: i, index: this.genes[i].site.index, start: this.params.maxenergy *2 });
                            bestday = counts[j];
                        }
                        if (bestday.reward === counts[j].reward && bestday.energy > counts[j].energy) {
                            counts[j].last = i;
                            counts[j].indexlist.push({ geneindex: i, index: this.genes[i].site.index, start: counts[j].energy });
                            counts[j].indexlist.push({ geneindex: i, index: this.genes[i].site.index, start: this.params.maxenergy * 2 });
                            bestday = counts[j];
                        }
                        counts.splice(j--, 1);
                    }
                }
            }
            // if we are at the current site start a count
            if (currentSite === this.genes[i].site.index) {
                var breedcost = breeding === true ? (this.genes[i].breed + this.breedsites[this.genes[i].site.index]) : 0;
                counts.push({
                    index: i,
                    intervals: breedcost === 0 ? [] : [{ start: this.genes[i].cost(), end: this.genes[i].cost() + breedcost, site: this.genes[i].site.index }],
                    indexlist: [{ geneindex: i, index: this.genes[i].site.index, start: 0 }],
                    energy: this.genes[i].cost() + breedcost,
                    reward: this.genes[i].reward(),
                    rewind: this.rewind
                });
            }
        }
        // if there are more counts to finish
        this.rewind = false;
        for (var i = 1; counts.length > 0 && i < this.genes.length; i++) {
            // if we have counts on the go
            //if (i >= this.genes.length) console.log("i: " + i + "length: " + this.genes.length);
            if (counts.length > 0) {
                var breedcost = breeding === true ? (this.genes[i].breed + this.breedsites[this.genes[i].site.index]) : 0;
                var edgecost = this.params.map.adjacencymatrix[this.genes[this.rewind ? i + 1 : i - 1].site.index][this.genes[i].site.index];
                var cost = this.genes[i].cost() + edgecost + breedcost;

                for (var j = 0; j < counts.length; j++) {
                    if (counts[j].energy + cost <= energy) {
                        counts[j].indexlist.push({ geneindex: i, index: this.genes[i].site.index, start: counts[j].energy });
                        counts[j].energy += cost;
                        counts[j].reward += this.genes[i].reward();
                        if (breedcost > 0) {
                            counts[j].intervals.push({ start: counts[j].energy - breedcost, end: counts[j].energy, site: this.genes[i].site.index });
                        }
                    }
                    else {
                        //console.log(counts[j]);
                        if (bestday.reward < counts[j].reward) {
                            counts[j].last = i - 1;
                            counts[j].indexlist.push({ geneindex: i, index: this.genes[i].site.index, start: counts[j].energy });
                            counts[j].indexlist.push({ geneindex: i, index: this.genes[i].site.index, start: this.params.maxenergy * 2 });
                            bestday = counts[j];
                        }
                        if (bestday.reward === counts[j].reward && bestday.energy > counts[j].energy) {
                            counts[j].last = i - 1;
                            counts[j].indexlist.push({ geneindex: i, index: this.genes[i].site.index, start: counts[j].energy });
                            counts[j].indexlist.push({ geneindex: i, index: this.genes[i].site.index, start: this.params.maxenergy * 2 });
                            bestday = counts[j];
                        }
                        counts.splice(j--, 1);
                    }
                }
            }
        }
    }
    var ints = 0;
    this.gene = bestday.last;
    this.rewind = bestday.rewind;
    if (bestday.last === this.genes.length - 1) {
        //console.log("end " + bestday.last + " " + this.genes.length + " " + bestday.rewind);
        this.rewind = false;
    }
    if (bestday.last === 0) {
        //console.log("front " + bestday.last + " " + this.genes.length + " " + bestday.rewind);
        this.rewind = true;
    }

    if (energy < bestday.energy) {
        //console.log("low energy " + bestday.energy + "/" + energy);
        return { index: -1, reward: -1 };
    }
    //if (bestday.intervals) {
    //    while (bestday.intervals.length > ints) {
    //        console.log("(" + bestday.intervals[ints].start + ", " + bestday.intervals[ints].end + ", " + bestday.intervals[ints].site + ")");
    //        ints++;
    //    }
    //}
    //if (bestday.index === -1) {
    //    console.log("no best day");
    //    var cycle = currentSite + " ";
    //    for (var i = 0; i < this.genes.length; i++) {
    //        cycle += this.genes[i].site.index + "-";
    //    }
    //    console.log(cycle);
    //}

    //console.log(bestday);

    return bestday;
}

Geneplex.prototype.updateStats = function () {
    this.length = this.getLength();
    this.resources = this.getResources();
    this.siteList = this.getSiteList();
    this.resourcesRatio = this.resources / this.length;
}

Geneplex.prototype.getSiteList = function () {
    var siteList = [];
    for (var i = 0; i < this.genes.length; i++) {
        siteList.push( this.genes[i].site.index);
    }
    this.siteList = siteList;
    return siteList;
}

Geneplex.prototype.getLength = function () {
    var length = 0;
    var breedlength = 0;
    var travellength = 0;
    for (var i = 0; i < this.genes.length; i++) {
        length += this.genes[i].cost();
        var breedcost = this.genes[i].breed + this.breedsites[this.genes[i].site.index];
        breedlength += breedcost;
        length += breedcost;
        if (i + 1 < this.genes.length) {
            if (!this.genes[i + 1].site) { console.log(i + " " + this.genes.length); }
            var travelcost = this.params.map.adjacencymatrix[this.genes[i + 1].site.index][this.genes[i].site.index];
            if (travelcost === 0) {
                console.log("no edge at " + this.genes[i].site.index);
            }
            travellength += travelcost;
            length += travelcost;
        }
    }
 //   console.log(length + " " + breedlength + " " + travellength);
    this.breedlength = breedlength;
    this.travellength = travellength;
    this.length = length;
    return length;
}

Geneplex.prototype.getResources = function () {
    var resources = 0;
    for (var i = 0; i < this.genes.length; i++) {
        resources += this.genes[i].reward();
    }
    this.resources = resources;
    return resources;
}

var Genome = function (params) {
    this.params = params;
    this.geneplex = new Geneplex(this.params);

    this.asexual = this.params.asexual;
    this.sexual = this.params.sexual;
}

Genome.prototype.mutate = function () {
    if (Math.random() < this.params.mutationrate) {
        Math.random() > 0.5 ? this.asexual++ : this.asexual--;
        this.asexual = this.asexual < this.params.maxenergy ? this.params.maxenergy : this.asexual;
        if (this.asexual === undefined) console.log(this.asexual);
    }
    if (Math.random() < this.params.mutationrate) {
        Math.random() > 0.5 ? this.sexual++ : this.sexual--;
        this.sexual = this.sexual < this.params.maxenergy / 2 ? this.params.maxenergy / 2 : this.sexual;
        if (this.sexual === undefined) console.log(this.sexual);
    }
    return this.geneplex.mutate();
}

Genome.prototype.crossover = function (genome) {
    //if (Math.random > 0.5) this.geneplex.reverse();
    //if (Math.random() < 0.5) {
    //    this.geneplex = genome.geneplex.clone();
    //}
    //this.geneplex.crossover(genome.geneplex);
    if (Math.random() < 0.5) this.asexual = genome.asexual;
    if (Math.random() < 0.5) this.sexual = genome.sexual;
    var related = this.geneplex.crossover(genome.geneplex);
    this.mutate();
    return related;
}

Genome.prototype.clone = function () {
    var g = new Genome(this.params);

    g.geneplex = this.geneplex.clone();
    g.asexual = this.asexual;
    g.sexual = this.sexual;

    return g;
}

function Agent(params, id) {
    this.params = params;
    this.energy = this.params.maxenergy;
    this.genome = new Genome(this.params);
    this.site = this.genome.geneplex.genes[0].site.index;
    this.gene = 0;
    this.bestday = null;
    this.newday = true;
    this.elapsed = 0;
    this.resources = 0;
    this.lastindex = 0;
    this.age = 0;
    this.births = 0;
    this.sexbirths = 0;
    this.gen = 0;
    this.lovechild = false;
    this.mutated = false;
    this.breeding = false;
    this.parentrelated = -1;

    //console.log(id);
    this.id = id;
    this.mates = [];
    this.sitesbred = [];
    this.children = [];
}

Agent.prototype.day = function () {
    this.age++;

    if (this.bestday && this.bestday.index !== -1) {
        while (this.lastindex < this.bestday.indexlist.length - 2) {
            var index = this.bestday.indexlist[this.lastindex].index;
            var lastindex = this.lastindex === 0 ? index : this.bestday.indexlist[this.lastindex - 1].index;
            this.params.map.visited[lastindex][index]++;
            this.params.map.visited[index][lastindex]++;
            var gene = this.genome.geneplex.genes[this.bestday.indexlist[this.lastindex].geneindex];
            this.resources += gene.site.gather(gene.perm).reward;
            this.site = this.bestday.indexlist[this.lastindex++].index;
        }
        var num = this.energy - this.bestday.energy + this.params.resourcefactor * this.resources - (this.params.maxenergy - this.bestday.energy) * this.params.restcost - this.age * this.age * this.params.agecost;
        this.energy = num;
        //console.log(this.resources + " " + this.bestday.reward);
    }

    if ((this.params.sexualon && this.energy > this.genome.sexual + this.params.maxenergy)
        || (this.params.asexualon && this.energy > this.genome.asexual + this.params.maxenergy))
        this.breeding = true;
    else this.breeding = false;

    this.bestday = this.genome.geneplex.findBestDay(this.site, Math.min(this.energy, this.params.maxenergy), this.breeding || true);
    this.resources = 0;
    this.lastindex = 0;
}

Agent.prototype.update = function () {
    var i = 0;
    var delay = (this.params.maxenergy - this.bestday.energy) / 2;

    if (this.bestday.index !== -1) {
//        console.log(this.elapsed);
        while (this.elapsed > this.bestday.indexlist[i++].start + delay);
        i--;
        if (i === this.bestday.indexlist.length - 1) i--;
        if (i > this.lastindex) {
            for (var j = this.lastindex; j < i; j++) {
                var index = this.bestday.indexlist[j].index;
                var lastindex = j === 0 ? index : this.bestday.indexlist[j - 1].index;
                this.params.map.visited[lastindex][index]++;
                this.params.map.visited[index][lastindex]++;
                var gene = this.genome.geneplex.genes[this.bestday.indexlist[j].geneindex];
                this.resources += gene.site.gather(gene.perm).reward;
                //console.log(this.lastindex + j + " resources " + this.resources);
            }
            this.lastindex = i;
            this.site = this.bestday.indexlist[i].index;
            this.gene = this.bestday.indexlist[i].geneindex;
        }
    }
}

Agent.prototype.mutate = function () {
    this.mutated = this.genome.mutate();
}

Agent.prototype.crossover = function (agent) {
    this.parentrelated = this.genome.crossover(agent.genome);
    //console.log(this.parentrelated);
}

Agent.prototype.clone = function (id) {
    var a = new Agent(this.params, id);
    a.genome = this.genome.clone();
    a.site = this.site;
    a.gen = this.gen;
    return a;
}

Agent.prototype.asex = function (id) {
    this.births++;
    this.params.map.sitelist[this.site].asex++;
    var newagent = this.clone(id);

    newagent.mutate();
    newagent.gen++;
    newagent.day();

    this.energy -= this.params.maxenergy;
    this.breeding = false;

    this.children.push({ gen: -1, phe: -1 });

    return newagent;
}

Agent.prototype.sex = function (father, id) {
    var mother = this;

    mother.sexbirths++;
    father.sexbirths++;

    var newagent = mother.clone(id);
    newagent.crossover(father);
    newagent.gen = Math.max(mother.gen, father.gen) + 1;
    newagent.lovechild = true;
    newagent.day();

    var fSeq = new SiteSequence(father.genome.geneplex.siteList);
    var mSeq = new SiteSequence(mother.genome.geneplex.siteList);

    newagent.parentrelated = fSeq.levenshtein(mSeq).levenshtein;
    var fIndLst = father.bestday.indexlist;
    var mIndLst = mother.bestday.indexlist;

    fSeq = [];
    for (var i = 0; i < fIndLst.length; i++) {
        fSeq.push(fIndLst[i].index);
    }
    mSeq = [];
    for (var i = 0; i < mIndLst.length; i++) {
        mSeq.push(mIndLst[i].index);
    }

    fSeq = new SiteSequence(fSeq);
    mSeq = new SiteSequence(mSeq);
    newagent.parentPhenRelated = fSeq.levenshtein(mSeq).levenshtein;

    mother.energy -= this.params.maxenergy / 2;
    father.energy -= this.params.maxenergy / 2;

    mother.mates.push(father.id);
    father.mates.push(mother.id);

    mother.children.push({ gen: newagent.parentrelated, phe: newagent.parentPhenRelated });
    father.children.push({ gen: newagent.parentrelated, phe: newagent.parentPhenRelated });

    mother.breeding = false;
    father.breeding = false;

    return newagent;
}

function Population(params) {
    this.params = params;

    this.agents = [];
    this.days = 0;
    this.births = 0;
    this.sexbirths = 0;
    this.dayasex = 0;
    this.daysex = 0;
    this.slept = 0;
    this.deaths = 0;
    this.deathage = 0;
    this.elapsed = this.params.maxenergy;
    this.newday = true;
    this.harvest = 0;
    this.overharvest = 0;
    this.initBred = 0;
    this.initBarren = 0;

    this.energys = [];
    this.res = [];
    this.ages = [];
    this.parents = [];
    this.initParents = [];
    this.childParents = [];
    this.parentsPhen = [];
    this.initParentsPhen = [];
    this.childParentsPhen = [];
    this.lengths = [];
    this.ratio = [];
    this.dayratio = [];
    this.gen = [];
    this.related = [];
    this.philopatry = [[0, 0, 0, 0]];
    this.partners = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.genomeLog = [];
    this.phenoLog = [];
    this.partnersLog = [];
    this.sitesLog = [];
    this.parentsGenLog = [];
    this.parentsPhenLog = [];

    for (var i = 0; i < 100; i++) {
        this.parents.push(0);
        this.parentsPhen.push(0);
        this.initParents.push(0);
        this.initParentsPhen.push(0);
        this.childParents.push(0);
        this.childParentsPhen.push(0);
    }

    for (var i = 0; i < this.params.numagent; i++) {
        var a = new Agent(this.params, this.births++);
        this.agents.push(a);
    }
}

Population.prototype.day = function () {
    this.days++;
    if (this.days > this.params.runlength || this.agents.length === 0) {
        this.newPop = new Population(this.params);
        //        this = new Population(this.params);
        if (this.days > this.params.runlength) {
        }
    }
    this.elapsed = 0;
    this.dayasex = 0;
    this.daysex = 0;
    this.slept = 0;
    this.deaths = 0;
    this.harvest = 0;
    this.overharvest = 0;
    // for rendering
    var sites = [];
    var allIntervals = new IntervalList();
    var sampleLength = 100;
    var epochLength = 500;

    var genomeLog = [];
    var phenoLog = [];
    var pop = [];

    var that = this;
    function logDay() { return (that.days - 1) % sampleLength === 0; }
    function endDay() { return (that.days - 1) % epochLength === 0 && that.days > 1; }

    for (var i = 0; i < this.params.map.sitelist.length; i++) {
        var site = this.params.map.sitelist[i];
        if (site.feedcount > 0) this.harvest++;
        if (site.feedcount > site.yield * site.reward) this.overharvest++;
        sites.push([]);
    }
    this.params.map.day();

    this.gen = { max: 0, min: this.days, average: 0 };
    this.age = { max: 0, min: this.days, average: 0 };
    this.energy = { max: 0, min: 4 * this.params.maxenergy, average: 0 };
    this.lengths = { max: 0, min: 2000000, average: 0 };
    this.ratio = { max: 0, min: 2000000, average: 0 };
    this.dayratio = { max: 0, min: 2000000, average: 0, count: 0 };
    this.resources = { max: 0, min: 4 * this.params.maxenergy, average: 0 };
    for (var i = 0; i < this.agents.length; i++) {
        var agent = this.agents[i];

        if (agent.energy < 0 || agent.bestday && agent.bestday.index === -1) {
            this.deaths++;
            agent.dead = true;
            // agent dead

            if (agent.id < this.params.numagent) { // initial agent(s)
                if (agent.children.length > 0) this.initBred++;
                else this.initBarren++;

                var mate = 0;
                for (var j = 0; j < agent.children.length; j++) {
                    var child = agent.children[j];
                    if (child.gen > 0) {
                        if (agent.mates[mate] < this.params.numagent) {
                            this.initParents[Math.min(99, child.gen)]++;
                            this.initParentsPhen[Math.min(99, child.phe)]++;
                        }
                        else {
                            this.childParents[Math.min(99, child.gen)]++;
                            this.childParentsPhen[Math.min(99, child.phe)]++;
                        }
                    }
                    else mate--;

                    mate++;
                }

                if (this.initBarren + this.initBred === this.params.numagent) console.log(this.initBred + "/" + this.params.numagent + " of Initial Population Bred");
            }

            if (agent.sitesbred.length === 0) this.philopatry[0][0]++;
            else {
                while (this.philopatry.length < agent.sitesbred.length + 1) this.philopatry.push([0, 0, 0, 0]);
            }
            var philopatry = false;
            var wander = false;

            for (var j = 0; j < agent.sitesbred.length; j++) {
                if (agent.sitesbred[j] === agent.siteborn) {
                    philopatry = true;
                } else {
                    wander = true;
                }
            }
            if (philopatry && wander) this.philopatry[agent.sitesbred.length][2]++;
            else if (philopatry) this.philopatry[agent.sitesbred.length][3]++;
            else if (wander) this.philopatry[agent.sitesbred.length][1]++;

            //console.log("DEATH\tage: " + agent.age + "\tbirths: " + agent.births + "\tgen: " + agent.gen + "\tlength: "
            //+ agent.genome.geneplex.genes.length);
            this.agents.splice(i, 1);
            //this.related.splice(i, 1);
            //for (var j = 0; j < this.related.length; j++) this.related[j].splice(i, 1);
            i--;
        }
        else {
            this.params.map.sitelist[agent.site].slept++;
            this.gen.max = Math.max(this.gen.max, agent.gen);
            this.gen.min = Math.min(this.gen.min, agent.gen);
            this.gen.average += agent.gen / this.agents.length;
            this.age.max = Math.max(this.age.max, agent.age);
            this.age.min = Math.min(this.age.min, agent.age);
            this.age.average += agent.age / this.agents.length;
            this.energy.max = Math.max(this.energy.max, agent.energy);
            this.energy.min = Math.min(this.energy.min, agent.energy);
            this.energy.average += agent.energy / this.agents.length;
            this.resources.max = Math.max(this.resources.max, agent.resources);
            this.resources.min = Math.min(this.resources.min, agent.resources);
            this.resources.average += agent.resources / this.agents.length;
            this.lengths.max = Math.max(this.lengths.max, agent.genome.geneplex.length);
            this.lengths.min = Math.min(this.lengths.min, agent.genome.geneplex.length);
            this.lengths.average += agent.genome.geneplex.length / this.agents.length;
            this.ratio.max = Math.max(this.ratio.max, agent.genome.geneplex.resourcesRatio);
            this.ratio.min = Math.min(this.ratio.min, agent.genome.geneplex.resourcesRatio);
            this.ratio.average += agent.genome.geneplex.resourcesRatio / this.agents.length;

            if (agent.bestday && agent.energy > this.params.maxenergy) {
                var ratio = agent.resources / agent.bestday.energy;
                //if (ratio > 1) {
                //    console.log("Agent Energy " + agent.energy);
                //    console.log(agent.resources + "/" + agent.bestday.energy);
                //    var str = "";
                //    for (var j = 0; j < agent.bestday.indexlist.length - 1; j++) {
                //        str += "" + this.params.map.sitelist[agent.bestday.indexlist[j].index].reward +  " + ";
                //    }
                //    console.log(str);
                //}

                if (ratio < 1 && ratio > 0) {
                    this.dayratio.max = Math.max(this.dayratio.max, ratio);
                    this.dayratio.min = Math.min(this.dayratio.min, ratio);
                    this.dayratio.average += ratio;
                    this.dayratio.count++;
                }
            }

            if (agent.breeding) {
                var ints = agent.bestday.intervals;
                sites[agent.site].push(agent);
                if (ints === undefined) console.log(agent.bestday +  " " + agent.energy);
                for (var j = 0; j < ints.length; j++) {
                    var interval = ints[j];
                    interval.agent = i;

                    allIntervals.insert(interval);
                }
            }
            agent.day();
        }

        if (logDay()) {
            var sl = agent.genome.geneplex.siteList;
            sl = [agent.genome.geneplex.genes.length].concat(sl);
            //console.log(sl);

            genomeLog.push(agent.id + " " + agent.genome.geneplex.genes.length + " " + agent.genome.geneplex.siteList.join(" "));

            var psl = [];
            if (agent.bestday.indexlist) {
                var index = agent.bestday.indexlist.length - 1;
                psl = [index];
                var str = agent.id + " " + index + " ";
                for (var j = 0; j < agent.bestday.indexlist.length - 1; j++) {
                    psl.push(agent.bestday.indexlist[j].index);
                }
                str += psl.join(" ");
                phenoLog.push(str);
            }
            pop.push({ id: agent.id, genome: sl, phenome: psl });
        }
    }
    this.dayratio.count > 0 ? this.dayratio.average /= this.dayratio.count : this.dayratio.average = 0;

    

    // sexual interval breeding
    for (var i = 0; i < allIntervals.ints.length; i++) {
        var interval = allIntervals.ints[i];
        var agent = this.agents[interval.agent];
        if (!agent) {
            console.log(interval.agent);
            console.log(this.agents);
        }
        if (agent.breeding && this.params.sexualon && agent.energy > agent.genome.sexual + this.params.maxenergy) {
            var partners = allIntervals.findNextOverlap(i);
            var j = 0;
            //if(partners.length > 0) console.log(partners);
            while (j < partners.length) {
                var other = this.agents[partners[j]];
                if (other.breeding && other.energy > other.genome.sexual + this.params.maxenergy) {
                    while (partners.length > this.partners.length) this.partners.push(0);
                    this.partners[partners.length - 1]++;

                    this.params.map.sitelist[interval.site].sex++;
                    this.sexbirths++;

                    agent.sitesbred.push(interval.site);

                    var newagent = agent.sex(other, this.births + this.sexbirths);

                    newagent.siteborn = interval.site;
                    newagent.site = interval.site;

                    this.parents[Math.min(99, newagent.parentrelated)]++;

                    this.parentsPhen[Math.min(99, newagent.parentPhenRelated)]++;

                    this.agents.push(newagent);
                    break;
                }

                j++;
            }
        }
    }

    // asexual night breeding
    for (var i = 0; i < this.agents.length; i++) {
        var agent = this.agents[i];
        //if (sites[agent.site].length > 1) {
        //    // check for sexual breeding
        //    if (agent.breeding && this.params.sexualon && agent.energy > agent.genome.sexual + this.params.maxenergy) {
        //        var site = sites[agent.site];
        //        for (var j = 0; j < site.length; j++) {
        //            if (agent !== site[j] && site[j].breeding && site[j].energy > site[j].genome.sexual + this.params.maxenergy) {
        //                //console.log("SEX\tsite: " + agent.site + "\tenergy: " + Math.floor(agent.energy) + " " + Math.floor(site[j].energy) +
        //                //    "\tasexual: " + agent.genome.asexual + "\tsexual: " + agent.genome.sexual);
        //                var newagent = agent.sex(site[j]);

        //                while (this.parents.length < Math.min(100, newagent.parentrelated + 1)) this.parents.push(0);
        //                this.parents[Math.min(100, newagent.parentrelated)]++;

        //                this.agents.push(newagent);
        //                break;
        //            }
        //        }
        //    }
        //}
        if (agent.breeding && this.params.asexualon && agent.energy > agent.genome.asexual + this.params.maxenergy) {
            // agent asexually breeds
            //console.log("ASEX\tsite: " + agent.site + "\tenergy: " + Math.floor(agent.energy) +
            //"\tasexual: " + agent.genome.asexual + "\tsexual: " + agent.genome.sexual);
            this.births++;
            var newagent = agent.asex(this.births + this.sexbirths);

            newagent.siteborn = agent.site;
            this.agents.push(newagent);
        }
    }

    for (var i = 0; i < this.params.map.sitelist.length; i++) {
        var site = this.params.map.sitelist[i];
        if (site.slept > 0) this.slept++;
        if (site.sex > 0) this.daysex++;
        if (site.asex > 0) this.dayasex++;
    }
    if (logDay()) {
        var sites = [];
        for (var i = 0; i < this.params.numsites; i++) {
            var site = this.params.map.sitelist[i];
            var s = { x: site.x, y: site.y, index: site.index, totalsex: site.totalsex, totalasex: site.totalasex, visits: site.totalvisits };
            sites.push(s);
        }
        this.genomeLog.push(genomeLog.length + "\r\n" + genomeLog.join("\r\n") + "\r\n");
        this.phenoLog.push(phenoLog.length + "\r\n" + phenoLog.join("\r\n") + "\r\n");
        this.partnersLog.push(this.partners.join(" "));
        this.sitesLog.push(this.params.map.totalsex.join(" "));
        this.parentsGenLog.push(this.parents.join(" "));
        this.parentsPhenLog.push(this.parentsPhen.join(" "));
        var log = {
            day: this.days,
            numagent: this.params.numagent,
            name: this.params.mapname,
            population: pop,
            sites: sites,
            parentsGen: this.parents,
            parentsPhe: this.parentsPhen,
            philopatry: this.philopatry,
            initGen: this.initParents,
            initBred: this.initBred,
            initBarren: this.initBarren,
            initPhe: this.initParentsPhen,
            offGen: this.childParents,
            offPhe: this.childParentsPhen
        };
        if(socket) socket.emit("savepop", log);
   }
    if (endDay()) {
        if (this.params.download) {
            var filename = "Run" + this.params.mapname + "-R" + Math.floor(this.days / epochLength) + "-Gen.txt";
            download(filename, this.genomeLog.join(""));

            filename = "Run" + this.params.mapname + "-R" + Math.floor(this.days / epochLength) + "-Phe.txt";
            download(filename, this.phenoLog.join(""));

            filename = "Run" + this.params.mapname + "-R" + Math.floor(this.days / epochLength) + "-Part.txt";
            download(filename, this.partnersLog.join("\r\n"));

            filename = "Run" + this.params.mapname + "-R" + Math.floor(this.days / epochLength) + "-Site.txt";
            download(filename, this.sitesLog.join("\r\n"));

            filename = "Run" + this.params.mapname + "-R" + Math.floor(this.days / epochLength) + "-ParentsGen.txt";
            download(filename, this.parentsGenLog.join("\r\n"));

            filename = "Run" + this.params.mapname + "-R" + Math.floor(this.days / epochLength) + "-ParentsPhen.txt";
            download(filename, this.parentsPhenLog.join("\r\n"));
        }
        this.genomeLog = [];
        this.phenoLog = [];
        this.partnersLog = [];
        this.sitesLog = [];
        this.parentsGenLog = [];
        this.parentsPhenLog = [];
    }
}

Population.prototype.update = function () {
    var speed = document.getElementById('speed').value;
    this.elapsed += this.params.engine.clockTick * speed;
    if (this.elapsed > this.params.maxenergy) this.newday = true;

    if (this.newday) {
        this.newday = false;
        this.day();
    }

    for (var i = 0; i < this.agents.length; i++) {
        var agent = this.agents[this.agents.length - 1 - i];
        agent.elapsed = this.elapsed;
        agent.update();
    }
}

var ASSET_MANAGER = new AssetManager();
var socket = null;
if (window.io !== undefined) {
    console.log("Database connected!");
    socket = io.connect('http://76.28.150.193:8888');
}
ASSET_MANAGER.queueDownload("./img/FishSite.png");
ASSET_MANAGER.queueDownload("./img/NutSite.png");
ASSET_MANAGER.queueDownload("./img/Hut.png");
ASSET_MANAGER.queueDownload("./img/FishNutter.png");

ASSET_MANAGER.downloadAll(function () {
    console.log("starting up da sheild");
    var canvas = document.getElementById('gameWorld');
    var play = document.getElementById('play');
    var restart = document.getElementById('restart');
    var savemap = document.getElementById('savemap');
    var loadmap = document.getElementById('loadmap');
    var newmap = document.getElementById('newmap');
    var simStart = false;

    var ctx = canvas.getContext('2d');
    var gameEngine = new GameEngine();

    var fnn = {};
    fnn.engine = gameEngine;

    var p;

    var randomName = function() {
        var lst = [];
        var chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
        for (var i = 0; i < 8; i++) {
            var index = Math.floor(Math.random()*chars.length);
            lst.push(chars[index]);
        }
        return lst.join("");
    }

    var saveMap = function () {
        console.log("save clicked");
        var map = { name: fnn.mapname, reach: fnn.reach };
        var sitelist = [];
        var site = {};
        for (var i = 0; i < fnn.numsites; i++) {
            var s = fnn.map.sitelist[i];
            site = { x: s.x, y: s.y, reward: s.reward, perm: s.perm.perm };
            sitelist.push(site);
        }
        map.sitelist = sitelist;
        if(socket) socket.emit("savemap", map);
    }

    var newMap = function () {
        fnn.permsize = parseInt(document.getElementById('permsize').value);
        fnn.rewardmin = parseInt(document.getElementById('rewardmin').value);
        fnn.rewardmax = parseInt(document.getElementById('rewardmax').value);
        fnn.numsites = parseInt(document.getElementById('numsites').value);
        fnn.reach = parseFloat(document.getElementById('reach').value);
        fnn.yield = parseInt(document.getElementById('yield').value);
        fnn.mapname = document.getElementById("mapname").value;
        if (fnn.mapname === "") {
            document.getElementById("mapname").value = randomName();
            fnn.mapname = document.getElementById("mapname").value;
        }
        fnn.map = new SiteMap(fnn);
        saveMap();
        newPop();
    }

    var newPop = function () {
        fnn.numagent = parseInt(document.getElementById('numagent').value);
        fnn.maxenergy = parseInt(document.getElementById('maxenergy').value);
        fnn.asexual = parseInt(document.getElementById('asexual').value);
        fnn.sexual = parseInt(document.getElementById('sexual').value);
        fnn.asexualon = document.getElementById('asexualon').checked;
        fnn.sexualon = document.getElementById('sexualon').checked;
        fnn.maximize = document.getElementById('maximize').checked;
        fnn.continue = document.getElementById('continue').checked;
        fnn.resourcefactor = parseFloat(document.getElementById('resourcefactor').value);
        fnn.restcost = parseFloat(document.getElementById('restcost').value);
        fnn.agecost = parseFloat(document.getElementById('agecost').value);
        //fnn.clusters = document.getElementById('clusters').checked;
        fnn.mutationlength = parseInt(document.getElementById('mutationlength').value);
        fnn.mutationrate = parseFloat(document.getElementById('mutationrate').value);
        //fnn.clusterthreshold = parseFloat(document.getElementById('clusterthreshold').value);
        fnn.runlength = parseInt(document.getElementById('runlength').value);
        fnn.download = document.getElementById('download').checked;

        p = new Population(fnn);

        var renderer = new Renderer(p, fnn.map);
        if (gameEngine.entities.length === 1) gameEngine.entities.splice(0, 1);
        gameEngine.addEntity(renderer);
    }

    newMap();
    fnn.pause = true;
    play.onclick = function () {
            fnn.pause = !fnn.pause;
    };

    restart.onclick = function () {
        fnn.map.reset();
        newPop();
    };

    newmap.onclick = function () {
        newMap();
    }


    savemap.onclick = function () {
        fnn.mapname = document.getElementById("mapname").value;
        saveMap();
    };

    loadmap.onclick = function () {
        fnn.mapname = document.getElementById("mapname").value;
        if(socket) socket.emit("loadmap", { name: fnn.mapname });
    };

    if(socket) socket.on("loadmap", function (map) {
        console.log(map.name + " loaded from db");
        fnn.reach = map.reach;
        fnn.numsites = map.sitelist.length;
        fnn.map = new SiteMap(fnn, map.sitelist);

        p = new Population(fnn);
        var renderer = new Renderer(p, fnn.map);
        if (gameEngine.entities.length === 1) gameEngine.entities.splice(0, 1);
        gameEngine.addEntity(renderer);
    });

    gameEngine.init(ctx);
    gameEngine.start();

});
