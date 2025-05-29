const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

// Player properties
const player = {
  width: 50,
  height: 20, // Base height
  barrelHeight: 10, // Barrel height, can be player.height / 2 or fixed
  speed: 5,
  color: 'green',
  isMovingLeftKeyboard: false,
  isMovingRightKeyboard: false,
  isMovingLeftTouch: false,
  isMovingRightTouch: false,
  isMovingLeftGamepad: false,
  isMovingRightGamepad: false,
  x: 0,
  y: 0 // Represents the BOTTOM-MOST part of the cannon graphic
};

// Enemy Configuration
const enemyConfig = {
  width: 40, 
  height: 30, 
  color: 'red',
  speed: 2,
  rows: 3,
  cols: 8,
  padding: 10,
  marginTop: 30,
  marginLeft: 60
};

let enemies = [];
let enemyDirection = 1;
let enemyMoveDown = 0;

// Bullet Configuration
const bulletConfig = {
  width: 5,
  height: 10,
  color: 'yellow',
  speed: 7
};
let bullets = [];

// Enemy Bullet Configuration
const enemyBulletConfig = { 
  width: 4, 
  height: 10, 
  color: "pink", // Differentiated from player bullets
  speed: 4 
};
let enemyBullets = [];


// Barrier Constants & Array
const BARRIER_COUNT = 4;
const BARRIER_COLOR = player.color; 
const BARRIER_BLOCK_SIZE = 5; 
const BARRIER_BLOCK_ROWS = 6; 
let barriers = [];


// Game State
let gameState = "title"; 
let gameWon = false;
let onScreenControlsEnabled = false;

// Clickable areas
let startButton = {};
let settingsButton = {};
let onScreenControlsToggleButton = {};
let backButton = {};
let gameOverToTitleButton = {}; 

const buttonHeight = 50;
const buttonPadding = 10;

// On-screen control buttons
const osButtonHeight = 60;
const osButtonWidth = 100;
const osPadding = 10;

let osLeftButton = {
  x: osPadding,
  y: canvas.height - osButtonHeight - osPadding,
  width: osButtonWidth,
  height: osButtonHeight,
  label: "<"
};
let osRightButton = {
  x: osPadding + osButtonWidth + osPadding, 
  y: canvas.height - osButtonHeight - osPadding,
  width: osButtonWidth,
  height: osButtonHeight,
  label: ">"
};
let osFireButton = {
  x: canvas.width - osButtonWidth - osPadding, 
  y: canvas.height - osButtonHeight - osPadding,
  width: osButtonWidth,
  height: osButtonHeight,
  label: "Fire"
};

// Gamepad support
let gamepads = {};

function gamepadConnected(e) {
  console.log("Gamepad connected:", e.gamepad.id);
  gamepads[e.gamepad.index] = e.gamepad;
}

function gamepadDisconnected(e) {
  console.log("Gamepad disconnected:", e.gamepad.id);
  delete gamepads[e.gamepad.index];
}

window.addEventListener("gamepadconnected", gamepadConnected);
window.addEventListener("gamepaddisconnected", gamepadDisconnected);


function initializeEnemies() {
  enemies = [];
  enemyDirection = 1;
  enemyMoveDown = 0;
  for (let row = 0; row < enemyConfig.rows; row++) {
    for (let col = 0; col < enemyConfig.cols; col++) {
      enemies.push({
        x: enemyConfig.marginLeft + col * (enemyConfig.width + enemyConfig.padding),
        y: enemyConfig.marginTop + row * (enemyConfig.height + enemyConfig.padding),
        width: enemyConfig.width,
        height: enemyConfig.height,
        color: enemyConfig.color,
        alive: true
      });
    }
  }
}

