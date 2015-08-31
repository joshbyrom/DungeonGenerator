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

    this.averageRoomSize = 4;
    this.roomVariance = 4;
    this.numberOfRooms = 5;

    this.pathfinder = new PathFinder(this.graph);

    this.updateDelta = 0;
    this.updateLastUpdateTime = 15000;
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

    var max = this.averageRoomSize + this.roomVariance,
        min = Math.max(5, this.averageRoomSize - this.roomVariance);

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

Demo.prototype.generateDoors = function () {
    var i = 0, j = 0, ilen = this.rooms.length;
    var currentRoom = undefined, currentDoor = undefined;

    var numDoors = 0;
    for (; i < ilen; ++i) {
        currentRoom = this.rooms[i];

        numDoors = Math.floor(Math.random() * (4 - 1)) + 1;
        for (j = 0; j < numDoors; ++j) {
            currentDoor = currentRoom.getRandomWall(this.map);
            currentRoom.addDoor(currentDoor);

            this.doors.push(currentDoor);
        }
    }
};

Demo.prototype.generatePaths = function () {
    var next = this.doors.shift();
    var last = this.doors.pop();

    var path = this.createPath(next, last);
    for (var i = 0; i < path.length; ++i) {
        var tile = path[i].tile;
        if (!tile.tagged('door')) {
            tile.tag('hallway', true);
            tile.cost = 0;

            this.paths.push(tile);
        }
    }

    if (this.doors.length > 1) {
        this.generatePaths();
    } else if (this.doors.length == 1) {
        var randRoom = this.rooms[Math.floor(Math.random() * this.rooms.length)];
        var randDoor = randRoom.doors[Math.floor(Math.random() * randRoom.doors.length)]

        while (randDoor === this.doors[0]) {
            randRoom = this.rooms[Math.floor(Math.random() * this.rooms.length)];
            randDoor = randRoom.doors[Math.floor(Math.random() * randRoom.doors.length)]
        }

        this.doors.push(randDoor);
        this.generatePaths();
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
    this.generateDoors();
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

    // Logic 
    var step = function (timestamp) {
        this.draw(canvas, context);

        if (!this.paused) {
            this.updateDelta = timestamp - this.updateLastUpdateTime;

            if (this.updateDelta > this.updateThreshold) {
                this.update();

                this.updateLastUpdateTime = timestamp;
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