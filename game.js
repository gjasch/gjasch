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
const EXPLOSIVE_BULLETS_DURATION_FRAMES = 420; // Approx 7 seconds at 60FPS
const EXPLOSION_RADIUS = 30; // Radius for AoE damage from explosive bullets
const BULLET_EXPLOSION_PARTICLE_COUNT = 15; // Number of particles for a bullet's explosion
const BULLET_EXPLOSION_COLOR = 'orange';   // Color of a bullet's own explosion particles

const BOMB_BARRIER_EXPLOSION_PARTICLES = 20;
const BOMB_BARRIER_EXPLOSION_COLOR = '#FFA500'; // Orange
const BOMB_AOE_ON_BARRIER_RADIUS = 25;

// UI Message
let powerupMessage = "";
// let powerupMessageTimer = 0; // Removed
// const POWERUP_MESSAGE_DURATION_FRAMES = 120; // Removed
let activePowerupNameForMessage = ""; // To identify which power-up's message and timer to show
let activePowerupTimerDisplay = 0;   // To store the current frame count of the active power-up's timer for display

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
const BOMB_WIDTH = 18;
const BOMB_HEIGHT = 18;
const BOMB_COLOR = '#888888'; // Medium Gray

const POWERUP_GENERIC_WIDTH = 20; // Can be reused for shield
const POWERUP_GENERIC_HEIGHT = 20; // Can be reused for shield
const POWERUP_GENERIC_COLOR = '#4A90E2'; // A distinct blue
const FALLING_OBJECT_BASE_VY_POWERUP = 0.5; // Powerups fall slightly slower

const POWERUP_SHIELD_WIDTH = 20;
const POWERUP_SHIELD_HEIGHT = 20;
const POWERUP_SHIELD_COLOR = '#00FFFF'; // Cyan
const FALLING_OBJECT_GRAVITY = 0.04;
const MAX_FALLING_SPEED_POWERUP = 2.5;

const POWERUP_AUTOFIRE_WIDTH = 20;
const POWERUP_AUTOFIRE_HEIGHT = 20;
const POWERUP_AUTOFIRE_COLOR = '#FFA500'; // Orange

const POWERUP_DUALBARREL_WIDTH = 20;
const POWERUP_DUALBARREL_HEIGHT = 20;
const POWERUP_DUALBARREL_COLOR = '#00FF00'; // Bright Green

const POWERUP_EXPLOSIVE_WIDTH = 20;
const POWERUP_EXPLOSIVE_HEIGHT = 20;
const POWERUP_EXPLOSIVE_COLOR = '#FF4500'; // OrangeRed

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
  dualBarrelTimer: 0,
  hasExplosiveBullets: false,
  explosiveBulletsTimer: 0
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

function createExplosion(centerX, centerY, baseColor, numParticles = PARTICLES_PER_EXPLOSION, particleSpeedMultiplier = 1) {
    for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * (PARTICLE_MAX_SPEED - PARTICLE_MIN_SPEED) + PARTICLE_MIN_SPEED) * particleSpeedMultiplier;
        const lifespan = Math.random() * PARTICLE_MAX_LIFESPAN_RANDOM + PARTICLE_MAX_LIFESPAN_BASE;

        particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 2 + 3,
            color: baseColor,
            lifespan: lifespan,
            maxLifespan: lifespan
        });
    }
}