function initializeBarriers() {
  barriers = [];
  
  const targetBarrierWidth = player.width * 1.5;
  const newBarrierBlockCols = Math.floor(targetBarrierWidth / BARRIER_BLOCK_SIZE);
  console.log("Calculated newBarrierBlockCols:", newBarrierBlockCols); // Expected: 15

  const singleBarrierActualWidth = newBarrierBlockCols * BARRIER_BLOCK_SIZE;

  const interBarrierGap = 60; 
  const totalBarriersGroupWidth = (BARRIER_COUNT * singleBarrierActualWidth) + ((BARRIER_COUNT - 1) * interBarrierGap);
  const groupStartX = (canvas.width - totalBarriersGroupWidth) / 2;

  const playerCannonTopY = player.y - player.height - player.barrelHeight;
  const currentBarrierY = playerCannonTopY - (BARRIER_BLOCK_ROWS * BARRIER_BLOCK_SIZE) - 30; 

  // Barrier shape pattern. Each string must have 'newBarrierBlockCols' characters.
  // This pattern is designed for newBarrierBlockCols = 15.
  // It has BARRIER_BLOCK_ROWS (6) elements.
  const barrierShapePattern = [ 
      "   111111111   ", // Row 0
      "  11111111111  ", // Row 1
      " 1111111111111 ", // Row 2
      "111111111111111", // Row 3
      "1111  111  1111", // Row 4 (with gaps)
      "111        111"  // Row 5 (larger gaps)
  ];

  // Check if the pattern width matches the calculated columns.
  // This is a basic check; more complex adjustments might be needed if they don't match.
  if (newBarrierBlockCols !== 15) {
    console.warn(`Barrier shape pattern width (15) does not match calculated newBarrierBlockCols (${newBarrierBlockCols}). Falling back to solid rectangular barriers.`);
    // Fallback to solid rectangular barriers if pattern doesn't match
    for (let i = 0; i < BARRIER_COUNT; i++) {
      const barrierX = groupStartX + i * (singleBarrierActualWidth + interBarrierGap);
      let barrier = { x: barrierX, y: currentBarrierY, blocks: [] };
      for (let row = 0; row < BARRIER_BLOCK_ROWS; row++) {
        for (let col = 0; col < newBarrierBlockCols; col++) {
          let blockX = barrier.x + col * BARRIER_BLOCK_SIZE;
          let blockY = barrier.y + row * BARRIER_BLOCK_SIZE;
          barrier.blocks.push({ 
            x: blockX, y: blockY, 
            width: BARRIER_BLOCK_SIZE, height: BARRIER_BLOCK_SIZE, 
            alive: true 
          });
        }
      }
      barriers.push(barrier);
    }
  } else {
    // Use the shape pattern
    for (let i = 0; i < BARRIER_COUNT; i++) {
      const barrierX = groupStartX + i * (singleBarrierActualWidth + interBarrierGap);
      let barrier = { x: barrierX, y: currentBarrierY, blocks: [] };
      for (let row = 0; row < BARRIER_BLOCK_ROWS; row++) {
        // Ensure the pattern row exists to prevent errors if pattern is shorter than BARRIER_BLOCK_ROWS
        if (barrierShapePattern[row]) { 
          for (let col = 0; col < newBarrierBlockCols; col++) {
            // Ensure the character at col exists to prevent errors if pattern string is shorter
            if (barrierShapePattern[row].charAt(col) === '1') { 
              let blockX = barrier.x + col * BARRIER_BLOCK_SIZE;
              let blockY = barrier.y + row * BARRIER_BLOCK_SIZE;
              barrier.blocks.push({ 
                x: blockX, 
                y: blockY, 
                width: BARRIER_BLOCK_SIZE, 
                height: BARRIER_BLOCK_SIZE, 
                alive: true 
              });
            }
          }
        }
      }
      barriers.push(barrier);
    }
  }
}


function playerShoot() {
  const barrelTipY = player.y - player.height - player.barrelHeight;
  bullets.push({
    x: player.x + player.width / 2 - bulletConfig.width / 2,
    y: barrelTipY, 
    width: bulletConfig.width,
    height: bulletConfig.height,
    color: bulletConfig.color,
    speed: bulletConfig.speed
  });
}

function enemyShoot() {
  if (Math.random() < 0.01) { 
    let aliveEnemies = enemies.filter(e => e.alive);
    if (aliveEnemies.length > 0) {
      let shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      enemyBullets.push({
        x: shooter.x + shooter.width / 2 - enemyBulletConfig.width / 2,
        y: shooter.y + shooter.height, 
        width: enemyBulletConfig.width,
        height: enemyBulletConfig.height,
        color: enemyBulletConfig.color,
        speed: enemyBulletConfig.speed
      });
    }
  }
}


function startGame() {
  initializeEnemies();
  player.y = canvas.height - 10 - (onScreenControlsEnabled ? osButtonHeight + osPadding : 0);
  initializeBarriers(); 
  enemyBullets = []; 

  player.x = (canvas.width - player.width) / 2;
  player.isMovingLeftKeyboard = false;
  player.isMovingRightKeyboard = false;
  player.isMovingLeftTouch = false;
  player.isMovingRightTouch = false;
  player.isMovingLeftGamepad = false;
  player.isMovingRightGamepad = false;
  bullets = []; 
  gameWon = false;
  gameState = "playing";
}

