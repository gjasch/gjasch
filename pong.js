// Get the canvas element and its 2D rendering context
const canvas = document.getElementById('pongCanvas');
const context = canvas.getContext('2d');

// Define game dimensions and colors
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const BALL_RADIUS = 10;
const PADDLE_SPEED = 8;

const COLOR_BACKGROUND = 'black';
const COLOR_FOREGROUND = 'white';

const STATE_TITLE_SCREEN = 'title_screen';
const STATE_COUNTDOWN = 'countdown';
const STATE_PLAYING = 'playing';
const STATE_GAME_OVER = 'game_over';

// Button area for Title Screen
// const startGameButton = { ... }; // REMOVED/COMMENTED
const onePlayerStartButton = {
    x: CANVAS_WIDTH / 2 - 150, // Adjust X to be on one side
    y: CANVAS_HEIGHT / 2 + 50,
    width: 140, // Slightly smaller buttons if needed
    height: 50,
    text: "1 Player"
};

const twoPlayerStartButton = {
    x: CANVAS_WIDTH / 2 + 10,  // Adjust X to be on the other side
    y: CANVAS_HEIGHT / 2 + 50,
    width: 140,
    height: 50,
    text: "2 Players"
};

const rematchButton = {
    x: CANVAS_WIDTH / 2 - 155, // Positioned to the left of center
    y: CANVAS_HEIGHT / 2 + 50,  // Below winner message
    width: 150,
    height: 50,
    text: "Rematch"
};

const backToMenuButton = {
    x: CANVAS_WIDTH / 2 + 5,   // Positioned to the right of center
    y: CANVAS_HEIGHT / 2 + 50, // Below winner message
    width: 150,
    height: 50,
    text: "Main Menu"
};

// Function to draw a rectangle (for paddles)
function drawRect(x, y, width, height, color) {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
}

// Function to draw a circle (for the ball)
function drawCircle(x, y, radius, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2, false); // 0 to 2*PI for a full circle
    context.closePath();
    context.fill();
}

// Define Game Objects
const player1Paddle = {
    x: 50,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    color: COLOR_FOREGROUND,
    dy: 0 // Vertical speed, will be controlled by input
};

const player2Paddle = {
    x: CANVAS_WIDTH - 50 - PADDLE_WIDTH,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    color: COLOR_FOREGROUND,
    dy: 0 // Vertical speed, will be controlled by input
};

const ball = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    radius: BALL_RADIUS,
    speed: 5, // Magnitude of speed
    dx: 0,    // Horizontal speed - START STATIC
    dy: 0,    // Vertical speed - START STATIC
    color: COLOR_FOREGROUND
};
// REMOVE the Math.random() lines that were here for dx/dy

let player1Score = 0;
let player2Score = 0;

const WINNING_SCORE = 5; // Or any score you prefer

// AI Behavior Parameters
// const AI_REACTION_ZONE_X = CANVAS_WIDTH / 2; // Example: AI intensifies reaction when ball crosses half-court. (Currently unused)
// const AI_TARGET_OFFSET_MAX = PADDLE_HEIGHT * 0.35; // REMOVED/REPLACED by PREDICTION_ERROR_MARGIN_MAX

// Enhanced AI Behavior Parameters
const AI_REACTION_INTERVAL = 150; // Milliseconds between AI reaction/prediction updates
const AI_MAX_ERROR_AT_MAX_DISTANCE = PADDLE_HEIGHT * 0.6; // Max random error in Y prediction when ball is furthest
const AI_MIN_ERROR_AT_IMPACT = PADDLE_HEIGHT * 0.1; // Min random error when ball is very close
// const AI_MISS_CHANCE = 0.05; // Example: 5% chance AI 'messes up' on a given cycle. (Currently unused, for future refinement)


let winnerMessage = ""; // Keep for game over message
let currentGameState = STATE_TITLE_SCREEN;
let gameMode = 'two_player'; // Default or set to null until chosen

