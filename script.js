const startBtn = document.getElementById("startBtn");
const statusDiv = document.getElementById("status");
const canvas = document.getElementById("game-area");
const ctx = canvas.getContext("2d");

// Set the canvas size to 400x400
canvas.width = 400;
canvas.height = 400;

const gravity = 0.01;
const sideEngineThrust = 0.01;
const mainEngineThrust = 0.03;
const lzBuffer = 3;

class Rect {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  get top() {
    return this.y;
  }
  get bottom() {
    return this.y + this.h;
  }
  get left() {
    return this.x;
  }
  get right() {
    return this.x + this.w;
  }
  get center() {
    return {
      x: this.x + this.w * 0.5,
      y: this.y + this.h * 0.5
    }
  }
  // Returns true if this Rect overlaps the other Rect, false otherwise
  overlaps(other) {
    return !(
      this.bottom < other.top /* above */|| 
      this.top > other.bottom /* below */ || 
      this.left > other.right /* to the left */ ||
      this.right < other.left /* to the right */
    )
  }
}

// Projectiles list
const prjs = [];

const terrain = [];

const ship = new Rect(0, 0, 8, 22);
ship.color = "black";
ship.dx = 0;
ship.dy = 0;
ship.mainEngine = false;
ship.leftEngine = false;
ship.rightEngine = false;
ship.crashed = false;
ship.landed = false;

const platform = new Rect(190, 345, 20, 5);
platform.color = "blue";

terrain.push([0, 310]);
terrain.push([100, 240]);
terrain.push([platform.left, platform.bottom]);
terrain.push([platform.right, platform.bottom]);
terrain.push([300, 250]);
terrain.push([350, 350]);
terrain.push([400, 300]);

function drawPlatform() {
  ctx.fillStyle = platform.color;
  ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
}

function drawTerrain() {
  ctx.beginPath()
  ctx.moveTo(0,400);
  for (let i = 0; i < terrain.length; i++) {
    ctx.lineTo(terrain[i][0], terrain[i][1]);
  }
  ctx.lineTo(400,400);
  ctx.closePath();
  ctx.fillStyle = 'gray'
  ctx.fill();

}

function initShip() {
  // position
  ship.x = 150 + Math.random() * 100;
  ship.y = 150 + Math.random() * 100;
  // velocity
  ship.dx = Math.random();
  ship.dy = Math.random();
  ship.mainEngine = false;
  ship.leftEngine = false;
  ship.rightEngine = false;
  ship.crashed = false;
  ship.landed = false;
}

function drawPrjs() {
  for (let i= 0; i < prjs.length; i++) {
    let prj = prjs[i];
    ctx.fillStyle = prj.color;
    ctx.fillRect(prj.x, prj.y, prj.w, prj.h);
  }
}

function initPrjs() {
  prjs.length = 0;
  for (let i = 0; i < 10; i++) {
    let prj = new Rect(Math.floor(Math.random() * 400), 0, 4, 4);
    prj.dx = 1 - (Math.random() * 2);
    prj.dy = Math.random();
    prj.color = "brown";
    prjs.push(prj);
  }
}

