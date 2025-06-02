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
const STATE_PAUSED = 'paused';
const STATE_SETTINGS = 'settings';

// Button area for Title Screen
const onePlayerStartButton = {
    x: CANVAS_WIDTH / 2 - 150,
    y: CANVAS_HEIGHT / 2 + 50,
    width: 140,
    height: 50,
    text: "1 Player"
};
const twoPlayerStartButton = {
    x: CANVAS_WIDTH / 2 + 10,
    y: CANVAS_HEIGHT / 2 + 50,
    width: 140,
    height: 50,
    text: "2 Players"
};

// Game Over Menu Buttons
const rematchButton = {
    x: CANVAS_WIDTH / 2 - 155,
    y: CANVAS_HEIGHT / 2 + 50,
    width: 150,
    height: 50,
    text: "Rematch"
};
const backToMenuButton = {
    x: CANVAS_WIDTH / 2 + 5,
    y: CANVAS_HEIGHT / 2 + 50,
    width: 150,
    height: 50,
    text: "Main Menu"
};

const settingsButton = {
    x: CANVAS_WIDTH / 2 - 75, // Centered
    y: CANVAS_HEIGHT / 2 + 120, // Below 1P/2P buttons
    width: 150,
    height: 40, // Slightly smaller height
    text: "Settings"
};

// Pause Menu Buttons
const resumeButton = {
    x: CANVAS_WIDTH / 2 - 100,
    y: CANVAS_HEIGHT / 2 + 0,
    width: 200,
    height: 50,
    text: "Resume"
};
const mainMenuButtonFromPause = {
    x: CANVAS_WIDTH / 2 - 100,
    y: CANVAS_HEIGHT / 2 + 60,
    width: 200,
    height: 50,
    text: "Main Menu"
};

// Settings Page Button Constants
const toggleOnScreenControlsButton = {
    x: CANVAS_WIDTH / 2 - 150,
    y: CANVAS_HEIGHT / 2 - 25, // Position for the toggle button
    width: 300,
    height: 50,
    textPrefix: "On-Screen Controls: " // Text will be dynamic
};

const settingsBackButton = {
    x: CANVAS_WIDTH / 2 - 75,
    y: CANVAS_HEIGHT / 2 + 50,  // Below the toggle button
    width: 150,
    height: 40,
    text: "Back"
};

// On-Screen Control Button Definitions
const OSC_BUTTON_WIDTH = 100;  // On-screen control button width
const OSC_BUTTON_HEIGHT = 100; // On-screen control button height
const OSC_BUTTON_MARGIN = 20;  // Margin from canvas edges

// Player 1 On-Screen Controls (Left Side)
const player1UpButton = {
    x: OSC_BUTTON_MARGIN,
    y: OSC_BUTTON_MARGIN, // Top-left area
    width: OSC_BUTTON_WIDTH,
    height: OSC_BUTTON_HEIGHT,
    text: "P1 Up" // Text for drawing/debugging, can be an arrow later
};

const player1DownButton = {
    x: OSC_BUTTON_MARGIN,
    y: CANVAS_HEIGHT - OSC_BUTTON_HEIGHT - OSC_BUTTON_MARGIN, // Bottom-left area
    width: OSC_BUTTON_WIDTH,
    height: OSC_BUTTON_HEIGHT,
    text: "P1 Down"
};

// Player 2 On-Screen Controls (Right Side)
const player2UpButton = {
    x: CANVAS_WIDTH - OSC_BUTTON_WIDTH - OSC_BUTTON_MARGIN,
    y: OSC_BUTTON_MARGIN, // Top-right area
    width: OSC_BUTTON_WIDTH,
    height: OSC_BUTTON_HEIGHT,
    text: "P2 Up"
};

