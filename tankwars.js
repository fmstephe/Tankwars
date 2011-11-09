// Global Constants
var maxPower = 200;
var minPower = 0;
var initPower = 100;
var powerInc = 0.4;
var gravity = 12;
var turretLength = 20;
var rotationSpeed = Math.PI/50;
var frameRate = 30;
var framePause = Math.floor(1000/frameRate);
var expLife = 0.1*frameRate;
var expRadius = 50;
var expRadius2 = expRadius*expRadius;

document.onkeydown = captureKeydown
document.onkeyup = captureKeyup

// Global Variables
var fgCtxt;
var terrainCtxt;
var bgCtxt;
var terrain;
var height;
var width;
// Game entity lists
var playerList;
var missileList;
var explosionList;
// Frame rate tracking 
var lastCycle;
var thisCycle;
// Display toggle for nerdy info
var devMode;

function init() {
	devMode = false;
	lastCycle = new Date().getTime();
	thisCycle = new Date().getTime();
	var fgCanvas = document.getElementById("foreground");
	var terrainCanvas = document.getElementById("terrain");
	var bgCanvas = document.getElementById("background");
	fgCtxt = fgCanvas.getContext("2d");
	terrainCtxt = terrainCanvas.getContext("2d");
	bgCtxt = bgCanvas.getContext("2d");
	height = fgCanvas.height;
	width = fgCanvas.width;
	var heightArray = generateTerrain(width, height);
	terrain = new Terrain(heightArray, width, height);
	var kb1 = new KeyBindings(87,83,65,68,70);
	var player1 = new Player(r(width/3),"Player1", turretLength, initPower, kb1);
	var kb2 = new KeyBindings(73,75,74,76,72);
	var player2 = new Player(width-r(width/3),"Player2", turretLength, initPower, kb2);
	explosionList = new LinkedList();
	missileList = new LinkedList();
	playerList = new LinkedList();
	playerList.append(player1);
	playerList.append(player2);
	initRender();
	setInterval(loop, framePause);
}

function initRender() {
	renderBackground();
	terrainCtxt.fillStyle = "rgba(100,100,100,1.0)";
	terrain.render(terrainCtxt);
	terrain.clearMods();
}

function loop() {
	// Debug info, such as frame rate is logged here
	manageInfo();
	logInfo();
	// Clear out each of the last frame's positions
	playerList.forEach(function(p) {p.setClear(fgCtxt);});
	missileList.forEach(function(m) {m.setClear(fgCtxt);});
	explosionList.forEach(function(e) {e.setClear(fgCtxt);});
	// Filter removable elements from entity lists
	playerList.filter(function(p) {return p.shouldRemove();});
	missileList.filter(function(m) {return m.shouldRemove();});
	explosionList.filter(function(e) {return e.shouldRemove();});
	// Manage game entities
	playerList.forEach(function(p) {updatePlayer(p);});
	missileList.forEach(function(m) {updateMissile(m);});
	explosionList.forEach(function(e) {updateExplosion(e);});
	// If an explosion has caused the terrain to change clear out the affected region
	terrain.setClear(terrainCtxt);
	// Render game entities
	terrainCtxt.fillStyle = "rgba(100,100,100,1.0)";
	terrain.render(terrainCtxt);
	fgCtxt.fillStyle = "rgba(255,30,40,1.0)";
	fgCtxt.strokeStyle = "rgba(255,255,255,1.0)";
	fgCtxt.lineWidth = 5;
	playerList.forEach(function(p){p.render(fgCtxt)});
	missileList.forEach(function(m){m.render(fgCtxt)});
	explosionList.forEach(function(e){e.render(fgCtxt)});
	terrain.clearMods();
}

function updatePlayer(player) {
	hr = terrain.heightArray;
	player.y = hr[player.x];
	if (player.keyBindings.left) {
		player.arc -= rotationSpeed;
	}
	if (player.keyBindings.right) {
		player.arc += rotationSpeed;
	}
	if (player.keyBindings.up) {
		player.power += powerInc;
	}
	if (player.keyBindings.down) {
		player.power -= powerInc;
	}
	player.power = Math.max(player.power,minPower);
	player.power = Math.min(player.power,maxPower);
	if (player.canFire && player.keyBindings.firing) {
		missileList.append(player.createMissile(gravity));
	}
}

