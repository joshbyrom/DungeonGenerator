var TileRoom = function (width, height) {
    this.column = undefined;
    this.row = undefined;
    this.width = width;
    this.height = height;

    this.map = undefined;
    this.valid = false;
};

TileRoom.prototype.warnIfNotValid = function () {
    if (!this.valid) {
        throw 'Room is not valid, but being treated as valid.';
    }
};

TileRoom.prototype.tryAndPlaceIn = function (map, column, row) {
    var ilen = column + this.width;
    var i = column;

    var jlen = row + this.height;
    var j = row;

    var currentTile = undefined;
    for (; i < ilen; ++i) {
        for (; j < jlen; ++j) {
            if (i === 0 || j === 0) return false;
            if (i >= map.width || j >= map.height) return false;

            currentTile = map.getTileAt(i, j);
            if (currentTile.tagged) {
                return false;
            }
        }
    }

    this.column = column;
    this.row = row
    this.map = map;
    return true;
};

TileRoom.prototype.commit = function () {
    var tiles = this.getTiles();

    tiles.forEach(function (element, index, array) {
        console.log('tagging ' + element.toString());
        element.tagged = this;
    }.bind(this));

    this.valid = true;
    return this;
}

TileRoom.prototype.getTiles = function () {
    var tiles = [];

    var i = this.column;
    var ilen = i + this.width;

    var j = this.row;
    var jlen = j + this.height;

    var currentTile = undefined;
    for (; i < ilen; ++i) {
        for (; j < jlen; ++j) {
            currentTile = this.map.getTileAt(i, j);
            tiles.push(currentTile);
        }
    }

    return tiles;
}

TileRoom.prototype.getCenter = function () {
    this.warnIfNotValid();

    var column = Math.floor(this.width * 0.5 + this.column);
    var row = Math.floor(this.height * 0.5 + this.row);

    return this.map.getTileAt(column, row);
};

TileRoom.prototype.getWalls = function () {
    this.warnIfNotValid();

    var walls = [];

    var counter = 0;
    var limit = 0;

    var column = this.column;
    var clen = this.column + this.width;
    for (; column <= clen; column += this.width) {
        limit = this.row + this.height;
        for (counter = this.row; counter < limit; ++counter) {
            walls.push(this.map.getTileAt(column, counter));
        }
    }

    var row = this.row;
    var rlen = this.row + this.height;
    for (; row <= rlen; row += this.height) {
        limit = this.column + this.width;
        for (counter = this.column; counter < limit; ++counter) {
            walls.push(this.map.getTileAt(counter, row));
        }
    }

    return walls;
};