function drawButton(button) {
  context.fillStyle = 'gray';
  context.fillRect(button.x, button.y, button.width, button.height);
  context.fillStyle = 'white';
  context.font = '24px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(button.label, button.x + button.width / 2, button.y + button.height / 2);
}

function drawTitleScreen() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'black';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.font = '72px Arial';
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.fillText('Space Invaders', canvas.width / 2, canvas.height / 3);

  const startButtonWidth = 300;
  startButton = {
    x: (canvas.width - startButtonWidth) / 2,
    y: canvas.height / 2 - buttonHeight - buttonPadding / 2,
    width: startButtonWidth,
    height: buttonHeight,
    label: "Start New Game"
  };
  drawButton(startButton);

  const settingsButtonWidth = 200;
  settingsButton = {
    x: (canvas.width - settingsButtonWidth) / 2,
    y: canvas.height / 2 + buttonPadding / 2,
    width: settingsButtonWidth,
    height: buttonHeight,
    label: "Settings"
  };
  drawButton(settingsButton);
}

function drawSettingsScreen() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'black';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.font = '48px Arial';
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.fillText('Settings', canvas.width / 2, canvas.height / 4);

  const toggleButtonWidth = 400;
  onScreenControlsToggleButton = {
    x: (canvas.width - toggleButtonWidth) / 2,
    y: canvas.height / 2 - buttonHeight - buttonPadding / 2,
    width: toggleButtonWidth,
    height: buttonHeight,
    label: `On-Screen Controls: ${onScreenControlsEnabled ? "Enabled" : "Disabled"}`
  };
  drawButton(onScreenControlsToggleButton);
  
  const backButtonWidth = 150;
  backButton = {
    x: (canvas.width - backButtonWidth) / 2,
    y: canvas.height / 2 + buttonPadding / 2 + 20,
    width: backButtonWidth,
    height: buttonHeight,
    label: "Back"
  };
  drawButton(backButton);
}

function drawOnScreenControls() {
  osLeftButton.y = canvas.height - osButtonHeight - osPadding;
  osRightButton.y = canvas.height - osButtonHeight - osPadding;
  osFireButton.y = canvas.height - osButtonHeight - osPadding;
  osFireButton.x = canvas.width - osButtonWidth - osPadding;

  drawButton(osLeftButton);
  drawButton(osRightButton);
  drawButton(osFireButton);
}

function handleGamepadInput() {
  let activeGamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  
  player.isMovingLeftGamepad = false;
  player.isMovingRightGamepad = false;

  for (let i = 0; i < activeGamepads.length; i++) {
    const gp = activeGamepads[i];
    if (gp) {
      const deadZone = 0.2;
      const horizontalAxis = gp.axes[0];

      if (horizontalAxis < -deadZone) {
        player.isMovingLeftGamepad = true;
      } else if (horizontalAxis > deadZone) {
        player.isMovingRightGamepad = true;
      }

      const fireButtonIndex = 0; 
      if (gp.buttons[fireButtonIndex] && gp.buttons[fireButtonIndex].pressed) {
        playerShoot(); 
      }
    }
  }
}

// Event Listeners
document.addEventListener('keydown', function(event) {
  if (gameState === "playing") {
    if (event.key === 'ArrowLeft') {
      player.isMovingLeftKeyboard = true;
    } else if (event.key === 'ArrowRight') {
      player.isMovingRightKeyboard = true;
    } else if (event.code === 'Space') {
      playerShoot();
    }
  }
});

document.addEventListener('keyup', function(event) {
  if (gameState !== "playing") return;
  if (event.key === 'ArrowLeft') {
    player.isMovingLeftKeyboard = false;
  } else if (event.key === 'ArrowRight') {
    player.isMovingRightKeyboard = false;
  }
});

