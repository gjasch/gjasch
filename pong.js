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
    dx: 5,    // Horizontal speed
    dy: 5,    // Vertical speed
    color: COLOR_FOREGROUND
};
// Randomize initial ball direction for the first serve
if (Math.random() < 0.5) {
    ball.dx = -ball.dx;
}
if (Math.random() < 0.5) {
    ball.dy = -ball.dy;
}

let player1Score = 0;
let player2Score = 0;

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

    // Player 2 (Right Paddle) - ArrowUp and ArrowDown keys
    if (event.key === 'ArrowUp') {
        player2Paddle.dy = -PADDLE_SPEED;
    } else if (event.key === 'ArrowDown') {
        player2Paddle.dy = PADDLE_SPEED;
    }
});

document.addEventListener('keyup', function(event) {
    // Player 1 - Stop movement when key is released
    if ((event.key === 'w' || event.key === 'W') && player1Paddle.dy < 0) {
        player1Paddle.dy = 0;
    } else if ((event.key === 's' || event.key === 'S') && player1Paddle.dy > 0) {
        player1Paddle.dy = 0;
    }

    // Player 2 - Stop movement when key is released
    if (event.key === 'ArrowUp' && player2Paddle.dy < 0) {
        player2Paddle.dy = 0;
    } else if ((event.key === 'ArrowDown' && player2Paddle.dy > 0)) { // Corrected parenthesis
        player2Paddle.dy = 0;
    }
});

function updatePaddles() {
    // Move player 1 paddle
    player1Paddle.y += player1Paddle.dy;
    // Keep player 1 paddle within canvas bounds
    if (player1Paddle.y < 0) {
        player1Paddle.y = 0;
    } else if (player1Paddle.y + player1Paddle.height > CANVAS_HEIGHT) {
        player1Paddle.y = CANVAS_HEIGHT - player1Paddle.height;
    }

    // Move player 2 paddle
    player2Paddle.y += player2Paddle.dy;
    // Keep player 2 paddle within canvas bounds
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
        // console.log("Player 2 Score:", player2Score); // For debugging
        resetBall();
    } else if (ball.x + ball.radius > CANVAS_WIDTH) { // Ball went past right paddle
        player1Score++;
        // console.log("Player 1 Score:", player1Score); // For debugging
        resetBall();
    }
}

// --- Game Update and Render (will become the game loop) ---
updatePaddles(); // Update paddle positions
updateBall();    // Update ball position and check for wall collision

// Clear canvas
drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_BACKGROUND);

// Draw player 1 paddle
drawRect(player1Paddle.x, player1Paddle.y, player1Paddle.width, player1Paddle.height, player1Paddle.color);

// Draw player 2 paddle
drawRect(player2Paddle.x, player2Paddle.y, player2Paddle.width, player2Paddle.height, player2Paddle.color);

// Draw ball
drawCircle(ball.x, ball.y, ball.radius, ball.color);

    // Display Scores
    context.fillStyle = COLOR_FOREGROUND;
    context.font = '45px Arial'; // Set font size and family

    // Player 1 Score (left side)
    context.fillText(player1Score.toString(), CANVAS_WIDTH / 4, 50);

    // Player 2 Score (right side)
    // To align P2 score nicely, measure text width if needed, or place it relative to 3/4 width
    const player2ScoreText = player2Score.toString();
    // const player2ScoreTextWidth = context.measureText(player2ScoreText).width; // Optional for precise alignment
    context.fillText(player2ScoreText, CANVAS_WIDTH * 3 / 4 - 30, 50); // Adjusted position for typical two-digit scores
                                                                    // A fixed offset like -30 or - (font_size) should work for small scores
