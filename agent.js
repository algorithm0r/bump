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
    newagent.mutate();
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
