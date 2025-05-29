const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

// Score variables
let score = 0;
let highScore = 0;

// Level variables
let currentLevel = 1;

// Starfield
let stars = [];
const NUM_STARS = 100; // Adjust for desired density

// Particle System
let particles = [];
const PARTICLES_PER_EXPLOSION = 20;
const PARTICLE_MAX_LIFESPAN_BASE = 30; // Base lifespan frames
const PARTICLE_MAX_LIFESPAN_RANDOM = 30; // Additional random lifespan frames
const PARTICLE_MAX_SPEED = 3; // Max initial speed of particles
const PARTICLE_MIN_SPEED = 1; // Min initial speed

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
  color: 'red', // Default color, can be overridden by type
  speed: 2, // Base speed
  rows: 3, 
  cols: 8,
  padding: 10,
  marginTop: 30,
  marginLeft: 60
};

// Alien Shape Patterns
const alienShapePatterns = {
    type1: {
        pattern: [
            "  1111  ",
            " 111111 ",
            "11111111",
            "11 11 11",
            "11111111" 
        ],
        color: "red" 
    },
    type2: { 
        pattern: [
            "   11   ",
            "  1111  ",
            " 111111 ",
            "11111111",
            "1  11  1" 
        ],
        color: "mediumorchid" 
    },
    type3: { 
        pattern: [
            "1  11  1",
            " 111111 ",
            "11111111",
            "11111111",
            "  1  1  " 
        ],
        color: "orange" 
    }
};
const alienTypeKeys = Object.keys(alienShapePatterns);


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
  color: "pink", 
  speed: 4 
};
let enemyBullets = [];


// Barrier Constants & Array
const BARRIER_COUNT = 4;
const BARRIER_COLOR = player.color; 
const BARRIER_BLOCK_SIZE = 5; 
const BARRIER_BLOCK_ROWS = 9; 
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
let readyButtonLevelComplete = {}; 
// continueButtonGameOver will be defined locally in drawing/click handling for game over

const buttonHeight = 50; // General button height for menu buttons
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

  const baseRows = enemyConfig.rows; // e.g., 3
  let additionalRows = Math.floor((currentLevel - 1) / 4);
  additionalRows = Math.min(additionalRows, 4); // Max 4 additional rows
  const currentEnemyRows = baseRows + additionalRows;

  const baseCols = enemyConfig.cols; // e.g., 8
  let additionalCols = Math.floor((currentLevel - 1) / 8);
  additionalCols = Math.min(additionalCols, 2); // Max 2 additional columns
  const currentEnemyCols = baseCols + additionalCols;

  const currentGridWidth = currentEnemyCols * enemyConfig.width + (currentEnemyCols - 1) * enemyConfig.padding;
  let dynamicMarginLeft = (canvas.width - currentGridWidth) / 2;
  dynamicMarginLeft = Math.max(10, dynamicMarginLeft); // Prevent negative margin, ensure at least 10px

  for (let row = 0; row < currentEnemyRows; row++) {
    for (let col = 0; col < currentEnemyCols; col++) {
      const typeIndex = row % alienTypeKeys.length; 
      const enemyTypeKey = alienTypeKeys[typeIndex];
      const enemyPatternData = alienShapePatterns[enemyTypeKey];

      enemies.push({
        x: dynamicMarginLeft + col * (enemyConfig.width + enemyConfig.padding),
        y: enemyConfig.marginTop + row * (enemyConfig.height + enemyConfig.padding),
        width: enemyConfig.width,
        height: enemyConfig.height,
        color: enemyPatternData.color, 
        type: enemyTypeKey, 
        alive: true
      });
    }
  }
}