// Enhanced AI State Variables
let aiLastReactionTime = 0;
let aiTargetY = player2Paddle.y + player2Paddle.height / 2;
// let gameStarted = false; // REMOVED
// let gameOver = false; // REMOVED

let countdownValue = 3;
let lastCountdownTime = 0; // To track time for 1-second intervals

function resetBall() {
    ball.x = CANVAS_WIDTH / 2;
    ball.y = CANVAS_HEIGHT / 2;

    // Randomize direction, ensure it's not too vertical
    let newSpeedX = ball.speed;
    if (Math.random() < 0.5) {
        newSpeedX = -newSpeedX;
    }
    // Ensure dy is not 0, and has some variability
    let newSpeedY = (Math.random() * (ball.speed -1)) + 1; // from 1 to ball.speed -1
    if (Math.random() < 0.5) {
        newSpeedY = -newSpeedY;
    }

    ball.dx = newSpeedX;
    ball.dy = newSpeedY;
}

// Keyboard event listeners
document.addEventListener('keydown', function(event) {
    // Player 1 (Left Paddle) - W and S keys
    if (event.key === 'w' || event.key === 'W') {
        player1Paddle.dy = -PADDLE_SPEED;
    } else if (event.key === 's' || event.key === 'S') {
        player1Paddle.dy = PADDLE_SPEED;
    }

    // Player 2 (Right Paddle) - ArrowUp and ArrowDown keys - ONLY if two_player mode
    if (gameMode === 'two_player') {
        if (event.key === 'ArrowUp') {
            player2Paddle.dy = -PADDLE_SPEED;
        } else if (event.key === 'ArrowDown') {
            player2Paddle.dy = PADDLE_SPEED;
        }
    }

    // Start game on Spacebar press - REMOVED, will be handled by title screen UI
    // if (event.key === ' ' || event.code === 'Space') { ... }
});

document.addEventListener('keyup', function(event) {
    // Player 1 - Stop movement when key is released
    if ((event.key === 'w' || event.key === 'W') && player1Paddle.dy < 0) {
        player1Paddle.dy = 0;
    } else if ((event.key === 's' || event.key === 'S') && player1Paddle.dy > 0) {
        player1Paddle.dy = 0;
    }

    // Player 2 - Stop movement when key is released - ONLY if two_player mode
    if (gameMode === 'two_player') {
        if (event.key === 'ArrowUp' && player2Paddle.dy < 0) {
            player2Paddle.dy = 0;
        } else if ((event.key === 'ArrowDown' && player2Paddle.dy > 0)) { // Corrected parenthesis
            player2Paddle.dy = 0;
        }
    }
});

