/**
 * The visualization controller will works as a state machine.
 * See files under the `doc` folder for transition descriptions.
 * See https://github.com/jakesgordon/javascript-state-machine
 * for the document of the StateMachine module.
 */
var Controller = StateMachine.create({
    initial: 'none',
    events: [
        {
            name: 'init',
            from: 'none',
            to:   'ready'
        },
        {
            name: 'set',
            from: '*',
            to:   'ready'
        },
        {
            name: 'search',
            from: 'starting',
            to:   'searching'
        },
        {
            name: 'pause',
            from: 'searching',
            to:   'paused'
        },
        {
            name: 'finish',
            from: 'searching',
            to:   'finished'
        },
        {
            name: 'resume',
            from: 'paused',
            to:   'searching'
        },
        {
            name: 'cancel',
            from: 'paused',
            to:   'ready'
        },
        {
            name: 'modify',
            from: 'finished',
            to:   'modified'
        },
        {
            name: 'reset',
            from: '*',
            to:   'ready'
        },
        {
            name: 'clear',
            from: ['finished', 'modified'],
            to:   'ready'
        },
        {
            name: 'start',
            from: ['ready', 'modified', 'restarting'],
            to:   'starting'
        },
        {
            name: 'restart',
            from: ['searching', 'finished'],
            to:   'restarting'
        },
        {
            name: 'dragStart',
            from: ['ready', 'finished'],
            to:   'draggingStart'
        },
        {
            name: 'dragEnd',
            from: ['ready', 'finished'],
            to:   'draggingEnd'
        },
        {
            name: 'dragEnd2',
            from: ['ready', 'finished'],
            to:   'draggingEnd2'
        },
		{
            name: 'dragEnd3',
            from: ['ready', 'finished'],
            to:   'draggingEnd3'
        },
        {
            name: 'dragEnd4',
            from: ['ready', 'finished'],
            to:   'draggingEnd4'
        },
        {
            name: 'drawWall',
            from: ['ready', 'finished'],
            to:   'drawingWall'
        },
        {
            name: 'eraseWall',
            from: ['ready', 'finished'],
            to:   'erasingWall'
        },
        {
            name: 'rest',
            from: ['draggingStart', 'draggingEnd', 'draggingEnd2', 'draggingEnd3', 'draggingEnd4', 'drawingWall', 'erasingWall'],
            to  : 'ready'
        },
    ],
});

