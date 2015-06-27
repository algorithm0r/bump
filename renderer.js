// Fisher and Nutters code here
// Fisher and Nutters Animation code below

function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);
    pom.click();
}

function Renderer(p, map) {
    this.map = map;
    this.p = p;

    this.clusters = [];

    this.agents = [];
    this.related = [];
    this.related.push([]);
    this.related[0].push(0);
    var newagent = this.p.agents[0];
    this.agents.push(newagent);
    Entity.call(this, null, 0, 0);
}

Renderer.prototype = new Entity();
Renderer.prototype.constructor = Renderer;

Renderer.prototype.update = function () {
    var numAgents = 36;

    if (!this.p.params.pause) {
        if (this.p.newPop) {
            this.p = this.p.newPop;
            this.p.params.map.reset();
        }
        this.p.update();
        this.agents = this.p.agents.slice(0, numAgents);
    }
}

Renderer.prototype.drawSiteMap = function (ctx, map, x, y, w, h) {

    // population map
    ctx.beginPath();
    ctx.strokeStyle = "Black";
    //ctx.rect(x, y, w, h);
    //ctx.stroke();
    ctx.lineWidth = 0.5;
    for (var i = 0; i < this.map.sitelist.length; i++) {
        for (var j = 0; j < this.map.sitelist.length; j++) {
            if (this.map.adjacencymatrix[i][j] !== 0) {
                var site1 = this.map.sitelist[i];
                var site2 = this.map.sitelist[j];
                ctx.beginPath();
                ctx.moveTo(w * site1.x + x, h * site1.y + y);
                ctx.lineTo(w * site2.x + x, h * site2.y + y);
                ctx.stroke();
            }
        }
    }
    ctx.lineWidth = 1.0;

    var sites = [];
    for (var i = 0; i < this.map.sitelist.length; i++) sites.push(0);

    for (var i = 0; i < this.p.agents.length; i++) {
        sites[this.p.agents[i].site]++;
    }

    for (var i = 0; i < this.map.sitelist.length; i++) {
        var site = this.map.sitelist[i];
        ctx.beginPath();
        var rad = Math.max(2, Math.min(2 * (1 + sites[i]), 50));
        ctx.arc(w * site.x + x, h * site.y + y, rad, 0, 2 * Math.PI, false);
        var dist = Math.sqrt(site.x * site.x + site.y * site.y) / Math.sqrt(2);
        var red = Math.floor((dist - 0.5) * 2 * 255);
        var green = Math.floor((dist - 0.5) * 2 * 255);
        var blue = Math.floor(255);
        if (red < 0) {
            red = 0;
            gree = 0;
            blue = Math.floor(dist * 2 * 255);
        }
        ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
        ctx.fill();
        ctx.strokeStyle = "Black";
        ctx.stroke();
    }

    ctx.font = "18px Arial";
    ctx.fillStyle = "black";
    ctx.fillText("Population " + this.p.agents.length, x, y + 1.1*h + 24);
    ctx.fillText("Length (Max/Ave/Min) " + Math.floor(this.p.lengths.max) + "/" + Math.floor(this.p.lengths.average) + "/" + Math.floor(this.p.lengths.min), x, y + 1.1 * h + 44);
    ctx.fillText("Ratio (Max/Ave/Min) " + Math.floor(this.p.ratio.max * 100) / 100 + "/" + Math.floor(this.p.ratio.average * 100) / 100 + "/" + Math.floor(this.p.ratio.min * 100) / 100, x, y + 1.1 * h + 63);

    var offset = 1.1 * w;

    // reproduction map
    ctx.strokeStyle = "LightGrey";
    ctx.lineWidth = 0.5;

    for (var i = 0; i < this.map.sitelist.length; i++) {
        for (var j = 0; j < this.map.sitelist.length; j++) {
            if (this.map.adjacencymatrix[i][j] !== 0) {
                var site1 = this.map.sitelist[i];
                var site2 = this.map.sitelist[j];
                ctx.beginPath();
                ctx.moveTo(offset + w * site1.x + x, h * site1.y + y);
                ctx.lineTo(offset + w * site2.x + x, h * site2.y + y);
                ctx.stroke();
            }
        }
    }
    ctx.lineWidth = 1;
    var scale = 1;
    for (var i = 0; i < this.map.sitelist.length; i++) {
        var site = this.map.sitelist[i];
        ctx.beginPath();
        ctx.globalAlpha = 0.5;
        var rad = (Math.log(site.totalasex + 1) / Math.log(2)) * scale;
        ctx.arc(offset + w * site.x + x, h * site.y + y, rad, 0, 2 * Math.PI, false);
        ctx.fillStyle = "Blue";
        ctx.fill();

        ctx.beginPath();
        rad = (Math.log(site.totalsex + 1)/Math.log(2)) * scale;
        ctx.arc(offset + w * site.x + x, h * site.y + y, rad, 0, 2 * Math.PI, false);
        ctx.fillStyle = "Red";
        ctx.fill();
        ctx.globalAlpha = 1.0;

        ctx.beginPath();
        rad = (site.slept) * scale / 2;
        ctx.arc(offset + w * site.x + x, h * site.y + y, rad, 0, 2 * Math.PI, false);
        ctx.strokeStyle = "Grey";
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.fillStyle = "Blue";
    ctx.rect(x + offset, y + 1.1 * h, this.p.dayasex / this.p.params.numsites * w, 8);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = "Black";
    ctx.rect(x + offset, y + 1.1*h, this.p.slept / this.p.params.numsites * w, 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = "Red";
    ctx.rect(x + offset, y + 1.1 * h + 10, this.p.daysex / this.p.params.numsites * w, 8);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = "Black";
    ctx.rect(x + offset, y + 1.1 * h + 10, this.p.harvest / this.p.params.numsites * w, 8);
    ctx.stroke();

    ctx.fillStyle = "black";
    ctx.fillText("Births(Asex/Sex) " + this.p.births + "/" + this.p.sexbirths, x + 1.1 * w, y + 1.1 * h + 40);
    ctx.fillText("Generation (Max/Min) " + this.p.gen.max + "/" + this.p.gen.min, x + 1.1 * w, y + 1.1 * h + 60);


    // gathering map
    offset = 2.2 * w;
    ctx.lineWidth = 0.5;

    for (var i = 0; i < this.map.sitelist.length; i++) {
        for (var j = 0; j < this.map.sitelist.length; j++) {
            if (this.map.adjacencymatrix[i][j] !== 0) {
                var site1 = this.map.sitelist[i];
                var site2 = this.map.sitelist[j];
                var color = 192 - 8 * this.map.visited[i][j];
                if (this.map.visited[i][j] === 0) color = 232;
                if (color < 0) color = 0;
                ctx.strokeStyle = "rgb(" + color + "," + color + "," + color + ")";
                ctx.beginPath();
                ctx.moveTo(offset + w * site1.x + x, h * site1.y + y);
                ctx.lineTo(offset + w * site2.x + x, h * site2.y + y);
                ctx.stroke();
            }
        }
    }
    ctx.lineWidth = 1;
    var scale = 1;
    for (var i = 0; i < this.map.sitelist.length; i++) {
        var site = this.map.sitelist[i];
        ctx.beginPath();
        ctx.globalAlpha = 0.3;
        var rad = (site.feedcount) * scale;
        while (rad > 10) {
            ctx.arc(offset + w * site.x + x, h * site.y + y, 10, 0, 2 * Math.PI, false);
            ctx.fillStyle = "Green";
            ctx.fill();
            rad -= 10;
        }
        ctx.arc(offset + w * site.x + x, h * site.y + y, rad, 0, 2 * Math.PI, false);
        ctx.fillStyle = "Green";
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
    for (var i = 0; i < this.map.sitelist.length; i++) {
        var site = this.map.sitelist[i];
        ctx.beginPath();
        ctx.globalAlpha = 0.3;
        var rad = (site.failcount) * scale;
        while (rad > 10) {
            ctx.arc(offset + w * site.x + x, h * site.y + y, 10, 0, 2 * Math.PI, false);
            ctx.fillStyle = "Black";
            ctx.fill();
            rad -= 10;
        }
        ctx.arc(offset + w * site.x + x, h * site.y + y, rad, 0, 2 * Math.PI, false);
        ctx.fillStyle = "Black";
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    ctx.beginPath();
    ctx.fillStyle = "Green";
    ctx.rect(x + offset, y + 1.1 * h, this.p.harvest / this.p.params.numsites * w, 8);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "Black";
    ctx.rect(x + offset, y + 1.1 * h, this.p.overharvest / this.p.params.numsites * w, 8);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = "Black";
    ctx.rect(x + offset, y + 1.1 * h, w, 8);
    ctx.stroke();

    ctx.fillStyle = "Black";
    ctx.fillText("Day (Max/Ave/Min) " + Math.floor(this.p.dayratio.max * 100) / 100 + "/" + Math.floor(this.p.dayratio.average * 100) / 100 + "/" + Math.floor(this.p.dayratio.min * 100) / 100, x  + offset, y + 1.1 * h + 43);

    ctx.font = "16px Arial";
    ctx.fillStyle = "black";
    ctx.fillText("Population", x + 0.3*w, y-4);
    ctx.fillText("Breeding", x + 1.4*w, y-4);
    ctx.fillText("Feeding", x + 2.5*w, y-4);
}

Renderer.prototype.drawGeneplex = function (ctx, gp, x, y, genescale, vert) {
    var xoffset = 0;
    var yoffset = 0;
    var visualLength = 560;
    //console.log(gp.genes[0].cost());
    for (var j = 0; j < gp.genes.length && xoffset < visualLength && yoffset < visualLength; j++) {
        ctx.beginPath();
        //if (gp.genes[j] === null) console.log(j);
        var site = gp.genes[j].site;
        var dist = Math.sqrt(site.x * site.x + site.y * site.y) / Math.sqrt(2);
        var red = Math.floor((dist - 0.5) * 2 * 255);
        var green = Math.floor((dist - 0.5) * 2 * 255);
        var blue = Math.floor(255);
        if (red < 0) {
            red = 0;
            gree = 0;
            blue = Math.floor(dist * 2 * 255);
        }
        ctx.strokeStyle = j === gp.gene ? "Red" : "rgb(" + red + "," + green + "," + blue + ")";
        var width = genescale * gp.genes[j].cost();
        var height = genescale * 2;
        ctx.rect(x + xoffset, y + yoffset, vert ? height : width , vert ? width : height);
        //console.log("Gene " + j + " Cost " + gp.genes[j].cost() + " Game " + gp.genes[j].minigame.perm.perm + " Attempt " + gp.genes[j].perm.perm);
        if (!vert && xoffset > visualLength/2) ctx.globalAlpha = 1.0 - (xoffset - visualLength/2) / (visualLength / 2);
        if (vert && yoffset > visualLength/2) ctx.globalAlpha = 1.0 - (yoffset - visualLength/2) / (visualLength / 2);
        ctx.stroke();
        vert ? yoffset += width + 1 : xoffset += width + 1;

        if (gp.genes[j].breed + gp.breedsites[gp.genes[j].site.index] > 0) {
            ctx.beginPath();
            ctx.strokeStyle = "Green";
            width = Math.max(genescale * (gp.genes[j].breed + gp.breedsites[gp.genes[j].site.index]), 1);
            ctx.rect(x + xoffset, y + yoffset, vert ? height : width, vert ? width : height);
            ctx.stroke();
            vert ? yoffset += width + 1 : xoffset += width + 1;
        }

        if (j != gp.genes.length - 1) {
            ctx.beginPath();
            ctx.strokeStyle = "Black";
            width = genescale * this.p.params.map.adjacencymatrix[gp.genes[j].site.index][gp.genes[j + 1].site.index];
            ctx.rect(x + xoffset, y + yoffset, vert ? height : width, vert ? width : height);
            ctx.stroke();
            vert ? yoffset += width + 1 : xoffset += width + 1;
        }
        ctx.globalAlpha = 1.0;

    }
}

Renderer.prototype.drawGenome = function (ctx, genome, x, y) {

}

Renderer.prototype.drawAgent = function (ctx, agent, x, y, vert) {
    var xoffset = 0;
    var yoffset = 0;
    var scale = 4;
    var geneplex = agent.genome.geneplex;

    //this.drawGeneplex(ctx, geneplex, x, y, 2, vert);
    if (geneplex) {
        ctx.beginPath();
        ctx.fillStyle = "LightGrey";
        ctx.strokeStyle = "DarkGrey";
        var width = geneplex.length * scale / 2;
        var height = 25;
        ctx.rect(x + xoffset - 2, y + yoffset - 2, (vert ? height : width) + 4, (vert ? width : height) + 4);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = "Brown";
        width = geneplex.resourcesRatio * scale * 100;
        height = 4;
        ctx.rect(x + xoffset, y + yoffset, vert ? height : width, vert ? width : height);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = "Green";
        var gathering = (geneplex.length - geneplex.breedlength - geneplex.travellength) / geneplex.length * 100 * scale;
        vert ? yoffset += gathering : xoffset += gathering;
        width = geneplex.breedlength / geneplex.length * scale * 100;
        height = 4;
        ctx.rect(x + xoffset, y + yoffset, vert ? height : width, vert ? width : height);
        ctx.fill();
        vert ? yoffset -= gathering : xoffset -= gathering;

        ctx.beginPath();
        ctx.fillStyle = "DarkGray";
        gathering += geneplex.breedlength / geneplex.length * 100 * scale;
        vert ? yoffset += gathering : xoffset += gathering;
        width = geneplex.travellength / geneplex.length * scale * 100;
        height = 4;
        ctx.rect(x + xoffset, y + yoffset, vert ? height : width, vert ? width : height);
        ctx.fill();
        vert ? yoffset -= gathering : xoffset -= gathering;
    }

    ctx.beginPath();
    ctx.strokeStyle = "Black";
    width = 100 * scale;
    height = 4;
    ctx.rect(x + xoffset, y + yoffset, vert ? height : width, vert ? width : height);
    ctx.stroke();

    vert ? xoffset = 7 : yoffset = 7;

    ctx.beginPath();
    ctx.fillStyle = "Blue";
    ctx.strokeStyle = "Black";
    var width = agent.age * scale;
    var height = 4;
    ctx.rect(x + xoffset, y + yoffset, vert ? height : width, vert ? width : height);
    ctx.fill();
    ctx.stroke();

    vert ? xoffset = 15 : yoffset = 15;

    ctx.beginPath();
    ctx.fillStyle = "Green";
    width = agent.energy * scale;
    height = 2;
    ctx.rect(x + xoffset, y + yoffset, vert ? height : width, vert ? width : height);
    ctx.fill();

    vert ? xoffset-- : yoffset--;

    ctx.beginPath();
    ctx.strokeStyle = "Black";
    width = this.p.params.maxenergy * scale;
    height = 4;
    ctx.rect(x + xoffset, y + yoffset, vert ? height : width, vert ? width : height);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "Red";
    width = agent.genome.sexual * scale;
    vert ? yoffset = this.p.params.maxenergy * scale : xoffset = this.p.params.maxenergy * scale;
    ctx.rect(x + xoffset, y + yoffset, vert ? height : width, vert ? width : height);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "Blue";
    width = agent.genome.asexual * scale;
    ctx.rect(x + xoffset, y + yoffset, vert ? height : width, vert ? width : height);
    ctx.stroke();

    vert ? xoffset = 21 : yoffset = 21;

    for (var i = 0; i < agent.children.length; i++) {
        ctx.beginPath();
        var val = agent.children[i].gen;
        if (val >= 0) {
            var red = Math.floor(255);
            var green = Math.floor(val * 2.5);
            var blue = Math.floor(val * 2.5);
            ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
        }
        else
            ctx.fillStyle = "Blue";

        ctx.strokeStyle = "Black";
        vert ? yoffset = i * 20 : xoffset = i * 20;
        width = 20;
        ctx.rect(x + xoffset, y + yoffset, vert ? height : width, vert ? width : height);
        ctx.fill();
        ctx.stroke();
    }
}

Renderer.prototype.drawPop = function (ctx, pop, index, x, y) {

}

Renderer.prototype.drawSun = function (ctx, x, y, radius) {
    ctx.beginPath();
    var rad = radius / 5;
    var elapsed = this.p.elapsed / this.p.params.maxenergy;
    var xx = Math.cos(elapsed * 2 * Math.PI) * radius;
    var yy = Math.sin(elapsed * 2 * Math.PI) * radius;
    ctx.arc(x + xx, y + yy, rad, 0, 2 * Math.PI, false);
    ctx.fillStyle = "Yellow";
    ctx.fill();
    ctx.font = "20px Arial";
    ctx.fillStyle = "black";
    ctx.fillText("Day " + this.p.days, x + 6 * radius / 5, y + 10);
}

Renderer.prototype.drawHeatPlot = function (ctx, x, y, lists, scale) {
    for (var i = 0; i < lists.length; i++) {
        var list = lists[i];
        for (var j = 0; j < list.length; j++) {
            ctx.beginPath();
            if (isNaN(list[j])) console.log("NaN");
            if (typeof list[j] == "undefined") console.log("undefined");
            var blue = Math.floor(0 + list[j] * 5);
            if (blue > 255) {
                blue -= 255;
                ctx.fillStyle = "rgb(" + blue + "," + blue + "," + 255 + ")";
            }
            else {
                ctx.fillStyle = "rgb(" + 0 + "," + 0 + "," + blue + ")";
            }
            ctx.rect(x + i * scale, y + j * scale, scale, scale);
            ctx.fill();
        }
    }
}

Renderer.prototype.drawLogPlot = function (ctx, x,y,label, series, base) {
    ctx.fillStyle = "black";
    ctx.font = "12px Arial";
    ctx.fillText(label, x+100, y+11);

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "Grey";
    ctx.rect(x-2, y-2, 204, 45);
    ctx.stroke();

    for (var i = 0; i < series.length; i++) {
        ctx.beginPath();
        ctx.fillStyle = "Red";
        var value = series[i];
        value = Math.log(value + 1) / Math.log(base) * 2;
        ctx.rect(x + 2* i, y+39, 2, -value);
        ctx.fill();
    }
    for (var i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.fillStyle = i % 2 === 0 ? "Black" : "LightGrey";
        ctx.rect(x + 20 * i, y+39, 20, 2);
        ctx.fill();
    }
}

Renderer.prototype.draw = function (ctx) {
    var that = this;

    this.drawSiteMap(ctx, this.map, 10, 20, 300, 300);
    this.drawSun(ctx, 1030, 50, 40);

    this.drawLogPlot(ctx, 980, 100, "Breeding Partners", this.p.partners, 2);
    this.drawLogPlot(ctx, 980, 150, "Breeding Sites", this.p.params.map.totalsex, 2);
    this.drawLogPlot(ctx, 980, 200, "Parent Genotype", this.p.parents, 2);
    this.drawLogPlot(ctx, 980, 250, "Parent Phenotype", this.p.parentsPhen, 2);
    this.drawLogPlot(ctx, 980, 300, "Visited Sites", this.p.params.map.totalvisited, 4);

    for (var i = 0; i < Math.min(this.agents.length, 72) ; i++) {
        //this.agents[i].genome.geneplex.gene = this.agents[i].gene;
        var vert = true;
        var xoffset = 0;
        var yoffset = 0;
        vert ? xoffset = 5 + i * 33 : yoffset = 5 + i * 33;
        this.drawAgent(ctx, this.agents[i], 2 + xoffset, 422 + yoffset, true);
    }

    var philopatry = [0,0,0,0];
    for (var i = 0; i < this.p.philopatry.length; i++) {
        for (var j = 0; j < this.p.philopatry[i].length; j++) {
            philopatry[j] += this.p.philopatry[i][j];
        }
    }
    var max = 1;
    for (var i = 0; i < philopatry.length; i++) {
        if (philopatry[i] > max) max = philopatry[i];
    }

    var scale = 199 / max;

    for (var i = 0; i < philopatry.length; i++) {
        ctx.beginPath();
        ctx.fillStyle = i === 0 ? "Black" : i === 1 ? "Blue" : i === 2 ? "Purple" : "Red";
        ctx.rect(980, 350 + i * 8, philopatry[i] * scale, 8);
        ctx.fill();
    }

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "Grey";
    ctx.rect(978, 348, 204, 45);
    ctx.stroke();

}