function updatePaddles() {
    // Move player 1 paddle (always controlled by player)
    player1Paddle.y += player1Paddle.dy;
    // Keep player 1 paddle within canvas bounds
    if (player1Paddle.y < 0) {
        player1Paddle.y = 0;
    } else if (player1Paddle.y + player1Paddle.height > CANVAS_HEIGHT) {
        player1Paddle.y = CANVAS_HEIGHT - player1Paddle.height;
    }

    // Player 2 paddle movement
    if (gameMode === 'one_player' && currentGameState === STATE_PLAYING) {
        // --- New Predictive AI controls Player 2 paddle ---

        // Only update AI's target and reaction if enough time has passed and ball is coming
        if (ball.dx > 0 && (Date.now() - aiLastReactionTime > AI_REACTION_INTERVAL)) {
            // Predict ball's Y position at the paddle's x-plane
            const dxToPaddle = player2Paddle.x - ball.x;
            const timeToReachPaddle = dxToPaddle / ball.dx; // Avoid division by zero if ball.dx can be 0
            let predictedY = ball.y + ball.dy * timeToReachPaddle;

            // Simplified wall bounce prediction
            if (predictedY < BALL_RADIUS) { // Check against BALL_RADIUS for edge
                predictedY = BALL_RADIUS + (BALL_RADIUS - predictedY);
            } else if (predictedY > CANVAS_HEIGHT - BALL_RADIUS) {
                predictedY = (CANVAS_HEIGHT - BALL_RADIUS) - (predictedY - (CANVAS_HEIGHT - BALL_RADIUS));
            }
            // Clamp predictedY to be within canvas ball center bounds, as a safeguard.
            predictedY = Math.max(BALL_RADIUS, Math.min(CANVAS_HEIGHT - BALL_RADIUS, predictedY));

            // --- DYNAMIC ERROR CALCULATION ---
            // Normalize distance: 0 (at paddle) to 1 (far away at player 1 side)
            // We use (player2Paddle.x - BALL_RADIUS) as the max distance for scaling for simplicity, assuming ball starts beyond P1 paddle
            // A simpler approach for distance factor:
            let distanceFactor = 0;
            if (dxToPaddle > 0) { // only calculate if ball is to the left of paddle
                 // Scale factor: 1 when ball is at x=0, 0 when ball is at paddle.x
                 distanceFactor = Math.min(1, Math.max(0, dxToPaddle / player2Paddle.x));
            }

            const currentErrorMargin = AI_MIN_ERROR_AT_IMPACT +
                                     (AI_MAX_ERROR_AT_MAX_DISTANCE - AI_MIN_ERROR_AT_IMPACT) * distanceFactor;

            aiTargetY = predictedY + (Math.random() - 0.5) * 2 * currentErrorMargin;
            // --- END DYNAMIC ERROR CALCULATION ---

            // Clamp aiTargetY to where paddle center can realistically be
            aiTargetY = Math.max(player2Paddle.height / 2, aiTargetY);
            aiTargetY = Math.min(CANVAS_HEIGHT - player2Paddle.height / 2, aiTargetY);

            aiLastReactionTime = Date.now();
        }

        // Move paddle towards the current aiTargetY
        player2Paddle.dy = 0; // Default to no movement
        const paddleCenterY = player2Paddle.y + player2Paddle.height / 2;
        const deadZone = PADDLE_HEIGHT * 0.1; // e.g., 10% of paddle height

        if (paddleCenterY < aiTargetY - deadZone) {
            player2Paddle.dy = PADDLE_SPEED; // Move down
        } else if (paddleCenterY > aiTargetY + deadZone) {
            player2Paddle.dy = -PADDLE_SPEED; // Move up
        }

        player2Paddle.y += player2Paddle.dy;

    } else if (gameMode === 'two_player') {
        // Player 2 paddle is controlled by keyboard
        player2Paddle.y += player2Paddle.dy;
    }
    // Else (e.g. if gameMode is null or other states like countdown/game_over for P2)
    // P2 paddle dy is already 0 or not updated by keys, so it remains static.

    // Keep player 2 paddle within canvas bounds (common for both AI and human player)
    if (player2Paddle.y < 0) {
        player2Paddle.y = 0;
    } else if (player2Paddle.y + player2Paddle.height > CANVAS_HEIGHT) {
        player2Paddle.y = CANVAS_HEIGHT - player2Paddle.height;
    }
}

