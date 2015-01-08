var Game = {};

(function(){

Game.Game = function(images,tileSize) {
	this.imgs = images;
	this.tileSize = tileSize;
	
	var bspMap = Game.generateMap(60,60,3);
	console.log(bspMap);

	this.map = {
		islands:this.createIslandSprites(bspMap.islands),
		bridges:this.createBridgeSprites(bspMap.bridges)
	};
};

Game.Game.prototype.createIslandSprites = function(islands) {
	var sprites = [];
	//  FOR EACH ISLAND
		for(i in islands) {
			var island = islands[i];
			//  FOR EACH COLUMN AND ROW IN EACH ISLAND
			for(var y=0,yL=island.h; y<yL; y++) {
				for(var x=0,xL=island.w; x<xL; x++) {
					sprites.push(new Game.Sprite(0,0,this.tileSize,this.tileSize,
												(island.x+x)*this.tileSize,
												(island.y+y)*this.tileSize,
												this.tileSize,this.tileSize));
				}
			}
		}
	return sprites;
};

Game.Game.prototype.createBridgeSprites = function(bridges) {
	var sprites = [];
	for(var i=0,iL=bridges.length; i<iL; i++) {
		var bridgeEnds = bridges[i];

		if(bridgeEnds[0].x === bridgeEnds[1].x) {
			//  VERTICAL BRIDGE
			for(var l=0,lL=bridgeEnds[1].y - bridgeEnds[0].y + 2; l<lL; l++) {
				sprites.push(new Game.Sprite(16,0,this.tileSize,this.tileSize,
											(bridgeEnds[0].x)*this.tileSize,
											(bridgeEnds[0].y+l-1)*this.tileSize,this.tileSize,this.tileSize))
			}
		} else {
			//  HORIZONTAL BRIDGE
			for(var l=0,lL=bridgeEnds[1].x - bridgeEnds[0].x + 2; l<lL; l++) {
				sprites.push(new Game.Sprite(16,0,this.tileSize,this.tileSize,
											(bridgeEnds[0].x+l-1)*this.tileSize,
											(bridgeEnds[0].y)*this.tileSize,this.tileSize,this.tileSize))
			}
		}
	}
	return sprites;
}

Game.Game.prototype.render = function(draw) {

	for(i in this.map.islands) {
		this.map.islands[i].render(draw,this.imgs.ground);
	}
	for(i in this.map.bridges) {
		this.map.bridges[i].render(draw,this.imgs.ground);
	}
};

Game.Sprite = function(sx,sy,sw,sh,x,y,w,h) {
        
        this.visible = true;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.sourceX = sx;
        this.sourceY = sy;
        this.sourceW = sw;
        this.sourceH = sh;
};

Game.Sprite.prototype.render = function(draw,img) {
    if(this.visible) {
        draw.drawImage(img,this.sourceX,this.sourceY,
				        	this.sourceW,this.sourceH,
	                        this.x,this.y,this.w,this.h);
    }
};

})();