function StochasticGenome(params) {
    this.params = params;
    this.numGenes = this.params.numsites;
    //this.geneplex = { length: this.params.numsites, genes: {length: this.params.numsites} };
    this.probStepSize = 10;
    this.asexual = this.params.asexual;
    this.sexual = this.params.sexual;

    var adjM = this.params.map.adjacencymatrix;

    this.genes = [];

    for (var i = 0; i < this.numGenes; i++) {
        var lst = adjM[i];
        var sitelist = [];
        gene = new Gene(this.params.map.sitelist[i], new Perm(this.params.permsize), this.params);
        for (var j = 0; j < this.numGenes; j++) {
            if (lst[j] !== 0) sitelist.push({ site: j, probability: 0 });
        }

        for (var j = 0; j < this.probStepSize; j++) {
            sitelist[Math.floor(Math.random() * sitelist.length)].probability += 1 / this.probStepSize;
        }
        var breed = Math.random() > 0.2 ? 0 : Math.floor(Math.random()*6)*0.1;
        this.genes.push({breed: breed, gene: gene, sitelist: sitelist});
    }

};

StochasticGenome.prototype.findBestDay = function (site, energy, breeding) {
    //console.log(site + " " + energy + " " + breeding);
    var nrg = 0;
    var reward = 0;
    var intervals = [];
    var indexlist = [];

    var index = site;

    var gene = this.genes[index];

    //console.log(gene);

    var gathercost = gene.gene.cost();
    var breedcost = gene.breed;
    var travelcost = 0;
    
    var cost = gathercost + breedcost + travelcost;

    while (nrg + cost < energy) {
        indexlist.push({ geneindex: index, index: index, start: nrg });
        nrg += cost;
        reward += gene.gene.reward();
        if (breedcost > 0) {
            intervals.push({ start: nrg - breedcost, end: nrg, site: index });
        }

        var nextsites = gene.sitelist;
        var randomsite = Math.random();
        var last = index;

        var newsite = 0;
        var sum = nextsites[0].probability;
        while (randomsite > sum) sum += nextsites[++newsite].probability;
        index = nextsites[newsite].site;

        gene = this.genes[index];
        travelcost = this.params.map.adjacencymatrix[last][index];
        gathercost = gene.gene.cost();
        breedcost = gene.breed;

        cost = gathercost + breedcost + travelcost;
    }

    // end day
    indexlist.push({ geneindex: index, index: index, start: nrg });
    indexlist.push({ geneindex: index, index: index, start: this.params.maxenergy * 2 });

    var bestday = {
        index: site,
        intervals: intervals,
        indexlist: indexlist,
        energy: nrg,
        reward: reward,
        rewind: false,
        last: index
    };
    return bestday;
};

StochasticGenome.prototype.mutate = function () {
    for (var i = 0; i < this.numGenes; i++) {
        this.genes[i].gene.mutate();
        var g = this.genes[i].sitelist;
        if (Math.random() < this.params.mutationrate && g.length > 0) {
            //console.log("mutation");
            var j = Math.floor(Math.random() * g.length);
            var k = Math.floor(Math.random() * g.length);;
            while (g[k].probability === 0) k = Math.floor(Math.random() * g.length);;
            if (g[k].probability > 0) {
                g[j].probability += 1 / this.probStepSize;
                g[k].probability -= 1 / this.probStepSize;
                //console.log("mutation" + j + " " + k);
            }
        }
        if (Math.random() < this.params.mutationrate) {
            this.genes[i].breed += Math.random() > 0.5 ? 0.1 : -0.1;
            if (this.genes[i].breed < 0) this.genes[i].breed = 0;
        }
    }
}

StochasticGenome.prototype.crossover = function (agent) {
    for (var i = 0; i < this.numGenes; i++) {
        var g = agent.genes[i].sitelist;
        if (Math.random() < 0.5) this.genes[i].gene = agent.genes[i].gene.clone();
        if (Math.random() < 0.5) this.genes[i].breed = agent.genes[i].breed;
        if (Math.random() < 0.5) {
            var gene = [];
            for (var j = 0; j < g.length ; j++) {
                gene.push({ site: g[j].site, probability: g[j].probability });
            }
            this.genes[i].sitelist = gene;
        }
    }
}

