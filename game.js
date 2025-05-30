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
const INVINCIBILITY_DURATION_FRAMES = 300; // Approx 5 seconds at 60FPS
const AUTOFIRE_DURATION_FRAMES = 300; // Approx 5 seconds at 60FPS
const AUTOFIRE_COOLDOWN_FRAMES = 5;  // Cooldown between auto-fired shots (e.g., 12 shots/sec)
const DUALBARREL_DURATION_FRAMES = 480; // Approx 8 seconds at 60FPS

// UI Message
let powerupMessage = "";
let powerupMessageTimer = 0;
const POWERUP_MESSAGE_DURATION_FRAMES = 120; // Approx 2 seconds at 60FPS

// Particle System
let particles = [];
const PARTICLES_PER_EXPLOSION = 30;
const PARTICLE_MAX_LIFESPAN_BASE = 30; // Base lifespan frames
const PARTICLE_MAX_LIFESPAN_RANDOM = 30; // Additional random lifespan frames
const PARTICLE_MAX_SPEED = 3; // Max initial speed of particles
const PARTICLE_MIN_SPEED = 1; // Min initial speed

// Falling Objects
let fallingObjects = [];
const FALLING_OBJECT_BASE_VY_BOMB = 1.5;
const BOMB_WIDTH = 15;
const BOMB_HEIGHT = 15;
const BOMB_COLOR = '#800000'; // Maroon

const POWERUP_GENERIC_WIDTH = 20; // Can be reused for shield
const POWERUP_GENERIC_HEIGHT = 20; // Can be reused for shield
const POWERUP_GENERIC_COLOR = '#4A90E2'; // A distinct blue
const FALLING_OBJECT_BASE_VY_POWERUP = 1.0; // Powerups fall slightly slower

const POWERUP_SHIELD_WIDTH = 20;    
const POWERUP_SHIELD_HEIGHT = 20;   
const POWERUP_SHIELD_COLOR = '#00FFFF'; // Cyan
const FALLING_OBJECT_GRAVITY = 0.04;

const POWERUP_AUTOFIRE_WIDTH = 20;
const POWERUP_AUTOFIRE_HEIGHT = 20;
const POWERUP_AUTOFIRE_COLOR = '#FFA500'; // Orange

const POWERUP_DUALBARREL_WIDTH = 20;
const POWERUP_DUALBARREL_HEIGHT = 20;
const POWERUP_DUALBARREL_COLOR = '#00FF00'; // Bright Green

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
  y: 0, // Represents the BOTTOM-MOST part of the cannon graphic
  isInvincible: false,
  invincibilityTimer: 0,
  hasAutoFire: false,
  autoFireTimer: 0,
  autoFireNextShotTimer: 0,
  isTryingToFireKeyboard: false,
  isTryingToFireTouch: false,
  isTryingToFireGamepad: false,
  hasDualBarrel: false,
  dualBarrelTimer: 0
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
let freezeFrameUntil = 0;
let nextStateAfterFreeze = "";

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

  if (player.hasDualBarrel) {
    const spreadAmount = 10; // Pixels offset from center for each barrel
    const centerBarrelX = player.x + player.width / 2 - bulletConfig.width / 2;

    // Left bullet
    bullets.push({
      x: centerBarrelX - spreadAmount,
      y: barrelTipY,
      width: bulletConfig.width,
      height: bulletConfig.height,
      color: bulletConfig.color,
      speed: bulletConfig.speed
    });

    // Right bullet
    bullets.push({
      x: centerBarrelX + spreadAmount,
      y: barrelTipY,
      width: bulletConfig.width,
      height: bulletConfig.height,
      color: bulletConfig.color,
      speed: bulletConfig.speed
    });

  } else {
    // Single, centered bullet (existing logic)
    bullets.push({
      x: player.x + player.width / 2 - bulletConfig.width / 2,
      y: barrelTipY,
      width: bulletConfig.width,
      height: bulletConfig.height,
      color: bulletConfig.color,
      speed: bulletConfig.speed
    });
  }
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
            size: Math.random() * 2 + 3, // Size between 3 and 5
            color: baseColor, // Use the destroyed alien's color
            lifespan: lifespan,
            maxLifespan: lifespan // Store initial lifespan for potential fading effects
        });
    }
}

