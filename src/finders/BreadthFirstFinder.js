var Util = require('../core/Util');
var DiagonalMovement = require('../core/DiagonalMovement');

/**
 * Breadth-First-Search path finder.
 * @constructor
 * @param {Object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 *     Deprecated, use diagonalMovement instead.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching
 *     block corners. Deprecated, use diagonalMovement instead.
 * @param {DiagonalMovement} opt.diagonalMovement Allowed diagonal movement.
 * @param {boolean} opt.biDirectional whether bidirectional search or not.
 */
function BreadthFirstFinder(opt) {
    opt = opt || {};
    this.allowDiagonal = opt.allowDiagonal;
    this.dontCrossCorners = opt.dontCrossCorners;
    this.diagonalMovement = opt.diagonalMovement;
    this.biDirectional = opt.biDirectional;

    if (!this.diagonalMovement) {
        if (!this.allowDiagonal) {
            this.diagonalMovement = DiagonalMovement.Never;
        } else {
            if (this.dontCrossCorners) {
                this.diagonalMovement = DiagonalMovement.OnlyWhenNoObstacles;
            } else {
                this.diagonalMovement = DiagonalMovement.IfAtMostOneObstacle;
            }
        }
    }
}

/**
 * Find and return the the path.
 * @return {Array<Array<number>>} The path, including both start and
 *     end positions.
 */
BreadthFirstFinder.prototype.findPath = function(startX, startY, endX, endY, grid) {
   
    if(!bi){
        
        var openList = [],
        startnode = grid.getNodeAt(startX, startY),
        endnode   = grid.getNodeAt(endX, endY),
        neighbours, neighbour, i, node;
        
        openList.push(startnode);
    startnode.opened = true;

    while(openList.length){
        node = openList.shift();
        node.closed = true;

        if(node === endnode) {
          return Util.backtrace(endnode);
        }
        neighbours = grid.getNeighbors(node, this.diagonalMovement);

        for(i=0; i<neighbours.length; ++i){
            neighbour = neighbours[i];
            // skip this neighbor if it has been inspected before
            if (neighbour.closed || neighbour.opened) {
                continue;
            }

            openList.push(neighbour);
            neighbour.opened = true;
            neighbour.parent = node;
        }

    }

}

  else{
       var openList = [],
        startnode = grid.getNodeAt(startX, startY),
        endnode   = grid.getNodeAt(endX, endY),
        neighbours, neighbour, i, node;

    openList.push(startnode);
    startnode.opened = true;
    var by_start = 1, by_end = 2,
        endList=[];

    startnode.by = by_start;
    endList.push(endnode);
    endnode.opened = true;
    endnode.by = by_end;

    while(openList.length && endList.length){
        node = openList.shift();
        node.closed = true;

        neighbours = grid.getNeighbors(node, this.diagonalMovement);

        for(i=0; i<neighbours.length; ++i){
            neighbour = neighbours[i];

            if (neighbour.closed) {
                continue;
            }
            if (neighbour.opened) {
                // if this node has been inspected by the reversed search,
                // then a path is found.
                if (neighbour.by === by_end) {
                    return Util.biBacktrace(node, neighbour);
                }
                continue;
            }
            openList.push(neighbour);
            neighbour.parent = node;
            neighbour.opened = true;
            neighbour.by = by_start;
        }

        node = endList.shift();
        node.closed = true;

        neighbours = grid.getNeighbors(node, this.diagonalMovement);

        for(i=0; i<neighbours.length; ++i){
            neighbour = neighbours[i];

            if (neighbour.closed) {
                continue;
            }
            if (neighbour.opened) {
                if (neighbour.by === by_start) {
                    return Util.biBacktrace(neighbour, node);
                }
                continue;
            }
            endList.push(neighbour);
            neighbour.parent = node;
            neighbour.opened = true;
            neighbour.by = by_end;
        }

    }
}
    return [];

};

module.exports = BreadthFirstFinder;
