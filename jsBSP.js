(function(){

Game.generateMap = function(width,height,depth,minSplit,minSize,percentSize) {
	return new BSP({
		width: width,
		height: height,
		depth: depth,
		minSplit: minSplit,
		minSize: minSize,
		percentSize: percentSize
	});
};

function BSP(options) {

	this.width  = options.width  || 40;
	this.height = options.height || 40;
	this.depth  = options.depth  || 3;
	this.minSplit = options.minSplit || 0.3;
	this.minSize = options.minSize || 5;
	this.percentSize = options.percentSize || 0.6;

	this.islands = emptyGrid(this.width, this.height);
	this.bridges = emptyGrid(this.width, this.height);

	this.COMPLETE = false;

	return this.generateMap();
};

/*
  THE BASIC UNIT OF OUR PROCEDURE
*/
var Box = function(x,y,w,h) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
};

BSP.prototype.generateMap = function () {

	this.COMPLETE = true;

	//  A BOX AS BIG AS REQUESTED
	this.tree = new Box(0,0,this.width,this.height);

	//  SUBDIVE THE BOX TO THE DEPTH REQUESTED
	this.tree = this.subdivideToDepth(this.tree,this.depth,this.minSplit,this.minSize);

	//  GIVE THE PROPER BOXES ISLANDS
	this.tree[this.tree.length - 1] = this.makeIslands(this.tree[this.tree.length - 1],this.percentSize);

	var islands = [];
	//  COLLECT ISLANDS FOR USE
	for(var i=0,iL=this.tree[this.tree.length - 1].length; i<iL; i++)
		islands.push(this.tree[this.tree.length - 1][i].island);

	//  SET THE this.islands GRID TO HAVE ISLANDS
	this.islands = this.createIslands(islands,this.islands);

	//  BRIDGE ALL LAYERS OF ISLANDS
	var bridges = this.bridgeIslands(this.tree,this.depth);

	//  SET THE this.bridges GRID TO HAVE BRIDGES
	this.bridges = this.createBridges(bridges,this.bridges);
	
	if(this.COMPLETE) {
		return {
			islands: islands,
			islandsGrid: this.islands,
			bridges: bridges,
			bridgesGrid: this.bridges
		};
	} else {
		console.log("RETRYING");
		return this.generateMap();
	}
};

/*
  TAKES A BOX AND GIVES IT A CHILDREN ARRAY WITH TWO 
  BOXES, MADE FROM THE FIRST
*/
BSP.prototype.subdivideBox = function(box,minSplit,minSize) {
	
	//  BOX TO BE RETURNED
	var box = box;

	//  MINIMUM SPLIT SIZE PERCENT
	//var minSplit = minSplit || 0.2;

	//  TOSS ANY ISLAND WITH EITHER DIMENSION SMALLER THAN THIS
	//var minSize = minSize || 5;

	//  THE DIRECTION TO SPLIT THE BOX
	var split = false;

	//  IF ONE DIRECTION IS WAY BIGGER USE THAT
	if(box.w >= box.h*2) {
		split = true;
	} else if(box.h >= box.w*2) {
		split = false;
	} else {
		//  OTHER WISE USE A RANDOM SPLIT DIRECTION
		split = Math.random() > 0.5;
	}

	//  THE LOCATION TO DIVIDE THE BOX AT
	var divide = (Math.random()* (1-(minSplit*2))) + minSplit;
	divide = split ? Math.floor(box.w * divide) 
				   : Math.floor(box.h * divide);

	//  CREATE NEW BOXES
	var boxes = [];

	if(split) {

		var box1 = new Box(box.x, box.y, divide, box.h);
		if(box1.w >= minSize && box1.h >= minSize) boxes.push(box1);

		var box2 = new Box(box.x + divide, box.y, box.w - divide, box.h);
		if(box2.w >= minSize && box2.h >= minSize) boxes.push(box2);
	} else {

		var box1 = new Box(box.x, box.y, box.w, divide);
		if(box1.w >= minSize && box1.h >= minSize) boxes.push(box1);

		var box2 = new Box(box.x, box.y + divide, box.w, box.h - divide);
		if(box2.w >= minSize && box2.h >= minSize) boxes.push(box2);
	}
	
	//  IF boxes HAS ANY BOXES IN IT, GIVE IT TO box AND RETURN IT
	if(boxes.length > 0) box.branches = boxes;
	return box;
};

/*
  TAKES ONE BOX AND SUBDIVIDES IT depth TIMES
  RETURNS AN OBJECT TREE
*/
BSP.prototype.subdivideToDepth = function(box,depth,minSplit,minSize) {

	var tree = [[box]];
	
	//  REPEAT THE ALGORITHM TO A DEPTH OF depth
	for(var i=0,iL=depth; i<iL; i++) {

		//  THIS LEVEL OF THE TREE
		var level = tree[tree.length - 1];

		//  THE NEXT LEVEL OF THE TREE
		var branches = [];

		//  FOR EACH BOX IN THIS LEVEL OF THE TREE
		for(var j=0,jL=level.length; j<jL; j++) {
			var box = level[j];

			//  IF IT DOESN'T HAVE BRANCHES
			if(box.branches === undefined) {

				//  SUBDIVIDE SO IT HAS TWO BRANCHES
				box = this.subdivideBox(box, minSplit,minSize);

				//  THOSE NEW BOXES GET ADDED TO THE TREE IF POSSIBLE
				if(box.branches !== undefined) {
					for(var k=0,kL=box.branches.length; k<kL; k++) {
						branches.push(box.branches[k]);
					}
				}
			}
		}

		//  ADD THIS LEVEL TO THE TREE
		tree.push(branches);
	}
	return tree;
};

/*
  TAKES AN ARRAY OF BOXES AND CREATES ISLANDS WITHIN THEM
  EACH ISLAND CANNOT BE WITHIN ONE SPACE OF THE EDGE OF THE BOX
*/

BSP.prototype.makeIslands = function(boxes,min) {
	
	//  RETURN ARRAY
	var result = [];

	//  FOR EACH BOX
	for(var i=0,iL=boxes.length; i<iL; i++) {
		var box = boxes[i];

		//  GIVE IT AN ISLAND
		 box.island = this.makeIsland(box,min);

		//  GIVE THE ISLAND TO THE RETURN ARRAY
		result.push(box);
	}

	return result;

};

/*
  MAKES A SINGLE ISLAND WITHIN A SINGLE BOX
*/
BSP.prototype.makeIsland = function(box,min) {

	//  RANDOM LOCATION AND SIZE
	var rX, rY, rW, rH;

	//  MUST BE AT LEAST (min*100)% OF THE SIZE OF THE BOX
	// var min = min || 0.7;
	var rngW = (box.w - 2) - (box.w * min);
	var rngH = (box.h - 2) - (box.h * min);
	rW = Math.floor((Math.random()*rngW) + (box.w * min));
	rH = Math.floor((Math.random()*rngH) + (box.h * min));
	
	//  ISLAND CAN NOT BE WITHIN ONE SPACE OF THE EDGE
	var maxX = box.w - rW - 2;
	var maxY = box.h - rH - 2;

	rX = Math.round( (Math.random() * maxX) ) + 1;
	rY = Math.round( (Math.random() * maxY) ) + 1;

	return new Box(rX + box.x, rY + box.y, rW, rH);
};

/*
  TAKES THE TREE AND BRIDGES ISLANDS AT ALL LEVELS
*/
BSP.prototype.bridgeIslands = function(tree,depth) {
	
	//  RETURN ARRAY
	var bridges = [];

	//  STARTING AT THE SECOND LAST LEVEL OF BRANCHES
	for(var i=depth-1; i>=0; i--) {

		//  FOR EACH BRANCH IN THIS LEVEL
		for(var j=0,jL=tree[i].length; j<jL; j++) {
			var branch = tree[i][j];

			//  IF EACH BRANCH HAS 2 SUB BRANCHES, BRIDGE THEM
			if(branch.branches !== undefined && branch.branches.length > 1) {
				var B = this.bridgeChildren(branch.branches,i);
				if(B[0] !== undefined)	{
					bridges = bridges.concat(B);
				}
			}			
		}
	}

	return bridges;
};

/*
  TAKES A BRANCH AND RETURNS A BRIDGE BETWEEN IT'S
  CHILD BRANCHES
*/
BSP.prototype.bridgeChildren = function(branches,depth) {

	//  SO WE CAN MAKE MULTIPLE BRIDGES SOMETIMES
	var bridgeLocs = [];

	//  SHOULD THESE ISLANDS BE JOINED HORIZONTALLY
	var hrzJoin = isHrz(branches[0],branches[1]);

	//  GET JOINABLE CHILDREN OF EACH SUB BRANCH
	var J1 = this.getJoinableIslands(branches[0],hrzJoin,false);
	var J2 = this.getJoinableIslands(branches[1],hrzJoin,true)

	//  FIND THE EDGES ON THE APPROPRIATE SIDE OF
	//  THOSE JOINABLE CHILDREN
	var E1 = this.getEdgesOfGroup(J1,hrzJoin,false);
	var E2 = this.getEdgesOfGroup(J2,hrzJoin,true);
	
	//  COMPARE THE TWO SETS OF EDGES AND PULL OUT ANY MATCHES
	var matchedEdges = this.matchEdges(E1,E2,hrzJoin);

	//  IF THERE ARE NO MATCHED EDGES, THAT MEANS AN ISLAND CAN'T
	//  BE BRIDGED.  IN THIS CASE I CHOOSE JUST TO TRY OVER
	if(matchedEdges.length === 0)
		this.COMPLETE = false;

	//  PICK A RANDOM MATCHED EDGE SET
	bridgeLocs.push(matchedEdges[Math.floor(Math.random() * matchedEdges.length)]);

	//  ATTEMPT TO CREATE A SECOND BRIDGE ON THE TOP LEVEL
	if(depth < 2 && bridgeLocs[0] !== undefined) {
		var bridgeLoc = this.secondBridge(bridgeLocs[0],matchedEdges,10);
		if(bridgeLoc !== false) bridgeLocs.push(bridgeLoc);
	}
	
	return bridgeLocs;
};

/*
  RETURNS A SECOND BRIDGE NO CLOSER THAN dist FROM THE LAST
*/
BSP.prototype.secondBridge = function(bridge,pool,dist) {

	//  HORIZONTAL BRIDGE?
	var Hrz = bridge[0].y === bridge[1].y;

	//  THE POOL FROM WHICH TO PICK THE SECOND BRIDGE 
	var newPool = [];

	//  FOR ALL OF THE BRIDGE LOCATIONS LEFT IN THE POOL
	for(var i=0,iL=pool.length; i<iL; i++) {
		var B = pool[i];
		
		if(Hrz) {
			//  IF THE BRIDGE IS MORE THAN dist UNITS AWAY
			if(Math.abs(B[0].y - bridge[0].y) > dist) {

				//  ADD IT TO newPool
				newPool.push(B);
			}
		} else {
			if(Math.abs(B[0].x - bridge[0].x) > dist) {
				newPool.push(B);
			}
		}	
	}

	//  PICK A RANDOM BRIDGE LOCATION FROM newPool
	if(newPool.length > 0)
		var secondBridge = newPool[Math.floor(Math.random() * newPool.length)];
	else return false;
	return secondBridge;
};

/*
  TAKES A BRANCH AND RETURNS ALL JOINABLE CHILDREN OF THAT BRANCH
  BASED ON Hrz AND leadingEdge
*/
BSP.prototype.getJoinableIslands = function(branch,Hrz,leadingEdge) {

	//  RETURN ISLANDS
	var islands = [];

	//  IF THE BRANCH HAS AN ISLAND, IT WONT HAVE ANY MORE BRANCHES
	if(branch.island !== undefined) islands.push(branch.island);
	else {
		//  IF THIS BRANCH HAS CHILDREN BRANCHES
		if(branch.branches !== undefined) {
			var branches = branch.branches;
			//  IF IT ONLY HAS ONE BRANCH
			if(branches.length === 1) {

				//  CHECK IT FOR ISLANDS/BRANCHES
				islands = islands.concat(this.getJoinableIslands(branches[0],Hrz,leadingEdge));

			//  IF IT HAS MORE THAN ONE BRANCH
			} else {

				//  IF THEY ARE JOINED THE SAME WAY, ONLY RECURSIVELY CHECK HALF
				if(isHrz(branches[0],branches[1]) === Hrz) {

					if(leadingEdge) {
						//  THE FIRST HALF
						islands = islands.concat(this.getJoinableIslands(branches[0],Hrz,leadingEdge));
					} else {
						//  THE SECOND HALF
						islands = islands.concat(this.getJoinableIslands(branches[1],Hrz,leadingEdge));
					}
				} else {
					//  IF THEY ARE JOINED OPPOSITE, CHECK ALL
					islands = islands.concat(this.getJoinableIslands(branches[0],Hrz,leadingEdge));
					islands = islands.concat(this.getJoinableIslands(branches[1],Hrz,leadingEdge));
				}
			}
		} 
	}

	return islands;
};

/*
  HELPER TO PICK WHICH SIDE TO GET EDGES FROM 
*/
BSP.prototype.getEdgesOfGroup = function(arr,Hrz,leadingEdge) {

	var tiles = [];
	
	if(Hrz) {  //  HORIZONTAL JOIN
		if(leadingEdge) {  
			//  LEFT SIDE
			tiles = tiles.concat(this.getEdgeTiles(arr,"left"));
		} else {
			//  RIGHT SIDE
			tiles = tiles.concat(this.getEdgeTiles(arr,"right"));
		}
	} else {  //  VERTICAL JOIN
		if(leadingEdge) {
			//  TOP
			tiles = tiles.concat(this.getEdgeTiles(arr,"top"));
		} else {
			//  BOTTOM
			tiles = tiles.concat(this.getEdgeTiles(arr,"bottom"));
		}
	}
	return tiles;
};

/*
  RETURNS ALL EDGE TILES EXCEPT CORNERS OF AN ARRAY OF ISLANDS
  ON THE APPROPRIATE SIDE
*/
BSP.prototype.getEdgeTiles = function (islands,side) {

	//  RETURN TILES
	var tiles = [];

	//  FOR EACH ISLAND
	for(var i=0,iL=islands.length; i<iL; i++) {
		island = islands[i];
		
		//  DISTANCE FROM THE CORNER TO START COLLECTING TILES
		//  I'VE ELECTED TO NOT INCLUDE CORNERS SO BRIDGES CAN'T
		//  OVERLAP, AND I THINK IT LOOKS NICER
		var buffer = 1;

		//  DEPENDING ON THE SIDE PUSH AN OBJECT WITH CARTESIAN
		//  COORDINATES FOR EACH TILE DOWN THE APPROPRIATE EDGE
		switch(side) {
			case "left":
				for(var j=buffer,jL=island.h-buffer; j<jL; j++) {
					tiles.push({ x:island.x,y:island.y+j });
				}
			break;
			case "right":
				for(var j=buffer,jL=island.h-buffer; j<jL; j++) {
					tiles.push({ x:island.x + island.w,y:island.y+j });
				}
			break;
			case "top":
				for(var j=buffer,jL=island.w-buffer; j<jL; j++) {
					tiles.push({ x:island.x + j,y:island.y });
				}
			break;
			case "bottom":
				for(var j=buffer,jL=island.w-buffer; j<jL; j++) {
					tiles.push({ x:island.x + j,y:island.y + island.h});
				}
			break;
		}
	}
	return tiles;
};


/*
  TAKES TWO ARRAYS AND THE DIRECTION TO JOIN
  RETURNS ONE ARRAY WITH MATCHED UP EDGES THAT 
  COULD BE BRIDGED
*/
BSP.prototype.matchEdges = function(arr1,arr2,Hrz) {

	var matches = [];
	if(Hrz) {
		//  CHECK Y
		for(var i=0,iL=arr1.length; i<iL; i++) {
			for(var j=0,jL=arr2.length; j<jL; j++) {
				if(arr1[i].y === arr2[j].y) {
					matches.push([arr1[i],arr2[j]]);
				}
			}
		}
	} else {
		//  CHECK X
		for(var i=0,iL=arr1.length; i<iL; i++) {
			for(var j=0,jL=arr2.length; j<jL; j++) {
				if(arr1[i].x === arr2[j].x) {
					matches.push([arr1[i],arr2[j]]);
				}
			}
		}
	}
	return matches;
};

/*
  TAKES ISLANDS AND A GRID, AND FILLS THE ISLAND LOCATIONS
  WITH ONES
*/
BSP.prototype.createIslands = function(islands,grid) {

	var result = grid;

	//  FOR EACH ISLAND
	for(var i=0,iL=islands.length; i<iL; i++) {
		var island = islands[i];

		//  FOR EACH COLUMN AND ROW IN EACH ISLAND
		for(var y=0,yL=island.h; y<yL; y++) {
			for(var x=0,xL=island.w; x<xL; x++) {

				//  MAKE THEM ONES
				result[y+island.y][x+island.x] = 1;
			}
		}
	}
	return result;
}

/*
  TAKES BRIDGES AND A GRID, AND FILLS THE BRIDGE LOCATIONS
  WITH ONES.  BRIDGES MOVE AN EXTRA LOCATION ONTO EACH ISLAND
  SO THEY ARE NOT JUST FLOATING IN SPACE.  THAT IS WHY THEY 
  GET THEIR OWN GRID
*/
BSP.prototype.createBridges = function(bridges,grid) {

	//  FOR EACH BRIDGE IN THE ARRAY
	for(var i=0,iL=bridges.length; i<iL; i++) {
		var bridgeEnds = bridges[i];

		if(bridgeEnds[0].x === bridgeEnds[1].x) {
			//  VERTICAL BRIDGE
			for(var l=0,lL=bridgeEnds[1].y - bridgeEnds[0].y + 2; l<lL; l++) {
				grid[bridgeEnds[0].y+l-1][bridgeEnds[0].x] = 1;
			}
		} else {
			//  HORIZONTAL BRIDGE
			for(var l=0,lL=bridgeEnds[1].x - bridgeEnds[0].x + 2; l<lL; l++) {
				grid[bridgeEnds[0].y][bridgeEnds[0].x+l-1] = 1;
			}
		}
	}
	return grid;
};

/*
  RETURNS A TWO DIMENSIONAL ARRAY OF 0's
*/
function emptyGrid (width,height) {
	var result = [];
	for(var i=0,iL=height; i<iL; i++) {
		var arr = [];
		for(var j=0,jL=width; j<jL; j++) {
			arr.push(0);
		}
		result.push(arr);
	}
	return result;
}

/*
  TAKES AN ARRAY OF BOXES AND PRINTS THEM TO THE CONSOLE
*/
function debugBoxes(boxes) {
	console.log("##### BOXES #####");
	for(b in boxes) {
		var box = boxes[b];
		console.log(box.x,box.y,box.w,box.h);
	}
};

/*
  PRINTS THE GRID TO THE CONSOLE
*/
function debugGrid (grid) {
	console.log("##### GRID #####");
	for(var i in grid) console.log(grid[i]);
}

/*
  TAKES TWO OBJECTS WITH .x AND .y PROPERTIES AND CALCULATES
  IF THE DIFFERENCE IS GREATER HORIZONTALLY THAN VERTICALLY
*/
function isHrz(obj1,obj2) {
	return Math.abs(obj1.x - obj2.x) > Math.abs(obj1.y - obj2.y);
};

/*
  APPNEDS THE CONTENTS OF ONE ARRAY TO ANOTHER
  BECAUSE CONCAT() ISN"T WORKING LIKE IT SHOULD
*/
function readIntoArray(from, to) {
	for(var i=0,iL=from.length; i<iL; i++)
		to.push(from[i]);
	return to;
};
})();