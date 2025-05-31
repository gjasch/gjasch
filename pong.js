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
const AI_MAX_ERROR_AT_MAX_DISTANCE = PADDLE_HEIGHT * 0.6;
const AI_MIN_ERROR_AT_IMPACT = PADDLE_HEIGHT * 0.1;
// const AI_MISS_CHANCE = 0.05; // (Currently unused)

// Enhanced AI Behavior Parameters
const AI_REACTION_INTERVAL = 150;

let winnerMessage = "";
let currentGameState = STATE_TITLE_SCREEN;
let gameMode = 'two_player';

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
            aiTargetY = predictedY + (Math.random() - 0.5) * 2 * currentErrorMargin;
            aiTargetY = Math.max(player2Paddle.height / 2, aiTargetY);
            aiTargetY = Math.min(CANVAS_HEIGHT - player2Paddle.height / 2, aiTargetY);
            aiLastReactionTime = Date.now();
        }
        player2Paddle.dy = 0;
        const paddleCenterY = player2Paddle.y + player2Paddle.height / 2;
        const deadZone = PADDLE_HEIGHT * 0.1;
        if (paddleCenterY < aiTargetY - deadZone) {
            player2Paddle.dy = PADDLE_SPEED;
        } else if (paddleCenterY > aiTargetY + deadZone) {
            player2Paddle.dy = -PADDLE_SPEED;
        }
        player2Paddle.y += player2Paddle.dy;
    } else if (gameMode === 'two_player') {
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
});

// Start the game loop
requestAnimationFrame(gameLoop);