const player2DownButton = {
    x: CANVAS_WIDTH - OSC_BUTTON_WIDTH - OSC_BUTTON_MARGIN,
    y: CANVAS_HEIGHT - OSC_BUTTON_HEIGHT - OSC_BUTTON_MARGIN, // Bottom-right area
    width: OSC_BUTTON_WIDTH,
    height: OSC_BUTTON_HEIGHT,
    text: "P2 Down"
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
    context.arc(x, y, radius, 0, Math.PI * 2, false);
    context.closePath();
    context.fill();
}

// Helper function to draw on-screen control buttons
function drawOSCButton(button) {
    context.fillStyle = 'rgba(128, 128, 128, 0.5)'; // Semi-transparent grey
    context.fillRect(button.x, button.y, button.width, button.height);
    context.fillStyle = 'rgba(255, 255, 255, 0.7)'; // Semi-transparent white text
    context.font = '20px Arial';
    let localTextWidth = context.measureText(button.text).width; // Use local for helper
    context.fillText(button.text, button.x + (button.width - localTextWidth) / 2, button.y + button.height / 2 + 7);
}

// Define Game Objects
const player1Paddle = {
    x: 50,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    color: COLOR_FOREGROUND,
    dy: 0
};
const player2Paddle = {
    x: CANVAS_WIDTH - 50 - PADDLE_WIDTH,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    color: COLOR_FOREGROUND,
    dy: 0
};
const ball = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    radius: BALL_RADIUS,
    speed: 5,
    dx: 0,
    dy: 0,
    color: COLOR_FOREGROUND
};

// Game State Variables
let player1Score = 0;
let player2Score = 0;
const WINNING_SCORE = 5;

// AI Behavior Parameters
// const AI_REACTION_ZONE_X = CANVAS_WIDTH / 2; // (Currently unused)
const AI_MAX_ERROR_AT_MAX_DISTANCE = PADDLE_HEIGHT * 0.25; // Max random error in Y prediction when ball is furthest
const AI_MIN_ERROR_AT_IMPACT = PADDLE_HEIGHT * 0.05; // Min random error when ball is very close
const AI_TARGET_CHANGE_THRESHOLD = PADDLE_HEIGHT * 0.20; // Min change in targetY (from current paddle center) for AI to adjust its dy
// const AI_MISS_CHANCE = 0.05; // (Currently unused)

// Enhanced AI Behavior Parameters
const AI_REACTION_INTERVAL = 500; // Milliseconds between AI reaction/prediction updates

let winnerMessage = "";
let currentGameState = STATE_TITLE_SCREEN;
let gameMode = 'two_player';
let onScreenControlsEnabled = false;

// Enhanced AI State Variables
let aiLastReactionTime = 0;
let aiTargetY = player2Paddle.y + player2Paddle.height / 2;

let countdownValue = 3;
let lastCountdownTime = 0;

function resetBall() {
    ball.x = CANVAS_WIDTH / 2;
    ball.y = CANVAS_HEIGHT / 2;
    let newSpeedX = ball.speed;
    if (Math.random() < 0.5) {
        newSpeedX = -newSpeedX;
    }
    let newSpeedY = (Math.random() * (ball.speed -1)) + 1;
    if (Math.random() < 0.5) {
        newSpeedY = -newSpeedY;
    }
    ball.dx = newSpeedX;
    ball.dy = newSpeedY;
}

document.addEventListener('keydown', function(event) {
    // Player 1 (Left Paddle) - W and S keys
    if (event.key === 'w' || event.key === 'W') {
        if (currentGameState === STATE_PLAYING) player1Paddle.dy = -PADDLE_SPEED;
    } else if (event.key === 's' || event.key === 'S') {
        if (currentGameState === STATE_PLAYING) player1Paddle.dy = PADDLE_SPEED;
    }

    // Player 2 (Right Paddle) - ArrowUp and ArrowDown keys - ONLY if two_player mode and playing
    if (gameMode === 'two_player') {
        if (event.key === 'ArrowUp') {
            if (currentGameState === STATE_PLAYING) player2Paddle.dy = -PADDLE_SPEED;
        } else if (event.key === 'ArrowDown') {
            if (currentGameState === STATE_PLAYING) player2Paddle.dy = PADDLE_SPEED;
        }
    }

    // Escape Key for Pause/Resume
    if (event.key === 'Escape') {
        if (currentGameState === STATE_PLAYING) {
            currentGameState = STATE_PAUSED;
            player1Paddle.dy = 0;
            player2Paddle.dy = 0;
        } else if (currentGameState === STATE_PAUSED) {
            currentGameState = STATE_PLAYING;
            aiLastReactionTime = Date.now();
        }
    }
});

