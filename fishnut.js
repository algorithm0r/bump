window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

function AssetManager() {
    this.successCount = 0;
    this.errorCount = 0;
    this.cache = [];
    this.downloadQueue = [];
}

AssetManager.prototype.queueDownload = function (path) {
    console.log(path.toString());
    this.downloadQueue.push(path);
}

AssetManager.prototype.isDone = function () {
    return (this.downloadQueue.length == this.successCount + this.errorCount);
}
AssetManager.prototype.downloadAll = function (callback) {
    for (var i = 0; i < this.downloadQueue.length; i++) {
        var path = this.downloadQueue[i];
        var img = new Image();
        var that = this;
        img.addEventListener("load", function () {
            console.log("dun: " + this.src.toString());
            that.successCount += 1;
            if (that.isDone()) { callback(); }
        });
        img.addEventListener("error", function () {
            that.errorCount += 1;
            if (that.isDone()) { callback(); }
        });
        img.src = path;
        this.cache[path] = img;
    }
}

AssetManager.prototype.getAsset = function(path){
    //console.log(path.toString());
    return this.cache[path];
}


function GameEngine() {
    this.entities = [];
    this.ctx = null;
    this.click = null;
    this.mouse = null;
    this.wheel = null;
    this.surfaceWidth = null;
    this.surfaceHeight = null;
}

GameEngine.prototype.init = function (ctx) {
    this.ctx = ctx;
    this.timer = new Timer();
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.startInput();

    console.log('game initialized');
}

GameEngine.prototype.start = function () {
    console.log("starting game");
    var that = this;
    (function gameLoop() {
        that.loop();
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
}

GameEngine.prototype.startInput = function () {
    console.log('Starting input');

    var getXandY = function (e) {
        var x = e.clientX - that.ctx.canvas.getBoundingClientRect().left;
        var y = e.clientY - that.ctx.canvas.getBoundingClientRect().top;

        if (x < 1024) {
            x = Math.floor(x / 32);
            y = Math.floor(y / 32);
        }

        return { x: x, y: y };
    }

    var that = this;

    this.ctx.canvas.addEventListener("click", function (e) {
        that.click = getXandY(e);
    }, false);

    this.ctx.canvas.addEventListener("mousemove", function (e) {
        that.mouse = getXandY(e);
    }, false);

    this.ctx.canvas.addEventListener("mousewheel", function (e) {
        that.wheel = e;
    }, false);

    console.log('Input started');
}

GameEngine.prototype.addEntity = function (entity) {
    console.log('added entity');
    this.entities.push(entity);
}

GameEngine.prototype.draw = function (drawCallback) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.save();
    for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(this.ctx);
    }
    if (drawCallback) {
        drawCallback(this);
    }
    this.ctx.restore();
}

GameEngine.prototype.update = function () {
    var entitiesCount = this.entities.length;

    for (var i = 0; i < entitiesCount; i++) {
        var entity = this.entities[i];

        if (!entity.removeFromWorld) {
            entity.update();
        }
    }

    for (var i = this.entities.length - 1; i >= 0; --i) {
        if (this.entities[i].removeFromWorld) {
            this.entities.splice(i, 1);
        }
    }
}

GameEngine.prototype.loop = function () {
    this.clockTick = this.timer.tick();
    this.update();
    this.draw();
    this.click = null;
    this.wheel = null;
}

function Entity(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.removeFromWorld = false;
}

Entity.prototype.update = function () {
}

Entity.prototype.draw = function (ctx) {
    if (this.game.showOutlines && this.radius) {
        ctx.beginPath();
        ctx.strokeStyle = "green";
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.stroke();
        ctx.closePath();
    }
}

Entity.prototype.rotateAndCache = function (image, angle) {
    var offscreenCanvas = document.createElement('canvas');
    var size = Math.max(image.width, image.height);
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    var offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCtx.save();
    offscreenCtx.translate(size / 2, size / 2);
    offscreenCtx.rotate(angle);
    offscreenCtx.translate(0, 0);
    offscreenCtx.drawImage(image, -(image.width / 2), -(image.height / 2));
    offscreenCtx.restore();
    //offscreenCtx.strokeStyle = "red";
    //offscreenCtx.strokeRect(0,0,size,size);
    return offscreenCanvas;
}

function Timer() {
    this.gameTime = 0;
    this.maxStep = 0.05;
    this.wallLastTimestamp = 0;
}

