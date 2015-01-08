(function(){
    
    //  CANVAS ELEMENT
    var canvas = document.createElement("canvas");

    //  SET TO FILL WINDOW
    canvas.width  = window.innerWidth ;
    canvas.height = window.innerHeight;
    
    //  APPEND TO DOCUMENT
    document.body.appendChild(canvas);

    //  GET THE DRAWING CONTEXT
    var draw = canvas.getContext("2d");

    //  MAIN STATE MACHINE
    var LOADING = 0;
    var PLAY = 1;
    var gameState = LOADING;

    //  THE GAME
    var game = null;

    var tileSize = 16;

    //  INTERVAL FOR MAIN RUN LOOP
	var tick = setInterval(update,1000/60);

    //  ARRAY OF ASSETS TO LOAD
    var assetsToLoad = [];
    
    //  HOW MANY ASSETS HAVE LOADED
	var assetsLoaded = 0;
	
    //  CREATE IMAGE
    var sprites = new Image();
    
    //  CALL loadHandler WHEN LOADED
    sprites.onload = loadHandler;
    
    //  FILE PATH FOR THE IMAGE
    sprites.src = "sprites.png";
    
    //  PUSH IT TO assetsToLoad
    assetsToLoad.push(sprites);

    //  CALLED FOR EVERY ASSET LOADED
	function loadHandler() {
    
        //  COUNT HOW MANY ASSETS HAVE LOADED
	    assetsLoaded++;
        
        //  IF IT IS AS MANY AS WE ARE SUPPOSED TO LOAD
	    if(assetsLoaded === assetsToLoad.length) {
            console.log(assetsLoaded + " asset[s] loaded");
            
            //  PLAY BALL!
	        gameState = PLAY;
	    }
	}

    //  MAIN RUN LOOP
    function update() {
    
        //  STATE MACHINE SWITCH
		switch(gameState){
        
            //  LOADING OF ASSETS AT BEGINNING OF GAME
            case LOADING:
                console.log("loading");
            break;
            
            //  WHEN WE ARE PLAYING A LEVEL
            case PLAY:
                play();
            break;
        }

		//  RENDER LAST
		render();
		
	}

    function play() {
        if(game === null) game = new Game.Game({ground:sprites,player:sprites},tileSize);

    }

    //  RENDER FUNCTION
    function render() {
        
        //  CLEAR THE BACKGROUND
        draw.clearRect(0,0,canvas.width,canvas.height);

        switch(gameState) {

            case PLAY:
               if(game) game.render(draw);
            break;
        }
	}

})();