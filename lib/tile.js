var Tile = function (map, x, y, w, h, cost) {
    this.x = x || 0;
    this.y = y || 0;

    this.w = w || 0;
    this.h = h || 0;

    this.tags = {};

    this.avgSize = (this.w + this.h) * 0.5;
    this.avgSizeSq = this.avgSize * this.avgSize;

    this.cost = cost || Math.random();
    this.terrainMod = 1;

    this.tileMap = map || undefined;
};

Tile.prototype.draw = function (context, x, y) {
    var red = parseInt(255 * this.cost);
    var green = parseInt(255 - 255 * this.cost);

    context.beginPath();
    if (this.tags.room) {
        context.fillStyle = "gray";
    } else {
        context.fillStyle = "rgb(" + red + ", " + green + ", 0)";
    }

    if (this.tags.wall && !this.tags.door) {
        context.fillStyle = 'black';
    }

    if (this.tags.hallway) {
        context.fillStyle = 'gray';
    }

    context.rect(x, y, this.w, this.h);
    context.fill();
};

Tile.prototype.getGlobalX = function () {
    return this.x * this.w;
};

Tile.prototype.getGlobalY = function () {
    return this.y * this.h;
};

Tile.prototype.drawGlobal = function (context) {
    this.draw(context, this.x * this.w, this.y * this.h);
};

Tile.prototype.isPassable = function() {
    return this.cost <= 0.89;
};

Tile.prototype.getTileAbove = function () {
    return this.tileMap.getTileAt(this.x, this.y - 1);
};

Tile.prototype.getTileBelow = function () {
    return this.tileMap.getTileAt(this.x, this.y + 1);
};

Tile.prototype.getTileLeft = function () {
    return this.tileMap.getTileAt(this.x - 1, this.y);
};

Tile.prototype.getTileRight = function () {
    return this.tileMap.getTileAt(this.x + 1, this.y);
};

Tile.prototype.toString = function () {
    return 'Tile at (' + this.x + ', ' + this.y + ')';
};

Tile.prototype.clearTags = function () {
    this.tags = {};
};

Tile.prototype.tag = function (tag, value) {
    this.tags[tag] = value;
    return this;
};

Tile.prototype.tagged = function (tag) {
    if (!tag) {
        return this.tags != undefined;
    } else {
        if (this.tags.hasOwnProperty(tag)) {
            return this.tags[tag];
        } else {
            return false;
        }
    }
};

Tile.prototype.getCostDescription = function () {
    if(this.cost < 0.10) {
      return "There is almost no cost to traveling over this tile.";
    } else if(this.cost < 0.20) {
      return "There is a minor cost to travel over this tile.";
    } else if(this.cost < 0.30) {
      return "There is some penalty for traveling over this tile.";
    } else if(this.cost < 0.5) {
      return "This is a costly tile to travel over.";
    } else if(this.cost < 0.7) {
      return "This tile should be avoided.";
    } else if(this.cost < 0.9) {
      return "This tile is nearly impassable.";
    }
    
    return "This tile cannot be traveled on, completely impassable!";
};