document.addEventListener('keyup', function(event) {
    if ((event.key === 'w' || event.key === 'W') && player1Paddle.dy < 0) {
        player1Paddle.dy = 0;
    } else if ((event.key === 's' || event.key === 'S') && player1Paddle.dy > 0) {
        player1Paddle.dy = 0;
    }
    if (gameMode === 'two_player') {
        if (event.key === 'ArrowUp' && player2Paddle.dy < 0) {
            player2Paddle.dy = 0;
        } else if ((event.key === 'ArrowDown' && player2Paddle.dy > 0)) {
            player2Paddle.dy = 0;
        }
    }
});

function updatePaddles() {
    player1Paddle.y += player1Paddle.dy;
    if (player1Paddle.y < 0) {
        player1Paddle.y = 0;
    } else if (player1Paddle.y + player1Paddle.height > CANVAS_HEIGHT) {
        player1Paddle.y = CANVAS_HEIGHT - player1Paddle.height;
    }
    if (gameMode === 'one_player' && currentGameState === STATE_PLAYING) {
        if (ball.dx > 0 && (Date.now() - aiLastReactionTime > AI_REACTION_INTERVAL)) {
            const dxToPaddle = player2Paddle.x - ball.x;
            const timeToReachPaddle = dxToPaddle / ball.dx;
            let predictedY = ball.y + ball.dy * timeToReachPaddle;
            if (predictedY < BALL_RADIUS) {
                predictedY = BALL_RADIUS + (BALL_RADIUS - predictedY);
            } else if (predictedY > CANVAS_HEIGHT - BALL_RADIUS) {
                predictedY = (CANVAS_HEIGHT - BALL_RADIUS) - (predictedY - (CANVAS_HEIGHT - BALL_RADIUS));
            }
            predictedY = Math.max(BALL_RADIUS, Math.min(CANVAS_HEIGHT - BALL_RADIUS, predictedY));
            let distanceFactor = 0;
            if (dxToPaddle > 0) {
                 distanceFactor = Math.min(1, Math.max(0, dxToPaddle / player2Paddle.x));
            }
            const currentErrorMargin = AI_MIN_ERROR_AT_IMPACT +
                                     (AI_MAX_ERROR_AT_MAX_DISTANCE - AI_MIN_ERROR_AT_IMPACT) * distanceFactor;
            const newPotentialAiTargetY = predictedY + (Math.random() - 0.5) * 2 * currentErrorMargin;

            // Clamp this new potential target
            const clampedNewPotentialAiTargetY = Math.max(player2Paddle.height / 2, Math.min(CANVAS_HEIGHT - player2Paddle.height / 2, newPotentialAiTargetY));

            const paddleCenterY = player2Paddle.y + player2Paddle.height / 2;

            // Only update the global aiTargetY if the new prediction is significantly different from the paddle's current center
            if (Math.abs(clampedNewPotentialAiTargetY - paddleCenterY) > AI_TARGET_CHANGE_THRESHOLD) {
                aiTargetY = clampedNewPotentialAiTargetY;
            }
            // Note: If not significantly different, aiTargetY (the committed target) remains unchanged from previous reaction.

            aiLastReactionTime = Date.now();

            // Always decide dy based on the current (potentially unchanged) global aiTargetY
            const deadZone = PADDLE_HEIGHT * 0.1;
            if (paddleCenterY < aiTargetY - deadZone) {
                player2Paddle.dy = PADDLE_SPEED;
            } else if (paddleCenterY > aiTargetY + deadZone) {
                player2Paddle.dy = -PADDLE_SPEED;
            } else {
                player2Paddle.dy = 0;
            }
        }
        // If it's not time to react, player2Paddle.dy keeps its value from the last reaction.

        // Apply movement based on the current player2Paddle.dy
        player2Paddle.y += player2Paddle.dy;

    } else if (gameMode === 'two_player') {
        // Player 2 paddle is controlled by keyboard
        player2Paddle.y += player2Paddle.dy;
    }
    if (player2Paddle.y < 0) {
        player2Paddle.y = 0;
    } else if (player2Paddle.y + player2Paddle.height > CANVAS_HEIGHT) {
        player2Paddle.y = CANVAS_HEIGHT - player2Paddle.height;
    }
}

