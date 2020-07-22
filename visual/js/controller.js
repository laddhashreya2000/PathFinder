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
            name: 'raceset',
            from: '*',
            to:   'ready'
        },
        {
            name: 'node',
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
            name: 'dragStart2',
            from: ['ready', 'finished'],
            to:   'draggingStart2'
        },
		{
            name: 'dragStart3',
            from: ['ready', 'finished'],
            to:   'draggingStart3'
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
            from: ['draggingStart', 'draggingStart2', 'draggingStart3', 'draggingEnd', 'draggingEnd2', 'draggingEnd3', 'draggingEnd4', 'drawingWall', 'erasingWall'],
            to  : 'ready'
        },
    ],
});

$.extend(Controller, {
    operationsPerSecond: 300,
	RoverImg: ['./visual/js/mars_rover.png', './visual/js/mars_rover2.png', './visual/js/mars_rover3.png'],
	StatsState: ["Searching", "Racing"],
    getNodeSize: function() {
        var zoom = $('input[name=nodesize]').val();
        View.setNodeSize(zoom);
        // $.getScript('main.js');
        // document.location.reload(true);
        // Controller.setDefaultStartEndPos();
        // Controller.onleavenone();
    },
    showinstructions: function() {
    	// get the screen height and width
    	// var maskHeight = $(document).height();
    	var maskWidth = $(window).width();

    	// calculate the values for center alignment
    	// var dialogTop =  (maskHeight/3) - ($('#instructions_panel').height());
    	var dialogLeft = (maskWidth/2) - ($('#instructions_panel').width()/2);

    	// assign values to the overlay and dialog box
    	// $('#instructions_panel').css({height:maskHeight, width:maskWidth}).show();
    	$('#instructions_panel').css({left:dialogLeft}).show();
      $('#instructions_panel').show();
    },
    getGridSize: function() {
      Controller.getNodeSize();
      var width = Math.floor($(window).width()/View.nodeSize) +1,
          height = Math.floor($(window).height()/View.nodeSize) + 1;
      console.log(width);
      console.log(height);
      console.log($(document).width());
      this.gridSize = [width,height];
    },
    getDest: function(){
      var destattr =$('input[name=dest]:checked').val();
      return destattr;
    },
  	getStype: function(){
          var stype =$('input[name=stype]:checked').val();
      	return stype;
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
      this.startNodes = new Array;
		  this.stype = 0;
		  this.setType = "0zero";

        var x = document.getElementById("WelcomeMsg");
        setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3500);

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
        View.dynamicStats(this.StatsState[this.stype]);
        var timeStart, timeEnd;

        timeStart = window.performance ? performance.now() : Date.now();

    if(this.setType === "0zero"){
		var gr = this.makeGraph(this.endNodes),
            n = this.endNodes.length,
            pathArray = new Array,
            order = {p: new Array},
            len = this.getPath(1,gr,0,n, order),
		    f = order.p.reverse(),  l = f.length;

		for(var j=0; j<l-1; j++){
			 if(f[j+1] > f[j] ) gr[f[j]][f[j+1]][1].reverse();
		     pathArray = pathArray.concat(gr[f[j]][f[j+1]][1]);
		}

        this.path = pathArray;
      }
	  else{
		View.setRoverPos2(Controller.startNodes[0][0], Controller.startNodes[0][1], 0);
		View.setRoverPos2(Controller.startNodes[1][0], Controller.startNodes[1][1], 1);
		View.setRoverPos2(Controller.startNodes[2][0], Controller.startNodes[2][1], 2);
		console.log(this.startNodes);
		this.winner = new Array;
        var graph = this.makeGraph2(this.startNodes);
        this.graph = graph;
	  }

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
	makeGraph2: function(endNodes){
        var n = endNodes.length;
        var graph = new Array(n-1);
		var win_len = 100000;

        for(var i = 0; i < graph.length; i++){

                var Grid,finder = Panel.getFinder();
                Grid = this.grid.clone(i);

                var dist = finder.findPath(
                  endNodes[i][0], endNodes[i][1], endNodes[n-1][0], endNodes[n-1][1], Grid, i
                );

                var len = PF.Util.pathLength(dist);

		if(len< win_len && len > 0) {win_len = len; this.winner = [i]; }
        else if(len === win_len) this.winner.push(i);

                graph[i] = new Array(2);
                graph[i][0]=len;
                graph[i][1]= dist;
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
        View.dynamicStats('Paused. Start '+ this.StatsState[this.stype] +' again');
    },
    onresume: function(event, from, to) {
        View.dynamicStats('Resuming');
        this.loop();
        // => searching
    },
    oncancel: function(event, from, to) {
        this.clearOperations();
        this.clearFootprints();
        View.dynamicStats('Cancelled. Start ' + this.StatsState[this.stype] + ' again');
        // => ready
    },
    onfinish: function(event, from, to) {
      if(this.setType === "0zero"){
        View.showStats({
            pathLength: PF.Util.pathLength(this.path),
            timeSpent:  this.timeSpent,
            operationCount: this.operationCount,
        });
        View.drawPath(this.path, 0);
      }
	  else{

		var path = this.graph;

        View.showStats2({
            pathLength1: path[0][0],
			pathLength2: path[1][0],
			pathLength3: path[2][0],
            timeSpent:  this.timeSpent,
            operationCount: this.operationCount,
        });

		var imgs = [ "<img src= './visual/js/mars_rover3.png' width=30% >" ,
		             "<img src= './visual/js/mars_rover.png' width=30% />" ,
		             "<img src= './visual/js/mars_rover2.png' width=34% />"
		];

		var x = document.getElementById("WinMsg");

		console.log(this.winner);

		if(this.winner[0] === undefined){
			x.innerHTML = "No rover can reach the destination.";
		}
		else{
		    var pathLen = path[this.winner[0]][0];
		    for(var i=0; i<3; i++){
				if(this.winner.indexOf(i) === -1){

					var len = 0, j=0;
					while(len <= pathLen){
					    a = path[i][1][j];
                        b = path[i][1][j+1];
                        dx = a[0] - b[0];
                        dy = a[1] - b[1];
                        len += Math.sqrt(dx * dx + dy * dy);
                        j++;
					}
					path[i][1].splice(j);
					View.setRoverPos2(path[i][1][j-1][0], path[i][1][j-1][1], i);
				}

				View.drawPath(path[i][1], i);

	        }

			View.setRoverWinPos(this.winner, this.startNodes[3][0], this.startNodes[3][1]);

		    var winRover = (this.winner[0] +1);
			var winImg = imgs[Controller.winner[0]];

		    for(var i=1; i<this.winner.length; i++){
			    winRover = winRover + " and rover " + (this.winner[i]+1);
		        winImg = winImg + " " +imgs[Controller.winner[i]];
			}

			x.innerHTML = "Congrats, rover " + winRover + " won" + "<br>" + winImg ;
		}

        setTimeout(function(){ x.className = x.className.replace("", "show"); }, 1000);
        setTimeout(function(){ x.className = x.className.replace("show", ""); }, 4000);
	  }
        // => finished
    },
    onclear: function(event, from, to) {
        this.clearOperations();
        this.clearFootprints();
        View.dynamicStats('Path Cleared. Start ' + this.StatsState[this.stype] + ' again');
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
            View.dynamicStats('Reset done. Start '+ Controller.StatsState[Controller.stype] +' again')
            Controller.clearOperations();
            Controller.clearAll();
            Controller.buildNewGrid();
        }, View.nodeColorizeEffect.duration * 1.2);
        // => ready
    },
    onnode: function(event, from, to) {
      setTimeout(function() {
          Controller.clearOperations();
          Controller.clearAll();
          Controller.getGridSize();
          Controller.buildNewGrid();
          Controller.onleavenone();

          // Controller.onraceset();
          // ($('input[name=stype]').val() == "0zero").checked = true;
      }, View.nodeColorizeEffect.duration * 1.2);
    },
	onraceset: function(event, from, to) {
		var a = this.setType = this.getStype();
		this.stype = a[0];
		var x = document.getElementById("WelcomeMsg");
        setTimeout(function() {
            Controller.clearOperations();
            Controller.clearAll();
            Controller.getGridSize();
            Controller.buildNewGrid();
            if(a === "1one") {
			           Controller.setDefaultStartEndPos2();
                 View.dynamicStats('Start racing');
				         x.innerHTML = "Welcome to the race between rovers. <br> Enjoy the race.";
			      }
    		    else {
        			  Controller.setDefaultStartEndPos();
        				View.dynamicStats('Start searching');
        				x.innerHTML = "Welcome!! <br>Find the shortest path from rover to destination.";
    			}
        }, View.nodeColorizeEffect.duration * 1.2);

		this.setButtonStates({
            id: 1,
            text: 'Start ' + this.StypeState[this.stype] ,
            enabled: true,
            callback: $.proxy(this.start, this),
        }, {
            id: 2,
            text: 'Pause ' + this.StypeState[this.stype] ,
            enabled: false,
        }, {
            id: 4,
            text: 'Set dest',
            enabled: this.SetDestType[this.stype],
            callback: $.proxy(this.set, this),
        });

		x.className = x.className.replace("", "show");
        setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3500);
        // => ready
    },

	StypeState: ["Search", "Race"],
	SetDestType: [true, false],

    /**
     * The following functions are called on entering states.
     */

    onready: function() {
        console.log('=> ready');
        this.setButtonStates({
            id: 1,
            text: 'Start ' + this.StypeState[this.stype],
            enabled: true,
            callback: $.proxy(this.start, this),
        }, {
            id: 2,
            text: 'Pause ' + this.StypeState[this.stype],
            enabled: false,
        }, {
            id: 3,
            text: 'Clear Walls',
            enabled: true,
            callback: $.proxy(this.reset, this),
        }, {
            id: 4,
            text: 'Set dest',
            enabled: this.SetDestType[this.stype],
            callback: $.proxy(this.set, this),
		}, {
            id: 6,
            text: 'Set',
            enabled: true,
            callback: $.proxy(this.raceset, this),
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
		}, {
            id: 6,
            text: 'Set',
            enabled: false,
            callback: $.proxy(this.raceset, this),
        });
        this.search();
        // => searching
    },
    onsearching: function() {
        console.log('=> searching');
        this.setButtonStates({
            id: 1,
            text: 'Restart ' + this.StypeState[this.stype],
            enabled: true,
            callback: $.proxy(this.restart, this),
        }, {
            id: 2,
            text: 'Pause ' + this.StypeState[this.stype],
            enabled: true,
            callback: $.proxy(this.pause, this),
        }, {
            id: 4,
            text: 'Set dest',
            enabled: false,
            callback: $.proxy(this.set, this),
		}, {
            id: 6,
            text: 'Set',
            enabled: false,
            callback: $.proxy(this.raceset, this),
        });
        // => [paused, finished]
    },
    onpaused: function() {
        console.log('=> paused');
        this.setButtonStates({
            id: 1,
            text: 'Resume ' + this.StypeState[this.stype],
            enabled: true,
            callback: $.proxy(this.resume, this),
        }, {
            id: 2,
            text: 'Cancel ' + this.StypeState[this.stype],
            enabled: true,
            callback: $.proxy(this.cancel, this),
        }, {
            id: 4,
            text: 'Set dest',
            enabled: this.SetDestType[this.stype],
            callback: $.proxy(this.set, this),
		}, {
            id: 6,
            text: 'Set',
            enabled: true,
            callback: $.proxy(this.raceset, this),
        });
        // => [searching, ready]
    },
    onfinished: function() {
        console.log('=> finished');
        this.setButtonStates({
            id: 1,
            text: 'Restart ' + this.StypeState[this.stype],
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
            enabled: this.SetDestType[this.stype],
            callback: $.proxy(this.set, this),
		}, {
            id: 6,
            text: 'Set',
            enabled: true,
            callback: $.proxy(this.raceset, this),
        });
    },
    onmodified: function() {
        console.log('=> modified');
        this.setButtonStates({
            id: 1,
            text: 'Start ' + this.SetDestType[this.stype],
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
            enabled: this.SetDestType[this.stype],
            callback: $.proxy(this.set, this),
		}, {
            id: 6,
            text: 'Set',
            enabled: true,
            callback: $.proxy(this.raceset, this),
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

      if(this.setType !== "1one"){
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
	  }
      else{
		if (this.can('dragStart') && this.isStartPos2(gridX, gridY, 0)) {
            this.dragStart();
            return;
        }
        if (this.can('dragStart2') && this.isStartPos2(gridX, gridY, 1)) {
            this.dragStart2();
            return;
        }
        if (this.can('dragStart3') && this.isStartPos2(gridX, gridY, 2)) {
            this.dragStart3();
            return;
        }
		if (this.can('dragEnd') && this.isEndPos2(gridX, gridY, 3)) {
            this.dragEnd();
            return;
        }
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

      if(this.setType !== "1one"){
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
	  }
      else{
		if (this.isStartOrEndPos2(gridX, gridY)) {
            return;
        }

        switch (this.current) {
        case 'draggingStart':
            if (grid.isWalkableAt(gridX, gridY)) {
                this.setStartPos2(gridX, gridY,0);
            }
            break;
		case 'draggingStart2':
            if (grid.isWalkableAt(gridX, gridY)) {
                this.setStartPos2(gridX, gridY,1);
            }
            break;
		case 'draggingStart3':
            if (grid.isWalkableAt(gridX, gridY)) {
                this.setStartPos2(gridX, gridY,2);
            }
            break;
        case 'draggingEnd':
            if (grid.isWalkableAt(gridX, gridY)) {
                this.setEndPos2(gridX, gridY,3);
            }
            break;
		case 'drawingWall':
            this.setWalkableAt(gridX, gridY, false);
            break;
        case 'erasingWall':
            this.setWalkableAt(gridX, gridY, true);
            break;
		}
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

		if(this.startNodes[0]){
		   this.setEndPos2(64*nodeSize, 36*nodeSize, 3);
	       this.startNodes.splice(3);

		   for(var i=2; i>=0; i--){
		      this.setStartPos2(64*nodeSize, 36*nodeSize, i);
		      this.startNodes.splice(i);
           }
		}

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
		if(this.endNodes[0] === undefined) return false;
        return gridX === this.endNodes[0][0] && gridY === this.endNodes[0][1];
    },
    isEndPos: function(gridX, gridY,n) {
        if(this.endNodes[n] === undefined) return false;
		return (gridX === this.endNodes[n][0] && gridY === this.endNodes[n][1]);
    },
    isStartOrEndPos: function(gridX, gridY) {
        return this.isStartPos(gridX, gridY) || this.isEndPos(gridX, gridY, 1) || this.isEndPos(gridX, gridY, 2)
		    || this.isEndPos(gridX, gridY, 3) || this.isEndPos(gridX, gridY, 4);
    },
	setDefaultStartEndPos2: function() {
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

		for(var i=this.endNodes.length - 1; i>0; i--){
		   this.setEndPos(64*nodeSize, 36*nodeSize, i);
		   this.endNodes.splice(i);
        }

		this.setStartPos(64*nodeSize, 36*nodeSize);
		this.endNodes.splice(0);

        this.setStartPos2(centerX-1, centerY, 0);
	    this.setStartPos2(centerX+4, centerY-5, 1);
	    this.setStartPos2(centerX+4, centerY+5, 2);
        this.setEndPos2(centerX+4, centerY, 3);

    },
    setStartPos2: function(gridX, gridY, n) {
        this.startNodes[n] = [gridX, gridY];
        View.setStartPos2(gridX, gridY, n);
		View.setRoverPos2(gridX, gridY, n);
    },
    setEndPos2: function(gridX, gridY, n) {
        this.startNodes[n] = [gridX, gridY];
        View.setEndPos2(gridX, gridY, n);
    },
    isStartPos2: function(gridX, gridY, n) {
		if(this.startNodes[n] === undefined) return false;
        return gridX === this.startNodes[n][0] && gridY === this.startNodes[n][1];
    },
    isEndPos2: function(gridX, gridY, n) {
        if(this.startNodes[n] === undefined) return false;
		return (gridX === this.startNodes[n][0] && gridY === this.startNodes[n][1]);
    },
    isStartOrEndPos2: function(gridX, gridY) {
        return this.isStartPos2(gridX, gridY,0) || this.isStartPos2(gridX, gridY,1) ||
		       this.isStartPos2(gridX, gridY,2) || this.isEndPos2(gridX, gridY,3);
    },

});
