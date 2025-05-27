# Pong Game
A simple implementation of the classic Pong game.

## How to Run on macOS

To run the Pong game on your MacBook, follow these steps:

**1. Install Python 3:**
   *   macOS often comes with an older version of Python. It's highly recommended to install Python 3.
   *   Download the official Python 3 installer from the Python website: [https://www.python.org/downloads/macos/](https://www.python.org/downloads/macos/)
   *   Alternatively, if you use Homebrew (a package manager for macOS), open Terminal (`Applications/Utilities/Terminal.app`) and run:
     ```bash
     brew install python
     ```
   *   After installation, verify it by typing `python3 --version` in the Terminal. It should display a version like `Python 3.x.x`.

**2. Install Pygame:**
   *   With Python 3 installed, install the Pygame library using pip (Python's package installer).
   *   Open Terminal and run:
     ```bash
     pip3 install pygame
     ```
     (If `pip3` doesn't work or if you used Homebrew and it configured `pip` for Python 3, you might be able to use `pip install pygame`.)

**3. Get the Game Code:**
   *   Create a new folder on your MacBook for the game (e.g., `MyPongGame` on your Desktop).
   *   Inside this folder, create a file named `pong.py`.
   *   Copy the Python code for the Pong game into this `pong.py` file. (The code was provided in a previous step by the assistant).

**4. Run the Game:**
   *   Open Terminal.
   *   Navigate to the directory where you saved `pong.py`. For example, if you saved it in `MyPongGame` on your Desktop:
     ```bash
     cd Desktop/MyPongGame
     ```
   *   Execute the game using Python 3:
     ```bash
     python3 pong.py
     ```
   *   The Pong game window should appear. Use W/S keys for the left paddle and Up/Down arrow keys for the right paddle.