function updateBall() {
    // Move the ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with paddles
    // Check collision with player 1 (left) paddle
    if (ball.x - ball.radius < player1Paddle.x + player1Paddle.width && // Ball's left edge is to the left of paddle's right edge
        ball.x + ball.radius > player1Paddle.x && // Ball's right edge is to the right of paddle's left edge
        ball.y - ball.radius < player1Paddle.y + player1Paddle.height && // Ball's top edge is above paddle's bottom edge
        ball.y + ball.radius > player1Paddle.y) { // Ball's bottom edge is below paddle's top edge

        if (ball.dx < 0) { // Only reflect if ball is moving towards the paddle
            ball.dx *= -1;
            // Optional: Adjust ball position to prevent sticking
            // ball.x = player1Paddle.x + player1Paddle.width + ball.radius;
        }
    }
    // Check collision with player 2 (right) paddle
    else if (ball.x + ball.radius > player2Paddle.x && // Ball's right edge is to the right of paddle's left edge
             ball.x - ball.radius < player2Paddle.x + player2Paddle.width && // Ball's left edge is to the left of paddle's right edge
             ball.y - ball.radius < player2Paddle.y + player2Paddle.height && // Ball's top edge is above paddle's bottom edge
             ball.y + ball.radius > player2Paddle.y) { // Ball's bottom edge is below paddle's top edge

        if (ball.dx > 0) { // Only reflect if ball is moving towards the paddle
            ball.dx *= -1;
            // Optional: Adjust ball position to prevent sticking
            // ball.x = player2Paddle.x - ball.radius;
        }
    }

    // Ball collision with top and bottom walls
    if (ball.y + ball.radius > CANVAS_HEIGHT || ball.y - ball.radius < 0) {
        ball.dy *= -1; // Reverse vertical direction
    }

    // Scoring logic
    if (ball.x - ball.radius < 0) { // Ball went past left paddle
        player2Score++;
        if (player2Score >= WINNING_SCORE) {
            winnerMessage = "Player 2 Wins!";
            currentGameState = STATE_GAME_OVER;
        } else {
            // Instead of immediate resetBall(), prepare for countdown:
            ball.x = CANVAS_WIDTH / 2; // Reset ball position
            ball.y = CANVAS_HEIGHT / 2;
            ball.dx = 0;                 // Make ball static
            ball.dy = 0;
            countdownValue = 3;          // Reset countdown timer
            lastCountdownTime = Date.now(); // Set new countdown start time
            currentGameState = STATE_COUNTDOWN; // Transition to countdown state
        }
    } else if (ball.x + ball.radius > CANVAS_WIDTH) { // Ball went past right paddle
        player1Score++;
        if (player1Score >= WINNING_SCORE) {
            winnerMessage = "Player 1 Wins!";
            currentGameState = STATE_GAME_OVER;
        } else {
            // Instead of immediate resetBall(), prepare for countdown:
            ball.x = CANVAS_WIDTH / 2; // Reset ball position
            ball.y = CANVAS_HEIGHT / 2;
            ball.dx = 0;                 // Make ball static
            ball.dy = 0;
            countdownValue = 3;          // Reset countdown timer
            lastCountdownTime = Date.now(); // Set new countdown start time
            currentGameState = STATE_COUNTDOWN; // Transition to countdown state
        }
    }
}

