var Demo = function (columns, rows, tilesize) {
    this.columns = columns || 32;
    this.rows = rows || 24;

    this.tileSize = tilesize || 32;

    this.sWidth = this.tileSize * this.columns;
    this.sHeight = this.tileSize * this.rows;

    this.map = new TileMap(this.columns, this.rows, this.tileSize, this.tileSize);
    this.map.generate(function (map, x, y) {
        return new Tile(map, x, y, tilesize, tilesize);
    });

    this.firstTile = undefined;
    this.lastTile = undefined;

    this.graph = new Graph(this.map);
    this.graph.generate(function (graph, tile, x, y) {
        return new Node(graph, tile);
    });

    this.rooms = [];
    this.doors = [];
    this.paths = [];

    this.averageRoomSize = 8;
    this.roomVariance = 0.5;
    this.numberOfRooms = 10;

    this.pathfinder = new PathFinder(this.graph);

    this.updatedThisFrame = true;
    this.updateDelta = 0;
    this.updateLastUpdateTime = 0;
    this.updateThreshold = 5000;

    this.paused = false;
    this.finished = false;
};

Demo.prototype.generateRooms = function () {
    this.rooms = [];
    this.doors = [];
    this.paths = [];

    var len = this.numberOfRooms;
    var counter = 0;

    var max = Math.floor(this.averageRoomSize + (this.averageRoomSize * (1 - this.roomVariance))),
        min = Math.floor(Math.max(3, max * this.roomVariance));

    var room = undefined,
        roomX = 0, roomY = 0,
        roomWidth = 0, roomHeight = 0;

    var tile = undefined;

    var tries = 0, maxRetries = 40;
    for (; counter < len && tries < maxRetries; ++counter) {
        roomWidth = Math.floor(Math.random() * (max - min)) + min;
        roomHeight = Math.floor(Math.random() * (max - min)) + min;

        room = new TileRoom(roomWidth, roomHeight);
        tile = this.map.getRandomTile();

        roomX = Math.floor(tile.x - roomWidth * 0.5);
        roomY = Math.floor(tile.y - roomHeight * 0.5);

        if (room.tryAndPlaceIn(this.map, this.rooms, roomX, roomY)) {
            room.commit(this.map);

            this.rooms.push(room);
        } else {
            ++tries;
            --counter;
        }
    }
};

Demo.prototype.generateDoor = function (room) {
    var currentDoor = room.getRandomWall(this.map);
    room.addDoor(currentDoor);

    this.doors.push(currentDoor);

    return currentDoor;
};

Demo.prototype.shuffle = function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

Demo.prototype.generatePaths = function () {
    for (var i = 0; i < this.rooms.length; ++i) {
        var room1 = this.rooms[i];

        var nextIndex = i + 1;
        if (nextIndex >= this.rooms.length) {
            nextIndex = 0;
        }
        var room2 = this.rooms[nextIndex]

        var door1 = this.generateDoor(room1);
        var door2 = this.generateDoor(room2);

        var path = this.createPath(door1, door2);
        for (var j = 0; j < path.length; ++j) {
            var tile = path[j].tile;
            if (!tile.tagged('door')) {
                tile.tag('hallway', true);
                tile.cost = 0;

                this.paths.push(tile);
            }
        }
    }
};

Demo.prototype.closeInPaths = function () {
    this.paths.forEach(function (element, index, array) {
        var tile = element.getTileAbove();
        if (!(tile.tagged('room') || tile.tagged('hallway'))) {
            tile.tag('wall', true)
        }

        tile = element.getTileBelow();
        if (!(tile.tagged('room') || tile.tagged('hallway'))) {
            tile.tag('wall', true)
        }

        tile = element.getTileLeft();
        if (!(tile.tagged('room') || tile.tagged('hallway'))) {
            tile.tag('wall', true)
        }

        tile = element.getTileRight();
        if (!(tile.tagged('room') || tile.tagged('hallway'))) {
            tile.tag('wall', true)
        }
    }.bind(this));
}

Demo.prototype.createPath = function (start, end) {
    this.path = this.pathfinder.findPath(start, end);
    return this.path;
};

Demo.prototype.update = function () {
    var i = 0, len = this.rooms.length;
    for (; i < len; ++i) {
        this.rooms[i].getTiles(this.map).forEach(function (element, index, array) {
            element.cost = Math.random();
            element.clearTags();
        });
    }

    var pathTile = undefined;
    len = this.paths.length;
    for (i = 0; i < len; ++i) {
        pathTile = this.paths[i];
        pathTile.cost = Math.random();
        pathTile.clearTags();

        pathTile.getTileAbove().clearTags();
        pathTile.getTileBelow().clearTags();
        pathTile.getTileLeft().clearTags();
        pathTile.getTileRight().clearTags();
    }

    this.generateRooms();
    this.generatePaths();
    this.closeInPaths();
};

Demo.prototype.start = function (canvasName) {
    // gui stuff
    var jQueryCanvas = $("#" + canvasName);
    var canvas = jQueryCanvas.get(0);
    var context = canvas.getContext('2d');

    $('#options').on('panelbeforeopen', function (event) {
        if (this.paused) {
            $('#simulationSwitch').val('off').slider("refresh");
        } else {
            $('#simulationSwitch').val('on').slider("refresh");
        }

        $('#minRoomSlider').val(this.numberOfRooms);
        $('#roomSizeSlider').val(this.averageRoomSize);
        $('#roomSizeVarianceSlider').val(this.roomVariance * 100);
    } .bind(this));

    $('#simulationSwitch').on('change', function (event) {
        var val = $('#simulationSwitch').val();
        if (val === 'on') {
            this.paused = false;
        } else {
            this.paused = true;
        }
    } .bind(this));

    $('#minRoomChanger').on('change', function (event) {
        this.numberOfRooms = $('#minRoomSlider').val();
    } .bind(this));

    $('#roomSizeChanger').on('change', function (event) {
        this.averageRoomSize = parseInt($('#roomSizeSlider').val());
    } .bind(this));

    $('#roomSizeVarianceChanger').on('change', function (event) {
        this.roomVariance = parseFloat($('#roomSizeVarianceSlider').val() / 100);
    } .bind(this));

    // Logic 
    var step = function (timestamp) {
        if (!this.updatedThisFrame === true) {
            this.draw(canvas, context);
        }

        if (!this.paused) {
            this.updateDelta = timestamp - this.updateLastUpdateTime;

            if (this.updateDelta > this.updateThreshold) {
                this.update();

                this.updateLastUpdateTime = timestamp;
                this.updatedThisFrame = true;
            } else {
                this.updatedThisFrame = false;
            }
        }

        if (!this.finished) {
            window.requestAnimationFrame(step);
        }
    } .bind(this);

    this.update();

    window.requestAnimationFrame(step);
};

Demo.prototype.draw = function (canvas, context) {
    this.map.draw(context);
};

var demo = new Demo(100, 78, 10);
demo.start('canvas');