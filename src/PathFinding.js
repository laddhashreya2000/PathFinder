var pathfinding = {
    'Heap'                      : require('heap'),
    'Node'                      : require('./core/Node'),
    'Grid'                      : require('./core/Grid'),
    'Util'                      : require('./core/Util'),
    'DiagonalMovement'          : require('./core/DiagonalMovement'),
    'Heuristic'                 : require('./core/Heuristic'),
    'AStarFinder'               : require('./finders/AStarFinder'),
    'BestFirstFinder'           : require('./finders/BestFirstFinder'),
    'BreadthFirstFinder'        : require('./finders/BreadthFirstFinder'),
    'DijkstraFinder'            : require('./finders/DijkstraFinder'),
    'IDAStarFinder'             : require('./finders/IDAStarFinder'),
    'JumpPointFinder'           : require('./finders/JPFMoveDiagonallyIfAtMostOneObstacle'),
    'OrthoJumpPointFinder'      : require('./finders/JPFNeverMoveDiagonally')
};


try {
  //for grid in browser
  window.PF = pathfinding;
}
catch(err) {
  //for node, window does not work
  module.exports = pathfinding;
}