function gameLoop() {
    let textWidth; // Declare once at the top of the function scope

    // Clear canvas (common to all states, or move into each state's render logic if background changes)
    drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_BACKGROUND);

    switch (currentGameState) {
        case STATE_TITLE_SCREEN:
            // --- Update logic for Title Screen (e.g., button hover) ---
            // (To be implemented in next step)

            // --- Render logic for Title Screen ---
            context.fillStyle = COLOR_FOREGROUND;
            context.font = '70px Arial';
            const titleText = "PONG";
            textWidth = context.measureText(titleText).width; // Assignment
            context.fillText(titleText, (CANVAS_WIDTH - textWidth) / 2, CANVAS_HEIGHT / 2 - 50);

            // Draw 1 Player Start button
            drawRect(onePlayerStartButton.x, onePlayerStartButton.y, onePlayerStartButton.width, onePlayerStartButton.height, COLOR_FOREGROUND);
            context.fillStyle = COLOR_BACKGROUND;
            context.font = '25px Arial'; // Adjust font size as needed
            textWidth = context.measureText(onePlayerStartButton.text).width; // Assignment
            context.fillText(onePlayerStartButton.text, onePlayerStartButton.x + (onePlayerStartButton.width - textWidth) / 2, onePlayerStartButton.y + onePlayerStartButton.height / 2 + 8);

            // Draw 2 Players Start button
            drawRect(twoPlayerStartButton.x, twoPlayerStartButton.y, twoPlayerStartButton.width, twoPlayerStartButton.height, COLOR_FOREGROUND);
            context.fillStyle = COLOR_BACKGROUND;
            context.font = '25px Arial';
            textWidth = context.measureText(twoPlayerStartButton.text).width; // Assignment
            context.fillText(twoPlayerStartButton.text, twoPlayerStartButton.x + (twoPlayerStartButton.width - textWidth) / 2, twoPlayerStartButton.y + twoPlayerStartButton.height / 2 + 8);
            break;

        case STATE_COUNTDOWN:
            // --- Update logic for Countdown ---
            if (Date.now() - lastCountdownTime > 1000) { // 1 second has passed
                countdownValue--;
                lastCountdownTime = Date.now();
            }

            if (countdownValue <= 0) {
                currentGameState = STATE_PLAYING;
                resetBall(); // Serve the ball
            }

            // --- Render logic for Countdown ---
            // (Draw static paddles and ball - already in placeholder, ensure it's correct)
            drawRect(player1Paddle.x, player1Paddle.y, player1Paddle.width, player1Paddle.height, player1Paddle.color);
            drawRect(player2Paddle.x, player2Paddle.y, player2Paddle.width, player2Paddle.height, player2Paddle.color);
            drawCircle(ball.x, ball.y, ball.radius, ball.color); // Ball is static (dx=0, dy=0)

            // Display countdown number
            context.fillStyle = COLOR_FOREGROUND;
            context.font = '80px Arial';
            const countText = countdownValue > 0 ? countdownValue.toString() : "Go!"; // Or just blank for 0
            if (countdownValue <=0) { // If we want "Go!" to not show once playing starts.
                 // Do nothing here if we want it to disappear immediately when state changes
            } else {
                textWidth = context.measureText(countText).width; // Assignment
                context.fillText(countText, (CANVAS_WIDTH - textWidth) / 2, CANVAS_HEIGHT / 2);
            }
            break;

        case STATE_PLAYING:
            // --- Update game state (paddles, ball) ---
            updatePaddles(); // These functions should no longer check gameStarted/gameOver internally
            updateBall();    // updateBall will need modification for scoring to transition to COUNTDOWN or GAME_OVER

            // --- Render game elements ---
            drawRect(player1Paddle.x, player1Paddle.y, player1Paddle.width, player1Paddle.height, player1Paddle.color);
            drawRect(player2Paddle.x, player2Paddle.y, player2Paddle.width, player2Paddle.height, player2Paddle.color);
            drawCircle(ball.x, ball.y, ball.radius, ball.color);

            // Display Scores
            context.fillStyle = COLOR_FOREGROUND;
            context.font = '45px Arial';
            context.fillText(player1Score.toString(), CANVAS_WIDTH / 4, 50);
            const player2ScoreText = player2Score.toString();
            context.fillText(player2ScoreText, CANVAS_WIDTH * 3 / 4 - 30, 50);
            break;

        case STATE_GAME_OVER:
            // --- Update logic for Game Over (e.g., button hover) ---
            // (To be implemented)

            // --- Render Game Over Screen ---
            drawRect(player1Paddle.x, player1Paddle.y, player1Paddle.width, player1Paddle.height, player1Paddle.color); // Show final state
            drawRect(player2Paddle.x, player2Paddle.y, player2Paddle.width, player2Paddle.height, player2Paddle.color);
            drawCircle(ball.x, ball.y, ball.radius, ball.color);

            context.fillStyle = COLOR_FOREGROUND;
            context.font = '45px Arial'; // Scores
            context.fillText(player1Score.toString(), CANVAS_WIDTH / 4, 50);
            const p2ScoreText = player2Score.toString(); // Renamed to avoid conflict with outer scope if any
            context.fillText(p2ScoreText, CANVAS_WIDTH * 3 / 4 - 30, 50);

            context.font = '60px Arial'; // Winner message
            textWidth = context.measureText(winnerMessage).width; // Assignment // winnerMessage should still be set when transitioning to GAME_OVER
            context.fillText(winnerMessage, (CANVAS_WIDTH - textWidth) / 2, CANVAS_HEIGHT / 2);

            // Draw Rematch button
            drawRect(rematchButton.x, rematchButton.y, rematchButton.width, rematchButton.height, COLOR_FOREGROUND);
            context.fillStyle = COLOR_BACKGROUND;
            context.font = '25px Arial'; // Slightly smaller font for these buttons
            textWidth = context.measureText(rematchButton.text).width; // Assignment
            context.fillText(rematchButton.text, rematchButton.x + (rematchButton.width - textWidth) / 2, rematchButton.y + rematchButton.height / 2 + 8);

            // Draw Back to Menu button
            drawRect(backToMenuButton.x, backToMenuButton.y, backToMenuButton.width, backToMenuButton.height, COLOR_FOREGROUND);
            context.fillStyle = COLOR_BACKGROUND;
            context.font = '25px Arial';
            textWidth = context.measureText(backToMenuButton.text).width; // Assignment
            context.fillText(backToMenuButton.text, backToMenuButton.x + (backToMenuButton.width - textWidth) / 2, backToMenuButton.y + backToMenuButton.height / 2 + 8);
            break;
    }

    requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);