function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
    if (ball.x - ball.radius < player1Paddle.x + player1Paddle.width &&
        ball.x + ball.radius > player1Paddle.x &&
        ball.y - ball.radius < player1Paddle.y + player1Paddle.height &&
        ball.y + ball.radius > player1Paddle.y) {
        if (ball.dx < 0) {
            ball.dx *= -1;
        }
    }
    else if (ball.x + ball.radius > player2Paddle.x &&
             ball.x - ball.radius < player2Paddle.x + player2Paddle.width &&
             ball.y - ball.radius < player2Paddle.y + player2Paddle.height &&
             ball.y + ball.radius > player2Paddle.y) {
        if (ball.dx > 0) {
            ball.dx *= -1;
        }
    }
    if (ball.y + ball.radius > CANVAS_HEIGHT || ball.y - ball.radius < 0) {
        ball.dy *= -1;
    }
    if (ball.x - ball.radius < 0) {
        player2Score++;
        if (player2Score >= WINNING_SCORE) {
            winnerMessage = "Player 2 Wins!";
            currentGameState = STATE_GAME_OVER;
        } else {
            ball.x = CANVAS_WIDTH / 2;
            ball.y = CANVAS_HEIGHT / 2;
            ball.dx = 0;
            ball.dy = 0;
            countdownValue = 3;
            lastCountdownTime = Date.now();
            currentGameState = STATE_COUNTDOWN;
        }
    } else if (ball.x + ball.radius > CANVAS_WIDTH) {
        player1Score++;
        if (player1Score >= WINNING_SCORE) {
            winnerMessage = "Player 1 Wins!";
            currentGameState = STATE_GAME_OVER;
        } else {
            ball.x = CANVAS_WIDTH / 2;
            ball.y = CANVAS_HEIGHT / 2;
            ball.dx = 0;
            ball.dy = 0;
            countdownValue = 3;
            lastCountdownTime = Date.now();
            currentGameState = STATE_COUNTDOWN;
        }
    }
}

