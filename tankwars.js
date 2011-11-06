// Global Constants
var maxPower = 170;
var minPower = 0;
var initPower = 50;
var powerInc = 0.4;
var gravity = 4;
var turretLength = 20;
var rotationSpeed = Math.PI/50;
var frameRate = 30;
var framePause = Math.floor(1000/frameRate);
var expLife = 0.1*frameRate;
var expRadius = 50;
var expRadius2 = expRadius*expRadius;
var ctxt;

document.onkeydown = captureKeydown
document.onkeyup = captureKeyup

// Global Variables
var terrain;
var canvas;
var height;
var width;
var player1;
var player2;
// Player linked list
var firstPlayer;
var lastPlayer;
// Explosion linked list
var expList;
var lastCycle;
var thisCycle;
var devMode;

function Player(x, name, keyBindings) {
	this.x = x;
	this.y = 0; // This gets set automatically by the physics
	this.name = name;
	this.arc = 0;
	this.power = initPower;
	this.keyBindings = keyBindings;
	this.missile = null;
}

function KeyBindings(upKey, downKey, leftKey, rightKey, firingKey) {
	this.upKey = upKey;
	this.downKey = downKey;
	this.leftKey = leftKey;
	this.rightKey = rightKey;
	this.firingKey = firingKey;
	this.up = false;
	this.down = false;
	this.left = false;
	this.right = false;
	this.firing = false;
}

function Missile(player) {
	this.pushX = (player.power*Math.sin(player.arc));
	this.pushY = (player.power*Math.cos(player.arc));
	this.x = player.x;
	this.y = player.y;
	this.prevX = player.x;
	this.prevY = player.y;
}

function Explosion(missile) {
	this.x = missile.x;
	this.y = missile.y;
	this.life = expLife;
	this.next = null;
	this.prev = null;
}

function cleanExplosions() {
	filter(expList, cleanExplosion);
}

function cleanExplosion(exp) {
	exp.life--;
	return exp.life <= 0;
}

function init() {
	devMode = false;
	lastCycle = new Date().getTime();
	thisCycle = new Date().getTime();
	expList = new LinkedList();
	canvas = document.getElementById("canvas");
	ctxt = canvas.getContext("2d")
	height = canvas.height;
	width = canvas.width;
	terrain = generateTerrain(canvas.width, canvas.height);
	kb1 = new KeyBindings(87,83,65,68,70);
	player1 = new Player(r(width/3),"Player1",kb1);
	kb2 = new KeyBindings(73,75,74,76,72);
	player2 = new Player(width-r(width/3),"Player2",kb2);
	setInterval(loop, framePause);
}

function loop() {
	cleanExplosions();
	managePlayer(player1);
	managePlayer(player2);
	manageInfo();
	render();
}

function managePlayer(player) {
	playerUpdate(player);
	playerMissile(player);
}

function playerUpdate(player) {
	player.y = terrain[player.x];
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
}

function playerMissile(player) {
	if (player.missile == null && player.keyBindings.firing) {
		player.missile = new Missile(player);
	}
	if (player.missile != null) {
		player.missile.prevX = player.missile.x;
		player.missile.prevY = player.missile.y;
		player.missile.x += player.missile.pushX;
		player.missile.pushY -= gravity;
		player.missile.y += player.missile.pushY;
		if (terrain[Math.floor(player.missile.x)] >= player.missile.y) {
			exp = new Explosion(player.missile);
			player.missile = null;
			append(expList, exp);
			explode(exp);
			return;
		}
		if (player.missile.x > width || player.missile.x < 0) {
			player.missile = null;
		}
	} else if (player.explosion != null) {
		player.explosion = null;
	}
}

function manageInfo() {
	lastCycle = thisCycle;
	thisCycle = new Date().getTime();
}

function render() {
	renderTerrain();
	renderPlayer(player1);
	renderPlayer(player2);
	renderExplosions();
	renderInfo();
}

