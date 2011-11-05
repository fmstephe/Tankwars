// Global Constants
var maxPower = 100;
var minPower = 0;
var turretLength = 20;
var rotationSpeed = Math.PI/60;
var frameRate = 100;
var gravity = 10;
var expLife = 1000;
var expRadius = 100;

document.onkeydown = captureKeydown
document.onkeyup = captureKeyup

// Global Variables
var terrain;
var canvas;
var height;
var width;
var player1;
var player2;
var firstExp;
var lastExp;

// Player Object
function Player(x, name, keyBindings) {
	this.x = x;
	this.y = 0; // This gets set automatically by the physics
	this.name = name;
	this.arc = 0;
	this.power = 0;
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
	pushX = (player.power*Math.sin(player.arc))/10;
	pushY = (player.power*Math.cos(player.arc))/10;
	this.x = player.x;
	this.y = player.y;
	this.pushX = pushX;
	this.pushY = pushY;
}

function Explosion(missile) {
	this.x = missile.x;
	this.y = missile.y;
	this.life = expLife;
	this.next = null;
	this.prev = null;
}

function addExplosion(exp) {
	if (firstExp == null) {
		firstExp = exp;
		lastExp = exp;
	} else {
		exp.prev = lastExp;
		lastExp = exp;
	}
}

function removeExplosion(exp) {
	if (exp.prev != null && exp.next != null) {
		exp.prev.next = exp.next;
		exp.next.prev = exp.prev;
		return;
	}
	if (exp.next == null) {
		lastExp = exp.prev;
	}
	if (exp.prev == null) {
		firstExp = exp.next;
	}
}

function cleanExplosions() {
	exp = firstExp;
	while (exp != null) {
		exp.life--;
		if (exp.life > 0) {
			removeExplosion(exp);
		}
		exp = exp.next;
	}
}

function init() {
	firstExp = null;
	lastExp = null;
	canvas = document.getElementById("canvas");
	height = canvas.height;
	width = canvas.width;
	terrain = generateTerrain(canvas.width, canvas.height);
	kb1 = new KeyBindings(87,83,65,68,70);
	player1 = new Player(r(width/3),"Player1",kb1);
	kb2 = new KeyBindings(73,75,74,76,72);
	player2 = new Player(width-r(width/3),"Player2",kb2);
	setInterval(loop, frameRate);
}

function loop() {
	managePlayer(player1);
	managePlayer(player2);
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
		player.power += 10;
	}
	if (player.keyBindings.down) {
		player.power -= 10;
	}
	player.power = Math.max(player.power,minPower);
	player.power = Math.min(player.power,maxPower);
}

function playerMissile(player) {
	if (player.missile == null && player.keyBindings.firing) {
		player.missile = new Missile(player);
	}
	if (player.missile != null) {
		oldX = player.missile.x;
		oldY = player.missile.y;
		player.missile.x += player.missile.pushX;
		player.missile.y += player.missile.pushY - gravity;
		for (var i = Math.floor(oldX); i <= Math.floor(player.missile.x); i++) {
			if (terrain[i] >= player.missile.y) {
				player.missile = null;
				exp = new Explosion(player);
				addExplosion(exp);
				explode(exp);
				return;
			}
		}
		if (player.missile.x > width || player.missile.x < 0) {
			player.missile = null;
		}
	} else if (player.explosion != null) {
		player.explosion = null;
	}
}

function render() {
	context = canvas.getContext("2d");
	renderTerrain(context);
	renderPlayer(context, player1);
	renderPlayer(context, player2);
	renderExplosions(context);
}

function renderTerrain(context) {
	context.fillStyle = "rgba(0,0,0,1.0)";
	context.fillRect(0,0,canvas.width,canvas.height);
	context.fillStyle = "rgba(100,100,100,1.0)";
	context.lineWidth = 5
	context.strokeStyle = "rgba(200, 200, 200, 0.3)";
	context.beginPath();
	context.moveTo(0, height);
	for (x = 0; x < terrain.length; x++) {
		context.lineTo(x, height - terrain[x]);
	}
	context.lineTo(width,height);
	context.closePath();
	context.stroke();
	context.beginPath();
	context.moveTo(0,height);
	for (x = 0; x < terrain.length; x++) {
		context.lineTo(x, height - terrain[x]);
	}
	context.lineTo(width,height);
	context.closePath();
	context.fill();
}

function renderPlayer(context, player) {
	context.fillStyle = "rgba(255,30,40,1.0)";
	context.beginPath();
	context.arc(player.x, height-player.y, 10, 0, 2*Math.PI, true);
	context.closePath();
	context.fill();
	turretX = player.x+turretLength*Math.sin(player.arc);
	turretY = height-(player.y+(turretLength*Math.cos(player.arc)));
	context.strokeStyle = "rgba(255,255,255,1.0)";
	context.lineWidth = 5;
	context.beginPath();
	context.moveTo(player.x, height-player.y);
	context.lineTo(turretX,turretY);
	context.closePath();
	context.stroke();
	renderMissile(context, player);
}

function renderMissile(context, player) {
	if (player.missile != null) {
		context.fillStyle = "rgba(255,255,255,1.0)";
		context.beginPath();
		context.arc(player.missile.x, height-player.missile.y, 5, 0, 2*Math.PI, true);
		context.closePath();
		context.fill();
	}
	if (player.explosion != null) {
		context.fillStyle = "rgba(255,0,0,1.0)";
		context.beginPath();
		context.arc(player.explosion.x, height-player.explosion.y, 50, 0, 2*Math.PI, true);
		context.closePath();
		context.fill();
	}
}

function renderExplosions(context) {
	exp = firstExp;
	while (exp != null) {
		context.fillStyle = "rgba(255,30,40,1.0)";
		context.beginPath();
		context.arc(exp.x, height-exp.y, 50, 0, 2*Math.PI, true);
		context.closePath();
		context.fill();
		exp = exp.next;
	}
}

function r(lim) {
	return Math.floor(Math.random()*lim)+1
}

function explode(explosion) {
	var x = explosion.x;
	var y = height-explosion.y;
	var mult = (Math.PI/2)/expRadius;
	for (i = 0; i < expRadius; i++) {
		var sub = expRadius*Math.cos(i*mult);
		var bottom = y-sub;
		if (x+i < width && bottom < terrain[x+i]) {
			terrain[x+i] -= Math.min(sub, terrain[x+i]-bottom)
		}
		if (x-i >= 0 && i != 0 && bottom < terrain[x-i]) {
			terrain[x-i] -= Math.min(sub, terrain[x-i]-bottom)
		}
	}
/*
		context.beginPath();
		context.arc(x, y, 50, 0, 2*Math.PI, true);
		context.fillStyle = "rgba(255,30,40,1.0)";
		context.fill()
		context.lineWidth = 5
		context.strokeStyle = "rgba(255, 255, 255, 0.8)";
		context.stroke();
*/
}

function captureKeydown(e) {
	var keyCode = e.keyCode;
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