// Event Listener for Mouse Click (for buttons)
canvas.addEventListener('mousedown', function(event) {
    if (currentGameState === STATE_TITLE_SCREEN) {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        // Common reset logic function
        function initializeNewGame() {
            player1Score = 0;
            player2Score = 0;
            winnerMessage = "";
            ball.x = CANVAS_WIDTH / 2;
            ball.y = CANVAS_HEIGHT / 2;
            ball.dx = 0;
            ball.dy = 0;
            countdownValue = 3;
            lastCountdownTime = Date.now();
            currentGameState = STATE_COUNTDOWN;
        }

        // Check 1 Player Start button
        if (clickX >= onePlayerStartButton.x && clickX <= onePlayerStartButton.x + onePlayerStartButton.width &&
            clickY >= onePlayerStartButton.y && clickY <= onePlayerStartButton.y + onePlayerStartButton.height) {

            gameMode = 'one_player';
            initializeNewGame();
        }
        // Check 2 Players Start button
        else if (clickX >= twoPlayerStartButton.x && clickX <= twoPlayerStartButton.x + twoPlayerStartButton.width &&
                 clickY >= twoPlayerStartButton.y && clickY <= twoPlayerStartButton.y + twoPlayerStartButton.height) {

            gameMode = 'two_player';
            initializeNewGame();
        }
    }
    else if (currentGameState === STATE_GAME_OVER) {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        // Check Rematch button
        if (clickX >= rematchButton.x && clickX <= rematchButton.x + rematchButton.width &&
            clickY >= rematchButton.y && clickY <= rematchButton.y + rematchButton.height) {

            player1Score = 0;
            player2Score = 0;
            winnerMessage = "";

            ball.x = CANVAS_WIDTH / 2; // Center ball
            ball.y = CANVAS_HEIGHT / 2;
            ball.dx = 0;                // Make static for countdown
            ball.dy = 0;

            countdownValue = 3;
            lastCountdownTime = Date.now();
            currentGameState = STATE_COUNTDOWN;
        }
        // Check Back to Menu button
        else if (clickX >= backToMenuButton.x && clickX <= backToMenuButton.x + backToMenuButton.width &&
                 clickY >= backToMenuButton.y && clickY <= backToMenuButton.y + backToMenuButton.height) {

            player1Score = 0; // Reset P1 score
            player2Score = 0; // Reset P2 score
            winnerMessage = ""; // Clear winner message

            ball.x = CANVAS_WIDTH / 2; // Center ball
            ball.y = CANVAS_HEIGHT / 2;
            ball.dx = 0;                // Make static for title screen
            ball.dy = 0;

            currentGameState = STATE_TITLE_SCREEN;
        }
    }
});
