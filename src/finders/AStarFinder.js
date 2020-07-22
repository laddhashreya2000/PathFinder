var Heap       = require('heap');
var Util       = require('../core/Util');
var Heuristic  = require('../core/Heuristic');
var DiagonalMovement = require('../core/DiagonalMovement');

function Algo(val, neighbor, node, weight, heuristic, list, endX, endY) {
      var x, y, ng, abs = Math.abs, SQRT2 = Math.SQRT2;

      x = neighbor.x;
      y = neighbor.y;

      ng = node.g + ((x - node.x === 0 || y - node.y === 0) ? 1 : SQRT2);

      if (!neighbor.opened || ng < neighbor.g) {
          neighbor.g = ng;
          neighbor.h = neighbor.h || weight * heuristic(abs(x - endX), abs(y - endY));
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = node;

          if (!neighbor.opened) {
              list.push(neighbor);
              neighbor.opened = val;
          } else {
              list.updateItem(neighbor);
          }
      }
      return list;
  }

/**
 * A* path-finder. Based upon https://github.com/bgrins/javascript-astar
 * @constructor
 * @param {Object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 *     Deprecated, use diagonalMovement instead.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching
 *     block corners. Deprecated, use diagonalMovement instead.
 * @param {boolean} opt.biDirectional For BiAStar Algorithm
 * @param {DiagonalMovement} opt.diagonalMovement Allowed diagonal movement.
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 * @param {number} opt.weight Weight to apply to the heuristic to allow for
 *     suboptimal paths, in order to speed up the search.
 */

function AStarFinder(opt) {
    opt = opt || {};
    this.allowDiagonal = opt.allowDiagonal;
    this.dontCrossCorners = opt.dontCrossCorners;
    this.heuristic = opt.heuristic || Heuristic.manhattan;
    this.weight = opt.weight || 1;
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

    // When diagonal movement is allowed the manhattan heuristic is not
    //admissible. It should be octile instead
    if (this.diagonalMovement === DiagonalMovement.Never) {
        this.heuristic = opt.heuristic || Heuristic.manhattan;
    } else {
        this.heuristic = opt.heuristic || Heuristic.octile;
    }
}

/**
 * Find and return the the path.
 * @return {Array<Array<number>>} The path, including both start and
 *     end positions.
 */
 AStarFinder.prototype.findPath = function(startX, startY, endX, endY, grid) {
    var startNode = grid.getNodeAt(startX, startY),
        endNode = grid.getNodeAt(endX, endY),
        heuristic = this.heuristic,
        diagonalMovement = this.diagonalMovement,
        weight = this.weight,
        i, l, x, y, ng,k,
        abs = Math.abs, SQRT2 = Math.SQRT2,
        bi = this.biDirectional,
        cmp = function(nodeA, nodeB) {
            return nodeA.f - nodeB.f;
        };
    // set the `g` and `f` value of the start node to be 0
    startNode.g = 0;
    startNode.f = 0;

    // push the start node into the open list
    openList = new Heap(cmp);
    openList.push(startNode);

    if(!bi){
        startNode.opened = true;
        // while the open list is not empty
        while (!openList.empty()) {
            // pop the position of node which has the minimum `f` value.
            var node = openList.pop();
            node.closed = true;

            // if reached the end position, construct the path and return it
            if (node === endNode) {
                return Util.backtrace(endNode);
            }

            var neighbors = grid.getNeighbors(node, diagonalMovement);
            for (i = 0, l = neighbors.length; i < l; ++i) {
                var neighbor = neighbors[i];

                if (neighbor.closed) {
                    continue;
                }

                openList = Algo(1, neighbor, node, weight, heuristic, openList, endX, endY);
            }
        } // end while not open list empty
    }

    else{

      var endOpenList = new Heap(cmp),
      BY_START = 1, BY_END = 2;

      startNode.opened = BY_START;

      // set the `g` and `f` value of the end node to be 0
      // and push it into the open open list
      endNode.g = 0;
      endNode.f = 0;
      endOpenList.push(endNode);
      endNode.opened = BY_END;

      // while both the open lists are not empty
      while (!openList.empty() && !endOpenList.empty()) {
          // pop the position of start node which has the minimum `f` value.
          var node = openList.pop();
          node.closed = true;

          var neighbors = grid.getNeighbors(node, diagonalMovement);
          for (i = 0, l = neighbors.length; i < l; ++i) {
              var neighbor = neighbors[i];

              if (neighbor.closed) {
                  continue;
              }
              if (neighbor.opened === BY_START) {
                  return Util.biBacktrace(neighbor, node);
              }
              openList = Algo(BY_START, neighbor, node, weight, heuristic, openList, endX, endY);
          }
          // if(k) { return openList;}
          // pop the position of end node which has the minimum `f` value.
          node = endOpenList.pop();
          node.closed = true;

          for (i = 0, l = neighbors.length; i < l; ++i) {
              var neighbor = neighbors[i];

              if (neighbor.closed) {
                  continue;
              }
              if (neighbor.opened === BY_START) {
                  return Util.biBacktrace(neighbor, node);
              }
              endOpenList = Algo(BY_END, neighbor, node, weight, heuristic, endOpenList, endX, endY);
          }
          // if (k) { return endOpenList;}
    }
    return [];
  }
};

module.exports = AStarFinder;