Timer.prototype.tick = function () {
    var wallCurrent = Date.now();
    var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
    this.wallLastTimestamp = wallCurrent;

    var gameDelta = Math.min(wallDelta, this.maxStep);
    this.gameTime += gameDelta;
    return gameDelta;
}

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
    var numAgents = 20;

    if (!this.p.params.pause) {
        this.p.update();
        Entity.prototype.update.call(this);

        for (var i = 0; i < this.agents.length; i++) {
            if (this.agents[i] === null || this.agents[i].energy < 0 || this.agents[i].dead === true) {
                //console.log(this.agents[i]);
                if (this.p.params.clusters) {
                    this.related.splice(i, 1);
                    for (var j = 0; j < this.related.length; j++) this.related[j].splice(i, 1);
                }
                this.agents.splice(i--, 1);
            }
        }
        var changed = false;
        while (this.agents.length < numAgents && this.agents.length < this.p.agents.length) {
            var l = this.p.agents.length - 1 - Math.floor(Math.random() * this.p.agents.length / 4);
            var newagent = this.p.agents[l];
            this.agents.push(newagent);

            if (this.p.params.clusters) {
                this.related.push([]);
                for (var k = 0; k < this.agents.length - 1; k++) {
                    var value = Math.max(newagent.genome.geneplex.genes.length, this.agents[k].genome.geneplex.genes.length) - newagent.genome.geneplex.lcs(this.agents[k].genome.geneplex).max;
                    this.related[this.related.length - 1].push(value);
                    this.related[k].push(value);
                }
                this.related[this.related.length - 1].push(0);
                changed = true;
            }
        }
        if (changed) {
            this.clusters = [];
            for (var i = 0; i < this.agents.length; i++) {
                var clustered = false;
                for (var j = 0; j < this.clusters.length; j++) {
                    var allZero = true;
                    for (var k = 0; k < this.clusters[j].length; k++) {
                        if (this.related[i][this.clusters[j][k]] > this.p.params.clusterthreshold) {
                            allZero = false;
                            break;
                        }
                    }
                    if (allZero) {
                        this.clusters[j].push(i);
                        clustered = true;
                        break;
                    }
                }
                if (!clustered) {
                    this.clusters.push([]);
                    this.clusters[this.clusters.length - 1].push(i);
                }
            }
            //if (this.clusters.length > 1) {
            //console.log(this.clusters);
            var order = [];
            var cls = 0, itm = 0;
            for (var i = 0; i < this.agents.length; i++) {
                order.push(this.clusters[cls][itm]);
                itm++;
                if (itm >= this.clusters[cls].length) {
                    cls++;
                    itm = 0;
                }
            }
            //if (this.clusters.length > 1) {
            //    console.log(this.clusters);
            //    console.log(order);
            //}
            var temp = [];
            var agents = [];
            for (var i = 0; i < this.agents.length; i++) {
                temp.push([]);
                var k = order[i];
                agents.push(this.agents[k]);
                for (var j = 0; j < this.agents.length; j++) {
                    var l = order[j];
                    //console.log(i + " " + j + " " + k + " " + l + " " + clsi + " " + itmi + " " + clsj + " " + itmj);
                    if (this.related[k][l] != this.related[l][k]) console.log(l + " " + k + " " + this.related[k][l] + " " + this.related[l][k]);
                    temp[i].push(this.related[k][l]);
                }
            }
            this.related = temp;
            this.agents = agents;
        }

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

    for (var i = 0; i < this.map.sitelist.length; i++) {
        var site = this.map.sitelist[i];
        ctx.beginPath();
        var rad = 2;
        for (var j = 0; j < this.p.agents.length; j++) {
            if (this.p.agents[j].site === i) rad += 2;
        }
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
    var scale = 2;
    for (var i = 0; i < this.map.sitelist.length; i++) {
        var site = this.map.sitelist[i];
        ctx.beginPath();
        ctx.globalAlpha = 0.5;
        var rad = (site.asex) * scale;
        ctx.arc(offset + w * site.x + x, h * site.y + y, rad, 0, 2 * Math.PI, false);
        ctx.fillStyle = "Blue";
        ctx.fill();

        ctx.beginPath();
        rad = (site.sex) * scale;
        ctx.arc(offset + w * site.x + x, h * site.y + y, rad, 0, 2 * Math.PI, false);
        ctx.fillStyle = "Red";
        ctx.fill();
        ctx.globalAlpha = 1.0;

        ctx.beginPath();
        rad = (site.slept) * scale /2;
        ctx.arc(offset + w * site.x + x, h * site.y + y, rad, 0, 2 * Math.PI, false);
        ctx.strokeStyle = "Grey";
        ctx.stroke();
    }
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
                ctx.strokeStyle = "rgb(" + color + "," + color + "," + color + ")";;
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
        var rad = (site.count) * scale;
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
}

Renderer.prototype.drawGeneplex = function (ctx, gp, x, y) {
    var offset = 0;
    //console.log(gp.genes[0].cost());
    for (var j = 0; j < gp.genes.length && offset < 1200; j++) {
        ctx.beginPath();
        //if (gp.genes[j] === null) console.log(j);
        var site = gp.genes[j].site;
        var dist = Math.sqrt(site.x * site.x + site.y * site.y) / Math.sqrt(2);
        var red = Math.floor((dist-0.5) * 2 * 255);
        var green = Math.floor((dist - 0.5) * 2 * 255);
        var blue = Math.floor(255);
        if (red < 0) {
            red = 0;
            gree = 0;
            blue = Math.floor(dist * 2 * 255);
        }
        ctx.strokeStyle = j === gp.gene ? "Red" : "rgb(" + red + "," + green + "," + blue + ")";
        ctx.rect(x + offset, y, 3 * gp.genes[j].cost(), 5);
        //console.log("Gene " + j + " Cost " + gp.genes[j].cost() + " Game " + gp.genes[j].minigame.perm.perm + " Attempt " + gp.genes[j].perm.perm);
        if (offset > 900) ctx.globalAlpha = 1.0 - (offset - 900) / 300;
        ctx.stroke();
        offset += 3 * gp.genes[j].cost() + 1;

        if (gp.genes[j].breed + gp.breedsites[gp.genes[j].site.index] > 0) {
            ctx.beginPath();
            ctx.strokeStyle = "Green";
            ctx.rect(x + offset, y, Math.max(3 * gp.genes[j].breed + gp.breedsites[gp.genes[j].site.index], 1), 5);
            ctx.stroke();
            offset += Math.max(3 * gp.genes[j].breed + gp.breedsites[gp.genes[j].site.index], 1) + 1;
        }

        if(j != gp.genes.length - 1) {
            ctx.beginPath();
            ctx.fillStyle = "Black";
            ctx.rect(x + offset, y, 3 * this.p.params.map.adjacencymatrix[gp.genes[j].site.index][gp.genes[j+1].site.index], 5);
            ctx.fill();
            offset += 3 * this.p.params.map.adjacencymatrix[gp.genes[j].site.index][gp.genes[j+1].site.index];
        }
        ctx.globalAlpha = 1.0;

    }
}

Renderer.prototype.drawGenome = function (ctx, genome, x, y) {

}

Renderer.prototype.drawAgent = function (ctx, agent, x, y) {
    this.drawGeneplex(ctx, agent.genome.geneplex, x, y);
}

Renderer.prototype.drawPop = function (ctx, pop, index, x, y) {

}

Renderer.prototype.drawSun = function (ctx, x, y, radius) {
    ctx.beginPath();
    var rad = radius/5;
    var elapsed = this.p.elapsed / this.p.params.maxenergy;
    var xx = Math.cos(elapsed * 2 * Math.PI) * radius;
    var yy = Math.sin(elapsed * 2 * Math.PI) * radius;
    ctx.arc(x+ xx, y+yy, rad, 0, 2 * Math.PI, false);
    ctx.fillStyle = "Yellow";
    ctx.fill();
    ctx.font = "20px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(this.p.days, x+6*radius/5, y+10);
}

Renderer.prototype.drawPlot = function (ctx, x, y, lists, scale) {
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

Renderer.prototype.draw = function (ctx) {
    var that = this;
    for (var i = 0; i < this.p.ages.length; i++) {
        if (this.p.ages[i + 1] > 0) {
            ctx.beginPath();
            var red = Math.floor(255);
            var green = Math.floor(192 - this.p.ages[i + 1] * 8);
            var blue = Math.floor(192 - this.p.ages[i + 1] * 8);
            ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
            ctx.rect(10 + 8 * i, 10, 8, 8);
            ctx.fill();
        }
    }
    for (var i = 0; i < 15; i++) {
        ctx.beginPath();
        ctx.strokeStyle = "Black";
        ctx.rect(10 + 80 * i, 10, 80, 8);
        ctx.stroke();
    }
    var scale = 8/Math.ceil(this.p.agents.length/146);
    for (var i = 0; i < this.p.agents.length; i++) {
        //ctx.beginPath();
        //ctx.fillStyle = this.p.agents[this.p.agents.length - 1 - i].lovechild ? "Red" : "Blue";
        //ctx.rect(10 + 4 * i, 22, 4, 8);
        //ctx.fill();
        var agent = this.p.agents[this.p.agents.length - 1 - i];
        ctx.beginPath();
        if (agent.lovechild) {
            var red = Math.floor(255);
            var green = Math.floor(agent.parentrelated * 5);
            var blue = Math.floor(agent.parentrelated * 5);
            ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
        }
        else
            ctx.fillStyle = agent.mutated ? "Black" : "Blue";
        ctx.rect(10 + scale * i, 22, scale, 8);
        ctx.fill();

        ctx.beginPath();
        if (agent.genome.asexual > agent.genome.sexual) {
            var dif = agent.genome.asexual - agent.genome.sexual;
            var red = Math.floor(255);
            var green = Math.floor(255 - dif * 5);
            var blue = Math.floor(255 - dif * 5);
            ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
        }
        else {
            var dif = agent.genome.sexual - agent.genome.asexual;
            var blue = Math.floor(255);
            var green = Math.floor(255 - dif * 5);
            var red = Math.floor(255 - dif * 5);
            ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
        }
        ctx.rect(10 + scale * i, 34, scale, 8);
        ctx.fill();

        ctx.beginPath();
        ctx.globalAlpha = 0.1;
        for (var j = 0; j < agent.births; j++) {
            ctx.fillStyle = "Blue";
            ctx.rect(10 + scale * i, 46, scale, 8);
            ctx.fill();
        }
        for (var j = 0; j < agent.sexbirths; j++) {
            ctx.fillStyle = "Red";
            ctx.rect(10 + scale * i, 46, scale, 8);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        ctx.beginPath();

        var green = Math.floor(255);
        var blue = Math.floor(255 - agent.energy * 3);
        var red = Math.floor(255 - agent.energy * 3);
        ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";

        ctx.rect(10 + scale * i, 58, scale, 8);
        ctx.fill();
    }
    this.drawSiteMap(ctx, this.map, 0, 100, 300, 300);
    this.drawSun(ctx, 1030, 210, 40);

    ctx.beginPath();
    ctx.fillStyle = "Black";
    ctx.rect(980, 270, this.p.deaths * 2, 8);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "Blue";
    ctx.rect(980, 282, this.p.dayasex / this.p.params.numsites * 200, 8);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = "Black";
    ctx.rect(980, 282, this.p.slept / this.p.params.numsites * 200, 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = "Red";
    ctx.rect(980, 294, this.p.daysex / this.p.params.numsites * 200, 8);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = "Black";
    ctx.rect(980, 294, this.p.slept / this.p.params.numsites * 200, 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = "Green";
    ctx.rect(980, 306, this.p.harvest / this.p.params.numsites * 200, 8);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "Black";
    ctx.rect(980, 306, this.p.overharvest / this.p.params.numsites * 200, 8);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = "Black";
    ctx.rect(980, 306, 200, 8);
    ctx.stroke();

    for (var i = 0; i < this.p.parents.length; i++) {
        ctx.beginPath();
        ctx.fillStyle = "Red";
        var value = this.p.parents[i];
        value = Math.log(value)/Math.log(2)*10;
        ctx.rect(980 + 2*i, 418, 2, -Math.min(100, value));
        ctx.fill();

        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "Black";
        value -= 100;
        if (value > 600) value = 600;
        while (value > 0) {
            ctx.beginPath();
            ctx.rect(980 + 2 * i, 418, 2, -Math.min(100, value));
            ctx.fill();
            value -= 100;
        }
        ctx.globalAlpha = 1;
    }

    for (var i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.fillStyle = i % 2 === 0 ? "Black" : "LightGrey";
        ctx.rect(980 + 20 * i, 418, 20, 2);
        ctx.fill();
    }
    //this.drawPlot(ctx, 10, 600, this.p.energys);
    //this.drawPlot(ctx, 10, 680, this.p.res);
    if (this.p.params.clusters) {
        this.drawPlot(ctx, 10, 600, this.related, 16);
        var offset = 0;
        for (var i = 0; i < this.clusters.length; i++) {
            ctx.beginPath();
            ctx.strokeStyle = "Red";
            ctx.lineWidth = 2.0;
            var step = this.clusters[i].length;
            ctx.rect(10 + offset, 600 + offset, step * 16, step * 16);
            ctx.stroke();
            offset += step * 16;
            ctx.font = "18px Arial";
            ctx.fillStyle = "black";
            ctx.fillText("Clusters " + this.clusters.length, 340, 620);
        }
    }
    for (var i = 0; i < Math.min(this.agents.length, 72); i++) {
        this.agents[i].genome.geneplex.gene = this.agents[i].gene;
        this.drawAgent(ctx, this.agents[i], 10, 422 + i * 8);
    }
    ctx.font = "18px Arial";
    ctx.fillStyle = "black";
    ctx.fillText("Agents " + this.p.agents.length, 980, 100);
    ctx.fillText("Births(A/S) " + this.p.births + "/" +this.p.sexbirths, 980, 120);
    ctx.fillText("Gen " + this.p.gen.max + "/" + Math.floor(this.p.gen.average) + "/" + this.p.gen.min, 980, 140);
    var a = this.p.agents[0];
    //ctx.fillText("Age " + a.age + " Energy " + Math.floor(a.energy) + " Births(A/S) " + a.births + "/"
    //    + a.sex + " Asexual " + a.genome.asexual + " Sexual " + a.genome.sexual, 700, 490);
    //ctx.fillText("Resources " + this.p.resources.max + "/" + Math.floor(this.p.resources.average * 100) / 100 + "/" + this.p.resources.min + " Energy " + Math.floor(this.p.energy.max * 100) / 100 + "/" + Math.floor(this.p.energy.average * 100) / 100 + "/" + Math.floor(this.p.energy.min * 100) / 100, 700, 510);
}

// Fisher and Nutters simulation code below

var contains = function (lst, obj) {
    for (var i =0; lst != null && i < lst.length; i++){
        if(lst[i] === obj)
            return true;
    }
    return false;
}

var indexof = function (lst, obj) {
    for (var i =0; lst != null && i < lst.length; i++){
        if(lst[i] === obj)
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

var IntervalList = function () {
    this.ints = [];
}

IntervalList.prototype.insert = function (item) {
    var i = 0;
    while (i < this.ints.length && this.ints[i].start < item.start){
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
        if(this.ints[i].site === this.ints[index].site) overlaps.push(this.ints[i].agent);
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
        if(contains(this.perm, other.perm[score]))
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

    this.count = 0;
    this.failcount = 0;
    this.yield = yield;

    this.sex = 0;
    this.asex = 0;
    this.slept = 0;
}


GatheringSite.prototype.day = function () {
    this.count = 0;
    this.failcount = 0;
}

GatheringSite.prototype.cost = function (perm) {
    return this.perm.compare(perm);
}

GatheringSite.prototype.gather = function (perm) {
    if(this.count++ < this.yield*this.reward)
        return { cost: this.perm.compare(perm), reward: this.reward };
    return { cost: this.perm.compare(perm), reward: 0, fail: this.failcount++ };
}



var SiteMap = function (params) {
    this.params = params;
    this.sitelist = [];
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
        var reward = Math.floor(Math.random() * this.params.rewardmax + 1);
        var x = Math.random();
        var y = Math.random();
        this.sitelist.push(new GatheringSite(this.params.permsize, reward, this.params.yield, type, i, x, y));
    }
    for (var i = 0; i < this.params.numsites; i++) {
        for (var j = i + 1; j < this.params.numsites; j++) {
            this.adjacencymatrix[i][j] = distance(this.sitelist[i], this.sitelist[j]) > this.params.reach ? 0 : 5 * distance(this.sitelist[i], this.sitelist[j]);
            this.adjacencymatrix[j][i] = distance(this.sitelist[i], this.sitelist[j]) > this.params.reach ? 0 : 5 * distance(this.sitelist[i], this.sitelist[j]);
        }
    }
}

SiteMap.prototype.day = function() {
    this.visited = [];
    for (var i = 0; i < this.params.numsites; i++) {
        this.visited.push([]);
        var vrow = this.visited[i];
        for (var j = 0; j < this.params.numsites; j++) {
            vrow.push(0);
        }
    }
}

var Gene = function (site, perm, params) {
    this.type = "Gather";
    this.site = site;
    this.params = params;
    this.perm = perm;
    this.breed = 0;
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
    if (this.perm != null) this.perm.mutate();
    if (Math.random() > this.params.mutationrate) {
        if (Math.random() > 0.5 || this.breed === 0) this.breed += 0.1;
        else this.breed -= 0.1;
    }
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
    for (var i = 0; i < this.params.numsites; i++) {
        this.breedsites.push(0);
    }

    var length = 0;
    var gene = new Gene(this.params.map.sitelist[Math.floor(Math.random()*this.params.map.sitelist.length)],new Perm(this.params.permsize), this.params);
    length += gene.cost();
    this.genes.push(gene);

    while (length < params.maxenergy*4) {
        var adj = [];
        for (var i = 0; i < params.map.sitelist.length; i++) {
            if (params.map.adjacencymatrix[gene.site.index][i] !== 0) adj.push(i);
        }
        var j = adj[Math.floor(Math.random() * adj.length)];
        gene = new Gene(this.params.map.sitelist[j], new Perm(this.params.permsize), this.params);
        length += gene.cost();
        this.genes.push(gene);
    }
}

Geneplex.prototype.mutate = function (){
    // mutate random genes in the list
    var num = this.genes.length * this.params.mutationrate;
    for (var i = 0; i < num; i++) {
        var index = Math.floor(Math.random() * this.genes.length);
        this.genes[index].mutate();
    }

    num = this.params.numsites * this.params.mutationrate;

    for (var i = 0; i < num; i++) {
        var index = Math.floor(Math.random() * this.breedsites.length);
        if (Math.random() > 0.5 || this.breedsites[index] === 0) this.breedsites[index] += 0.1;
        else this.breedsites[index] -= 0.1;
    }

    if (Math.random() < this.params.mutationrate) {
        // grow 

        // find a random cycle
        var sites = [];
        var gindex = [];
        var start = -1;
        var end = -1;
        for (var i = Math.floor(Math.random()*this.genes.length); i < this.genes.length; i++) {
            start = indexof(sites, this.genes[i].site.index);
            //console.log(start);
            if (start === -1) {
                sites.push(this.genes[i].site.index);
            }
            else {
                if (sites.length - start < 3) sites.push(this.genes[i].site.index);
                else {
                    start = i - sites.length + start;
                    end = i - 1;
                    break;
                }
            }
        }

        if (start != -1) {
            //var cycle = "";
            //console.log("cycle found " + start + " " + end);
            //for (var i = 0; i < this.genes.length; i++) {
            //    cycle += this.genes[i].site.index;
            //}
            //console.log(cycle);
            // //delete it

            var deleted = Math.random() > 0.5 ? true : false;
            //if (this.genes.length > 1000) deleted = true;

            //if (Math.random() > (1000-this.genes.length)/1000){
            //    deleted = true;
            //}

            if (deleted) {
                if (Math.random() > 0.5) {
                    //console.log("deleted " + (end - start + 1));
                    this.genes.splice(start, end - start + 1);
                }
                else {
                    var rand = Math.floor(Math.random() * Math.min(this.params.mutationlength, this.genes.length)) + 1;
                    //console.log("*deleted " + rand);
                    this.genes.splice(0, rand);
                }
            }
            else {
                if (Math.random() > 0.5) {
                    // add it somewhere else
                    var indexes = [];
                    for (var i = 0; i < this.genes.length; i++) {
                        if (this.genes[i].site.index === this.genes[start].site.index) indexes.push(i);
                    }
                    var insertAt = Math.floor(Math.random() * indexes.length);
                    //console.log("added " + (end - start + 1) + " at " + indexes[insertAt]);
                    var j = end;
                    while (start <= j) {
                        this.genes.splice(indexes[insertAt], 0, this.genes[j].clone());
                        if (indexes[insertAt] > start) j--;
                        else start++;
                    }
                }
                else {
                    var gene = this.genes[this.genes.length - 1];
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
                        this.genes.push(gene);
                    }
                }
            }
            //cycle = "";
            //for (var i = 0; i < this.genes.length; i++) {
            //    cycle += this.genes[i].site.index;
            //}
            //console.log(cycle);
        }
        else {
            // add a few genes to the end
            var gene = this.genes[this.genes.length - 1];
            var rand = Math.floor(Math.random * this.params.mutationlength) + 1;
            for (var k = 0; k < rand; k++) {
                var adj = [];
                for (var i = 0; i < this.params.map.sitelist.length; i++) {
                    if (this.params.map.adjacencymatrix[gene.site.index][i] === 1) adj.push(i);
                }
                var j = adj[Math.floor(Math.random() * adj.length)];
                gene = new Gene(this.params.map.sitelist[j], new Perm(this.params.permsize), this.params);
                this.genes.push(gene);
            }
        }
        return true;
    }
    return false;
}

Geneplex.prototype.lcs = function (geneplex) {
    var s = [];
    var n = this.genes.length;
    var m = geneplex.genes.length;
    for (var i = 0; i < n+1; i++) {
        s.push([]);
        for (var j = 0; j < m+1; j++) {
            s[i].push(0);
        }
    }

    for (var i = 1; i < n+1; i++) {
        for (var j = 1; j < m+1; j++) {
            if (this.genes[i-1].site.index === geneplex.genes[j-1].site.index) {
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
        if (that.genes[i-1].site.index === geneplex.genes[j-1].site.index) {
            var list = recover(i - 1, j - 1);
            list.push({ i: i-1, j: j-1 });
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

    return { max: s[n][m], list: recover(n,m) };
}

Geneplex.prototype.crossover = function (geneplex) {
    // add lcs dp solution here for crossover
    var crosspoints = this.lcs(geneplex);
    var toReturn = (Math.max(this.genes.length, geneplex.genes.length) - crosspoints.max);

    var genes = [];
    var mother = Math.random() > 0.5 ? true : false;
    var i = 0;
    var j = 0;
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
    return gp;
}

Geneplex.prototype.reverse = function () {
    var gp;
    gp.genes = [];
    for (var i = 0; i < this.genes.length; i++) {
        gp.genes.push(this.genes[this.genes.length - 1 - i]);
    }
    this.genes = gp.genes;
}

Geneplex.prototype.findBestDay = function (currentSite, energy, breeding) {
    var counts = [];
    var bestday = { index: -1, reward: -1 };

    var rewind = false;
    for (var i = 0; i >= 0; rewind ? i-- : i++) {
        if (i === this.genes.length) {
            if (i === 0||i===1) { console.log("panic!"); break; }
            i -= 2;
            rewind = true;
        }
        // if we have counts on the go
        if (counts.length > 0) {
            var breedcost = breeding === true ? (this.genes[i].breed + this.breedsites[this.genes[i].site.index]) : 0;
            var edgecost = this.params.map.adjacencymatrix[this.genes[rewind ? i + 1 : i - 1].site.index][this.genes[i].site.index];
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
                        counts[j].indexlist.push({ geneindex: i, index: this.genes[i].site.index, start: this.params.maxenergy + 1 });
                        bestday = counts[j];
                    }
                    if (bestday.reward === counts[j].reward && bestday.energy > counts[j].energy) {
                        counts[j].last = i - 1;
                        counts[j].indexlist.push({ geneindex: i, index: this.genes[i].site.index, start: this.params.maxenergy + 1 });
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
                intervals: breedcost === 0 ? [] : [{ start: this.genes[i].cost(), end: this.genes[i].cost() +  breedcost, site: this.genes[i].site.index }],
                indexlist: [{ geneindex: i, index: this.genes[i].site.index, start: 0 }],
                energy: this.genes[i].cost() + breedcost,
                reward: this.genes[i].reward(),
                rewind: rewind
            });
        }
    }
    // if there are more counts to finish
    rewind = false;
    for (var i = 1; counts.length > 0 && i < this.genes.length; i++) {
        // if we have counts on the go
        //if (i >= this.genes.length) console.log("i: " + i + "length: " + this.genes.length);
        if (counts.length > 0) {
            var breedcost = breeding === true ? (this.genes[i].breed + this.breedsites[this.genes[i].site.index]) : 0;
            var edgecost = this.params.map.adjacencymatrix[this.genes[rewind ? i + 1 : i - 1].site.index][this.genes[i].site.index];
            var cost = this.genes[i].cost() + edgecost + breedcost;

            for (var j = 0; j < counts.length; j++) {
                if (counts[j].energy + cost <= energy) {
                    counts[j].indexlist.push({ geneindex: i,index: this.genes[i].site.index, start: counts[j].energy });
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
                        counts[j].indexlist.push({ geneindex: i,index: this.genes[i].site.index, start: this.params.maxenergy + 1 });
                        bestday = counts[j];
                    }
                    if (bestday.reward === counts[j].reward && bestday.energy > counts[j].energy) {
                        counts[j].last = i - 1;
                        counts[j].indexlist.push({ geneindex: i,index: this.genes[i].site.index, start: this.params.maxenergy + 1 });
                        bestday = counts[j];
                    }
                    counts.splice(j--, 1);
                }
            }
        }
    }
    var ints = 0;
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
    return bestday;
}

Geneplex.prototype.length = function () {
    var length = 0;
    for (var i = 0; i < this.genes.length; i++) {
        length += this.genes[i].cost();
    }
    return length;
}

Geneplex.prototype.fitness = function () {
    var fitness = 0;
    for (var i = 0; i < this.genes.length; i++) {
        fitness += this.genes[i].reward();
    }
    //fitness += (50 - this.length())*0.01;
    return fitness;
}

var Genome = function (params) {
    this.params = params;
    this.geneplex = new Geneplex(this.params);

    this.asexual = this.params.asexual;
    this.sexual = this.params.sexual;
}

Genome.prototype.mutate = function() {
    if (Math.random() < this.params.mutationrate) {
        Math.random() > 0.5 ? this.asexual++ : this.asexual--;
        this.asexual = this.asexual < this.params.maxenergy / 4 ? this.params.maxenergy / 4 : this.asexual;
    }
    if (Math.random() < this.params.mutationrate) {
        Math.random() > 0.5 ? this.sexual++ : this.sexual--;
        this.sexual = this.sexual < 0 ? 0 : this.sexual;
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

Genome.prototype.clone = function() {
    var g = new Genome(this.params);

    g.geneplex = this.geneplex.clone();
    g.asexual = this.asexual;
    g.sexual = this.sexual;

    return g;
}

function Agent(params) {
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
}

Agent.prototype.day = function () {
    this.age++;

    if (this.bestday && this.bestday.index !== -1) {
        while (this.lastindex < this.bestday.indexlist.length - 1) {
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

    this.bestday = this.genome.geneplex.findBestDay(this.site, Math.min(this.energy,this.params.maxenergy), this.breeding);
    this.resources = 0;
    this.lastindex = 0;
}

Agent.prototype.update = function () {
    var i = 0;
    var delay = (this.params.maxenergy - this.bestday.energy)/2;

    if (this.bestday.index !== -1) {
        while (this.elapsed > this.bestday.indexlist[i++].start + delay);
        i--;
        if (i > this.lastindex) {
            for (var j = this.lastindex; j < i; j++) {
                var index = this.bestday.indexlist[j].index;
                var lastindex = j === 0 ? index : this.bestday.indexlist[j-1].index;
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

Agent.prototype.clone = function () {
    var a = new Agent(this.params);
    a.genome = this.genome.clone();
    a.site = this.site;
    a.gen = this.gen;
    return a;
}

Agent.prototype.asex = function () {
    this.births++;
    this.params.map.sitelist[this.site].asex++;
    var newagent = this.clone();

    newagent.mutate();
    newagent.gen++;
    newagent.day();

    this.energy -= this.params.maxenergy;
    this.breeding = false;

    return newagent;
}

Agent.prototype.sex = function (father) {
    var mother = this;

    mother.sexbirths++;
    father.sexbirths++;

    var newagent = mother.clone();
    newagent.crossover(father);
    newagent.gen = Math.max(mother.gen, father.gen) + 1;
    newagent.lovechild = true;
    newagent.day();

    mother.energy -= this.params.maxenergy / 2;
    father.energy -= this.params.maxenergy / 2;

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

    this.energys = [];
    this.res = [];
    this.ages = [];
    this.parents = [];
    this.related = [];

    for (var i = 0; i < this.params.numagent; i++) {
        var a = new Agent(this.params);
        this.agents.push(a);
    }

    //for (var i = 0; i < this.params.numagent; i++) {
    //    this.related.push([]);
    //    for (var j = 0; j < this.params.numagent; j++) {
    //        this.related[i].push(0);
    //    }
    //}

    //for (var i = 0; i < this.params.numagent; i++) {
    //    this.related[i][i] = 0;
    //    for (var j = i + 1; j < this.params.numagent; j++) {
    //        var value = Math.min(this.agents[i].genome.geneplex.genes.length,this.agents[j].genome.geneplex.genes.length) - this.agents[i].genome.geneplex.lcs(this.agents[j].genome.geneplex).max;
    //        this.related[i][j] = value;
    //        this.related[j][i] = value;
    //    }
    //}
    //console.log(this.related);

}

Population.prototype.day = function () {
    this.days++;
    this.elapsed -= this.params.maxenergy;
    this.dayasex = 0;
    this.daysex = 0;
    this.slept = 0;
    this.deaths = 0;
    this.harvest = 0;
    this.overharvest = 0;
    // for rendering
    var sites = [];
    var allIntervals = new IntervalList();

    for (var i = 0; i < this.params.map.sitelist.length; i++) {
        this.params.map.sitelist[i].slept = 0;
        sites.push([]);
        this.params.map.sitelist[i].sex = 0;
        this.params.map.sitelist[i].asex = 0;
    }

    this.gen = { max: 0, min: this.days, average: 0 };
    this.age = { max: 0, min: this.days, average: 0 };
    this.energy = { max: 0, min: 4 * this.params.maxenergy, average: 0 };
    this.ages = [];
    for (var i = 0; i < 200; i++) this.ages.push(0);
    this.resources = { max: 0, min: 4 * this.params.maxenergy, average: 0 };
    for (var i = 0; i < this.agents.length; i++) {
        var agent = this.agents[i];
        agent.day();

        this.ages[agent.age-1]++;
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

        if (agent.breeding) {
            var ints = agent.bestday.intervals;
            sites[agent.site].push(agent);

            for (var j = 0; j < ints.length; j++) {
                var interval = ints[j];
                interval.agent = i;

                allIntervals.insert(interval);
            }
        }

        if (agent.energy < 0 || agent.bestday.index === -1) {
            this.deaths++;
            agent.dead = true;
            // agent dead
            //console.log("DEATH\tage: " + agent.age + "\tbirths: " + agent.births + "\tgen: " + agent.gen + "\tlength: "
            //+ agent.genome.geneplex.genes.length);
            this.agents.splice(i, 1);
            //this.related.splice(i, 1);
            //for (var j = 0; j < this.related.length; j++) this.related[j].splice(i, 1);
            i--;
        }
    }

    for (var i = 0; i < allIntervals.ints.length; i++) {
        var interval = allIntervals.ints[i];
        var agent = this.agents[interval.agent];
        if (agent.breeding && this.params.sexualon && agent.energy > agent.genome.sexual + this.params.maxenergy) {
            var partners = allIntervals.findNextOverlap(i);
            var j = 0;
            while (j < partners.length) {
                var other = this.agents[partners[j]];
                if (other.breeding && other.energy > other.genome.sexual + this.params.maxenergy) {
                    this.params.map.sitelist[interval.site].sex++;
                    this.sexbirths++;

                    var newagent = agent.sex(other);

                    while (this.parents.length < Math.min(100, newagent.parentrelated + 1)) this.parents.push(0);
                    this.parents[Math.min(100, newagent.parentrelated)]++;

                    //this.related.push([]);
                    //for (var k = 0; k < this.agents.length; k++) {
                    //    var value = Math.min(newagent.genome.geneplex.genes.length, this.agents[k].genome.geneplex.genes.length) - newagent.genome.geneplex.lcs(this.agents[k].genome.geneplex).max;
                    //    this.related[this.related.length - 1].push(value);
                    //    this.related[k].push(value);
                    //}
                    //this.related[this.related.length - 1].push(0);

                    this.agents.push(newagent);
                    break;
                }

                j++;
            }
        }
    }

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

        //                //this.related.push([]);
        //                //for (var k = 0; k < this.agents.length; k++) {
        //                //    var value = Math.min(newagent.genome.geneplex.genes.length, this.agents[k].genome.geneplex.genes.length) - newagent.genome.geneplex.lcs(this.agents[k].genome.geneplex).max;
        //                //    this.related[this.related.length - 1].push(value);
        //                //    this.related[k].push(value);
        //                //}
        //                //this.related[this.related.length - 1].push(0);

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
            var newagent = agent.asex();

            //this.related.push([]);
            //for (var k = 0; k < this.agents.length; k++) {
            //    var value = Math.min(newagent.genome.geneplex.genes.length, this.agents[k].genome.geneplex.genes.length) - newagent.genome.geneplex.lcs(this.agents[k].genome.geneplex).max;
            //    console.log("k: " + k + " val: " + value);
            //    this.related[this.related.length - 1].push(value);
            //    this.related[k].push(value);
            //}
            //this.related[this.related.length - 1].push(0);

            //console.log(this.related);

            this.agents.push(newagent);
        }
    }


    for (var i = 0; i < this.params.map.sitelist.length; i++) {
        var site = this.params.map.sitelist[i];

        if (site.count > 0) this.harvest++;
        if (site.count > site.yield * site.reward) this.overharvest++;
        if (site.slept > 0) this.slept++;
        if (site.sex > 0) this.daysex++;
        if (site.asex > 0) this.dayasex++;


        site.day();
    }
    this.params.map.day();
}

Population.prototype.update = function () {
    var speed = document.getElementById('speed').value;
    this.elapsed += this.params.engine.clockTick*speed;
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

ASSET_MANAGER.queueDownload("./img/FishSite.png");
ASSET_MANAGER.queueDownload("./img/NutSite.png");
ASSET_MANAGER.queueDownload("./img/Hut.png");
ASSET_MANAGER.queueDownload("./img/FishNutter.png");

ASSET_MANAGER.downloadAll(function () {
    console.log("starting up da sheild");
    var canvas = document.getElementById('gameWorld');
    var play = document.getElementById('play');
    var restart = document.getElementById('restart');
    var simStart = false;

    var ctx = canvas.getContext('2d');
    var gameEngine = new GameEngine();

    var fnn = {};
    fnn.engine = gameEngine;

    var p;
    var startNewSim = function () {
        fnn.numagent = parseInt(document.getElementById('numagent').value);
        fnn.maxenergy = parseInt(document.getElementById('maxenergy').value);
        fnn.asexual = parseInt(document.getElementById('asexual').value);
        fnn.sexual = parseInt(document.getElementById('sexual').value);
        fnn.asexualon = document.getElementById('asexualon').checked;
        fnn.sexualon = document.getElementById('sexualon').checked;
        fnn.resourcefactor = parseInt(document.getElementById('resourcefactor').value);
        fnn.restcost = parseFloat(document.getElementById('restcost').value);
        fnn.agecost = parseFloat(document.getElementById('agecost').value);
        fnn.clusters = document.getElementById('clusters').checked;
        fnn.permsize = parseInt(document.getElementById('permsize').value);
        fnn.rewardmax = parseInt(document.getElementById('rewardmax').value);
        fnn.numsites = parseInt(document.getElementById('numsites').value);
        fnn.reach = parseFloat(document.getElementById('reach').value);
        fnn.yield = parseInt(document.getElementById('yield').value);
        fnn.mutationlength = parseInt(document.getElementById('mutationlength').value);
        fnn.mutationrate = parseFloat(document.getElementById('mutationrate').value);
        fnn.clusterthreshold = parseFloat(document.getElementById('clusterthreshold').value);
        fnn.pause = false;
        fnn.map = new SiteMap(fnn);
        console.log(fnn);
        p = new Population(fnn);

        var renderer = new Renderer(p, fnn.map);
        if (gameEngine.entities.length === 1) gameEngine.entities.splice(0, 1);
        gameEngine.addEntity(renderer);
    }

    startNewSim();

   
    play.onclick = function () {
        if (!simStart) {
            gameEngine.init(ctx);
            gameEngine.start();
            simStart = true;
        }
        else {
            fnn.pause = !fnn.pause;
        }
    };

    restart.onclick = function () {
        startNewSim();
    };

});