function spawnFallingObject() {
    const baseSpawnChance = 0.001 + (currentLevel - 1) * 0.0005;
    const effectiveSpawnChance = Math.min(baseSpawnChance, 0.02); // Cap at 2% per frame

    // Reduce spawn chance significantly for testing, e.g., 0.01 for more frequent spawns
    // const effectiveSpawnChance = Math.min(0.02 + (currentLevel - 1) * 0.001, 0.1); // Example for testing

    if (Math.random() < effectiveSpawnChance) {
        let objectType; // Determined by logic below
        let newObjectProps = {};

        if (Math.random() < 0.7) { // 70% chance for a bomb
            objectType = "bomb"; // Retained for potential direct use, though newObjectProps.type is primary
            newObjectProps = {
                vy: FALLING_OBJECT_BASE_VY_BOMB,
                width: BOMB_WIDTH,
                height: BOMB_HEIGHT,
                color: BOMB_COLOR,
                type: "bomb"
            };
        } else {
            const availablePowerupTypes = ["powerup_shield", "powerup_autofire", "powerup_dualbarrel"];
            const randomIndex = Math.floor(Math.random() * availablePowerupTypes.length);
            const selectedPowerupType = availablePowerupTypes[randomIndex];

            if (selectedPowerupType === "powerup_shield") {
                newObjectProps = {
                    vy: FALLING_OBJECT_BASE_VY_POWERUP,
                    width: POWERUP_SHIELD_WIDTH,
                    height: POWERUP_SHIELD_HEIGHT,
                    color: POWERUP_SHIELD_COLOR,
                    type: "powerup_shield"
                };
            } else if (selectedPowerupType === "powerup_autofire") {
                newObjectProps = {
                    vy: FALLING_OBJECT_BASE_VY_POWERUP,
                    width: POWERUP_AUTOFIRE_WIDTH,
                    height: POWERUP_AUTOFIRE_HEIGHT,
                    color: POWERUP_AUTOFIRE_COLOR,
                    type: "powerup_autofire"
                };
            } else if (selectedPowerupType === "powerup_dualbarrel") {
                newObjectProps = {
                    vy: FALLING_OBJECT_BASE_VY_POWERUP,
                    width: POWERUP_DUALBARREL_WIDTH,
                    height: POWERUP_DUALBARREL_HEIGHT,
                    color: POWERUP_DUALBARREL_COLOR,
                    type: "powerup_dualbarrel"
                };
            }
        }
        
        if (newObjectProps.type) { // Ensure newObjectProps was successfully populated
            fallingObjects.push({
                x: Math.random() * (canvas.width - newObjectProps.width),
                y: 0 - newObjectProps.height, // Start just above screen
                vx: 0,
                vy: newObjectProps.vy, 
                width: newObjectProps.width, 
                height: newObjectProps.height, 
                type: newObjectProps.type, 
                color: newObjectProps.color
            });
        }
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

function updateAndDrawFallingObjects(ctx) {
    for (let i = fallingObjects.length - 1; i >= 0; i--) {
        const obj = fallingObjects[i];

        obj.y += obj.vy;
        obj.x += obj.vx; // For bouncing later
        obj.vy += FALLING_OBJECT_GRAVITY; // Apply gravity

        // Barrier Collision Logic
        let objectHitBarrierThisFrame = false; 
        for (let b = 0; b < barriers.length; b++) {
            const barrier = barriers[b];
            for (let k = 0; k < barrier.blocks.length; k++) {
                const block = barrier.blocks[k];
                if (block.alive) {
                    // AABB collision check between obj and block
                    if (obj.x < block.x + block.width &&
                        obj.x + obj.width > block.x &&
                        obj.y < block.y + block.height &&
                        obj.y + obj.height > block.y) {
                        
                        const objCenterX = obj.x + obj.width / 2;
                        const objCenterY = obj.y + obj.height / 2;
                        const blockCenterX = block.x + block.width / 2;
                        const blockCenterY = block.y + block.height / 2;

                        const combinedHalfWidths = obj.width / 2 + block.width / 2;
                        const combinedHalfHeights = obj.height / 2 + block.height / 2;
                        const deltaX = objCenterX - blockCenterX;
                        const deltaY = objCenterY - blockCenterY;

                        const overlapX = combinedHalfWidths - Math.abs(deltaX);
                        const overlapY = combinedHalfHeights - Math.abs(deltaY);

                        const DAMPENING = 0.7; 
                        const FRICTION = 0.9; 

                        if (overlapX >= overlapY) { // Collision is more horizontal
                            obj.vx *= -DAMPENING;
                            obj.vy *= FRICTION; 
                            // Nudge out based on which side the object hit from
                            if (deltaX > 0) { // Object's center was to the right of block's center
                                obj.x = block.x + block.width + 1; // Place obj to the right of block
                            } else { // Object's center was to the left of block's center
                                obj.x = block.x - obj.width - 1;   // Place obj to the left of block
                            }
                        } else { // Collision is more vertical
                            obj.vy *= -DAMPENING;
                            obj.vx *= FRICTION;
                            // Nudge out based on which side the object hit from
                            if (deltaY > 0) { // Object's center was below block's center
                                obj.y = block.y + block.height + 1; // Place obj below the block
                            } else { // Object's center was above block's center
                                obj.y = block.y - obj.height - 1;   // Place obj above the block
                            }
                            // Add a very small random horizontal nudge on vertical bounce
                            obj.vx += (Math.random() - 0.5) * 0.5; 
                        }
                        
                        objectHitBarrierThisFrame = true;
                        break; 
                    }
                }
            }
            if (objectHitBarrierThisFrame) {
                break; 
            }
        }
        // End Barrier Collision Logic

        if (obj.type === "bomb") {
            // Bomb Body (Circle)
            const centerX = obj.x + obj.width / 2;
            const centerY = obj.y + obj.height / 2;
            const radius = obj.width / 2.8; // Slightly smaller than half width for fuse space

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
            ctx.fillStyle = obj.color; // BOMB_COLOR (maroon)
            ctx.fill();
            ctx.closePath();

            // Fuse (Small Rectangle on top)
            const fuseWidth = 4;
            const fuseHeight = 6;
            const fuseX = centerX - fuseWidth / 2;
            // Place fuse Y so it appears to come out of the top of the circle body
            const fuseY = centerY - radius - fuseHeight + (radius * 0.2); // Adjust '+2' for visual preference

            ctx.fillStyle = '#555555'; // Dark gray for the fuse
            ctx.fillRect(fuseX, fuseY, fuseWidth, fuseHeight);
            
            // (Optional: small spark at the tip of the fuse)
            // ctx.fillStyle = 'yellow';
            // ctx.fillRect(fuseX + fuseWidth/2 - 1, fuseY - 2, 2, 2);

        } else if (obj.type === "powerup_shield") {
            const centerX = obj.x + obj.width / 2;
            const centerY = obj.y + obj.height / 2;
            const radius = obj.width / 2; 

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
            ctx.fillStyle = obj.color; // Should be POWERUP_SHIELD_COLOR (Cyan)
            ctx.fill();
            ctx.closePath();
        } else if (obj.type === "powerup_autofire") { // <<< ADD THIS BLOCK
            const centerX = obj.x + obj.width / 2;
            const centerY = obj.y + obj.height / 2;
            const radius = obj.width / 2; 
    
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
            ctx.fillStyle = obj.color; // Should be POWERUP_AUTOFIRE_COLOR (Orange)
            ctx.fill();
            ctx.closePath();
        } else if (obj.type === "powerup_dualbarrel") { // <<< ADD THIS BLOCK
            const centerX = obj.x + obj.width / 2;
            const centerY = obj.y + obj.height / 2;
            const radius = obj.width / 2; 
    
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
            ctx.fillStyle = obj.color; // Should be POWERUP_DUALBARREL_COLOR (Green)
            ctx.fill();
            ctx.closePath();
        } else {
            // Default drawing for any other future types
            ctx.fillStyle = obj.color;
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        }

        // Player Collision Logic
        const playerVisualTopY = player.y - player.height - player.barrelHeight;
        const playerVisualBottomY = player.y; 

        if (obj.type === "bomb") {
            if (obj.x < player.x + player.width &&
                obj.x + obj.width > player.x &&
                obj.y < playerVisualBottomY && 
                obj.y + obj.height > playerVisualTopY) { 

                if (!player.isInvincible) { // Player is NOT invincible
                    const playerVisualCenterY = player.y - (player.height / 2) - (player.barrelHeight / 2);
                    createExplosion(player.x + player.width / 2, playerVisualCenterY, player.color);
                    
                    gameState = "freezeFrame";
                    freezeFrameUntil = Date.now() + 1000;
                    nextStateAfterFreeze = "gameOver";
                    gameWon = false;
                    
                    fallingObjects.splice(i, 1); 
                    continue; 
                } else { // Player IS invincible
                    fallingObjects.splice(i, 1); 
                    // console.log("Player invincible, bomb destroyed by shield!");
                    continue;
                }
            }
        } else if (obj.type === "powerup_shield") { 
            // const playerVisualTopY = player.y - player.height - player.barrelHeight; // Already defined above
            // const playerVisualBottomY = player.y; // Already defined above

            if (obj.x < player.x + player.width &&
                obj.x + obj.width > player.x &&
                obj.y < playerVisualBottomY &&      
                obj.y + obj.height > playerVisualTopY) { 
            
                player.isInvincible = true;
                player.invincibilityTimer = INVINCIBILITY_DURATION_FRAMES;
                powerupMessage = "Shield Activated!";
                powerupMessageTimer = POWERUP_MESSAGE_DURATION_FRAMES;
                // console.log("Shield Activated!");

                fallingObjects.splice(i, 1); 
                continue; 
            }
        } else if (obj.type === "powerup_autofire") {
            // AABB collision check with player (copy from powerup_shield)
            const playerVisualTopY = player.y - player.height - player.barrelHeight;
            const playerVisualBottomY = player.y;
    
            if (obj.x < player.x + player.width &&
                obj.x + obj.width > player.x &&
                obj.y < playerVisualBottomY &&
                obj.y + obj.height > playerVisualTopY) {
                
                player.hasAutoFire = true;
                player.autoFireTimer = AUTOFIRE_DURATION_FRAMES;
                player.autoFireNextShotTimer = 0; // Allow immediate first shot if fire is held
    
                powerupMessage = "Auto Fire On!"; // Or "Rapid Fire!"
                powerupMessageTimer = POWERUP_MESSAGE_DURATION_FRAMES;
                
                fallingObjects.splice(i, 1); // Remove the power-up
                continue; // Skip to the next falling object
            }
        } else if (obj.type === "powerup_dualbarrel") {
            // AABB collision check with player (copy from other powerup types)
            const playerVisualTopY = player.y - player.height - player.barrelHeight;
            const playerVisualBottomY = player.y;
    
            if (obj.x < player.x + player.width &&
                obj.x + obj.width > player.x &&
                obj.y < playerVisualBottomY &&
                obj.y + obj.height > playerVisualTopY) {
                
                player.hasDualBarrel = true;
                player.dualBarrelTimer = DUALBARREL_DURATION_FRAMES;
    
                powerupMessage = "Dual Barrel Active!"; 
                powerupMessageTimer = POWERUP_MESSAGE_DURATION_FRAMES;
                
                fallingObjects.splice(i, 1); // Remove the power-up
                continue; // Skip to the next falling object
            }
        }

        // Off-Screen Removal (if not already removed by collision)
        if (obj.y > canvas.height) { // This check is now safe due to 'continue' in collision blocks
            fallingObjects.splice(i, 1);
        }
    }
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
    player.isInvincible = false;
    player.invincibilityTimer = 0;
    player.hasAutoFire = false;
    player.autoFireTimer = 0;
    player.autoFireNextShotTimer = 0;
  player.isTryingToFireKeyboard = false;
  player.isTryingToFireTouch = false;
  player.isTryingToFireGamepad = false;
  player.hasDualBarrel = false;
  player.dualBarrelTimer = 0;
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
  fallingObjects = []; // Clear falling objects
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

function drawPowerupMessage(ctx) {
    if (powerupMessage !== "") {
        ctx.fillStyle = "yellow"; // Make it stand out, e.g., yellow
        ctx.font = "22px Arial";
        ctx.textAlign = "center";
        // Position it below the score/level display, e.g. score is at y=20, level y=40.
        ctx.fillText(powerupMessage, canvas.width / 2, 70); 
        ctx.textAlign = "left"; // Reset textAlign
    }
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
        if (!player.isTryingToFireGamepad && !player.hasAutoFire) { // First press and not autofire
            playerShoot();
        }
        player.isTryingToFireGamepad = true;
      } else {
        player.isTryingToFireGamepad = false; // Button is not pressed
      }
    }
  }
}