$.extend(Controller, {
    gridSize: [64, 36], // number of nodes horizontally and vertically
    operationsPerSecond: 300,

    getGridSize: function() {
      var width = Math.floor($(window).width()/View.nodeSize) +1,
          height = Math.floor($(window).height()/View.nodeSize) + 1;
      console.log(width);
      console.log(height);
      this.gridSize = [width,height];
    },

    getDest: function(){
      var destattr =$('input[name=dest]:checked').val();

      return destattr;
    },
    /**
     * Asynchronous transition from `none` state to `ready` state.
     */
    onleavenone: function() {
        Controller.getGridSize();
        var numCols = this.gridSize[0],
            numRows = this.gridSize[1];

        this.grid = new PF.Grid(numCols, numRows);

        View.init({
            numCols: numCols,
            numRows: numRows
        });

		    this.endNodes = new Array;

        View.generateGrid(function() {
            Controller.setDefaultStartEndPos();
            Controller.bindEvents();
            Controller.transition(); // transit to the next state (ready)
        });

        this.$buttons = $('.control_button');

        this.hookPathFinding();

        return StateMachine.ASYNC;
        // => ready
    },
    ondrawWall: function(event, from, to, gridX, gridY) {
        this.setWalkableAt(gridX, gridY, false);
        // => drawingWall
    },
    oneraseWall: function(event, from, to, gridX, gridY) {
        this.setWalkableAt(gridX, gridY, true);
        // => erasingWall
    },
    onsearch: function(event, from, to) {
        View.dynamicStats('Searching');
        var timeStart, timeEnd;

        timeStart = window.performance ? performance.now() : Date.now();

        var gr = this.makeGraph(this.endNodes);
     	var n = this.endNodes.length;
        var pathArray = new Array;
        var order = {p: new Array};
        var len = this.getPath(1,gr,0,n, order);
		var f = order.p.reverse(),  l = f.length;

		for(var j=0; j<l-1; j++){
			 if(f[j+1] > f[j] ) gr[f[j]][f[j+1]][1].reverse();
		     pathArray = pathArray.concat(gr[f[j]][f[j+1]][1]);
		}

        this.path = pathArray;

        this.operationCount = this.operations.length;
        timeEnd = window.performance ? performance.now() : Date.now();
        this.timeSpent = (timeEnd - timeStart).toFixed(4);

        this.loop();
        // => searching
    },
	makeGraph: function(endNodes){
        var n = endNodes.length;
        var graph = new Array(n);
        for (var i = 0; i < graph.length; i++) {
            graph[i] = new Array(n);
        }

        for(var i = 0; i < graph.length; i++){
            for(var j = i; j < graph.length; j++){
                var Grid,finder = Panel.getFinder();
                Grid = this.grid.clone();

                var dist = finder.findPath(
                  endNodes[i][0], endNodes[i][1], endNodes[j][0], endNodes[j][1], Grid
                );

                var len = PF.Util.pathLength(dist);

				graph[j][i] = new Array(2);
                graph[j][i][0]=len;
                graph[j][i][1]=dist;
                graph[i][j] = new Array(2);
                graph[i][j][0]=len;
                graph[i][j][1]= dist.reverse();
            }
        }

        return graph;

    },
    getPath: function(bit_mask,gr,pos,n, order){
        if (bit_mask === ((1<<n)-1)) {
            order.p.push(pos);
			return 0;
        }

        var min_len = 1000000;

        for (var i = 1; i < n; i++) {
            if (!(bit_mask & (1<<i))) {
			    var new_o = {p: new Array};

				if(!gr[pos][i][0]){
				    order.p = new_o.p;
					return 0;
				}

                var new_len = Controller.getPath(bit_mask|(1<<i), gr, i, n, new_o);
				new_len += gr[pos][i][0] ;

                if(new_len < min_len) {
					min_len = new_len;
					order.p = new_o.p;
                }
            }
        }
        order.p.push(pos);
        return min_len;
    },
    onrestart: function() {
        // When clearing the colorized nodes, there may be
        // nodes still animating, which is an asynchronous procedure.
        // Therefore, we have to defer the `abort` routine to make sure
        // that all the animations are done by the time we clear the colors.
        // The same reason applies for the `onreset` event handler.
        // View.showStats({
        //     pathLength: null,
        //     timeSpent:  null,
        //     operationCount: null,
        // });
        View.dynamicStats('Restarting');
        setTimeout(function() {
            Controller.clearOperations();
            Controller.clearFootprints();
            Controller.start();
        }, View.nodeColorizeEffect.duration * 1.2);
        // => restarting
    },
    onpause: function(event, from, to) {
        // => paused
        View.dynamicStats('Paused. Start searching again');
    },
    onresume: function(event, from, to) {
        View.dynamicStats('Resuming');
        this.loop();
        // => searching
    },
    oncancel: function(event, from, to) {
        // View.showStats({
        //     pathLength: '0',
        //     timeSpent:  '0',
        //     operationCount: '0',
        // });
        this.clearOperations();
        this.clearFootprints();
        View.dynamicStats('Cancelled. Start searching again');
        // => ready
    },
    onfinish: function(event, from, to) {
        View.showStats({
            pathLength: PF.Util.pathLength(this.path),
            timeSpent:  this.timeSpent,
            operationCount: this.operationCount,
        });
        View.drawPath(this.path);
        // => finished
    },
    onclear: function(event, from, to) {
        this.clearOperations();
        this.clearFootprints();
        View.dynamicStats('Path Cleared. Start searching again');
        // => ready
    },
    onmodify: function(event, from, to) {
        // => modified
    },
    onset: function(event, from, to) {
        setTimeout(function() {
            Controller.clearOperations();
            Controller.clearAll();
            Controller.buildNewGrid();
            Controller.setDefaultStartEndPos();
        }, View.nodeColorizeEffect.duration * 1.2);
        // => ready
    },
    onreset: function(event, from, to) {
        setTimeout(function() {
            View.dynamicStats('Reset done. Start searching again')
            Controller.clearOperations();
            Controller.clearAll();
            Controller.buildNewGrid();
        }, View.nodeColorizeEffect.duration * 1.2);
        // => ready
    },

    /**
     * The following functions are called on entering states.
     */

    onready: function() {
        console.log('=> ready');
        this.setButtonStates({
            id: 1,
            text: 'Start Search',
            enabled: true,
            callback: $.proxy(this.start, this),
        }, {
            id: 2,
            text: 'Pause Search',
            enabled: false,
        }, {
            id: 3,
            text: 'Clear Walls',
            enabled: true,
            callback: $.proxy(this.reset, this),
        }, {
            id: 4,
            text: 'Set dest',
            enabled: true,
            callback: $.proxy(this.set, this),
        });
        // => [starting, draggingStart, draggingEnd, drawingStart, drawingEnd]
    },
    onstarting: function(event, from, to) {
        console.log('=> starting');
        // Clears any existing search progress
        this.clearFootprints();
        this.setButtonStates({
            id: 2,
            enabled: true,
         }, {
            id: 4,
            text: 'Set dest',
            enabled: false,
            callback: $.proxy(this.set, this),
        });
        this.search();
        // => searching
    },
    onsearching: function() {
        console.log('=> searching');
        this.setButtonStates({
            id: 1,
            text: 'Restart Search',
            enabled: true,
            callback: $.proxy(this.restart, this),
        }, {
            id: 2,
            text: 'Pause Search',
            enabled: true,
            callback: $.proxy(this.pause, this),
        }, {
            id: 4,
            text: 'Set dest',
            enabled: false,
            callback: $.proxy(this.set, this),
        });
        // => [paused, finished]
    },
    onpaused: function() {
        console.log('=> paused');
        this.setButtonStates({
            id: 1,
            text: 'Resume Search',
            enabled: true,
            callback: $.proxy(this.resume, this),
        }, {
            id: 2,
            text: 'Cancel Search',
            enabled: true,
            callback: $.proxy(this.cancel, this),
        }, {
            id: 4,
            text: 'Set dest',
            enabled: true,
            callback: $.proxy(this.set, this),
        });
        // => [searching, ready]
    },
    onfinished: function() {
        console.log('=> finished');
        this.setButtonStates({
            id: 1,
            text: 'Restart Search',
            enabled: true,
            callback: $.proxy(this.restart, this),
        }, {
            id: 2,
            text: 'Clear Path',
            enabled: true,
            callback: $.proxy(this.clear, this),
        }, {
            id: 4,
            text: 'Set dest',
            enabled: true,
            callback: $.proxy(this.set, this),
        });
    },
    onmodified: function() {
        console.log('=> modified');
        this.setButtonStates({
            id: 1,
            text: 'Start Search',
            enabled: true,
            callback: $.proxy(this.start, this),
        }, {
            id: 2,
            text: 'Clear Path',
            enabled: true,
            callback: $.proxy(this.clear, this),
        }, {
            id: 4,
            text: 'Set dest',
            enabled: true,
            callback: $.proxy(this.set, this),
        });
    },

    /**
     * Define setters and getters of PF.Node, then we can get the operations
     * of the pathfinding.
     */
    hookPathFinding: function() {

        PF.Node.prototype = {
            get opened() {
                return this._opened;
            },
            set opened(v) {
                this._opened = v;
                Controller.operations.push({
                    x: this.x,
                    y: this.y,
                    attr: 'opened',
                    value: v
                });
            },
            get closed() {
                return this._closed;
            },
            set closed(v) {
                this._closed = v;
                Controller.operations.push({
                    x: this.x,
                    y: this.y,
                    attr: 'closed',
                    value: v
                });
            },
            get tested() {
                return this._tested;
            },
            set tested(v) {
                this._tested = v;
                Controller.operations.push({
                    x: this.x,
                    y: this.y,
                    attr: 'tested',
                    value: v
                });
            },
        };

        this.operations = [];
    },
    bindEvents: function() {
        $('#draw_area').mousedown($.proxy(this.mousedown, this));
        $(window)
            .mousemove($.proxy(this.mousemove, this))
            .mouseup($.proxy(this.mouseup, this));
    },
    loop: function() {
        var interval = 1000 / this.operationsPerSecond;
        (function loop() {
            if (!Controller.is('searching')) {
                return;
            }
            Controller.step();
            setTimeout(loop, interval);
        })();
    },
    step: function() {
        var operations = this.operations,
            op, isSupported;

        do {
            if (!operations.length) {
                this.finish(); // transit to `finished` state
                return;
            }
            op = operations.shift();
            isSupported = View.supportedOperations.indexOf(op.attr) !== -1;
        } while (!isSupported);

        View.setAttributeAt(op.x, op.y, op.attr, op.value);
    },
    clearOperations: function() {
        this.operations = [];
    },
    clearFootprints: function() {
        View.clearFootprints();
        View.clearPath();
    },
    clearAll: function() {
        this.clearFootprints();
        View.clearBlockedNodes();
    },
    buildNewGrid: function() {
        Controller.getGridSize();
        this.grid = new PF.Grid(this.gridSize[0], this.gridSize[1]);
    },
    mousedown: function (event) {
        var coord = View.toGridCoordinate(event.pageX, event.pageY),
            gridX = coord[0],
            gridY = coord[1],
            grid  = this.grid;

        if (this.can('dragStart') && this.isStartPos(gridX, gridY)) {
            this.dragStart();
            return;
        }
        if (this.can('dragEnd') && this.isEndPos(gridX, gridY,1)) {
            this.dragEnd();
            return;
        }
        if (this.can('dragEnd2') && this.isEndPos(gridX, gridY,2)) {
            this.dragEnd2();
            return;
        }
		if (this.can('dragEnd3') && this.isEndPos(gridX, gridY,3)) {
            this.dragEnd3();
            return;
        }
        if (this.can('dragEnd4') && this.isEndPos(gridX, gridY,4)) {
            this.dragEnd4();
            return;
        }
        if (this.can('drawWall') && grid.isWalkableAt(gridX, gridY)) {
            this.drawWall(gridX, gridY);
            return;
        }
        if (this.can('eraseWall') && !grid.isWalkableAt(gridX, gridY)) {
            this.eraseWall(gridX, gridY);
        }
    },
    mousemove: function(event) {
        var coord = View.toGridCoordinate(event.pageX, event.pageY),
            grid = this.grid,
            gridX = coord[0],
            gridY = coord[1];

        if (this.isStartOrEndPos(gridX, gridY)) {
            return;
        }

        switch (this.current) {
        case 'draggingStart':
            if (grid.isWalkableAt(gridX, gridY)) {
                this.setStartPos(gridX, gridY);
            }
            break;
        case 'draggingEnd':
            if (grid.isWalkableAt(gridX, gridY)) {
                this.setEndPos(gridX, gridY,1);
            }
            break;
        case 'draggingEnd2':
            if (grid.isWalkableAt(gridX, gridY)) {
                this.setEndPos(gridX, gridY,2);
            }
            break;
		case 'draggingEnd3':
            if (grid.isWalkableAt(gridX, gridY)) {
                this.setEndPos(gridX, gridY,3);
            }
            break;
        case 'draggingEnd4':
            if (grid.isWalkableAt(gridX, gridY)) {
                this.setEndPos(gridX, gridY,4);
            }
            break;
        case 'drawingWall':
            this.setWalkableAt(gridX, gridY, false);
            break;
        case 'erasingWall':
            this.setWalkableAt(gridX, gridY, true);
            break;
        }
    },
    mouseup: function(event) {
        if (Controller.can('rest')) {
            Controller.rest();
        }
    },
    setButtonStates: function() {
        $.each(arguments, function(i, opt) {
            var $button = Controller.$buttons.eq(opt.id - 1);
            if (opt.text) {
                $button.text(opt.text);
            }
            if (opt.callback) {
                $button
                    .unbind('click')
                    .click(opt.callback);
            }
            if (opt.enabled === undefined) {
                return;
            } else if (opt.enabled) {
                $button.removeAttr('disabled');
            } else {
                $button.attr({ disabled: 'disabled' });
            }
        });
    },
    /**
     * When initializing, this method will be called to set the positions
     * of start node and end node.
     * It will detect user's display size, and compute the best positions.
     */
    setDefaultStartEndPos: function() {
        var width, height,
            marginRight, availWidth,
            centerX, centerY,
            endX, endY,
            nodeSize = View.nodeSize;

        width  = $(window).width();
        height = $(window).height();

        marginRight = $('#algorithm_panel').width();
        availWidth = width - marginRight;

        centerX = Math.ceil(availWidth / 2 / nodeSize);
        centerY = Math.floor(height / 2 / nodeSize);

        this.setStartPos(centerX - 5, centerY);
        this.setEndPos(centerX + 5, centerY, 1);

		if(Controller.getDest() === "Two") {
            this.setEndPos(centerX, centerY+5, 2);

			if(this.endNodes[4]){
               this.setEndPos(64*nodeSize, 36*nodeSize, 4);
			   this.endNodes.splice(4);
            }

            if(this.endNodes[3]){
               this.setEndPos(64*nodeSize, 36*nodeSize, 3);
			   this.endNodes.splice(3);
            }
        }
        else if(Controller.getDest() === "Three"){
            this.setEndPos(centerX, centerY+5, 2);
            this.setEndPos(centerX, centerY-5, 3);

			if(this.endNodes[4]){
               this.setEndPos(64*nodeSize, 36*nodeSize, 4);
			   this.endNodes.splice(4);
            }
        }
		else if(Controller.getDest() === "Four"){
            this.setEndPos(centerX, centerY+5, 2);
            this.setEndPos(centerX, centerY-5, 3);
			this.setEndPos(centerX-10, centerY, 4);

		}
        else{
			if(this.endNodes[4]){
               this.setEndPos(64*nodeSize, 36*nodeSize, 4);
			   this.endNodes.splice(4);
            }

			if(this.endNodes[3]){
               this.setEndPos(64*nodeSize, 36*nodeSize, 3);
			   this.endNodes.splice(3);
            }

            if(this.endNodes[2]){
               this.setEndPos(64*nodeSize, 36*nodeSize, 2);
			   this.endNodes.splice(2);
            }
        }
    },
    setStartPos: function(gridX, gridY) {
        this.endNodes[0] = [gridX, gridY];
        View.setStartPos(gridX, gridY);
    },
    setEndPos: function(gridX, gridY, n) {
        this.endNodes[n] = [gridX, gridY];
        View.setEndPos(gridX, gridY,n);
    },
    setWalkableAt: function(gridX, gridY, walkable) {
		if(this.grid.isInside(gridX, gridY)){
           this.grid.setWalkableAt(gridX, gridY, walkable);
           View.setAttributeAt(gridX, gridY, 'walkable', walkable);
		}
    },
    isStartPos: function(gridX, gridY) {
        return gridX === this.endNodes[0][0] && gridY === this.endNode[0][1];
    },
    isEndPos: function(gridX, gridY,n) {
        if(this.endNodes[n] === undefined) return false;
		return (gridX === this.endNodes[n][0] && gridY === this.endNodes[n][1]);
    },
    isStartOrEndPos: function(gridX, gridY) {
        return this.isStartPos(gridX, gridY) || this.isEndPos(gridX, gridY, 1) || this.isEndPos(gridX, gridY, 2)
		    || this.isEndPos(gridX, gridY, 3) || this.isEndPos(gridX, gridY, 4);
    },
});
