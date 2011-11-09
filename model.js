// Interface for all model elements
//
// Used to clear out previous frame's drawing
// setClear(ctxt)
// Asks this entity to draw itself to the context provided
// render(ctxt)
//
//
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

function Player(x, name, turretLength, initPower, keyBindings) {
	this.x = x;
	this.y = 0; // This gets set automatically by the physics
	this.name = name;
	this.arc = 0;
	this.power = initPower;
	this.turretLength = turretLength;
	this.keyBindings = keyBindings;
	this.canFire = true;
	this.createMissile = createMissilePlayer;
	this.setClear = setClearPlayer;
	this.shouldRemove = shouldRemovePlayer;
	this.render = renderPlayer;
}

function createMissilePlayer(gravity) {
	this.canFire = false;
	return new Missile(this, gravity);
}

function setClearPlayer(ctxt) {
	var x = this.x-this.turretLength;
	var y = height - (this.y + this.turretLength);
	var size = this.turretLength*2;
	ctxt.clearRect(x, y, size, size);
}

function shouldRemovePlayer() {
	return false;
}

// ctxt.fillStyle = "rgba(255,30,40,1.0)";
// ctxt.strokeStyle = "rgba(255,255,255,1.0)";
// ctxt.lineWidth = 5;
function renderPlayer(ctxt) {
	ctxt.beginPath();
	ctxt.arc(this.x, height-this.y, 10, 0, 2*Math.PI, true);
	ctxt.closePath();
	ctxt.fill();
	turretX = this.x+this.turretLength*Math.sin(this.arc);
	turretY = height-(this.y+(this.turretLength*Math.cos(this.arc)));
	ctxt.beginPath();
	ctxt.moveTo(this.x, height-this.y);
	ctxt.lineTo(turretX,turretY);
	ctxt.closePath();
	ctxt.stroke();
}

function Missile(player, gravity) {
	this.pushX = (player.power*Math.sin(player.arc));
	this.pushY = (player.power*Math.cos(player.arc));
	this.x = player.x;
	this.y = player.y;
	this.pX = player.x;
	this.pY = player.y;
	this.player = player;
	this.gravity = gravity;
	this.removed = false;
	this.setClear = setClearMissile;
	this.remove = removeMissile;
	this.shouldRemove = shouldRemoveMissile;
	this.render = renderMissile;
	this.advance = advance;
}

function setClearMissile(ctxt) {
	var x = Math.min(this.pX,this.x)-10;
	var y = height - (Math.max(this.pY,this.y)+10);
	var width = Math.abs(this.pX-this.x)+20;
	var h = Math.abs(this.pY-this.y)+20;
	ctxt.clearRect(x,y,width,h);
}

function removeMissile() {
	this.removed = true;
	this.player.canFire = true;
}

function shouldRemoveMissile() {
	return this.removed;	
}

// ctxt.lineWidth = 5;
function renderMissile(ctxt) {
	var pX = this.pX;
	var pY = height - this.pY;
	var x = this.x;
	var y = height - this.y;
	ctxt.strokeStyle = ctxt.createLinearGradient(Math.floor(pX),Math.floor(pY),Math.floor(x),Math.floor(y));
	ctxt.strokeStyle.addColorStop(0,"rgba(255,255,255,0.1)");
	ctxt.strokeStyle.addColorStop(1,"rgba(255,255,255,1)");
	ctxt.beginPath();
	ctxt.moveTo(pX,pY);
	ctxt.lineTo(x,y);
	ctxt.closePath();
	ctxt.stroke();
}

function advance() {
	this.ppX = this.pX;
	this.ppY = this.pY;
	this.pX = this.x;
	this.pY = this.y;
	this.x += this.pushX;
	this.pushY -= this.gravity;
	this.y += this.pushY;
}

function Explosion(x, y, life, radius) {
	this.x = x;
	this.y = y;
	this.life = life;
	this.radius = radius;
	this.shouldRender = true;
	this.shouldRemove = false;
	this.setClear = setClearExplosion;
	this.deplete = depleteExplosion;
	this.shouldRemove = shouldRemoveExplosion;
	this.render = renderExplosion;
}

function setClearExplosion(ctxt) {
	var x = this.x - this.radius-2;
	var y = height - (this.y + this.radius + 2);
	var w = this.radius*2 + 4;
	var h = this.radius*2 + 4;
	ctxt.clearRect(x,y,w,h);
}

function depleteExplosion() {
	this.life--;
}

function shouldRemoveExplosion() {
	return this.life <= 0;
}

// fgCtxt.fillStyle = "rgba(255,30,30,1.0)";
function renderExplosion(ctxt) {
	var x = Math.floor(this.x);
	var y = Math.floor(this.y);
	ctxt.beginPath();
	ctxt.arc(x, height-y, this.radius, 0, 2*Math.PI, true);
	ctxt.closePath();
	ctxt.fill();
}

function Terrain(heightArray, w, h) {
	this.heightArray = heightArray;
	this.w = w;
	this.h = h;
	this.regionList = new LinkedList();
	this.notifyMod = notifyModTerrain;
	this.clearMods = clearModsTerrain;
	this.setClear = setClearTerrain;
	this.render = renderTerrain;
	this.notifyMod(0,w);
}

function notifyModTerrain(from, to) {
	this.regionList.append(new Region(from,to));
}

function clearModsTerrain() {
	this.regionList.clear();
}

function setClearTerrain(ctxt) {
	this.regionList.forEach(function(r) {doClearTerrain(ctxt,r);});
}

function doClearTerrain(ctxt, region) {
	var x = region.from;
	var y = 0;
	var w = region.to - region.from;
	var h = height;
	ctxt.clearRect(x,y,w,h);
}

function renderTerrain(ctxt) {
	this.regionList.forEach(function(r) {doRenderTerrain(ctxt,r);});
}

// bgCtxt.fillStyle = "rgba(100,100,100,1.0)";
function doRenderTerrain(ctxt, region) {
	console.log("Render Terrain");
	ctxt.beginPath();
	ctxt.moveTo(region.from,height);
	for (x = region.from; x <= region.to; x++) {
		ctxt.lineTo(x, height - terrain.heightArray[x]);
	}
	ctxt.lineTo(region.to,height);
	ctxt.closePath();
	ctxt.fill();
}

function Region(from, to) {
	this.from = from;
	this.to = to;
}