function renderTerrain() {
	ctxt.fillStyle = "rgba(0,0,0,1.0)";
	ctxt.fillRect(0,0,canvas.width,canvas.height);
	ctxt.fillStyle = "rgba(100,100,100,1.0)";
	ctxt.beginPath();
	ctxt.moveTo(0,height);
	for (x = 0; x < terrain.length; x++) {
		ctxt.lineTo(x, height - terrain[x]);
	}
	ctxt.lineTo(width,height);
	ctxt.closePath();
	ctxt.fill();
}

function renderPlayer(player) {
	ctxt.fillStyle = "rgba(255,30,40,1.0)";
	ctxt.beginPath();
	ctxt.arc(player.x, height-player.y, 10, 0, 2*Math.PI, true);
	ctxt.closePath();
	ctxt.fill();
	turretX = player.x+turretLength*Math.sin(player.arc);
	turretY = height-(player.y+(turretLength*Math.cos(player.arc)));
	ctxt.strokeStyle = "rgba(255,255,255,1.0)";
	ctxt.lineWidth = 5;
	ctxt.beginPath();
	ctxt.moveTo(player.x, height-player.y);
	ctxt.lineTo(turretX,turretY);
	ctxt.closePath();
	ctxt.stroke();
	renderMissile(player.missile);
}

function renderMissile(missile) {
	if (missile != null) {
		var prevX = missile.prevX;
		var prevY = height - missile.prevY;
		var x = missile.x;
		var y = height - missile.y;
		ctxt.strokeStyle = ctxt.createLinearGradient(Math.floor(prevX),Math.floor(prevY),Math.floor(x),Math.floor(y));
		//ctxt.strokeStyle = "rgba(255,255,255,1)"; //ctxt.createLinearGradient(0,0,width,height);
		ctxt.strokeStyle.addColorStop(0,"rgba(255,255,255,0.1)");
		ctxt.strokeStyle.addColorStop(1,"rgba(255,255,255,1)");
		ctxt.lineWidth = 5;
		ctxt.beginPath();
		ctxt.moveTo(prevX,prevY);
		ctxt.lineTo(x,y);
		ctxt.closePath();
		ctxt.stroke();
	}
}

function renderExplosions() {
	ctxt.fillStyle = "rgba(255,30,30,1.0)";
	forEach(expList, renderExplosion);
}

function renderExplosion(exp) {
	var x = Math.floor(exp.x);
	var y = Math.floor(exp.y);
	ctxt.beginPath();
	ctxt.arc(x, height-y, expRadius, 0, 2*Math.PI, true);
	ctxt.closePath();
	ctxt.fill();
}

function renderInfo() {
	if (devMode) {
		elapsed = thisCycle - lastCycle;
		frameRate = 1000/elapsed;
		ctxt.fillStyle = "rgba(255,255,255,1.0)";
		ctxt.font = "30px san-serif";
		ctxt.textBaseline = "top";
		ctxt.fillText(frameRate.toString(), 0, 0);
	}
}

function r(lim) {
	return Math.floor(Math.random()*lim)+1
}

function explode(explosion) {
	var x = Math.floor(explosion.x);
	var y = Math.floor(explosion.y);
	for (i = 0; i < expRadius2; i++) {
		var sub = Math.sqrt(expRadius2-(i*i));
		var bottom = y-sub;
		if (x+i < width && bottom < terrain[x+i]) {
			terrain[x+i] -= Math.min(sub*2, terrain[x+i]-bottom)
		}
		if (x-i >= 0 && i != 0 && bottom < terrain[x-i]) {
			terrain[x-i] -= Math.min(sub*2, terrain[x-i]-bottom)
		}
	}
/*
		ctxt.beginPath();
		ctxt.arc(x, y, 50, 0, 2*Math.PI, true);
		ctxt.fillStyle = "rgba(255,30,40,1.0)";
		ctxt.fill()
		ctxt.lineWidth = 5
		ctxt.strokeStyle = "rgba(255, 255, 255, 0.8)";
		ctxt.stroke();
*/
}

function captureKeydown(e) {
	var keyCode = e.keyCode;
	if (keyCode == 48) {
		devMode = !devMode;
		return;
	}	       
	keydown(keyCode, player1.keyBindings)
	keydown(keyCode, player2.keyBindings)
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
	keyup(keyCode, player1.keyBindings)
	keyup(keyCode, player2.keyBindings)
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