function getMousePos(canvasEl, event) { 
  const rect = canvasEl.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function isInside(pos, rect) {
  if (!rect || typeof rect.x === 'undefined') {
    return false;
  }
  return pos.x > rect.x && pos.x < rect.x + rect.width && pos.y < rect.y + rect.height && pos.y > rect.y;
}

canvas.addEventListener('click', function(event) {
  const mousePos = getMousePos(canvas, event);

  if (gameState === "title") {
    if (isInside(mousePos, startButton)) {
      startGame();
    } else if (isInside(mousePos, settingsButton)) {
      gameState = "settings";
    }
  } else if (gameState === "settings") {
    if (isInside(mousePos, onScreenControlsToggleButton)) {
      onScreenControlsEnabled = !onScreenControlsEnabled;
    } else if (isInside(mousePos, backButton)) {
      gameState = "title";
    }
  } else if (gameState === "gameOver") {
    if (isInside(mousePos, gameOverToTitleButton)) {
      gameState = "title";
    }
  }
});

canvas.addEventListener('touchstart', function(e) {
  if (gameState === "playing" && onScreenControlsEnabled) {
    let actionTaken = false;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchPos = getMousePos(canvas, touch);
      if (isInside(touchPos, osLeftButton)) {
        player.isMovingLeftTouch = true;
        actionTaken = true;
      }
      if (isInside(touchPos, osRightButton)) {
        player.isMovingRightTouch = true;
        actionTaken = true;
      }
      if (isInside(touchPos, osFireButton)) {
        playerShoot();
        actionTaken = true;
      }
    }
    if (actionTaken) {
      e.preventDefault();
    }
  }
}, { passive: false }); 

canvas.addEventListener('touchend', function(e) {
  if (gameState === "playing" && onScreenControlsEnabled) {
    let actionTaken = false;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchPos = getMousePos(canvas, touch); 
      
      if (player.isMovingLeftTouch && !isInside(touchPos, osRightButton)) {
        let leftStillPressed = false;
        for (let j = 0; j < e.touches.length; j++) { 
            if (isInside(getMousePos(canvas, e.touches[j]), osLeftButton)) {
                leftStillPressed = true;
                break;
            }
        }
        if (!leftStillPressed) player.isMovingLeftTouch = false;
        actionTaken = true;
      }
      
      if (player.isMovingRightTouch && !isInside(touchPos, osLeftButton)) {
        let rightStillPressed = false;
        for (let j = 0; j < e.touches.length; j++) {
            if (isInside(getMousePos(canvas, e.touches[j]), osRightButton)) {
                rightStillPressed = true;
                break;
            }
        }
        if (!rightStillPressed) player.isMovingRightTouch = false;
        actionTaken = true;
      }
    }
    if (actionTaken) {
      e.preventDefault();
    }
  }
}, { passive: false });

// --- Helper functions for gameLoop "playing" state ---
function updatePlayer() {
  if (player.isMovingLeftKeyboard || player.isMovingLeftTouch || player.isMovingLeftGamepad) player.x -= player.speed;
  if (player.isMovingRightKeyboard || player.isMovingRightTouch || player.isMovingRightGamepad) player.x += player.speed;

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

function drawPlayer() {
  context.fillStyle = player.color;
  context.fillRect(player.x, player.y - player.height, player.width, player.height);
  const barrelWidth = player.width / 3;
  const barrelX = player.x + (player.width / 2) - (barrelWidth / 2);
  const barrelY = player.y - player.height - player.barrelHeight;
  context.fillRect(barrelX, barrelY, barrelWidth, player.barrelHeight);
}

function updateAndDrawBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.y -= bullet.speed;

    context.fillStyle = bullet.color;
    context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

    let bulletRemovedThisFrame = false;

    if (bullet.y + bullet.height < 0) {
      bullets.splice(i, 1);
      bulletRemovedThisFrame = true; 
      continue; 
    }

    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      if (enemy.alive &&
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y) {
        enemy.alive = false;
        bullets.splice(i, 1);
        bulletRemovedThisFrame = true;
        break; 
      }
    }

    if (bulletRemovedThisFrame) {
      continue; 
    }

    for (let b = 0; b < barriers.length; b++) {
      const barrier = barriers[b];
      for (let k = 0; k < barrier.blocks.length; k++) {
        const block = barrier.blocks[k];
        if (block.alive) {
          if (bullet.x < block.x + block.width &&
              bullet.x + bullet.width > block.x &&
              bullet.y < block.y + block.height &&
              bullet.y + bullet.height > block.y) {
            block.alive = false;
            bullets.splice(i, 1);
            bulletRemovedThisFrame = true; 
            break; 
          }
        }
      }
      if (bulletRemovedThisFrame) {
        break; 
      }
    }
  }
}

