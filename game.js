const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

// Player properties
const player = {
  width: 50,
  height: 50,
  speed: 5,
  color: 'green',
  isMovingLeftKeyboard: false,
  isMovingRightKeyboard: false,
  isMovingLeftTouch: false,
  isMovingRightTouch: false,
  isMovingLeftGamepad: false,
  isMovingRightGamepad: false,
  x: 0,
  y: 0
};

// Enemy Configuration
const enemyConfig = {
  width: 40,
  height: 20,
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

// Game State
let gameState = "title"; // "title", "playing", "settings", "gameOver"
let gameWon = false;
let onScreenControlsEnabled = false;

// Clickable areas
let startButton = {};
let settingsButton = {};
let onScreenControlsToggleButton = {};
let backButton = {};
let gameOverToTitleButton = {}; // Added for game over screen

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

function playerShoot() {
  // Calls to this function are already guarded by gameState === "playing"
  bullets.push({
    x: player.x + player.width / 2 - bulletConfig.width / 2,
    y: player.y,
    width: bulletConfig.width,
    height: bulletConfig.height,
    color: bulletConfig.color,
    speed: bulletConfig.speed
  });
}

function startGame() {
  initializeEnemies();
  player.x = (canvas.width - player.width) / 2;
  player.y = canvas.height - player.height - 10 - (onScreenControlsEnabled ? osButtonHeight + osPadding : 0);
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
  // Removed game over 'Enter' key listener
  // if (gameState === "gameOver") {
  //   if (event.key === 'Enter') { // or event.code === 'Enter'
  //     gameState = "title";
  //   }
  //   return; 
  // }

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
  // Ensure rect is defined and has properties before checking
  if (!rect || typeof rect.x === 'undefined') {
    // console.warn("isInside called with undefined or incomplete rect:", rect);
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
    // gameOverToTitleButton properties are set in gameLoop when drawing this screen
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

  // Boundary detection
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

function drawPlayer() {
  context.fillStyle = player.color;
  context.fillRect(player.x, player.y, player.width, player.height);
}

function updateAndDrawBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.y -= bullet.speed;

    // Draw bullet
    context.fillStyle = bullet.color;
    context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

    // Check for off-screen bullets
    if (bullet.y + bullet.height < 0) {
      bullets.splice(i, 1);
      continue;
    }

    // Bullet-enemy collision
    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      if (enemy.alive &&
          bullet.x < enemy.x + enemy.width && bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height && bullet.y + bullet.height > enemy.y) {
        enemy.alive = false;
        bullets.splice(i, 1);
        break; 
      }
    }
  }
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
    const moveStep = 1; // Can be adjusted for faster/slower downward step
    enemies.forEach(enemy => { if (enemy.alive) enemy.y += moveStep; });
    enemyMoveDown -= moveStep;
  }

  // Draw enemies
  enemies.forEach(enemy => {
    if (enemy.alive) {
      context.fillStyle = enemy.color;
      context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }
  });
}

function checkGameConditions() {
  // Loss Condition Check (Enemies reach player)
  for (const enemy of enemies) {
    if (enemy.alive && enemy.y + enemy.height >= player.y) { 
      gameWon = false;
      gameState = "gameOver";
      return; // Game over, no need to check win condition
    }
  }
  
  // Win Condition Check (All enemies dead)
  // Only check if game is not already over from loss condition
  if (enemies.every(enemy => !enemy.alive)) {
    gameWon = true;
    gameState = "gameOver";
  }
}
// --- End of helper functions for gameLoop ---

function gameLoop() {
  if (gameState === "title") {
    drawTitleScreen();
  } else if (gameState === "settings") {
    drawSettingsScreen();
  } else if (gameState === "playing") {
    handleGamepadInput(); 
    context.clearRect(0, 0, canvas.width, canvas.height);

    updatePlayer();
    drawPlayer();
    
    updateAndDrawBullets();
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
    
    // Define and draw the "Return to Menu" button
    const buttonWidth = 250; // Adjusted width for better text fit
    gameOverToTitleButton = {
        x: canvas.width / 2 - buttonWidth / 2,
        y: canvas.height / 2 + 60, // Positioned below the game over message
        width: buttonWidth,
        height: buttonHeight, // Using global buttonHeight
        label: "Return to Menu"
    };
    drawButton(gameOverToTitleButton);

    // Removed: context.fillText('Press Enter to Return to Title Screen', canvas.width / 2, canvas.height / 2 + 60);
  }
  
  requestAnimationFrame(gameLoop);
}

gameLoop();