function gameLoop() {
    let textWidth;
    drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_BACKGROUND);
    switch (currentGameState) {
        case STATE_TITLE_SCREEN:
            context.fillStyle = COLOR_FOREGROUND;
            context.font = '70px Arial';
            const titleText = "PONG";
            textWidth = context.measureText(titleText).width;
            context.fillText(titleText, (CANVAS_WIDTH - textWidth) / 2, CANVAS_HEIGHT / 2 - 50);
            drawRect(onePlayerStartButton.x, onePlayerStartButton.y, onePlayerStartButton.width, onePlayerStartButton.height, COLOR_FOREGROUND);
            context.fillStyle = COLOR_BACKGROUND;
            context.font = '25px Arial';
            textWidth = context.measureText(onePlayerStartButton.text).width;
            context.fillText(onePlayerStartButton.text, onePlayerStartButton.x + (onePlayerStartButton.width - textWidth) / 2, onePlayerStartButton.y + onePlayerStartButton.height / 2 + 8);
            drawRect(twoPlayerStartButton.x, twoPlayerStartButton.y, twoPlayerStartButton.width, twoPlayerStartButton.height, COLOR_FOREGROUND);
            context.fillStyle = COLOR_BACKGROUND;
            context.font = '25px Arial';
            textWidth = context.measureText(twoPlayerStartButton.text).width;
            context.fillText(twoPlayerStartButton.text, twoPlayerStartButton.x + (twoPlayerStartButton.width - textWidth) / 2, twoPlayerStartButton.y + twoPlayerStartButton.height / 2 + 8);

            // Draw Settings button
            drawRect(settingsButton.x, settingsButton.y, settingsButton.width, settingsButton.height, COLOR_FOREGROUND);
            context.fillStyle = COLOR_BACKGROUND;
            context.font = '20px Arial'; // Adjust font size for button
            textWidth = context.measureText(settingsButton.text).width; // textWidth should be declared at top of gameLoop
            context.fillText(settingsButton.text, settingsButton.x + (settingsButton.width - textWidth) / 2, settingsButton.y + settingsButton.height / 2 + 7); // Adjust Y for text centering
            break;
        case STATE_COUNTDOWN:
            if (Date.now() - lastCountdownTime > 1000) {
                countdownValue--;
                lastCountdownTime = Date.now();
            }
            if (countdownValue <= 0) {
                currentGameState = STATE_PLAYING;
                resetBall();
            }
            drawRect(player1Paddle.x, player1Paddle.y, player1Paddle.width, player1Paddle.height, player1Paddle.color);
            drawRect(player2Paddle.x, player2Paddle.y, player2Paddle.width, player2Paddle.height, player2Paddle.color);
            drawCircle(ball.x, ball.y, ball.radius, ball.color);
            context.fillStyle = COLOR_FOREGROUND;
            context.font = '80px Arial';
            const countText = countdownValue > 0 ? countdownValue.toString() : "Go!";
            if (countdownValue > 0) {
                textWidth = context.measureText(countText).width;
                context.fillText(countText, (CANVAS_WIDTH - textWidth) / 2, CANVAS_HEIGHT / 2 - 80);
            }

            // Conditionally Render On-Screen Controls
            if (onScreenControlsEnabled) {
                drawOSCButton(player1UpButton);
                drawOSCButton(player1DownButton);
                if (gameMode === 'two_player') { // Only show P2 OSC buttons in 2-player mode
                    drawOSCButton(player2UpButton);
                    drawOSCButton(player2DownButton);
                }
            }
            break;
        case STATE_PLAYING:
            updatePaddles();
            updateBall();

            drawRect(player1Paddle.x, player1Paddle.y, player1Paddle.width, player1Paddle.height, player1Paddle.color);
            drawRect(player2Paddle.x, player2Paddle.y, player2Paddle.width, player2Paddle.height, player2Paddle.color);
            drawCircle(ball.x, ball.y, ball.radius, ball.color);

            context.fillStyle = COLOR_FOREGROUND;
            context.font = '45px Arial';
            context.fillText(player1Score.toString(), CANVAS_WIDTH / 4, 50);
            context.fillText(player2Score.toString(), CANVAS_WIDTH * 3 / 4 - 30, 50);

            // Conditionally Render On-Screen Controls
            if (onScreenControlsEnabled) {
                drawOSCButton(player1UpButton);
                drawOSCButton(player1DownButton);
                if (gameMode === 'two_player') {
                    drawOSCButton(player2UpButton);
                    drawOSCButton(player2DownButton);
                }
            }
            break;
        case STATE_PAUSED:
            drawRect(player1Paddle.x, player1Paddle.y, player1Paddle.width, player1Paddle.height, player1Paddle.color);
            drawRect(player2Paddle.x, player2Paddle.y, player2Paddle.width, player2Paddle.height, player2Paddle.color);
            drawCircle(ball.x, ball.y, ball.radius, ball.color);
            context.fillStyle = COLOR_FOREGROUND;
            context.font = '45px Arial';
            context.fillText(player1Score.toString(), CANVAS_WIDTH / 4, 50);
            context.fillText(player2Score.toString(), CANVAS_WIDTH * 3 / 4 - 30, 50);
            context.fillStyle = COLOR_FOREGROUND;
            context.font = '60px Arial';
            const pausedText = "Paused";
            textWidth = context.measureText(pausedText).width;
            context.fillText(pausedText, (CANVAS_WIDTH - textWidth) / 2, CANVAS_HEIGHT / 2 - 80);
            drawRect(resumeButton.x, resumeButton.y, resumeButton.width, resumeButton.height, COLOR_FOREGROUND);
            context.fillStyle = COLOR_BACKGROUND;
            context.font = '25px Arial';
            textWidth = context.measureText(resumeButton.text).width;
            context.fillText(resumeButton.text, resumeButton.x + (resumeButton.width - textWidth) / 2, resumeButton.y + resumeButton.height / 2 + 8);
            drawRect(mainMenuButtonFromPause.x, mainMenuButtonFromPause.y, mainMenuButtonFromPause.width, mainMenuButtonFromPause.height, COLOR_FOREGROUND);
            context.fillStyle = COLOR_BACKGROUND;
            context.font = '25px Arial';
            textWidth = context.measureText(mainMenuButtonFromPause.text).width;
            context.fillText(mainMenuButtonFromPause.text, mainMenuButtonFromPause.x + (mainMenuButtonFromPause.width - textWidth) / 2, mainMenuButtonFromPause.y + mainMenuButtonFromPause.height / 2 + 8);
            break;

        case STATE_SETTINGS:
            // --- Render logic for Settings Screen ---
            context.fillStyle = COLOR_FOREGROUND;
            context.font = '50px Arial';
            const settingsTitleText = "Settings";
            textWidth = context.measureText(settingsTitleText).width; // textWidth declared at top of gameLoop
            context.fillText(settingsTitleText, (CANVAS_WIDTH - textWidth) / 2, CANVAS_HEIGHT / 2 - 100); // Position title

            // Draw Toggle On-Screen Controls button
            // Text will show current state
            const toggleButtonText = toggleOnScreenControlsButton.textPrefix + (onScreenControlsEnabled ? "Enabled" : "Disabled");
            drawRect(toggleOnScreenControlsButton.x, toggleOnScreenControlsButton.y, toggleOnScreenControlsButton.width, toggleOnScreenControlsButton.height, COLOR_FOREGROUND);
            context.fillStyle = COLOR_BACKGROUND;
            context.font = '20px Arial'; // Font for button text
            textWidth = context.measureText(toggleButtonText).width;
            context.fillText(toggleButtonText, toggleOnScreenControlsButton.x + (toggleOnScreenControlsButton.width - textWidth) / 2, toggleOnScreenControlsButton.y + toggleOnScreenControlsButton.height / 2 + 7);

            // Draw Back button
            drawRect(settingsBackButton.x, settingsBackButton.y, settingsBackButton.width, settingsBackButton.height, COLOR_FOREGROUND);
            context.fillStyle = COLOR_BACKGROUND;
            // Font is already '20px Arial' from previous button if not changed
            textWidth = context.measureText(settingsBackButton.text).width;
            context.fillText(settingsBackButton.text, settingsBackButton.x + (settingsBackButton.width - textWidth) / 2, settingsBackButton.y + settingsBackButton.height / 2 + 7);
            break;

        case STATE_GAME_OVER:
            drawRect(player1Paddle.x, player1Paddle.y, player1Paddle.width, player1Paddle.height, player1Paddle.color);
            drawRect(player2Paddle.x, player2Paddle.y, player2Paddle.width, player2Paddle.height, player2Paddle.color);
            drawCircle(ball.x, ball.y, ball.radius, ball.color);
            context.fillStyle = COLOR_FOREGROUND;
            context.font = '45px Arial';
            context.fillText(player1Score.toString(), CANVAS_WIDTH / 4, 50);
            context.fillText(player2Score.toString(), CANVAS_WIDTH * 3 / 4 - 30, 50);
            context.font = '60px Arial';
            textWidth = context.measureText(winnerMessage).width;
            context.fillText(winnerMessage, (CANVAS_WIDTH - textWidth) / 2, CANVAS_HEIGHT / 2);
            drawRect(rematchButton.x, rematchButton.y, rematchButton.width, rematchButton.height, COLOR_FOREGROUND);
            context.fillStyle = COLOR_BACKGROUND;
            context.font = '25px Arial';
            textWidth = context.measureText(rematchButton.text).width;
            context.fillText(rematchButton.text, rematchButton.x + (rematchButton.width - textWidth) / 2, rematchButton.y + rematchButton.height / 2 + 8);
            drawRect(backToMenuButton.x, backToMenuButton.y, backToMenuButton.width, backToMenuButton.height, COLOR_FOREGROUND);
            context.fillStyle = COLOR_BACKGROUND;
            context.font = '25px Arial';
            textWidth = context.measureText(backToMenuButton.text).width;
            context.fillText(backToMenuButton.text, backToMenuButton.x + (backToMenuButton.width - textWidth) / 2, backToMenuButton.y + backToMenuButton.height / 2 + 8);
            break;
    }
    requestAnimationFrame(gameLoop);
}

