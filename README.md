# 3-D Model Viewer (Electron Desktop Application)

This project is a desktop 3D viewer application built with Electron. It allows users to select and view 3D models (FBX and OBJ formats) from a predefined list embedded within the application.

## Features

- Model selection menu.
- 3D viewer using Three.js.
- Camera controls: rotate, zoom, pan (via OrbitControls).
- Supports embedded FBX and OBJ model files.
- View resets and centers on newly loaded models.
- "Back to Selection" button.
- Packaged as a desktop application for Windows, macOS, and Linux.

## Project Structure

- `main.ts`: Electron main process source code.
- `preload.ts`: Electron preload script source code.
- `index.html`: Main HTML file for the renderer process.
- `style.css`: CSS styles for the renderer process.
- `script.ts`: TypeScript source code for the renderer process logic (Three.js, UI).
- `assets/models/`: Contains the embedded 3D model files (.fbx, .obj).
- `dist/`: Output directory for compiled renderer code (`script.js`).
- `dist_electron/`: Output directory for compiled Electron main and preload code (`main.js`, `preload.js`).
- `release/`: Default output directory for packaged desktop applications (by Electron Builder).
- `tsconfig.json`: TypeScript configuration for the renderer process.
- `tsconfig.electron.json`: TypeScript configuration for the Electron main and preload processes.
- `package.json`: Defines Node.js project dependencies, scripts for running and building.
- `.gitignore`: Specifies intentionally untracked files by Git.

## Prerequisites

- Node.js and npm (or yarn).
- A modern operating system (Windows, macOS, Linux) for running the packaged application.
- To build for specific platforms, you might need to be on that platform (e.g., macOS for .dmg, Windows for .exe). Cross-compilation can be complex.

## How to Run in Development Mode

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Start the Application:**
    ```bash
    npm start
    ```
    This command will:
    - Compile `main.ts`, `preload.ts`, and `script.ts`.
    - Watch for changes in these TypeScript files and recompile automatically.
    - Launch the Electron application.
    - The Electron window will open, and developer tools will be available.

## How to Build Desktop Executables

1.  **Ensure Dependencies are Installed:**
    ```bash
    npm install
    ```

2.  **Build for Your Current Operating System:**
    ```bash
    npm run build
    ```
    This will create a packaged application for your current OS (e.g., an `.exe` installer on Windows, a `.dmg` on macOS) in the `release/` directory.

3.  **Build Specifically for Windows:**
    ```bash
    npm run build:win
    ```
    This attempts to build for Windows. It's best run on a Windows machine or a properly configured build environment.

4.  **Build Specifically for macOS:**
    ```bash
    npm run build:mac
    ```
    This attempts to build for macOS. It typically needs to be run on a macOS machine.

5.  **Build Specifically for Linux (AppImage by default):**
    ```bash
    npm run build:linux # Assuming you add a "build:linux" script similar to win/mac
    ```
    (Note: The `package.json` currently has a `linux` configuration in the `build` section but might need a dedicated `npm run build:linux` script if desired, similar to `build:win` and `build:mac`. The generic `npm run build` might also produce Linux builds if run on Linux.)

**Note on Cross-Compilation:**
Building for a platform different from the one you are currently using (cross-compilation) can be tricky with Electron Builder. For example, building a macOS `.dmg` usually requires a macOS environment. Similarly for certain Windows installer types. Using CI/CD services or Docker images can help automate cross-platform builds.

The packaged application will be found in the `release/` directory.
