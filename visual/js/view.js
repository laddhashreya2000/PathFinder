/**
 * The pathfinding visualization.
 * It uses raphael.js to show the grids.
 */
var View = {
    nodeSize: 30,
    setNodeSize: function(zoom){
      this.nodeSize = zoom*30 /100;
    }, // width and height of a single node, in pixel
    nodeStyle: {
        normal: {
            fill: 'white',
            'stroke-opacity': 0.2, // the border
        },
        blocked: {
            fill: 'grey',
            'stroke-opacity': 0.2,
        },
        start: {
            fill: ['#5f9ea0', '#cdc1c5', '#f4a460'],
            'stroke-opacity': 0.2,
        },
        end: {
            fill: '#e40',
            'stroke-opacity': 0.2,
        },
        opened: {
            fill: '#98fb98',
            'stroke-opacity': 0.2,
        },
        closed: {
            fill: '#afeeee',
            'stroke-opacity': 0.2,
        },
        failed: {
            fill: '#ff8888',
            'stroke-opacity': 0.2,
        },
        tested: {
            fill: '#e5e5e5',
            'stroke-opacity': 0.2,
        },
    },
    nodeColorizeEffect: {
        duration: 50,
    },
    nodeZoomEffect: {
        duration: 200,
        transform: 's1.2', // scale by 1.2x
        transformBack: 's1.0',
    },
    pathStyle: {
        stroke: ['#5f9ea0', '#cdc1c5', '#f4a460' ],
        'stroke-width': 3,
    },
	roverimg: ['./visual/js/mars_rover3.png', './visual/js/mars_rover.png', './visual/js/mars_rover2.png'],
	rovercolor: ['./visual/js/CadetBlue.png', './visual/js/LightPink.png', './visual/js/SandyBrown.png'],
    supportedOperations: ['opened', 'closed', 'tested'],
    init: function(opts) {
        this.numCols      = opts.numCols;
        this.numRows      = opts.numRows;
        this.paper        = Raphael('draw_area');
        this.$stats       = $('#stats');
    },
    /**
     * Generate the grid asynchronously.
     * This method will be a very expensive task.
     * Therefore, in order to not to block the rendering of browser ui,
     * I decomposed the task into smaller ones. Each will only generate a row.
     */
    generateGrid: function(callback) {
        var i, j, x, y,
            rect,
            normalStyle, nodeSize,
            createRowTask, sleep, tasks,
            nodeSize    = this.nodeSize,
            normalStyle = this.nodeStyle.normal,
            numCols     = this.numCols,
            numRows     = this.numRows,
            paper       = this.paper,
            rects       = this.rects = [],
            $stats      = this.$stats;

        paper.setSize(numCols * nodeSize, numRows * nodeSize);

        createRowTask = function(rowId) {
            return function(done) {
                rects[rowId] = [];
                for (j = 0; j < numCols; ++j) {
                    x = j * nodeSize;
                    y = rowId * nodeSize;

                    rect = paper.rect(x, y, nodeSize, nodeSize);
                    rect.attr(normalStyle);
                    rects[rowId].push(rect);
                }
                $stats.text(
                    'generating grid ' +
                    Math.round((rowId + 1) / numRows * 100) + '%'
                );
                done(null);
            };
        };

        sleep = function(done) {
            setTimeout(function() {
                done(null);
            }, 0);
        };

        tasks = [];
        for (i = 0; i < numRows; ++i) {
            tasks.push(createRowTask(i));
            tasks.push(sleep);
        }

        async.series(tasks, function() {
            if (callback) {
                callback();
            }
        });
    },
    setStartPos: function(gridX, gridY) {
        var coord = this.toPageCoordinate(gridX, gridY);
        if (!this.startNode) {
            this.startNode = this.paper.rect(
                coord[0],
                coord[1],
                this.nodeSize,
                this.nodeSize
            ).attr(this.nodeStyle.normal)
             .animate(this.nodeStyle.start, 1000);
			this.Img = new Array;
            this.Img[0] =  this.paper.image( './visual/js/mars_rover3.png', coord[0], coord[1], this.nodeSize, this.nodeSize );
        } else {
            this.startNode.attr({ x: coord[0], y: coord[1] }).toFront();
			this.Img[0].remove();
			this.Img[0] = this.paper.image( './visual/js/mars_rover3.png', coord[0], coord[1], this.nodeSize, this.nodeSize ).toFront();
        }
    },
    setEndPos: function(gridX, gridY, n) {
        var coord = this.toPageCoordinate(gridX, gridY);
		if (!this.endNode)  {
			this.endNode = new Array;
		}

		if(!this.endNode[n-1]){
            this.endNode[n-1] = this.paper.rect(
                coord[0],
                coord[1],
                this.nodeSize,
                this.nodeSize
            ).attr(this.nodeStyle.normal)
             .animate(this.nodeStyle.end, 1000);
			 this.Img[n] =  this.paper.image( './visual/js/race_end.png', coord[0], coord[1], this.nodeSize, this.nodeSize ).toFront();
        }
		else {
            this.endNode[n-1].attr({ x: coord[0], y: coord[1] }).toFront();
			this.Img[n].remove();
			this.Img[n] =  this.paper.image( './visual/js/race_end.png', coord[0], coord[1], this.nodeSize, this.nodeSize ).toFront();
        }
    },
    setStartPos2: function(gridX, gridY, n) {
        var coord = this.toPageCoordinate(gridX, gridY);
        if (!this.startNodes)  {
			this.startNodes = new Array;
			this.start_img = new Array;
        }
		if(!this.startNodes[n]){

			this.startNodes[n] = this.paper.rect(
                coord[0],
                coord[1],
                this.nodeSize,
                this.nodeSize
            ).attr(this.nodeStyle.normal)
             .animate({fill: this.nodeStyle.start.fill[n], 'stroke-opacity': 0.2 }, 1000);
			 
			 this.start_img[n] = this.paper.image( this.rovercolor[n], coord[0], coord[1], this.nodeSize, this.nodeSize ).toFront();
		}
		else {
            this.startNodes[n].attr({ x: coord[0], y: coord[1] }).toFront();
			this.start_img[n].remove();
			this.start_img[n] = this.paper.image( this.rovercolor[n], coord[0], coord[1], this.nodeSize, this.nodeSize ).toFront();
        }
    },

	setRoverPos2: function(gridX, gridY, n) {
        var coord = this.toPageCoordinate(gridX, gridY);
        if (!this.img)  {
			this.img = new Array;
			this.img[n] = this.paper.image( this.roverimg[n], coord[0], coord[1], this.nodeSize, this.nodeSize );
        }
		else if(!this.img[n]){
			this.img[n] =  this.paper.image( this.roverimg[n], coord[0], coord[1], this.nodeSize, this.nodeSize ).toFront();
		}
		else {
			this.img[n].remove();
			this.img[n] =  this.paper.image( this.roverimg[n], coord[0], coord[1], this.nodeSize, this.nodeSize ).toFront();
        }
    },
	setRoverWinPos: function(winner, gridX, gridY){
		var coord = this.toPageCoordinate(gridX, gridY);
		this.img[winner[0]].remove();
		this.img[winner[0]] =  this.paper.image( this.roverimg[winner[0]], coord[0], coord[1]+ this.nodeSize/2, this.nodeSize/2, this.nodeSize/2 ).toFront();

		if(winner[1] !== undefined){
			this.img[winner[1]].remove();
		    this.img[winner[1]] =  this.paper.image( this.roverimg[winner[1]], coord[0]+ this.nodeSize/2, coord[1]+ this.nodeSize/2, this.nodeSize/2, this.nodeSize/2 ).toFront();
		}

		if(winner[2] !== undefined){
			this.img[winner[2]].remove();
		    this.img[winner[2]] =  this.paper.image( this.roverimg[winner[2]], coord[0], coord[1], this.nodeSize/2, this.nodeSize/2 ).toFront();
		}
	},
    setEndPos2: function(gridX, gridY, n) {
        var coord = this.toPageCoordinate(gridX, gridY);
        if (!this.startNode)  {
			this.startNode = new Array;
		}
        if(!this.startNode[n]){
            this.startNode[n] = this.paper.rect(
                coord[0],
                coord[1],
                this.nodeSize,
                this.nodeSize
            ).attr(this.nodeStyle.normal)
             .animate(this.nodeStyle.end, 1000);

			this.img_end = this.paper.image( './visual/js/race_end.png', coord[0], coord[1], this.nodeSize, this.nodeSize );
        }
		else {
            this.startNode[n].attr({ x: coord[0], y: coord[1] }).toFront();
			this.img_end.remove();
			this.img_end = this.paper.image( './visual/js/race_end.png', coord[0], coord[1], this.nodeSize, this.nodeSize ).toFront();
        }
    },
    /**
     * Set the attribute of the node at the given coordinate.
     */
    setAttributeAt: function(gridX, gridY, attr, value) {
        var color, nodeStyle = this.nodeStyle;
        switch (attr) {
        case 'walkable':
            color = value ? nodeStyle.normal.fill : nodeStyle.blocked.fill;
            this.setWalkableAt(gridX, gridY, value);
            break;
        case 'opened':
            this.colorizeNode(this.rects[gridY][gridX], nodeStyle.opened.fill);
            this.setCoordDirty(gridX, gridY, true);
            break;
        case 'closed':
            this.colorizeNode(this.rects[gridY][gridX], nodeStyle.closed.fill);
            this.setCoordDirty(gridX, gridY, true);
            break;
        case 'tested':
            color = (value === true) ? nodeStyle.tested.fill : nodeStyle.normal.fill;

            this.colorizeNode(this.rects[gridY][gridX], color);
            this.setCoordDirty(gridX, gridY, true);
            break;
        case 'parent':
            // XXX: Maybe draw a line from this node to its parent?
            // This would be expensive.
            break;
        default:
            console.error('unsupported operation: ' + attr + ':' + value);
            return;
        }
    },
    colorizeNode: function(node, color) {
        node.animate({
            fill: color
        }, this.nodeColorizeEffect.duration);
    },
    zoomNode: function(node) {
        node.toFront().attr({
            transform: this.nodeZoomEffect.transform,
        }).animate({
            transform: this.nodeZoomEffect.transformBack,
        }, this.nodeZoomEffect.duration);
    },
    setWalkableAt: function(gridX, gridY, value) {
        var node, i, blockedNodes = this.blockedNodes;
        if (!blockedNodes) {
            blockedNodes = this.blockedNodes = new Array(this.numRows);
            for (i = 0; i < this.numRows; ++i) {
                blockedNodes[i] = [];
            }
        }
        node = blockedNodes[gridY][gridX];
        if (value) {
            // clear blocked node
            if (node) {
                this.colorizeNode(node, this.rects[gridY][gridX].attr('fill'));
                this.zoomNode(node);
                setTimeout(function() {
                    node.remove();
                }, this.nodeZoomEffect.duration);
                blockedNodes[gridY][gridX] = null;
            }
        } else {
            // draw blocked node
            if (node) {
                return;
            }
            node = blockedNodes[gridY][gridX] = this.rects[gridY][gridX].clone();
            this.colorizeNode(node, this.nodeStyle.blocked.fill);
            this.zoomNode(node);
        }
    },
    clearFootprints: function() {
        var i, x, y, coord, coords = this.getDirtyCoords();
        for (i = 0; i < coords.length; ++i) {
            coord = coords[i];
            x = coord[0];
            y = coord[1];
            this.rects[y][x].attr(this.nodeStyle.normal);
            this.setCoordDirty(x, y, false);
        }
		this.coordDirty = undefined;
    },
    clearBlockedNodes: function() {
        var i, j, blockedNodes = this.blockedNodes;
        if (!blockedNodes) {
            return;
        }
        for (i = 0; i < this.numRows; ++i) {
            for (j = 0 ;j < this.numCols; ++j) {
                if (blockedNodes[i][j]) {
                    blockedNodes[i][j].remove();
                    blockedNodes[i][j] = null;
                }
            }
        }
		this.blockedNodes = undefined;
    },
    drawPath: function(path, n, i) {
        if (!path.length) {
            return;
        }
        var svgPath = this.buildSvgPath(path);
        if(!this.path) this.path = new Array;
		if(!this.path[n]) this.path[n] = new Array;
        this.path[n][i] = this.paper.path(svgPath).attr({stroke: this.pathStyle.stroke[n], 'stroke-width': 3});
    },
    /**
     * Given a path, build its SVG represention.
     */
    buildSvgPath: function(path) {
        var i, strs = [], size = this.nodeSize;

        strs.push('M' + (path[0][0] * size + size / 2) + ' ' +
                  (path[0][1] * size + size / 2));
        for (i = 1; i < path.length; ++i) {
            strs.push('L' + (path[i][0] * size + size / 2) + ' ' +
                      (path[i][1] * size + size / 2));
        }

        return strs.join('');
    },
    clearPath: function() {
        if (this.path){
			for(var i=0; i<this.path.length; i++){
                for(var j=0; j<this.path[i].length; j++){			
                    this.path[i][j].remove();
				}
			}
        }
    },
    /**
     * Helper function to convert the page coordinate to grid coordinate
     */
    toGridCoordinate: function(pageX, pageY) {
        return [
            Math.floor(pageX / this.nodeSize),
            Math.floor(pageY / this.nodeSize)
        ];
    },
    /**
     * helper function to convert the grid coordinate to page coordinate
     */
    toPageCoordinate: function(gridX, gridY) {
        return [
            gridX * this.nodeSize,
            gridY * this.nodeSize
        ];
    },
    showStats: function(opts) {
        var len = Math.round(opts.pathLength * 100) / 100;
        if(len==0) {
            len = 'PATH DOES NOT EXIST';
            alert("No path found!!! The rover can't reach the destination.");
        }
        var texts = [
            'length: ' + len,
            'time: ' + opts.timeSpent + 'ms',
            'operations: ' + opts.operationCount
        ];
        $('#stats').show().html(texts.join('<br>'));
    },
	showStats2: function(opts) {
		var len1 = Math.round(opts.pathLength1 * 100) / 100;
		if(!len1){
			len1 = 'PATH DOES NOT EXIST';
		}

		var len2 = Math.round(opts.pathLength2 * 100) / 100;
		if(!len2){
			len2 = 'PATH DOES NOT EXIST';
		}

		var len3 = Math.round(opts.pathLength3 * 100) / 100;
		if(!len3){
			len3 = 'PATH DOES NOT EXIST';
		}

        var texts = [
            'Rover 1 length: ' + len1,
			'Rover 2 length: ' + len2,
			'Rover 3 length: ' + len3,
            'time: ' + opts.timeSpent + 'ms',
            'operations: ' + opts.operationCount
        ];
        $('#stats').show().html(texts.join('<br>'));
    },
    dynamicStats: function(msg) {
      $('#stats').show().html(msg);
    },
    setCoordDirty: function(gridX, gridY, isDirty) {
        var x, y,
            numRows = this.numRows,
            numCols = this.numCols,
            coordDirty;

        if (this.coordDirty === undefined) {
            coordDirty = this.coordDirty = [];
            for (y = 0; y < numRows; ++y) {
                coordDirty.push([]);
                for (x = 0; x < numCols; ++x) {
                    coordDirty[y].push(false);
                }
            }
        }

        this.coordDirty[gridY][gridX] = isDirty;
    },
    getDirtyCoords: function() {
        var x, y,
            numRows = this.numRows,
            numCols = this.numCols,
            coordDirty = this.coordDirty,
            coords = [];

        if (coordDirty === undefined) {
            return [];
        }

        for (y = 0; y < numRows; ++y) {
            for (x = 0; x < numCols; ++x) {
                if (coordDirty[y][x]) {
                    coords.push([x, y]);
                }
            }
        }
        return coords;
    },
};