function initializeBarriers() {
  barriers = [];
  
  const targetBarrierWidth = player.width * 1.5;
  const newBarrierBlockCols = Math.floor(targetBarrierWidth / BARRIER_BLOCK_SIZE);
  // console.log("Calculated newBarrierBlockCols:", newBarrierBlockCols);

  const singleBarrierActualWidth = newBarrierBlockCols * BARRIER_BLOCK_SIZE;

  const interBarrierGap = 60; 
  const totalBarriersGroupWidth = (BARRIER_COUNT * singleBarrierActualWidth) + ((BARRIER_COUNT - 1) * interBarrierGap);
  const groupStartX = (canvas.width - totalBarriersGroupWidth) / 2;

  const playerCannonTopY = player.y - player.height - player.barrelHeight;
  const currentBarrierY = playerCannonTopY - (BARRIER_BLOCK_ROWS * BARRIER_BLOCK_SIZE) - 30; 

  const barrierShapePattern = [
      "   111111111   ",
      "  11111111111  ",
      " 1111111111111 ",
      "111111111111111",
      "111111111111111",
      "111111111111111",
      "1111  111  1111",
      "111   111   111",
      "111         111" 
  ];                       

  if (newBarrierBlockCols !== 15) { 
    console.warn(`Barrier shape pattern width (15) does not match calculated newBarrierBlockCols (${newBarrierBlockCols}). Falling back to solid rectangular barriers.`);
    for (let i = 0; i < BARRIER_COUNT; i++) {
      const barrierX = groupStartX + i * (singleBarrierActualWidth + interBarrierGap);
      let barrier = { x: barrierX, y: currentBarrierY, blocks: [] };
      for (let rowIdx = 0; rowIdx < BARRIER_BLOCK_ROWS; rowIdx++) { 
        for (let colIdx = 0; colIdx < newBarrierBlockCols; colIdx++) {
          let blockX = barrier.x + colIdx * BARRIER_BLOCK_SIZE;
          let blockY = barrier.y + rowIdx * BARRIER_BLOCK_SIZE;
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
    for (let i = 0; i < BARRIER_COUNT; i++) {
      const barrierX = groupStartX + i * (singleBarrierActualWidth + interBarrierGap);
      let barrier = { x: barrierX, y: currentBarrierY, blocks: [] };
      for (let rowIdx = 0; rowIdx < BARRIER_BLOCK_ROWS; rowIdx++) {
        if (barrierShapePattern[rowIdx]) { 
          for (let colIdx = 0; colIdx < newBarrierBlockCols; colIdx++) {
            if (barrierShapePattern[rowIdx].charAt(colIdx) === '1') { 
              let blockX = barrier.x + colIdx * BARRIER_BLOCK_SIZE;
              let blockY = barrier.y + rowIdx * BARRIER_BLOCK_SIZE;
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
  const firingProbability = 0.01 + (currentLevel - 1) * 0.002;
  if (Math.random() < firingProbability) { 
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

function createExplosion(centerX, centerY, baseColor) {
    for (let i = 0; i < PARTICLES_PER_EXPLOSION; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * (PARTICLE_MAX_SPEED - PARTICLE_MIN_SPEED) + PARTICLE_MIN_SPEED;
        const lifespan = Math.random() * PARTICLE_MAX_LIFESPAN_RANDOM + PARTICLE_MAX_LIFESPAN_BASE;

        particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 2 + 1, // Size between 1 and 3
            color: baseColor, // Use the destroyed alien's color
            lifespan: lifespan,
            maxLifespan: lifespan // Store initial lifespan for potential fading effects
        });
    }
}

function updateAndDrawParticles(ctx) { // Renamed context to ctx for consistency
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Optional: Apply simple physics
        particle.vx *= 0.98; // Friction/drag
        particle.vy *= 0.98; // Friction/drag
        particle.vy += 0.05; // Gravity

        // Update lifespan
        particle.lifespan--;

        // Check for removal
        if (particle.lifespan <= 0) {
            particles.splice(i, 1);
            continue; // Move to next particle
        }

        // Draw particle with fading effect
        // Ensure alpha is between 0 and 1. Max with 0 prevents negative alpha if lifespan somehow drops far below.
        ctx.globalAlpha = Math.max(0, particle.lifespan / particle.maxLifespan); 
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    ctx.globalAlpha = 1.0; // Reset global alpha after drawing all particles
}

function resetPlayerPosition() {
    player.x = canvas.width / 2 - player.width / 2;
    let bottomMargin = 10;
    let osControlsHeight = 0;
    if (onScreenControlsEnabled && typeof osLeftButton !== 'undefined' && osLeftButton.height > 0) { 
         osControlsHeight = osLeftButton.height + osPadding; 
    }
    player.y = canvas.height - bottomMargin - osControlsHeight;
    
    player.isMovingLeftKeyboard = false; player.isMovingRightKeyboard = false;
    player.isMovingLeftTouch = false; player.isMovingRightTouch = false;
    player.isMovingLeftGamepad = false; player.isMovingRightGamepad = false;
}


function startGame(isContinuing = false) {
  if (!isContinuing) {
    score = 0; 
    currentLevel = 1; 
  }
  highScore = parseInt(localStorage.getItem('spaceInvadersHighScore')) || 0; 

  resetPlayerPosition(); 
  
  initializeEnemies(); // Uses currentLevel for difficulty
  initializeBarriers(); 
  
  enemyBullets = []; 
  bullets = []; 
  particles = []; // Clear existing particles
  gameWon = false; 
  // gameState = "playing"; // This will be set by the caller
}

function drawButton(button) {
  context.fillStyle = '#777777'; // Was 'gray'
  context.fillRect(button.x, button.y, button.width, button.height);
  context.fillStyle = 'white';
  context.font = '24px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(button.label, button.x + button.width / 2, button.y + button.height / 2);
}

function drawScore(ctx) {
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Score: " + score, 10, 20); 
    ctx.fillText("Level: " + currentLevel, 10, 40); 
    ctx.textAlign = "right";
    ctx.fillText("High Score: " + highScore, canvas.width - 10, 20); 
    ctx.textAlign = "left"; 
}

function drawLevelCompleteMessage(ctx) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Level " + (currentLevel -1) + " Complete!", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "24px Arial";
    ctx.fillText("Ready for next wave?", canvas.width / 2, canvas.height / 2 + 20);
    ctx.textAlign = "left"; 

    const newButtonWidth = 280; // Increased width for padding
    // const buttonHeight = 50; // Standard button height is already globally defined
    readyButtonLevelComplete = {
        x: canvas.width / 2 - newButtonWidth / 2, // Recalculate x to stay centered
        y: canvas.height / 2 + 60, // y position can remain the same or be adjusted if needed
        width: newButtonWidth,
        height: buttonHeight, // Uses global buttonHeight
        label: "Start Level " + currentLevel // New label
    };
    drawButton(readyButtonLevelComplete); // Use the existing drawButton helper
}

function initializeStars() {
    stars = []; // Clear existing stars
    for (let i = 0; i < NUM_STARS; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1 // Star size between 1 and 3
        });
    }
}

function drawStars(ctx) {
    ctx.fillStyle = 'white';
    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }
}

function drawTitleScreen() {
  context.fillStyle = 'black';
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawStars(context);

  context.font = '72px Arial';
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.fillText('Space Invaders', canvas.width / 2, canvas.height / 3);

  const startButtonWidth = 340;
  startButton = {
    x: (canvas.width - startButtonWidth) / 2,
    y: canvas.height / 2 - buttonHeight - buttonPadding / 2,
    width: startButtonWidth,
    height: buttonHeight,
    label: "Start New Game"
  };
  drawButton(startButton);

  const settingsButtonWidth = 240;
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
  context.fillStyle = 'black';
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawStars(context);

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
  
  const backButtonWidth = 190;
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
      startGame(false); // Explicitly a new game
      gameState = "playing";
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
    // Define continueButtonGameOver for hit detection, matching its drawn properties
    const continueButtonGameOver = {
        x: canvas.width / 2 - 100, // Consistent with drawing
        y: canvas.height / 2 + 40, 
        width: 200,
        height: 40, // Consistent with drawing
        label: "Continue (Level " + currentLevel + ")" // Label doesn't affect hit box
    };
    // gameOverToTitleButton is global, its y is updated in gameLoop for drawing
    // but for hit detection, we might need to use the updated y or ensure it's consistent
    // For simplicity, we assume gameOverToTitleButton properties are up-to-date via gameLoop drawing
    
    if (isInside(mousePos, continueButtonGameOver)) {
        startGame(true); // Pass true for continue
        gameState = "playing";
    } else if (isInside(mousePos, gameOverToTitleButton)) {
        // Score and level reset will happen when startGame(false) is called from title.
        gameState = "title";
    }
  } else if (gameState === "levelComplete") {
    // const mousePos = getMousePos(canvas, event); // mousePos is already available in this scope

    // readyButtonLevelComplete is global and its properties (x, y, width, height)
    // are updated by drawLevelCompleteMessage before this click could occur for that screen.
    if (isInside(mousePos, readyButtonLevelComplete)) {
        // Logic to start the next level
        initializeEnemies();    // Uses currentLevel which should have been incremented
        initializeBarriers();   // Reset barriers
        resetPlayerPosition();  // Reset player's position and movement flags
        bullets = [];           // Clear player bullets
        enemyBullets = [];      // Clear enemy bullets
        particles = []; // Clear existing particles from previous level
        gameState = "playing";  // Transition to playing state
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
        
        enemy.alive = false; // Mark enemy as dead
        createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color);
        
        score += 10; 
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('spaceInvadersHighScore', highScore.toString());
        }
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
  const currentPatternData = alienShapePatterns[enemy.type] || alienShapePatterns.type1;
  const shape = currentPatternData.pattern;
  ctx.fillStyle = currentPatternData.color; 

  const blockW = enemy.width / 8;  
  const blockH = enemy.height / 5; 

  for (let r = 0; r < shape.length; r++) { 
    for (let c = 0; c < shape[r].length; c++) { 
      if (shape[r].charAt(c) === '1') {
        ctx.fillRect(enemy.x + c * blockW, enemy.y + r * blockH, blockW, blockH);
      }
    }
  }
}

function updateAndDrawEnemies() {
  let hitBoundary = false;
  let effectiveEnemySpeed = (enemyConfig.speed || 1) + (currentLevel - 1) * 0.2;

  enemies.forEach(enemy => {
    if (enemy.alive) {
      enemy.x += effectiveEnemySpeed * enemyDirection;
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
    currentLevel++; // Increment current level
    gameState = "levelComplete";
    // gameWon = false; // This should be false until player beats all levels
  }
}

// --- Game Loop ---
function gameLoop() {
  if (gameState === "title") {
    drawTitleScreen();
  } else if (gameState === "settings") {
    drawSettingsScreen();
  } else if (gameState === "levelComplete") {
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawStars(context);
    drawLevelCompleteMessage(context); // Draws its own overlay over stars
    // The logic to start the next level will be triggered by a button click later.
  } else if (gameState === "playing") {
    handleGamepadInput(); 
    enemyShoot(); 
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawStars(context);

    updatePlayer();
    drawPlayer();
    drawBarriers(context); 
    
    updateAndDrawBullets(); 
    updateAndDrawEnemyBullets(context); 
    updateAndDrawEnemies();
    updateAndDrawParticles(context);
    
    checkGameConditions(); 
    drawScore(context); 
    
    if (onScreenControlsEnabled) {
      drawOnScreenControls();
    }

  } else if (gameState === "gameOver") {
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawStars(context);
    // Now draw the semi-transparent overlay for the game over specific messages
    context.fillStyle = 'rgba(0, 0, 0, 0.75)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    drawScore(context); 

    context.font = '48px Arial';
    context.fillStyle = gameWon ? 'gold' : 'red'; 
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const message = gameWon ? 'You Win!' : 'Game Over!'; 
    context.fillText(message, canvas.width / 2, canvas.height / 2);
    
    // Define and draw Continue button
    const continueButtonGameOver = {
        x: canvas.width / 2 - (340 / 2), // Centered
        y: canvas.height / 2 + 40, // Below "Game Over" text slightly adjusted
        width: 340,
        height: 40, // Specific height for this button
        label: "Continue (Level " + currentLevel + ")"
    };
    drawButton(continueButtonGameOver);

    // Define and draw Return to Menu button (adjust Y to be below Continue)
    gameOverToTitleButton = { // Update global object for hit detection
        x: canvas.width / 2 - (280 / 2), // Centered
        y: canvas.height / 2 + 40 + continueButtonGameOver.height + 10, // Below continue button
        width: 280, // Same width as continue for alignment
        height: 40, // Specific height
        label: "Return to Menu"
    };
    drawButton(gameOverToTitleButton);

    context.textAlign = "left"; 
  }
  
  requestAnimationFrame(gameLoop);
}

initializeStars(); // Call once before game starts
gameLoop();
