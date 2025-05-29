const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

// Player properties
const player = {
  width: 50,
  height: 50,
  speed: 5,
  color: 'green',
  isMovingLeft: false,
  isMovingRight: false
};

// Initialize player position at bottom-center
player.x = (canvas.width - player.width) / 2;
player.y = canvas.height - player.height - 10; // 10px offset from bottom

// Enemy Configuration
const enemyConfig = {
  width: 40,
  height: 20,
  color: 'red',
  speed: 2, // Speed of horizontal movement
  rows: 3,
  cols: 8,
  padding: 10, // Padding between enemies
  marginTop: 30, // Margin from the top of the canvas
  marginLeft: 60 // Margin from the left of the canvas
};

let enemies = [];
let enemyDirection = 1; // 1 for right, -1 for left
let enemyMoveDown = 0; // Pixels to move down

// Bullet Configuration
const bulletConfig = {
  width: 5,
  height: 10,
  color: 'yellow',
  speed: 7
};

let bullets = [];

// Game State
let gameOver = false;
let gameWon = false;

function initializeEnemies() {
  enemies = []; // Clear existing enemies if any
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

// Event Listeners for keyboard input
document.addEventListener('keydown', function(event) {
  if (gameOver) return; // Don't allow input if game is over

  if (event.key === 'ArrowLeft') {
    player.isMovingLeft = true;
  } else if (event.key === 'ArrowRight') {
    player.isMovingRight = true;
  } else if (event.code === 'Space') {
    bullets.push({
      x: player.x + player.width / 2 - bulletConfig.width / 2,
      y: player.y,
      width: bulletConfig.width,
      height: bulletConfig.height,
      color: bulletConfig.color,
      speed: bulletConfig.speed
    });
  }
});

document.addEventListener('keyup', function(event) {
  if (event.key === 'ArrowLeft') {
    player.isMovingLeft = false;
  } else if (event.key === 'ArrowRight') {
    player.isMovingRight = false;
  }
});

function gameLoop() {
  if (gameOver) {
    context.fillStyle = 'rgba(0, 0, 0, 0.75)'; // Semi-transparent black background
    context.fillRect(0, 0, canvas.width, canvas.height); // Cover the whole canvas

    context.font = '48px Arial';
    context.fillStyle = gameWon ? 'gold' : 'red';
    context.textAlign = 'center';
    const message = gameWon ? 'You Win!' : 'Game Over!';
    context.fillText(message, canvas.width / 2, canvas.height / 2);
    return; // Stop further game processing
  }

  // Clear the canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Update player position
  if (player.isMovingLeft) {
    player.x -= player.speed;
  }
  if (player.isMovingRight) {
    player.x += player.speed;
  }

  // Boundary detection for player
  if (player.x < 0) {
    player.x = 0;
  }
  if (player.x + player.width > canvas.width) {
    player.x = canvas.width - player.width;
  }

  // Draw the player
  context.fillStyle = player.color;
  context.fillRect(player.x, player.y, player.width, player.height);

  // Bullet logic
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
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y) {
        enemy.alive = false;
        bullets.splice(i, 1);
        break; 
      }
    }
  }

  // Enemy logic
  let hitBoundary = false;
  enemies.forEach(enemy => {
    if (enemy.alive) {
      // Update horizontal position
      enemy.x += enemyConfig.speed * enemyDirection;

      // Check for boundary hits
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
    enemies.forEach(enemy => {
      if (enemy.alive) {
        enemy.y += moveStep;
      }
    });
    enemyMoveDown -= moveStep;
  }

  // Draw enemies (only alive ones)
  enemies.forEach(enemy => {
    if (enemy.alive) {
      context.fillStyle = enemy.color;
      context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }
  });

  // Loss Condition Check (Enemies reach player)
  for (const enemy of enemies) {
    if (enemy.alive && enemy.y + enemy.height >= player.y) {
      gameOver = true;
      gameWon = false;
      // No need to call gameLoop again here, the check at the top will handle it
      // and display the message. We also don't need to return here,
      // as the next iteration of gameLoop will catch the gameOver state.
      // However, returning early can prevent unnecessary processing if desired.
      // For simplicity, we'll let the top check handle it.
      break; // Exit loop as game is over
    }
  }
  if (gameOver && !gameWon) { // If loss condition met, request another frame to show message
      requestAnimationFrame(gameLoop);
      return;
  }


  // Win Condition Check (All enemies dead)
  // Only check if the game is not already over (e.g., by loss condition)
  if (!gameOver) {
    let allEnemiesDead = true;
    for (const enemy of enemies) {
      if (enemy.alive) {
        allEnemiesDead = false;
        break;
      }
    }

    if (allEnemiesDead) {
      gameOver = true;
      gameWon = true;
      // No need to call gameLoop again here, the check at the top will handle it.
    }
  }
  
  // Call itself again using requestAnimationFrame
  requestAnimationFrame(gameLoop);
}

// Initialize and start
initializeEnemies();
gameLoop();
