import pygame
import random

# Initialize Pygame
pygame.init()
pygame.font.init() # Initialize font module

# Define screen dimensions
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600

# Define colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)

# Create the game screen
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))

# Set window caption
pygame.display.set_caption("Pong")

# Define game objects
paddle_width = 15
paddle_height = 100
ball_radius = 10

player1_paddle = pygame.Rect(50, SCREEN_HEIGHT // 2 - paddle_height // 2, paddle_width, paddle_height)
player2_paddle = pygame.Rect(SCREEN_WIDTH - 50 - paddle_width, SCREEN_HEIGHT // 2 - paddle_height // 2, paddle_width, paddle_height)
ball = pygame.Rect(SCREEN_WIDTH // 2 - ball_radius, SCREEN_HEIGHT // 2 - ball_radius, ball_radius * 2, ball_radius * 2)

# Ball speed
initial_speeds = [speed for speed in range(-7, 8) if speed != 0]
ball_speed_x = random.choice(initial_speeds)
ball_speed_y = random.choice(initial_speeds)

# Paddle speed
paddle_speed = 7

# Clock for frame rate
clock = pygame.time.Clock()

# Scores
player1_score = 0
player2_score = 0

# Font for scores
score_font = pygame.font.Font(None, 74)

# Winning Score
WINNING_SCORE = 5

# Ball reset function
def reset_ball(ball_rect, screen_w, screen_h, current_ball_speed_x):
    ball_rect.center = (screen_w // 2, screen_h // 2)
    new_ball_speed_x = current_ball_speed_x * -1
    new_ball_speed_y = random.choice([speed for speed in range(-7, 8) if speed != 0])
    return new_ball_speed_x, new_ball_speed_y

# Main game loop
running = True
game_over = False # Game over state
win_text_str = ""

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    if not game_over:
        # Paddle Movement
        keys = pygame.key.get_pressed()
        # Player 1 (Left Paddle)
        if keys[pygame.K_w]:
            player1_paddle.y -= paddle_speed
        if keys[pygame.K_s]:
            player1_paddle.y += paddle_speed
        # Player 2 (Right Paddle)
        if keys[pygame.K_UP]:
            player2_paddle.y -= paddle_speed
        if keys[pygame.K_DOWN]:
            player2_paddle.y += paddle_speed

        # Paddle Boundaries
        if player1_paddle.top < 0:
            player1_paddle.top = 0
        if player1_paddle.bottom > SCREEN_HEIGHT:
            player1_paddle.bottom = SCREEN_HEIGHT
        if player2_paddle.top < 0:
            player2_paddle.top = 0
        if player2_paddle.bottom > SCREEN_HEIGHT:
            player2_paddle.bottom = SCREEN_HEIGHT

        # Ball Movement
        ball.x += ball_speed_x
        ball.y += ball_speed_y

        # Wall Bouncing
        if ball.top <= 0 or ball.bottom >= SCREEN_HEIGHT:
            ball_speed_y *= -1

        # Scoring Logic & Ball Reset
        if ball.left <= 0: # Player 2 scores
            player2_score += 1
            if player2_score >= WINNING_SCORE:
                game_over = True
                win_text_str = "Player 2 Wins!"
            else:
                ball_speed_x, ball_speed_y = reset_ball(ball, SCREEN_WIDTH, SCREEN_HEIGHT, ball_speed_x)

        if ball.right >= SCREEN_WIDTH: # Player 1 scores
            player1_score += 1
            if player1_score >= WINNING_SCORE:
                game_over = True
                win_text_str = "Player 1 Wins!"
            else:
                ball_speed_x, ball_speed_y = reset_ball(ball, SCREEN_WIDTH, SCREEN_HEIGHT, ball_speed_x)

        # Ball-Paddle Collision
        if ball.colliderect(player1_paddle) or ball.colliderect(player2_paddle):
            ball_speed_x *= -1

    # Drawing
    screen.fill(BLACK)

    pygame.draw.rect(screen, WHITE, player1_paddle)
    pygame.draw.rect(screen, WHITE, player2_paddle)
    pygame.draw.ellipse(screen, WHITE, ball)  # Draw ball as an ellipse (circle)

    # Display Scores
    player1_text = score_font.render(str(player1_score), True, WHITE)
    screen.blit(player1_text, (SCREEN_WIDTH // 4, 20))

    player2_text = score_font.render(str(player2_score), True, WHITE)
    screen.blit(player2_text, (SCREEN_WIDTH * 3 // 4 - player2_text.get_width(), 20))

    if game_over:
        win_text_surface = score_font.render(win_text_str, True, WHITE)
        text_rect = win_text_surface.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2))
        screen.blit(win_text_surface, text_rect)

    pygame.display.flip()

    # Control frame rate
    clock.tick(60)

# Quit Pygame
pygame.quit()