function updateMissile(missile) {
	hr = terrain.heightArray;
	missile.advance();
	var startY;
	var yD;
	var startX;
	var endX;
	var xInc;
	var xComp;
	if (missile.pX < missile.x) {
		startX = Math.floor(missile.pX);
		endX = Math.floor(missile.x);
		startY = missile.pY;
		yD = missile.y - missile.pY;
		for (x = startX; x < endX; x++) {
			yy = startY + (yD*((x-startX)/(endX-startX)));
			if (hr[x] > yy) {
				console.log(x,startX,endX);
				missile.remove();
				exp = new Explosion(x, yy, expLife, expRadius);
				explosionList.append(exp);
				explode(exp);
				return;
			}
		}
	} else if (missile.x < missile.Px) {
		console.log("Start", missile.player.x);
		startX = Math.floor(missile.pX);
		endX = Math.floor(missile.x);
		startY = missile.y;
		yD = missile.pY - missile.y;
		for (x = startX; x >= endX; x--) {
			yy = startY + (yD*((startX-x)/(startX-endX)));
			console.log("First",hr[x],yy);
			if (hr[x] > yy) {
				console.log(x,startX,endX);
				missile.remove();
				exp = new Explosion(x, yy, expLife, expRadius);
				explosionList.append(exp);
				explode(exp);
				return;
			}
		}
	} else { // missile.x == missile.pX
		console.log("last", missile.y, hr[Math.floor(missile.x)]);
		if (missile.y < hr[Math.floor(missile.x)]) {
			missile.remove();
			exp = new Explosion(missile.x, hr[Math.floor(missile.x)], expLife, expRadius);
			explosionList.append(exp); 
			explode(exp);
			return;

		}
	}
	if (missile.x > width || missile.x < 0 || missile.y < 0) {
		missile.remove();	
	}
}

function updateExplosion(explosion) {
	if (explosion.life == expLife) {
		explode(explosion);
	}
	explosion.deplete();
}

function explode(explosion) {
	hr = terrain.heightArray;
	var x = Math.floor(explosion.x);
	var y = Math.floor(explosion.y);
	for (i = 0; i < expRadius2; i++) {
		var sub = Math.sqrt(expRadius2-(i*i));
		var bottom = y-sub;
		if (x+i < width && bottom < hr[x+i]) {
			hr[x+i] -= Math.min(sub*2, hr[x+i]-bottom);
		}
		if (x-i >= 0 && i != 0 && bottom < hr[x-i]) {
			hr[x-i] -= Math.min(sub*2, hr[x-i]-bottom);
		}
	}
	terrain.notifyMod(x-expRadius, x+expRadius);
}

function manageInfo() {
	lastCycle = thisCycle;
	thisCycle = new Date().getTime();
}

function renderBackground() {
	bgCtxt.fillStyle = "rgba(0,0,0,1.0)";
	bgCtxt.fillRect(0,0,width,height);
}

function logInfo() {
	if (devMode) {
		elapsed = thisCycle - lastCycle;
		frameRate = 1000/elapsed;
		console.log("Frame Rate: " + frameRate);
		console.log("Players: " + playerList.length());
		console.log("Missiles: " + missileList.length());
		console.log("Explosions: " + explosionList.length());
	}
}

function r(lim) {
	return Math.floor(Math.random()*lim)+1
}

function captureKeydown(e) {
	var keyCode = e.keyCode;
	if (keyCode == 48) {
		devMode = !devMode;
		return;
	}	       
	playerList.forEach(function(p) {keydown(keyCode,p.keyBindings);});
}

function keydown(keyCode, keyBinding) {
	if (keyBinding.upKey == keyCode) {
		keyBinding.up = true;
	}
	if (keyBinding.downKey == keyCode) {
		keyBinding.down = true;
	}
	if (keyBinding.leftKey == keyCode) {
		keyBinding.left = true;
	}
	if (keyBinding.rightKey == keyCode) {
		keyBinding.right = true;
	}
	if (keyBinding.firingKey == keyCode) {
		keyBinding.firing = true;
	}
}

function captureKeyup(e) {
	var keyCode = e.keyCode;
	playerList.forEach(function(p) {keyup(keyCode,p.keyBindings);});
}

function keyup(keyCode, keyBinding) {
	if (keyBinding.upKey == keyCode) {
		keyBinding.up = false;
	}
	if (keyBinding.downKey == keyCode) {
		keyBinding.down = false;
	}
	if (keyBinding.leftKey == keyCode) {
		keyBinding.left = false;
	}
	if (keyBinding.rightKey == keyCode) {
		keyBinding.right = false;
	}
	if (keyBinding.firingKey == keyCode) {
		keyBinding.firing = false;
	}
}