StochasticGenome.prototype.clone = function (id) {
    var a = new StochasticGenome(this.params);
    a.genes = [];
    for (var i = 0; i < this.numGenes; i++) {
        var sites = [];
        var g = this.genes[i].sitelist;
        var gene = this.genes[i].gene.clone();
        for (var j = 0; j < g.length ; j++) {
            sites.push({ site: g[j].site, probability: g[j].probability });
        }
        a.genes.push({breed: this.genes[i].breed, sitelist: sites, gene:gene});
    }
    return a;
}

function StochasticAgent(params, id) {
    this.params = params;
    this.energy = this.params.maxenergy;
    this.genome = new StochasticGenome(this.params);
    this.site = Math.floor(Math.random()*this.params.numsites);
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

StochasticAgent.prototype.day = function () {
    this.age++;

    if (this.bestday && this.bestday.index !== -1) {
        while (this.lastindex < this.bestday.indexlist.length - 2) {
            var index = this.bestday.indexlist[this.lastindex].index;
            var lastindex = this.lastindex === 0 ? index : this.bestday.indexlist[this.lastindex - 1].index;
            this.params.map.visited[lastindex][index]++;
            this.params.map.visited[index][lastindex]++;
            var gene = this.genome.genes[this.bestday.indexlist[this.lastindex].geneindex].gene;
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

    this.bestday = this.genome.findBestDay(this.site, Math.min(this.energy, this.params.maxenergy), this.breeding || true);
    this.resources = 0;
    this.lastindex = 0;
}

StochasticAgent.prototype.update = function () {
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
                var gene = this.genome.genes[this.bestday.indexlist[j].geneindex].gene;
                this.resources += gene.site.gather(gene.perm).reward;
                //console.log(this.lastindex + j + " resources " + this.resources);
            }
            this.lastindex = i;
            this.site = this.bestday.indexlist[i].index;
            this.gene = this.bestday.indexlist[i].geneindex;
        }
    }
}

StochasticAgent.prototype.mutate = function () {
    this.mutated = this.genome.mutate();
}

StochasticAgent.prototype.crossover = function (agent) {
    this.parentrelated = this.genome.crossover(agent.genome);
    //console.log(this.parentrelated);
}

StochasticAgent.prototype.clone = function (id) {
    var a = new StochasticAgent(this.params, id);
    a.genome = this.genome.clone();
    a.site = this.site;
    a.gen = this.gen;
    return a;
}

StochasticAgent.prototype.asex = function (id) {
    this.births++;
    this.params.map.sitelist[this.site].asex++;
    var newagent = this.clone(id);
    //console.log(newagent);
    newagent.mutate();
    newagent.gen++;
    newagent.day();

    this.energy -= this.params.maxenergy;
    this.breeding = false;

    this.children.push({ gen: -1, phe: -1 });

    return newagent;
}

StochasticAgent.prototype.sex = function (father, id) {
    var mother = this;

    mother.sexbirths++;
    father.sexbirths++;

    var newagent = mother.clone(id);
    newagent.crossover(father);
    newagent.gen = Math.max(mother.gen, father.gen) + 1;
    newagent.lovechild = true;
    newagent.mutate();
    newagent.day();

    var fIndLst = father.bestday.indexlist;
    var mIndLst = mother.bestday.indexlist;

    var fSeq = [];
    for (var i = 0; i < fIndLst.length; i++) {
        fSeq.push(fIndLst[i].index);
    }
    var mSeq = [];
    for (var i = 0; i < mIndLst.length; i++) {
        mSeq.push(mIndLst[i].index);
    }

    fSeq = new SiteSequence(fSeq);
    mSeq = new SiteSequence(mSeq);
    newagent.parentPhenRelated = fSeq.levenshtein(mSeq).levenshtein;
    newagent.parentrelated = newagent.parentPhenRelated;

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
