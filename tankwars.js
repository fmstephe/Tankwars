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

document.onkeydown = captureKeydown
document.onkeyup = captureKeyup

// Global Variables
var fgCtxt;
var bgCtxt;
var terrain;
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

function Clear(x, y, width, height) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
}

function Player(x, name, keyBindings) {
	this.x = x;
	this.y = 0; // This gets set automatically by the physics
	this.name = name;
	this.arc = 0;
	this.power = initPower;
	this.keyBindings = keyBindings;
	this.missile = null;
	this.clr = new Clear(x-turretLength,y-turretLength,turretLength*2,turretLength*2);
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
	this.setClear = setClear;
	this.advance = advance;
	this.setClear();
}

function setClear() {
	var cX = Math.min(this.x,this.prevX);
	var cY = Math.min(this.y,this.prevY);
	var dX = Math.abs(this.x-this.prevX);
	var dY = Math.abs(this.y-this.prevY);
	this.clr = new Clear(cX,cY,dX,dY);
}

function advance() {
	this.prevX = this.x;
	this.prevY = this.y;
	this.x += this.pushX;
	this.pushY -= gravity;
	this.y += this.pushY;
}

function Explosion(missile) {
	this.x = missile.x;
	this.y = missile.y;
	this.life = expLife;
	this.next = null;
	this.prev = null;
}

function cleanExplosions() {
	expList.filter(cleanExplosion);
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
	var fgCanvas = document.getElementById("foreground");
	var bgCanvas = document.getElementById("background");
	fgCtxt = fgCanvas.getContext("2d")
	bgCtxt = bgCanvas.getContext("2d")
	height = bgCanvas.height;
	width = bgCanvas.width;
	terrain = generateTerrain(width, height);
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
		/*
		player.missile.prevX = player.missile.x;
		player.missile.prevY = player.missile.y;
		player.missile.x += player.missile.pushX;
		player.missile.pushY -= gravity;
		player.missile.y += player.missile.pushY;
		*/
		player.missile.advance();
		if (terrain[Math.floor(player.missile.x)] >= player.missile.y) {
			exp = new Explosion(player.missile);
			player.missile = null;
			expList.append(exp);
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
	fgCtxt.fillStyle = "rgba(0,0,0,1.0)";
	fgCtxt.fillRect(0,0,width,height);
	fgCtxt.fillStyle = "rgba(100,100,100,1.0)";
	fgCtxt.beginPath();
	fgCtxt.moveTo(0,height);
	for (x = 0; x < terrain.length; x++) {
		fgCtxt.lineTo(x, height - terrain[x]);
	}
	fgCtxt.lineTo(width,height);
	fgCtxt.closePath();
	fgCtxt.fill();
}

function renderPlayer(player) {
	fgCtxt.fillStyle = "rgba(255,30,40,1.0)";
	fgCtxt.beginPath();
	fgCtxt.arc(player.x, height-player.y, 10, 0, 2*Math.PI, true);
	fgCtxt.closePath();
	fgCtxt.fill();
	turretX = player.x+turretLength*Math.sin(player.arc);
	turretY = height-(player.y+(turretLength*Math.cos(player.arc)));
	fgCtxt.strokeStyle = "rgba(255,255,255,1.0)";
	fgCtxt.lineWidth = 5;
	fgCtxt.beginPath();
	fgCtxt.moveTo(player.x, height-player.y);
	fgCtxt.lineTo(turretX,turretY);
	fgCtxt.closePath();
	fgCtxt.stroke();
	renderMissile(player.missile);
}

function renderMissile(missile) {
	if (missile != null) {
		var prevX = missile.prevX;
		var prevY = height - missile.prevY;
		var x = missile.x;
		var y = height - missile.y;
		fgCtxt.strokeStyle = fgCtxt.createLinearGradient(Math.floor(prevX),Math.floor(prevY),Math.floor(x),Math.floor(y));
		//fgCtxt.strokeStyle = "rgba(255,255,255,1)"; //fgCtxt.createLinearGradient(0,0,width,height);
		fgCtxt.strokeStyle.addColorStop(0,"rgba(255,255,255,0.1)");
		fgCtxt.strokeStyle.addColorStop(1,"rgba(255,255,255,1)");
		fgCtxt.lineWidth = 5;
		fgCtxt.beginPath();
		fgCtxt.moveTo(prevX,prevY);
		fgCtxt.lineTo(x,y);
		fgCtxt.closePath();
		fgCtxt.stroke();
	}
}

function renderExplosions() {
	fgCtxt.fillStyle = "rgba(255,30,30,1.0)";
	expList.forEach(renderExplosion);
}

function renderExplosion(exp) {
	var x = Math.floor(exp.x);
	var y = Math.floor(exp.y);
	fgCtxt.beginPath();
	fgCtxt.arc(x, height-y, expRadius, 0, 2*Math.PI, true);
	fgCtxt.closePath();
	fgCtxt.fill();
}

function renderInfo() {
	if (devMode) {
		elapsed = thisCycle - lastCycle;
		frameRate = 1000/elapsed;
		fgCtxt.fillStyle = "rgba(255,255,255,1.0)";
		fgCtxt.font = "30px san-serif";
		fgCtxt.textBaseline = "top";
		fgCtxt.fillText(frameRate.toString(), 0, 0);
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
		fgCtxt.beginPath();
		fgCtxt.arc(x, y, 50, 0, 2*Math.PI, true);
		fgCtxt.fillStyle = "rgba(255,30,40,1.0)";
		fgCtxt.fill()
		fgCtxt.lineWidth = 5
		fgCtxt.strokeStyle = "rgba(255, 255, 255, 0.8)";
		fgCtxt.stroke();
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