function drawTriangle(a, b, c, fillStyle) {
  ctx.beginPath();
  // draw a triange from three points a, b, and c.
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.lineTo(c[0], c[1]);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function drawShip() {
  ctx.save();
  ctx.beginPath();
  ctx.translate(ship.center.x, ship.center.y);
  ctx.rect(ship.w * -0.5, ship.h * -0.5, ship.w, ship.h);
  ctx.fillStyle = ship.color;
  ctx.fill();
  ctx.closePath();

  // Draw the flame if engine is on
  if (ship.mainEngine) {
    drawTriangle(
      [ship.w * -0.5, ship.h * 0.5],
      [ship.w * 0.5, ship.h * 0.5],
      [0, ship.h * 0.5 + Math.random() * 10],
      "orange"
    );
  }
  if (ship.rightEngine) {
    drawTriangle(
      [ship.w * 0.5, ship.h * -0.25],
      [ship.w * 0.5 + Math.random() * 10, 0],
      [ship.w * 0.5, ship.h * 0.25],
      "orange"
    );
  }
  if (ship.leftEngine) {
    drawTriangle(
      [ship.w * -0.5, ship.h * -0.25],
      [ship.w * -0.5 - Math.random() * 10, 0],
      [ship.w * -0.5, ship.h * 0.25],
      "orange"
    );
  }
  ctx.restore();
}

function updateShip() {

  ship.dy += gravity;

  // what other forces acting on the ship?
  if (ship.rightEngine) {
    ship.dx -= sideEngineThrust;
  }
  if (ship.leftEngine) {
    ship.dx += sideEngineThrust;
  }
  if (ship.mainEngine) {
    ship.dy -= mainEngineThrust;
  }

  // after calculating velocity, update our position
  ship.x += ship.dx;
  ship.y += ship.dy;
}

function updatePrjs() {
  for (let i = 0; i < prjs.length; i++) {
    let prj = prjs[i];
    prj.dy += gravity;
    prj.y += prj.dy;
    prj.x += prj.dx;
  }
}

function checkCollision() {
  // check that ship flew out of bounds. If so, set ship.crashed = true
  if (ship.top < 0 || ship.bottom > canvas.height || ship.left < 0 || ship.right > canvas.width) {
    ship.crashed = true;
    return;
  }

  // check that ship hit platform
  if (ship.overlaps(platform)) {
    ship.crashed = true;
    return;
  }

  // check that ship hit a projectile
  for (let i = 0; i < prjs.length; i++) {
    if (ship.overlaps(prjs[i])) {
      ship.crashed = true;
      return;
    }
  }

  // check if ship landed. If so, set ship.landed = true
  // - What conditions have to be true for a soft landing?
  if (
    ship.dx < 0.2 &&
    ship.dy < 0.2 &&
    ship.left > platform.left &&
    ship.right < platform.right &&
    ship.bottom < platform.top &&
    platform.top - ship.bottom < lzBuffer
    ) {
    ship.landed = true;
    return;
  }
}

function gameLoop() {
  updateShip();
  updatePrjs();

  checkCollision();
  if (ship.crashed) {
    statusDiv.innerHTML = "GAME OVER - you crashed";
    endGame();
  } else if (ship.landed) {
    statusDiv.innerHTML = "LANDED - you win!";
    endGame();
  } else {
    // Clear entire screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPrjs();
    drawShip();
    drawPlatform();
    drawTerrain();
    requestAnimationFrame(gameLoop);
  }
}

function keyLetGo(event) {
  switch (event.keyCode) {
    case 37: // Left Arrow key
      ship.leftEngine = false;
      break;
    case 39: // Right Arrow key
      ship.rightEngine = false;
      break;
    case 40: // Down Arrow key
      ship.mainEngine = false;
      break;
    default:
      return;
  }
  // don't let arrow keys move screen around
  event.preventDefault();
}

function keyPressed(event) {
  switch (event.keyCode) {
    case 37: // Left Arrow key
      ship.leftEngine = true;
      break;
    case 39: // Right Arrow key
      ship.rightEngine = true;
      break;
    case 40: // Down Arrow key
      ship.mainEngine = true;
      break;
    default:
      return;
  }
  // don't let arrow keys move screen around
  event.preventDefault();
}

function start() {
  // console.log("start", ship);
  startBtn.disabled = true;
  statusDiv.innerHTML = "";
  initShip();
  initPrjs();

  document.addEventListener("keyup", keyLetGo);
  document.addEventListener("keydown", keyPressed);
  requestAnimationFrame(gameLoop);
}

function endGame() {
  // console.log("endGame", ship);
  startBtn.disabled = false;
  document.removeEventListener("keyup", keyLetGo);
  document.removeEventListener("keydown", keyPressed);
}