var Graph = function (map) {
    this.tileMap = map;
    this.nodes = [];

    this.numberOfColumns = map.getNumberOfColumns();
    this.numberOfRows = map.getNumberOfRows();
};

Graph.prototype.generate = function (f) {
    var currentX = 0,
        currentY = 0;

    var tile;
    for (; currentX < this.numberOfColumns; ++currentX) {
        for (currentY = 0; currentY < this.numberOfRows; ++currentY) {
            tile = this.tileMap.getTileAt(currentX, currentY);

            this.nodes.push(f(this, tile, currentX, currentY));
        }
    }
};

Graph.prototype.toIndex = function (x, y) {
    return x * this.numberOfRows + y;
};

Graph.prototype.getNode = function (tile) {
    var index = this.toIndex(tile.x, tile.y);
    var result = this.nodes[index];
    return result;
};

Graph.prototype.getNodeAt = function (x, y) {
    if (x >= 0 && x < this.numberOfColumns && y >= 0 && y < this.numberOfRows) {
        var index = this.toIndex(x, y);
        var result = this.nodes[index];
        return result;
    } else {
        return undefined;
    }
};