function updateAndDrawEnemyBullets(ctx) {
  ctx.fillStyle = enemyBulletConfig.color;
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    let bullet = enemyBullets[i];
    bullet.y += bullet.speed;
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    
    let bulletRemoved = false;

    const playerVisualTopY = player.y - player.height - player.barrelHeight;
    const playerVisualBottomY = player.y;

    if (bullet.x < player.x + player.width &&
        bullet.x + bullet.width > player.x &&
        bullet.y < playerVisualBottomY && 
        bullet.y + bullet.height > playerVisualTopY) { 
      
      gameState = "gameOver"; 
      gameWon = false;
      enemyBullets.splice(i, 1); 
      bulletRemoved = true;
      continue; 
    }

    if (!bulletRemoved) {
      for (let b = 0; b < barriers.length; b++) {
        const barrier = barriers[b];
        for (let k = 0; k < barrier.blocks.length; k++) {
          let block = barrier.blocks[k];
          if (block.alive &&
              bullet.x < block.x + block.width &&
              bullet.x + bullet.width > block.x &&
              bullet.y < block.y + block.height &&
              bullet.y + bullet.height > block.y) {
            block.alive = false;
            enemyBullets.splice(i, 1); 
            bulletRemoved = true;
            break; 
          }
        }
        if (bulletRemoved) break; 
      }
    }
    
    if (!bulletRemoved && bullet.y > canvas.height) { 
      enemyBullets.splice(i, 1);
    }
  }
}


function drawAlien(enemy, ctx) {
  ctx.fillStyle = enemy.color;
  const blockW = enemy.width / 8;  
  const blockH = enemy.height / 5; 
  ctx.fillRect(enemy.x + blockW * 3, enemy.y, blockW * 2, blockH);
  ctx.fillRect(enemy.x + blockW * 2, enemy.y + blockH, blockW * 4, blockH);
  ctx.fillRect(enemy.x + blockW * 1, enemy.y + blockH * 2, blockW * 6, blockH);
  ctx.fillRect(enemy.x, enemy.y + blockH * 3, enemy.width, blockH);
  ctx.fillRect(enemy.x + blockW * 1, enemy.y + blockH * 4, blockW * 2, blockH); 
  ctx.fillRect(enemy.x + blockW * 5, enemy.y + blockH * 4, blockW * 2, blockH); 
}

function updateAndDrawEnemies() {
  let hitBoundary = false;
  enemies.forEach(enemy => {
    if (enemy.alive) {
      enemy.x += enemyConfig.speed * enemyDirection;
      if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
        hitBoundary = true;
      }
    }
  });
  if (hitBoundary) {
    enemyDirection *= -1;
    enemyMoveDown = enemyConfig.height / 2; 
  }
  if (enemyMoveDown > 0) {
    const moveStep = 1; 
    enemies.forEach(enemy => { if (enemy.alive) enemy.y += moveStep; });
    enemyMoveDown -= moveStep;
  }
  enemies.forEach(enemy => {
    if (enemy.alive) {
      drawAlien(enemy, context); 
    }
  });
}

function drawBarriers(ctx) {
  ctx.fillStyle = BARRIER_COLOR;
  barriers.forEach(barrier => {
    barrier.blocks.forEach(block => {
      if (block.alive) {
        ctx.fillRect(block.x, block.y, block.width, block.height);
      }
    });
  });
}

function checkGameConditions() {
  if (gameState !== "playing") return; 

  for (const enemy of enemies) {
    if (enemy.alive && enemy.y + enemy.height >= player.y) { 
      gameState = "gameOver";
      gameWon = false;
      return; 
    }
  }
  if (enemies.every(enemy => !enemy.alive)) {
    gameState = "gameOver";
    gameWon = true;
  }
}

// --- Game Loop ---
function gameLoop() {
  if (gameState === "title") {
    drawTitleScreen();
  } else if (gameState === "settings") {
    drawSettingsScreen();
  } else if (gameState === "playing") {
    handleGamepadInput(); 
    enemyShoot(); 
    context.clearRect(0, 0, canvas.width, canvas.height);

    updatePlayer();
    drawPlayer();
    drawBarriers(context); 
    
    updateAndDrawBullets(); 
    updateAndDrawEnemyBullets(context); 
    updateAndDrawEnemies();
    
    checkGameConditions(); 
    
    if (onScreenControlsEnabled) {
      drawOnScreenControls();
    }

  } else if (gameState === "gameOver") {
    context.fillStyle = 'rgba(0, 0, 0, 0.75)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = '48px Arial';
    context.fillStyle = gameWon ? 'gold' : 'red';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const message = gameWon ? 'You Win!' : 'Game Over!';
    context.fillText(message, canvas.width / 2, canvas.height / 2);
    
    const buttonWidth = 250; 
    gameOverToTitleButton = {
        x: canvas.width / 2 - buttonWidth / 2,
        y: canvas.height / 2 + 60, 
        width: buttonWidth,
        height: buttonHeight, 
        label: "Return to Menu"
    };
    drawButton(gameOverToTitleButton);
  }
  
  requestAnimationFrame(gameLoop);
}

gameLoop();