function handlePlayerFiring() { // Call this from gameLoop "playing" state, or from updatePlayer
    if (!player.hasAutoFire) return; // Only applies to auto-fire mode

    const isFireInputActive = player.isTryingToFireKeyboard || player.isTryingToFireTouch || player.isTryingToFireGamepad;

    if (isFireInputActive && player.autoFireNextShotTimer <= 0) {
        playerShoot();
        player.autoFireNextShotTimer = AUTOFIRE_COOLDOWN_FRAMES;
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
      if (!player.isTryingToFireKeyboard && !player.hasAutoFire) { // First press and not autofire
          playerShoot();
      }
      player.isTryingToFireKeyboard = true; // Set flag regardless
    }
  }
});

document.addEventListener('keyup', function(event) {
  if (gameState !== "playing") return;
  if (event.key === 'ArrowLeft') {
    player.isMovingLeftKeyboard = false;
  } else if (event.key === 'ArrowRight') {
    player.isMovingRightKeyboard = false;
  } else if (event.code === 'Space') { 
      player.isTryingToFireKeyboard = false;
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
        fallingObjects = []; // Clear falling objects
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
        if (!player.isTryingToFireTouch && !player.hasAutoFire) { // First press and not autofire
            playerShoot();
        }
        player.isTryingToFireTouch = true; // Set flag regardless
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
      
      // Check if the touch that ended was on the fire button
      if (isInside(touchPos, osFireButton)) {
          player.isTryingToFireTouch = false;
          // actionTaken = true; // Not strictly needed to set actionTaken here unless other logic depends on it
      }

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
  if (player.isInvincible) {
    player.invincibilityTimer--;
    if (player.invincibilityTimer <= 0) {
        player.isInvincible = false;
        // No need to reset timer to 0 here, it's done or implicitly handled
    }
  }
  // After invincibility logic in updatePlayer():
  if (player.hasAutoFire) {
      player.autoFireTimer--;
      if (player.autoFireTimer <= 0) {
          player.hasAutoFire = false;
          // No need to reset autoFireNextShotTimer here, it just won't be used.
      }
  }
  if (player.autoFireNextShotTimer > 0) {
      player.autoFireNextShotTimer--;
  }
  if (player.hasDualBarrel) {
      player.dualBarrelTimer--;
      if (player.dualBarrelTimer <= 0) {
          player.hasDualBarrel = false;
      }
  }
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

  if (player.isInvincible) {
      const shieldColor = POWERUP_SHIELD_COLOR || '#00FFFF'; 

      const baseAlpha = 0.5; // Was 0.4
      const pulseAmplitude = 0.2; // Amplitude remains 0.2, so range is 0.3 to 0.7
      context.globalAlpha = baseAlpha + Math.sin(Date.now() / 150) * pulseAmplitude; 

      const visualCenterX = player.x + player.width / 2;
      const visualCenterY = player.y - (player.height / 2) - (player.barrelHeight / 2);
      
      const shieldRadius = (player.width / 2) + 10; // Was +8

      context.fillStyle = shieldColor;
      context.beginPath();
      context.arc(visualCenterX, visualCenterY, shieldRadius, 0, Math.PI * 2, false);
      context.fill();
      context.closePath();

      context.globalAlpha = 1.0;
  }
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
        
        if (!player.isInvincible) { // Player is NOT invincible
            const playerVisualCenterY = player.y - (player.height / 2) - (player.barrelHeight / 2);
            createExplosion(player.x + player.width / 2, playerVisualCenterY, player.color);

            gameState = "freezeFrame";
            freezeFrameUntil = Date.now() + 1000; 
            nextStateAfterFreeze = "gameOver";
            gameWon = false; 
        } else { 
            // Player IS invincible. Optionally, add different feedback here later.
            // console.log("Player invincible, bullet absorbed by shield!");
        }
        
        // Bullet is consumed regardless of invincibility.
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
      gameState = "freezeFrame";
      freezeFrameUntil = Date.now() + 1000;
      nextStateAfterFreeze = "gameOver";
      gameWon = false; // Outcome determined
      return; // Still exit the function
    }
  }
  if (enemies.every(enemy => !enemy.alive)) {
    gameState = "freezeFrame";
    freezeFrameUntil = Date.now() + 1000; // 1-second freeze
    nextStateAfterFreeze = "levelComplete";
    // currentLevel will be incremented after the freeze, before showing the level complete message.
    // gameWon = false; // This should be false until player beats all levels
  }
}