canvas.addEventListener('mousedown', function(event) {
    if (currentGameState === STATE_TITLE_SCREEN) {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
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
        if (clickX >= onePlayerStartButton.x && clickX <= onePlayerStartButton.x + onePlayerStartButton.width &&
            clickY >= onePlayerStartButton.y && clickY <= onePlayerStartButton.y + onePlayerStartButton.height) {
            gameMode = 'one_player';
            initializeNewGame();
        }
        else if (clickX >= twoPlayerStartButton.x && clickX <= twoPlayerStartButton.x + twoPlayerStartButton.width &&
                 clickY >= twoPlayerStartButton.y && clickY <= twoPlayerStartButton.y + twoPlayerStartButton.height) {
            gameMode = 'two_player';
            initializeNewGame();
        }
        // Check Settings button
        else if (clickX >= settingsButton.x && clickX <= settingsButton.x + settingsButton.width &&
                 clickY >= settingsButton.y && clickY <= settingsButton.y + settingsButton.height) {

            currentGameState = STATE_SETTINGS;
        }
    }
    else if (currentGameState === STATE_GAME_OVER) {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        if (clickX >= rematchButton.x && clickX <= rematchButton.x + rematchButton.width &&
            clickY >= rematchButton.y && clickY <= rematchButton.y + rematchButton.height) {
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
        else if (clickX >= backToMenuButton.x && clickX <= backToMenuButton.x + backToMenuButton.width &&
                 clickY >= backToMenuButton.y && clickY <= backToMenuButton.y + backToMenuButton.height) {
            player1Score = 0;
            player2Score = 0;
            winnerMessage = "";
            ball.x = CANVAS_WIDTH / 2;
            ball.y = CANVAS_HEIGHT / 2;
            ball.dx = 0;
            ball.dy = 0;
            currentGameState = STATE_TITLE_SCREEN;
        }
    }
    else if (currentGameState === STATE_SETTINGS) {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        // Check Toggle On-Screen Controls button
        if (clickX >= toggleOnScreenControlsButton.x && clickX <= toggleOnScreenControlsButton.x + toggleOnScreenControlsButton.width &&
            clickY >= toggleOnScreenControlsButton.y && clickY <= toggleOnScreenControlsButton.y + toggleOnScreenControlsButton.height) {

            onScreenControlsEnabled = !onScreenControlsEnabled; // Flip the boolean setting
            // The button's text will update automatically in the next render cycle due to its dynamic text generation.
        }
        // Check Back button
        else if (clickX >= settingsBackButton.x && clickX <= settingsBackButton.x + settingsBackButton.width &&
                 clickY >= settingsBackButton.y && clickY <= settingsBackButton.y + settingsBackButton.height) {

            currentGameState = STATE_TITLE_SCREEN;
        }
    }
    else if (currentGameState === STATE_PAUSED) {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        if (clickX >= resumeButton.x && clickX <= resumeButton.x + resumeButton.width &&
            clickY >= resumeButton.y && clickY <= resumeButton.y + resumeButton.height) {
            currentGameState = STATE_PLAYING;
            aiLastReactionTime = Date.now();
        }
        else if (clickX >= mainMenuButtonFromPause.x && clickX <= mainMenuButtonFromPause.x + mainMenuButtonFromPause.width &&
                 clickY >= mainMenuButtonFromPause.y && clickY <= mainMenuButtonFromPause.y + mainMenuButtonFromPause.height) {
            player1Score = 0;
            player2Score = 0;
            winnerMessage = "";
            ball.x = CANVAS_WIDTH / 2;
            ball.y = CANVAS_HEIGHT / 2;
            ball.dx = 0;
            ball.dy = 0;
            currentGameState = STATE_TITLE_SCREEN;
        }
    }
    // On-Screen Controls Input Handling (for mousedown/touchstart)
    // This should activate if game is playable (PLAYING or COUNTDOWN for pre-positioning)
    if (onScreenControlsEnabled && (currentGameState === STATE_PLAYING || currentGameState === STATE_COUNTDOWN)) {
        // Player 1 Controls
        if (clickX >= player1UpButton.x && clickX <= player1UpButton.x + player1UpButton.width &&
            clickY >= player1UpButton.y && clickY <= player1UpButton.y + player1UpButton.height) {
            player1Paddle.dy = -PADDLE_SPEED;
        } else if (clickX >= player1DownButton.x && clickX <= player1DownButton.x + player1DownButton.width &&
                   clickY >= player1DownButton.y && clickY <= player1DownButton.y + player1DownButton.height) {
            player1Paddle.dy = PADDLE_SPEED;
        }

        // Player 2 Controls (only if 2-player mode)
        if (gameMode === 'two_player') {
            if (clickX >= player2UpButton.x && clickX <= player2UpButton.x + player2UpButton.width &&
                clickY >= player2UpButton.y && clickY <= player2UpButton.y + player2UpButton.height) {
                player2Paddle.dy = -PADDLE_SPEED;
            } else if (clickX >= player2DownButton.x && clickX <= player2DownButton.x + player2DownButton.width &&
                       clickY >= player2DownButton.y && clickY <= player2DownButton.y + player2DownButton.height) {
                player2Paddle.dy = PADDLE_SPEED;
            }
        }
    }
});

canvas.addEventListener('mouseup', function(event) {
    if (onScreenControlsEnabled) {
        // Simplest approach: any mouseup stops all on-screen controlled paddle movement.
        player1Paddle.dy = 0;
        if (gameMode === 'two_player') { // Only affect P2 dy if it could have been moving via OSC
            player2Paddle.dy = 0;
        }
    }
});

// Proxy touch events to mouse events for on-screen controls
canvas.addEventListener('touchstart', function(e) {
    e.preventDefault(); // Prevent mouse event emulation and scrolling
    if (e.touches.length > 0) {
        const touch = e.touches[0]; // Get first touch point
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent); // Dispatch a mousedown event
    }
}, { passive: false }); // passive: false to allow preventDefault

canvas.addEventListener('touchend', function(e) {
    e.preventDefault();
    // Create a new MouseEvent, though clientX/Y might not be strictly needed for current mouseup logic
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent); // Dispatch a mouseup event
}, { passive: false });

// Start the game loop
requestAnimationFrame(gameLoop);
