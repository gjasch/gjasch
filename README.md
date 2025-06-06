# Godot 3D First-Person Tech Demo

This is a basic 3D tech demo created with Godot Engine (version 4.4, C#). It features a simple outdoor environment with first-person controls.

## Running the Demo

1.  Ensure you have Godot Engine 4.4 (C# version) installed.
2.  Open the Godot editor.
3.  Choose "Import" or "Open" and select the `project.godot` file from this repository.
4.  Once the project is open, you can run the main scene by clicking the "Play" button (or F5). The main scene should be `scenes/Main.tscn`.

## Input Controls

The player uses standard first-person shooter controls:
-   **W, A, S, D:** Move forward, left, backward, and right.
-   **Mouse:** Look around.
-   **Spacebar:** Jump.

### Input Map Configuration (Important!)

For the controls to work, Godot needs to know which keys correspond to which actions. These actions should have been automatically added to the `project.godot` file. However, if you encounter issues with controls, please verify them:

1.  In the Godot Editor, go to **Project > Project Settings**.
2.  Navigate to the **Input Map** tab.
3.  You should see the following actions listed. If not, you'll need to add them:
    *   `forward`
    *   `backward`
    *   `left`
    *   `right`
    *   `jump`
4.  To add an action (if missing):
    *   Type the action name (e.g., `forward`) in the "Add New Action" text box at the top and click "Add".
5.  To assign a key to an action:
    *   Find the action in the list.
    *   Click the "+" button to the right of the action name.
    *   Select "Key" from the dropdown.
    *   Press the desired key (e.g., "W" for `forward`) when prompted.
    *   The assigned keys should be:
        *   `forward`: **W**
        *   `backward`: **S**
        *   `left`: **A**
        *   `right`: **D**
        *   `jump`: **Space**

## Project Structure

-   `scenes/`: Contains the game scenes (`Main.tscn`, `Player.tscn`, `Tree.tscn`).
-   `scripts/`: Contains the C# scripts (e.g., `PlayerController.cs`).
-   `assets/`: Intended for game assets (currently empty as trees are procedurally generated in their scene).
-   `project.godot`: The main project file.
-   `.godot/`: Internal Godot directory.