function spawnFallingObject() {
    const baseSpawnChance = 0.001 + (currentLevel - 1) * 0.0005;
    const effectiveSpawnChance = Math.min(baseSpawnChance, 0.02);

    if (Math.random() < effectiveSpawnChance) {
        let newObjectProps = {};

        if (Math.random() < 0.7) {
            newObjectProps = {
                vy: FALLING_OBJECT_BASE_VY_BOMB,
                width: BOMB_WIDTH,
                height: BOMB_HEIGHT,
                color: BOMB_COLOR,
                type: "bomb"
            };
        } else {
            const availablePowerupTypes = ["powerup_shield", "powerup_autofire", "powerup_dualbarrel", "powerup_explosive"];
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
            } else if (selectedPowerupType === "powerup_explosive") {
                newObjectProps = {
                    vy: FALLING_OBJECT_BASE_VY_POWERUP,
                    width: POWERUP_EXPLOSIVE_WIDTH,
                    height: POWERUP_EXPLOSIVE_HEIGHT,
                    color: POWERUP_EXPLOSIVE_COLOR,
                    type: "powerup_explosive"
                };
            }
        }

        if (newObjectProps.type) {
            fallingObjects.push({
                x: Math.random() * (canvas.width - newObjectProps.width),
                y: 0 - newObjectProps.height,
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

function updateAndDrawParticles(ctx) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        particle.vy += 0.05;
        particle.lifespan--;
        if (particle.lifespan <= 0) {
            particles.splice(i, 1);
            continue;
        }
        ctx.globalAlpha = Math.max(0, particle.lifespan / particle.maxLifespan);
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    ctx.globalAlpha = 1.0;
}

function updateAndDrawFallingObjects(ctx) {
    for (let i = fallingObjects.length - 1; i >= 0; i--) {
        const obj = fallingObjects[i];
        let objectRemovedThisFrame = false;

        // Apply normal physics updates to all falling objects.
        obj.x += obj.vx;
        obj.y += obj.vy;
        obj.vy += FALLING_OBJECT_GRAVITY;

        if (obj.type && obj.type.startsWith("powerup_")) {
            obj.vy = Math.min(obj.vy, MAX_FALLING_SPEED_POWERUP);
        }

        // Apply friction to horizontal sliding speed (if any).
        // Since isResting is removed, this condition simplifies.
        if (obj.vx !== 0) {
             obj.vx *= 0.90; // 10% friction per frame
             if (Math.abs(obj.vx) < 0.1) { // If speed is very low, stop horizontal movement
                 obj.vx = 0;
             }
        }

        // Drawing logic
        if (obj.type === "bomb") {
            const centerX = obj.x + obj.width / 2;
            const centerY = obj.y + obj.height / 2;
            const radius = obj.width / 2.8;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
            ctx.fillStyle = obj.color;
            ctx.fill();
            ctx.closePath();
            const fuseWidth = 4;
            const fuseHeight = 6;
            const fuseX = centerX - fuseWidth / 2;
            const fuseY = centerY - radius - fuseHeight + (radius * 0.2);
            ctx.fillStyle = '#555555';
            ctx.fillRect(fuseX, fuseY, fuseWidth, fuseHeight);
            if (Math.floor(Date.now() / 250) % 2 === 0) {
                ctx.fillStyle = 'orange';
                const sparkSize = 3;
                ctx.fillRect(fuseX + fuseWidth / 2 - sparkSize / 2, fuseY - sparkSize / 2, sparkSize, sparkSize);
            }
        } else if (obj.type === "powerup_shield") {
            ctx.fillStyle = obj.color;
            ctx.beginPath();
            ctx.moveTo(obj.x, obj.y);
            ctx.lineTo(obj.x + obj.width, obj.y);
            ctx.lineTo(obj.x + obj.width, obj.y + obj.height * 0.65);
            ctx.lineTo(obj.x + obj.width / 2, obj.y + obj.height);
            ctx.lineTo(obj.x, obj.y + obj.height * 0.65);
            ctx.closePath();
            ctx.fill();
        } else if (obj.type === "powerup_autofire") {
            ctx.fillStyle = obj.color;
            const iconCount = 3;
            const iconWidth = obj.width / 4.5;
            const iconHeight = obj.height * 0.65;
            const totalIconsWidth = iconCount * iconWidth;
            const spaceBetweenIcons = iconWidth / 2.5;
            const totalGroupWidth = totalIconsWidth + (iconCount - 1) * spaceBetweenIcons;
            const startXOffset = (obj.width - totalGroupWidth) / 2;
            const startY = obj.y + (obj.height - iconHeight) / 2;
            for (let k_icon = 0; k_icon < iconCount; k_icon++) {
                const currentX = obj.x + startXOffset + k_icon * (iconWidth + spaceBetweenIcons);
                ctx.fillRect(currentX, startY, iconWidth, iconHeight);
            }
        } else if (obj.type === "powerup_dualbarrel") {
            ctx.fillStyle = obj.color;
            const barrelCount = 2;
            const barrelIconWidth = obj.width / 4;
            const barrelIconHeight = obj.height * 0.7;
            const spacingBetweenBarrels = obj.width / 8;
            const totalGroupWidth = (barrelCount * barrelIconWidth) + ((barrelCount - 1) * spacingBetweenBarrels);
            const startXOverall = obj.x + (obj.width - totalGroupWidth) / 2;
            const startY = obj.y + (obj.height - barrelIconHeight) / 2;
            for (let k_barrel = 0; k_barrel < barrelCount; k_barrel++) {
                const currentX = startXOverall + k_barrel * (barrelIconWidth + spacingBetweenBarrels);
                ctx.fillRect(currentX, startY, barrelIconWidth, barrelIconHeight);
            }
        } else if (obj.type === "powerup_explosive") {
            const centerX = obj.x + obj.width / 2;
            const centerY = obj.y + obj.height / 2;
            const radius = obj.width / 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
            ctx.fillStyle = obj.color;
            ctx.fill();
            ctx.closePath();
        } else {
            ctx.fillStyle = obj.color;
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        }

        // Barrier Collision Logic
        let objectHitBarrierFlag = false;
        for (let b = 0; b < barriers.length; b++) {
            const barrier = barriers[b];
            for (let k_block = 0; k_block < barrier.blocks.length; k_block++) {
                const block = barrier.blocks[k_block];
                if (block.alive) {
                    if (obj.x < block.x + block.width &&
                        obj.x + obj.width > block.x &&
                        obj.y < block.y + block.height &&
                        obj.y + obj.height > block.y) {

                        if (obj.type === "bomb") {
                            const impactX = obj.x + obj.width / 2;
                            const impactY = obj.y + obj.height / 2;
                            block.alive = false;
                            createExplosion(impactX, impactY, BOMB_BARRIER_EXPLOSION_COLOR, BOMB_BARRIER_EXPLOSION_PARTICLES, 0.8);
                            barriers.forEach(currentBarrierSearch => {
                                currentBarrierSearch.blocks.forEach(otherBlockSearch => {
                                    if (otherBlockSearch.alive && otherBlockSearch !== block) {
                                        const dist = Math.sqrt(
                                            Math.pow(otherBlockSearch.x + otherBlockSearch.width / 2 - impactX, 2) +
                                            Math.pow(otherBlockSearch.y + otherBlockSearch.height / 2 - impactY, 2)
                                        );
                                        if (dist < BOMB_AOE_ON_BARRIER_RADIUS) {
                                            otherBlockSearch.alive = false;
                                        }
                                    }
                                });
                            });
                            fallingObjects.splice(i, 1);
                            objectRemovedThisFrame = true;
                            // Power-ups no longer interact with barriers, so no "else if" here.
                            // The objectHitBarrierFlag and break should only be for bombs.
                            objectHitBarrierFlag = true;
                            break;
                        }
                        // Power-ups will now pass through barriers.
                        // The objectHitBarrierFlag and break; were moved inside the bomb block.
                    }
                }
            }
            // Only break from outer barrier loop if a bomb hit a barrier.
            // Powerups should continue checking against other barriers (though they'll pass through all).
            if (objectHitBarrierFlag && obj.type === "bomb") break;
        }

        if (objectRemovedThisFrame) {
            // This continue is mostly for bombs that were removed.
            // Powerups won't be removed by barriers anymore.
            continue;
        }

        // Player Collision Logic
        const playerVisualTopY = player.y - player.height - player.barrelHeight;
        const playerVisualBottomY = player.y;

        if (obj.type === "bomb") {
            if (obj.x < player.x + player.width &&
                obj.x + obj.width > player.x &&
                obj.y < playerVisualBottomY &&
                obj.y + obj.height > playerVisualTopY) {
                if (!player.isInvincible) {
                    const playerVisualCenterY = player.y - (player.height / 2) - (player.barrelHeight / 2);
                    createExplosion(player.x + player.width / 2, playerVisualCenterY, player.color);
                    gameState = "freezeFrame";
                    freezeFrameUntil = Date.now() + 1000;
                    nextStateAfterFreeze = "gameOver";
                    gameWon = false;
                    fallingObjects.splice(i, 1);
                    continue;
                } else {
                    fallingObjects.splice(i, 1);
                    continue;
                }
            }
        } else if (obj.type === "powerup_shield") {
            if (obj.x < player.x + player.width &&
                obj.x + obj.width > player.x &&
                obj.y < playerVisualBottomY &&
                obj.y + obj.height > playerVisualTopY) {
                player.isInvincible = true;
                player.invincibilityTimer = INVINCIBILITY_DURATION_FRAMES;
                powerupMessage = "Shield Active!";
                activePowerupNameForMessage = "shield";
                activePowerupTimerDisplay = player.invincibilityTimer;
                fallingObjects.splice(i, 1);
                continue;
            }
        } else if (obj.type === "powerup_autofire") {
            if (obj.x < player.x + player.width &&
                obj.x + obj.width > player.x &&
                obj.y < playerVisualBottomY &&
                obj.y + obj.height > playerVisualTopY) {
                player.hasAutoFire = true;
                player.autoFireTimer = AUTOFIRE_DURATION_FRAMES;
                player.autoFireNextShotTimer = 0;
                powerupMessage = "Auto Fire Active!";
                activePowerupNameForMessage = "autofire";
                activePowerupTimerDisplay = player.autoFireTimer;
                fallingObjects.splice(i, 1);
                continue;
            }
        } else if (obj.type === "powerup_dualbarrel") {
            if (obj.x < player.x + player.width &&
                obj.x + obj.width > player.x &&
                obj.y < playerVisualBottomY &&
                obj.y + obj.height > playerVisualTopY) {
                player.hasDualBarrel = true;
                player.dualBarrelTimer = DUALBARREL_DURATION_FRAMES;
                powerupMessage = "Dual Barrel Active!";
                activePowerupNameForMessage = "dualbarrel";
                activePowerupTimerDisplay = player.dualBarrelTimer;
                fallingObjects.splice(i, 1);
                continue;
            }
        } else if (obj.type === "powerup_explosive") {
            if (obj.x < player.x + player.width &&
                obj.x + obj.width > player.x &&
                obj.y < playerVisualBottomY &&
                obj.y + obj.height > playerVisualTopY) {
                player.hasExplosiveBullets = true;
                player.explosiveBulletsTimer = EXPLOSIVE_BULLETS_DURATION_FRAMES;
                powerupMessage = "Explosive Bullets Active!";
                activePowerupNameForMessage = "explosive";
                activePowerupTimerDisplay = player.explosiveBulletsTimer;
                fallingObjects.splice(i, 1);
                continue;
            }
        }

        if (obj.y > canvas.height) {
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
  player.hasExplosiveBullets = false;
  player.explosiveBulletsTimer = 0;
}


function startGame(isContinuing = false) {
  if (!isContinuing) {
    score = 0;
    currentLevel = 1;
  }
  highScore = parseInt(localStorage.getItem('spaceInvadersHighScore')) || 0;

  resetPlayerPosition();

  initializeEnemies();
  initializeBarriers();

  enemyBullets = [];
  bullets = [];
  particles = [];
  fallingObjects = [];
  gameWon = false;
}

function drawButton(button) {
  context.fillStyle = '#777777';
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
    if (powerupMessage !== "") { // Only draw if there's an active message
        const mainMessageY = 60; // Y position for the first line of text
        const lineHeight = 25;   // Approximate height for a line of text + spacing (for 1.5 lines apart)
        const mainFontSize = 20; // Font size for the main message
        const timerFontSize = 16; // Font size for the timer message

        // 1. Draw the main power-up message (e.g., "Shield Active!")
        ctx.fillStyle = "yellow"; // Prominent color for the message
        ctx.font = mainFontSize + "px Arial";
        ctx.textAlign = "center";
        ctx.fillText(powerupMessage, canvas.width / 2, mainMessageY);

        // 2. Calculate and draw the remaining time message
        if (activePowerupTimerDisplay > 0) {
            // Convert frames to seconds, show one decimal place
            const remainingSeconds = (activePowerupTimerDisplay / 60).toFixed(1);
            const timerMessage = "(" + remainingSeconds + " seconds remaining)";

            ctx.font = "italic " + timerFontSize + "px Arial"; // Smaller, italic font for timer
            // Use the same fillStyle as main message or a slightly different one if desired (e.g., white)
            // ctx.fillStyle = "white";
            ctx.fillText(timerMessage, canvas.width / 2, mainMessageY + lineHeight);
        }

        ctx.textAlign = "left"; // Reset textAlign to default for other draw functions
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

    const newButtonWidth = 280;
    readyButtonLevelComplete = {
        x: canvas.width / 2 - newButtonWidth / 2,
        y: canvas.height / 2 + 60,
        width: newButtonWidth,
        height: buttonHeight,
        label: "Start Level " + currentLevel
    };
    drawButton(readyButtonLevelComplete);
}

function initializeStars() {
    stars = [];
    for (let i = 0; i < NUM_STARS; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1
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
        if (!player.isTryingToFireGamepad && !player.hasAutoFire) {
            playerShoot();
        }
        player.isTryingToFireGamepad = true;
      } else {
        player.isMovingLeftGamepad = false; // Corrected: should be player.isTryingToFireGamepad
      }
    }
  }
}

function handlePlayerFiring() {
    if (!player.hasAutoFire) return;

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
      if (!player.isTryingToFireKeyboard && !player.hasAutoFire) {
          playerShoot();
      }
      player.isTryingToFireKeyboard = true;
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
      startGame(false);
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
    const continueButtonGameOver = {
        x: canvas.width / 2 - 100,
        y: canvas.height / 2 + 40,
        width: 200,
        height: 40,
        label: "Continue (Level " + currentLevel + ")"
    };
    if (isInside(mousePos, continueButtonGameOver)) {
        startGame(true);
        gameState = "playing";
    } else if (isInside(mousePos, gameOverToTitleButton)) {
        gameState = "title";
    }
  } else if (gameState === "levelComplete") {
    if (isInside(mousePos, readyButtonLevelComplete)) {
        initializeEnemies();
        initializeBarriers();
        resetPlayerPosition();
        bullets = [];
        enemyBullets = [];
        particles = [];
        fallingObjects = [];
        gameState = "playing";
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
        if (!player.isTryingToFireTouch && !player.hasAutoFire) {
            playerShoot();
        }
        player.isTryingToFireTouch = true;
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

      if (isInside(touchPos, osFireButton)) {
          player.isTryingToFireTouch = false;
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
    if (activePowerupNameForMessage === "shield") {
        activePowerupTimerDisplay = player.invincibilityTimer;
    }
    if (player.invincibilityTimer <= 0) {
        player.isInvincible = false;
        if (activePowerupNameForMessage === "shield") {
            powerupMessage = "";
            activePowerupNameForMessage = "";
        }
    }
  }
  if (player.hasAutoFire) {
      player.autoFireTimer--;
      if (activePowerupNameForMessage === "autofire") {
          activePowerupTimerDisplay = player.autoFireTimer;
      }
      if (player.autoFireTimer <= 0) {
          player.hasAutoFire = false;
          if (activePowerupNameForMessage === "autofire") {
              powerupMessage = "";
              activePowerupNameForMessage = "";
          }
      }
  }
  if (player.autoFireNextShotTimer > 0) {
      player.autoFireNextShotTimer--;
  }
  if (player.hasDualBarrel) {
      player.dualBarrelTimer--;
      if (activePowerupNameForMessage === "dualbarrel") {
          activePowerupTimerDisplay = player.dualBarrelTimer;
      }
      if (player.dualBarrelTimer <= 0) {
          player.hasDualBarrel = false;
          if (activePowerupNameForMessage === "dualbarrel") {
              powerupMessage = "";
              activePowerupNameForMessage = "";
          }
      }
  }
  if (player.hasExplosiveBullets) {
      player.explosiveBulletsTimer--;
      if (activePowerupNameForMessage === "explosive") {
          activePowerupTimerDisplay = player.explosiveBulletsTimer;
      }
      if (player.explosiveBulletsTimer <= 0) {
          player.hasExplosiveBullets = false;
          if (activePowerupNameForMessage === "explosive") {
              powerupMessage = "";
              activePowerupNameForMessage = "";
          }
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
      const baseAlpha = 0.5;
      const pulseAmplitude = 0.2;
      context.globalAlpha = baseAlpha + Math.sin(Date.now() / 150) * pulseAmplitude;
      const visualCenterX = player.x + player.width / 2;
      const visualCenterY = player.y - (player.height / 2) - (player.barrelHeight / 2);
      const shieldRadius = (player.width / 2) + 10;
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

            const impactX = bullet.x + bullet.width / 2;
            const impactY = bullet.y;

            enemy.alive = false;
            score += 10;
            createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color);

            if (player.hasExplosiveBullets) {
                createExplosion(impactX, impactY, BULLET_EXPLOSION_COLOR, BULLET_EXPLOSION_PARTICLE_COUNT, 0.75);
                enemies.forEach(otherEnemy => {
                    if (otherEnemy.alive && otherEnemy !== enemy) {
                        const dist = Math.sqrt(
                            Math.pow(otherEnemy.x + otherEnemy.width / 2 - impactX, 2) +
                            Math.pow(otherEnemy.y + otherEnemy.height / 2 - impactY, 2)
                        );
                        if (dist < EXPLOSION_RADIUS) {
                            otherEnemy.alive = false;
                            score += 10;
                            createExplosion(otherEnemy.x + otherEnemy.width / 2, otherEnemy.y + otherEnemy.height / 2, otherEnemy.color);
                        }
                    }
                });
                barriers.forEach(barrier => {
                    barrier.blocks.forEach(b => {
                        if (b.alive) {
                            const dist = Math.sqrt(
                                Math.pow(b.x + b.width / 2 - impactX, 2) +
                                Math.pow(b.y + b.height / 2 - impactY, 2)
                            );
                            if (dist < EXPLOSION_RADIUS) {
                                b.alive = false;
                            }
                        }
                    });
                });
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

            const impactX = bullet.x + bullet.width / 2;
            const impactY = bullet.y;

            block.alive = false;

            if (player.hasExplosiveBullets) {
                createExplosion(impactX, impactY, BULLET_EXPLOSION_COLOR, BULLET_EXPLOSION_PARTICLE_COUNT, 0.75);
                barriers.forEach(barrier => {
                    barrier.blocks.forEach(otherBlock => {
                        if (otherBlock.alive && otherBlock !== block) {
                            const dist = Math.sqrt(
                                Math.pow(otherBlock.x + otherBlock.width / 2 - impactX, 2) +
                                Math.pow(otherBlock.y + otherBlock.height / 2 - impactY, 2)
                            );
                            if (dist < EXPLOSION_RADIUS) {
                                otherBlock.alive = false;
                            }
                        }
                    });
                });
                enemies.forEach(e => {
                    if (e.alive) {
                        const dist = Math.sqrt(
                            Math.pow(e.x + e.width / 2 - impactX, 2) +
                            Math.pow(e.y + e.height / 2 - impactY, 2)
                        );
                        if (dist < EXPLOSION_RADIUS) {
                            e.alive = false;
                            score += 10;
                            createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.color);
                        }
                    }
                });
            }
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

        if (!player.isInvincible) {
            const playerVisualCenterY = player.y - (player.height / 2) - (player.barrelHeight / 2);
            createExplosion(player.x + player.width / 2, playerVisualCenterY, player.color);
            gameState = "freezeFrame";
            freezeFrameUntil = Date.now() + 1000;
            nextStateAfterFreeze = "gameOver";
            gameWon = false;
        } else {
            // console.log("Player invincible, bullet absorbed by shield!");
        }
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
      gameWon = false;
      return;
    }
  }
  if (enemies.every(enemy => !enemy.alive)) {
    gameState = "freezeFrame";
    freezeFrameUntil = Date.now() + 1000;
    nextStateAfterFreeze = "levelComplete";
  }
}

// --- Game Loop ---
function gameLoop() {
  // if (powerupMessageTimer > 0) { // This whole block related to old timer is removed in next step
  //     powerupMessageTimer--;
  //     if (powerupMessageTimer <= 0) {
  //         powerupMessage = "";
  //     }
  // }
  if (gameState === "title") {
    drawTitleScreen();
  } else if (gameState === "settings") {
    drawSettingsScreen();
  } else if (gameState === "levelComplete") {
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawStars(context);
    drawLevelCompleteMessage(context);
  } else if (gameState === "freezeFrame") {
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawStars(context);
    drawPlayer();
    drawBarriers(context);
    context.fillStyle = bulletConfig.color;
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
    context.fillStyle = enemyBulletConfig.color;
    for (let i = 0; i < enemyBullets.length; i++) {
        const bullet = enemyBullets[i];
        context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (enemy.alive) {
            drawAlien(enemy, context);
        }
    }
    updateAndDrawParticles(context);
    drawScore(context);
    if (Date.now() > freezeFrameUntil) {
        if (nextStateAfterFreeze === "levelComplete") {
            currentLevel++;
        }
        gameState = nextStateAfterFreeze;
        nextStateAfterFreeze = "";
    }
  } else if (gameState === "playing") {
    handleGamepadInput();
    handlePlayerFiring();
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
    context.fillStyle = 'rgba(0, 0, 0, 0.75)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawScore(context);
    context.font = '48px Arial';
    context.fillStyle = gameWon ? 'gold' : 'red';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const message = gameWon ? 'You Win!' : 'Game Over!';
    context.fillText(message, canvas.width / 2, canvas.height / 2);
    const continueButtonGameOver = {
        x: canvas.width / 2 - (340 / 2),
        y: canvas.height / 2 + 40,
        width: 340,
        height: 40,
        label: "Continue (Level " + currentLevel + ")"
    };
    drawButton(continueButtonGameOver);
    gameOverToTitleButton = {
        x: canvas.width / 2 - (280 / 2),
        y: canvas.height / 2 + 40 + continueButtonGameOver.height + 10,
        width: 280,
        height: 40,
        label: "Return to Menu"
    };
    drawButton(gameOverToTitleButton);
    context.textAlign = "left";
  }
  requestAnimationFrame(gameLoop);
}

initializeStars();
gameLoop();
