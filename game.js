// -- GAME SETUP --
// Get the canvas element and its 2D rendering context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// -- ASSET LOADING --
// Create a new image object for the player's sprite
const playerImage = new Image();
playerImage.src = 'player_64.PNG'; // Set the source of the player image

// -- GAME STATE VARIABLES --

// Player object: properties and state of the player
const player = {
    x: 50,                      // Horizontal position
    y: 0,                       // Vertical position (will be set accurately on image load)
    width: 64,                  // Width of the player (should match image width)
    height: 64,                 // Height of the player (should match image height)
    speed: 5,                   // Horizontal movement speed
    isFacingRight: true,        // Direction player is facing
    dx: 0,                      // Change in x position per frame (horizontal velocity)
    dy: 0,                      // Change in y position per frame (vertical velocity)
    jumpStrength: 15,           // Upward force applied when jumping
    gravity: 0.8,               // Downward force applied each frame
    isGrounded: false           // True if player is currently on a platform or the ground
};

// Platform definitions: an array of objects, each representing a platform
const platforms = [
    // Each platform has an x, y, width, and height
    { x: 100, y: canvas.height - 100, width: 150, height: 20 },
    { x: 300, y: canvas.height - 180, width: 200, height: 20 },
    { x: 50,  y: canvas.height - 280, width: 100, height: 20 }, // A higher platform
    { x: 550, y: canvas.height - 120, width: 180, height: 20 }  // Platform to the right
];

// Keyboard input state: tracks whether movement keys are currently pressed
const keys = {
    ArrowLeft: false,
    ArrowRight: false
    // Jump key ('Space') is handled as a single press event, not continuous state
};

// -- EVENT LISTENERS --

// Listen for keydown events
window.addEventListener('keydown', (e) => {
    // If the pressed key is one we track for continuous movement (Left/Right Arrows)
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true; // Mark as pressed
    }
    // Handle jump: if Space is pressed and player is grounded
    if (e.code === 'Space' && player.isGrounded) {
        player.dy = -player.jumpStrength; // Apply upward velocity
        player.isGrounded = false;        // Player is now in the air
    }
});

// Listen for keyup events
window.addEventListener('keyup', (e) => {
    // If the released key is one we track for continuous movement
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false; // Mark as not pressed
    }
});

// -- DRAWING FUNCTIONS --

// Draw all platforms
function drawPlatforms() {
    ctx.fillStyle = 'green'; // Set platform color
    platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
}

// Draw the player
function drawPlayer() {
    // Don't draw if the player image hasn't loaded yet
    if (!playerImage.complete || playerImage.naturalWidth === 0) {
        // console.warn("Player image not yet loaded or failed to load.");
        return;
    }

    ctx.save(); // Save the current canvas context state (transformations, etc.)

    // Flip player image if facing left
    if (!player.isFacingRight) {
        ctx.scale(-1, 1); // Flip context horizontally
        // When flipped, the drawing origin also flips.
        // We need to draw at a negative x-coordinate that accounts for this flip and player width.
        ctx.drawImage(playerImage, -player.x - player.width, player.y, player.width, player.height);
    } else {
        // Draw player facing right (normal)
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    }

    ctx.restore(); // Restore the canvas context state to what it was before this function
}

// -- GAME LOGIC UPDATE FUNCTION --

// Update player position, handle physics, and check for collisions
function updateGame() {
    // --- Horizontal Movement ---
    player.dx = 0; // Reset horizontal velocity for this frame
    if (keys.ArrowLeft) {
        player.dx = -player.speed;   // Move left
        player.isFacingRight = false; // Update facing direction
    }
    if (keys.ArrowRight) {
        player.dx = player.speed;    // Move right
        player.isFacingRight = true;  // Update facing direction
    }
    player.x += player.dx; // Apply horizontal movement

    // --- Horizontal Boundary Checks (prevent player from going off-screen) ---
    if (player.x < 0) {
        player.x = 0; // Stop at left edge
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width; // Stop at right edge
    }

    // --- Vertical Movement and Physics ---
    player.dy += player.gravity; // Apply gravity to vertical velocity
    player.y += player.dy;       // Apply vertical velocity to position

    // --- Collision Detection ---
    player.isGrounded = false; // Assume player is not grounded until a collision is detected

    // Platform Collision Detection
    for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        // Collision conditions:
        // 1. Player is moving downwards (player.dy > 0).
        // 2. Player's bottom edge in the *previous frame* was above or at the platform's top edge.
        //    (player.y + player.height - player.dy) is an approximation of player's bottom edge last frame.
        // 3. Player's current bottom edge is at or below the platform's top edge.
        // 4. Player is horizontally aligned with the platform.
        if (player.dy > 0 &&
            (player.y + player.height - player.dy) <= platform.y && // Check against previous position
            (player.y + player.height) >= platform.y &&
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.width
        ) {
            player.y = platform.y - player.height; // Position player on top of the platform
            player.dy = 0;                         // Stop vertical movement
            player.isGrounded = true;              // Player is now grounded
            break; // Exit loop as player can only be on one platform at a time
        }
    }

    // Ground Check (if player is not on a platform and falls to the bottom)
    const groundY = canvas.height - player.height; // Define ground level
    if (player.y > groundY) { // If player is below ground level
        player.y = groundY;       // Set player on the ground
        if (player.dy > 0) {      // If player was falling
            player.dy = 0;        // Stop vertical movement
        }
        player.isGrounded = true; // Player is grounded
    }

    // Top Boundary Check (prevent player from going above canvas)
    if (player.y < 0) {
        player.y = 0;
        if (player.dy < 0) { // If player was moving upwards
            player.dy = 0;    // Stop upward movement
        }
    }
}

// -- MAIN GAME LOOP --
function gameLoop() {
    // 1. Clear the canvas on each frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Update game state (player movement, physics, collisions)
    updateGame();

    // 3. Draw game elements
    drawPlatforms(); // Draw platforms first
    drawPlayer();    // Draw player on top of platforms

    // 4. Request the next frame to continue the loop
    requestAnimationFrame(gameLoop);
}

// -- INITIALIZATION --

// Actions to take once the player image has loaded
playerImage.onload = () => {
    // Set initial player Y position accurately now that height is known.
    // Places player on the "ground" with a small buffer from the absolute bottom.
    player.y = canvas.height - player.height - 10;
    player.isGrounded = true; // Player starts on the ground
    gameLoop(); // Start the game loop
};

// Handle image loading errors
playerImage.onerror = () => {
    console.error("Error loading player image. Game might not display player correctly.");
    // As a fallback, could try to start the game loop anyway,
    // or draw a placeholder for the player.
    // For now, just logs error. If player.width/height are accurate,
    // physics might still work for an invisible player.
    // gameLoop(); // Optionally start game even if image fails
};

// TODO: Future enhancements:
// - Implement obstacles and enemies
// - Add scoring system
// - Create multiple levels or scrolling background
// - Sound effects and music
// - More complex platform types (e.g., moving platforms)
