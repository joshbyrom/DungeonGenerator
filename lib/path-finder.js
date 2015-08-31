var PathFinder = function (graph) {
    this.graph = graph;

    this.end = undefined;
    this.searchTime = 0;

    this.opened = {};
    this.closed = {};

    this.openedCount = 0;
};

PathFinder.prototype.findPath = function (start, end) {
    this.end = end;
    this.opened = {};
    this.closed = {};

    this.openedCount = 0;

    var result = [];

    var start = this.graph.getNode(start);
    start.setParent(null);

    this.openNode(start);

    var lowest = undefined,
        current = undefined,
        neighbors = undefined;

    var index, length, neighbor;

    while (this.openedCount > 0) {
        lowest = this.getLowestCost();
        current = lowest;

        if (current.tile === end) {
            this.closeNode(current);
            break;
        }

        neighbors = current.getNeighbors();
        length = neighbors.length;

        for (index = 0; index < length; ++index) {
            neighbor = neighbors[index];

            if (this.stateless(neighbor)) {
                if(!(neighbor.tile.tagged('room') && neighbor.tile != end && neighbor.tile != start)) {
                    neighbor.setParent(current);
                    this.openNode(neighbor);
                }
            }
        }

        this.closeNode(current);
    }

    if (current.tile === end) {
        while (current != undefined) {
            result.splice(0, 0, current);
            current = current.parent;
        }

    } else {
        result = [];
    }

    return result;
};

PathFinder.prototype.stateless = function (node) {
    var nodeString = node.toString();

    if(Object.prototype.hasOwnProperty.call(this.closed, nodeString)) {
        return false;
    } else if(Object.prototype.hasOwnProperty.call(this.opened, nodeString)) {
        return false;
    } else {
        return true;
    }
};

PathFinder.prototype.openTile = function (tile) {
    var node = this.graph.getNode(tile);

    if (node) {
        this.openNode(node);
    } 
};

PathFinder.prototype.closeNode = function (node) {
    if (!(Object.prototype.hasOwnProperty.call(this.closed, node.toString()))) {
        this.closed[node.toString()] = node;
    }

    if (Object.prototype.hasOwnProperty.call(this.opened, node.toString())) {
        delete this.opened[node.toString()];
        this.openedCount -= 1;
    }
};

PathFinder.prototype.openNode = function (node) {
    if (!(Object.prototype.hasOwnProperty.call(this.opened, node.toString()))) {
        this.opened[node.toString()] = node;
        this.openedCount += 1;
    }

    delete this.closed[node.toString()];
};

PathFinder.prototype.getLowestCost = function () {
    var resultNode = undefined,
        currentNode = undefined,
        currentCost = 0,
        currentLowestCost = 0;

    for (var nodeString in this.opened) {
        currentNode = this.opened[nodeString];
        currentCost = currentNode.getCost(this.end);

        if (resultNode === undefined || currentCost < currentLowestCost) {
            resultNode = currentNode;
            currentLowestCost = currentCost;
        }
    }

    return resultNode;
};