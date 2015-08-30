var TileMap = function (width, height, tileWidth, tileHeight) {
    this.width = width || 50;
    this.height = height || 50;

    this.tileWidth = tileWidth || 16;
    this.tileHeight = tileHeight || 16;

    this.tiles = [];

    this.totalElements = this.width * this.height;
};

TileMap.prototype.generate = function (f) {
    var currentX = 0,
        currentY = 0;

    for (; currentX < this.width; ++currentX) {
        for (currentY = 0; currentY < this.height; ++currentY) {
            this.tiles.push(f(this, currentX, currentY));
        }
    }
};

TileMap.prototype.draw = function (context) {
    var current = 0, length = this.tiles.length;
    for (; current < length; ++current) {
        this.tiles[current].drawGlobal(context);
    }
};

TileMap.prototype.coordsToTile = function (x, y) {
    var col = parseInt(x / this.tileWidth);
    var row = parseInt(y / this.tileHeight);

    col = Math.min(this.width, col);
    col = Math.max(0, col);

    row = Math.min(this.height, row);
    row = Math.max(0, row);

    return this.getTileAt(col, row);
};

TileMap.prototype.tileExists = function (x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
};

TileMap.prototype.toIndex = function (x, y) {
    return x * this.height + y;
};

TileMap.prototype.getTileAt = function (x, y) {
    var gx = x % this.width;
    var gy = y % this.height;

    gx += gx < 0 ? this.width : 0;
    gy += gy < 0 ? this.height : 0;

    var index = gx * this.height + gy;
    return this.tiles[index];
};

TileMap.prototype.getRandomTile = function () {
    return this.tiles[Math.floor(Math.random()*this.totalElements)];
};

TileMap.prototype.getNumberOfColumns = function () { return this.width; }
TileMap.prototype.getNumberOfRows = function() { return this.height; }