// --- Game Loop ---
function gameLoop() {
  // At the start of gameLoop()
  if (powerupMessageTimer > 0) {
      powerupMessageTimer--;
      if (powerupMessageTimer <= 0) {
          powerupMessage = ""; // Clear message when timer expires
      }
  }
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
  } else if (gameState === "freezeFrame") {
    // 1. Drawing Logic (most things are static)
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawStars(context);

    drawPlayer(); // Player is static, no updatePlayer() call
    drawBarriers(context); // Barriers are static

    // Draw static player bullets
    context.fillStyle = bulletConfig.color;
    for (let i = 0; i < bullets.length; i++) { // Use standard for loop for safety
        const bullet = bullets[i];
        context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    // Draw static enemy bullets
    context.fillStyle = enemyBulletConfig.color;
    for (let i = 0; i < enemyBullets.length; i++) { // Use standard for loop
        const bullet = enemyBullets[i];
        context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    // Draw static enemies
    for (let i = 0; i < enemies.length; i++) { // Use standard for loop
        const enemy = enemies[i];
        if (enemy.alive) {
            drawAlien(enemy, context); // No enemy position updates
        }
    }

    updateAndDrawParticles(context); // Particles continue to update and draw

    drawScore(context); // Score display is static

    // 2. Check Timer and Transition Logic
    if (Date.now() > freezeFrameUntil) {
        if (nextStateAfterFreeze === "levelComplete") {
            currentLevel++; // Increment level just before showing "Level Complete" screen
        }
        gameState = nextStateAfterFreeze;
        nextStateAfterFreeze = ""; // Reset for future use (good practice)
    }
  } else if (gameState === "playing") {
    handleGamepadInput(); 
    handlePlayerFiring(); // Handle auto-fire logic
    enemyShoot(); 
    spawnFallingObject();
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
    updateAndDrawFallingObjects(context);
    
    checkGameConditions(); 
    drawScore(context); 
    drawPowerupMessage(context);
    
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
