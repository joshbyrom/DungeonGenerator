var TileRoom = function (width, height) {
    this.column = undefined;
    this.row = undefined;
    this.width = width;
    this.height = height;

    this.valid = false;
};

TileRoom.prototype.warnIfNotValid = function () {
    if (!this.valid) {
        throw 'Room is not valid, but being treated as valid.';
    }
};

TileRoom.prototype.tryAndPlaceIn = function (map, others, column, row) {
    var right = column + this.width;
    var left = column;

    var bottom = row + this.height;
    var top = row;

    // don't place near edges
    if (left <= 0 || right >= map.width || top <= 0 || bottom >= map.height) {
        console.log('room out of bounds');
        return false;
    }

    this.column = column;
    this.row = row;

    var i = 0, ilen = others.length, other = undefined;
    for (; i < ilen; ++i) {
        other = others[i];

        if (this.collidesWith(other.column, other.row, other.width, other.height)) {
            this.column = undefined;
            this.row = undefined;
            return false;
        }
    }

    this.column = column;
    this.row = row;
    return true;
};

TileRoom.prototype.commit = function (map) {
    if (!this.column || !this.row) {
        this.warnIfNotValid();
    }

    var i = this.column;
    var ilen = i + this.width;

    var j = this.row;
    var jlen = j + this.height;

    var currentTile = undefined;
    for (; i < ilen; ++i) {
        for (j = this.row; j < jlen; ++j) {
            currentTile = map.getTileAt(i, j);
            currentTile.tag({
                room: this,
                wall: currentTile.x === this.column || currentTile.x === (this.column + this.width - 1) ||
                       currentTile.y === this.row || currentTile.y === (this.row + this.height - 1)
            });
        }
    }

    this.valid = true;
    return this;
}

TileRoom.prototype.getTiles = function (map) {
    this.warnIfNotValid();

    var tiles = [];

    var i = this.column;
    var ilen = i + this.width;

    var j = this.row;
    var jlen = j + this.height;

    var currentTile = undefined;
    for (; i < ilen; ++i) {
        for (j = this.row; j < jlen; ++j) {
            currentTile = map.getTileAt(i, j);
            tiles.push(currentTile);
        }
    }

    return tiles;
}

TileRoom.prototype.getCenter = function (map) {
    this.warnIfNotValid();

    var column = Math.floor(this.width * 0.5 + this.column);
    var row = Math.floor(this.height * 0.5 + this.row);

    return map.getTileAt(column, row);
};

TileRoom.prototype.getWalls = function (map) {
    this.warnIfNotValid();

    var walls = [];

    var counter = 0;
    var limit = 0;

    var column = this.column;
    var clen = this.column + this.width;
    for (; column <= clen; column += this.width) {
        limit = this.row + this.height;
        for (counter = this.row; counter < limit; ++counter) {
            walls.push(map.getTileAt(column, counter));
        }
    }

    var row = this.row;
    var rlen = this.row + this.height;
    for (; row <= rlen; row += this.height) {
        limit = this.column + this.width;
        for (counter = this.column; counter < limit; ++counter) {
            walls.push(map.getTileAt(counter, row));
        }
    }

    return walls;
};

TileRoom.prototype.collidesWith = function(x, y, width, height) {
    return !(this.column              > x + width  || 
             this.column + this.width < x          || 
             this.row                 > y + height || 
             this.row + this.height   < y);
};