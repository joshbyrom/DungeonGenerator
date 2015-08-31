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
    this.averageRoomSize = 4;
    this.roomVariance = 4;
    this.numberOfRooms = 5;

    this.pathfinder = new PathFinder(this.graph);

    this.updateDelta = 0;
    this.updateLastUpdateTime = 0;
    this.updateThreshold = 5000;

    this.paused = false;
    this.finished = false;
};

Demo.prototype.generateRooms = function () {
    this.rooms = [];

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

Demo.prototype.createPath = function (start, end) {
    this.path = this.pathfinder.findPath(start, end);
    return this.path;
}

Demo.prototype.update = function () {
    var i = 0, len = this.rooms.length;
    for (; i < len; ++i) {
        this.rooms[i].getTiles(this.map).forEach(function (element, index, array) {
            element.tagged = false;
        });
    }

    this.generateRooms();
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

    window.requestAnimationFrame(step);
};

Demo.prototype.draw = function (canvas, context) {
    this.map.draw(context);
};

var demo = new Demo(100, 78, 10);
demo.start('canvas');