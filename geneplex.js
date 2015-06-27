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
    //var maximizing = false;
    //if (this.params.maximize && this.params.continue) {
    //    var threshold = 1 / this.maxthreshold;
    //    if (this.maxthreshold < this.params.map.thresholds.length) this.params.map.thresholds[this.maxthreshold-1]++;
    //    if (Math.random() < threshold) maximizing = true;
    //}
    ////console.log("find best day");

    //// continue following genome from current site
    //if (this.gene > -1 && this.params.continue && !maximizing) {
    //    //        console.log("continue from " + this.gene);
    //    bestday = {
    //        index: this.gene,
    //        intervals: [],
    //        indexlist: [],
    //        sitelist: "",
    //        energy: 0,
    //        reward: 0,
    //        rewind: this.rewind,
    //        last: this.gene
    //    };
    //    var duration = 0;
    //    for (var i = this.gene; duration < energy; this.rewind ? i-- : i++) {
    //        var breedcost = breeding === true ? (this.genes[i].breed + this.breedsites[this.genes[i].site.index]) : 0;
    //        if (this.rewind && (i + 2) > this.genes.length || !this.rewind && i - 1 < 0) {
    //            console.log(i + " " + this.genes.length + " " + this.rewind);
    //            this.rewind = !this.rewind;
    //        }
    //        if (this.genes.length < 5) {
    //            console.log("veryshort " + this.genes.length);
    //        }
    //        if (this.genes[i] === undefined || this.genes[this.rewind ? i + 1 : i - 1] === undefined) {
    //            console.log("undefined " + i + " " + this.genes + " " + this.genes[i] + " " + this.genes[this.rewind ? i + 1 : i - 1]);
    //        }
    //        var edgecost = this.params.map.adjacencymatrix[this.genes[this.rewind ? i + 1 : i - 1].site.index][this.genes[i].site.index];
    //        var cost = this.genes[i].cost() + edgecost + breedcost;
    //        if (duration + cost < energy) {
    //            bestday.indexlist.push({ geneindex: i, index: this.genes[i].site.index, start: bestday.energy });
    //            bestday.energy += cost;
    //            bestday.reward += this.genes[i].reward();
    //            if (breedcost > 0) {
    //                bestday.intervals.push({ start: bestday.energy - breedcost, end: bestday.energy, site: this.genes[i].site.index });
    //            }
    //            bestday.last = i;


    //            if (i === this.genes.length - 1) {
    //                this.rewind = true;
    //            }
    //            if (i === 0) {
    //                this.rewind = false;
    //            }
    //        }
    //        duration += cost;
    //    }
    //    //console.log(bestday.last);
    //    bestday.indexlist.push({ geneindex: bestday.last, index: this.genes[bestday.last].site.index, start: this.params.maxenergy * 2 });
    //    bestday.rewind = this.rewind;
    //}
    //else {
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
                    if (bestday.reward < counts[j].reward || (bestday.reward === counts[j].reward && bestday.energy > counts[j].energy)) {
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
    //}
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
