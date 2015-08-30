var Node = function (graph, tile) {
    this.graph = graph;
    this.tile = tile;

    this.parent = undefined;
    this.lastCost = 0;

    this.nodeString = "[Node containing: " + this.tile.toString() + ']';
};

Node.prototype.setParent = function (node) {
    if (node === this) {
        return;
    } else {
        this.parent = node;
    }
};

Node.prototype.getParent = function () {
    return this.parent;
};

Node.prototype.getNeighbors = function () {
    var neighbors = [];

    var above = this.graph.getNodeAt(this.tile.x, this.tile.y - 1);
    var below = this.graph.getNodeAt(this.tile.x, this.tile.y + 1);
    var left =  this.graph.getNodeAt(this.tile.x - 1, this.tile.y);
    var right = this.graph.getNodeAt(this.tile.x + 1, this.tile.y);

    if (above) neighbors.push(above);
    if (below) neighbors.push(below);
    if (left)  neighbors.push(left);
    if (right) neighbors.push(right);

    return neighbors;
};

Node.prototype.getCost = function (other) {
    var xDiff = this.tile.x - other.x;
    var yDiff = this.tile.y - other.y;
    var cost = 0.05 * (xDiff * xDiff + yDiff * yDiff);
    
    this.lastCost = this.tile.cost * 5.0 + cost;
    return this.lastCost;
};

Node.prototype.toString = function () {
    return this.nodeString;
};

Node.prototype.predraw = function (context) {
    var gx = this.tile.getGlobalX(), gy = this.tile.getGlobalY();

    if (this.parent != undefined) {
        var cx = gx + this.tile.w * 0.5;
        var cy = gy + this.tile.h * 0.5;

        var pcx = this.parent.tile.getGlobalX() + this.parent.tile.w * 0.5;
        var pcy = this.parent.tile.getGlobalY() + this.parent.tile.h * 0.5;

        context.beginPath();
        context.moveTo(cx, cy);
        context.lineTo(pcx, pcy);
        context.stroke();
        context.closePath();
    }
};

Node.prototype.draw = function (context, index) {
    var gx = this.tile.getGlobalX(), gy = this.tile.getGlobalY();

    context.beginPath();
    context.strokeStyle = 'white';
    context.fillStyle = 'blue';
    context.rect(gx + 6, gy + 6, this.tile.w - 12, this.tile.h - 12);
    context.fill();
    context.lineWidth = 2;
    context.stroke();
    context.closePath();

    context.beginPath();
    context.fillStyle = 'white';
    context.font = '12pt Calibri';
    context.textAlign = 'center';
    context.closePath();

    var text = '' + parseInt(index);
    context.fillText(text, gx + 16, gy + 22);
    context.closePath();
};

Node.prototype.mouseOverDraw = function (context) {
    var gx = this.tile.getGlobalX(), gy = this.tile.getGlobalY();

    context.beginPath();
    context.strokeStyle = 'yellow';
    context.rect(gx - 1, gy - 1, this.tile.w + 1, this.tile.h + 1);
    context.lineWidth = 2;
    context.stroke();
    context.closePath();
};
