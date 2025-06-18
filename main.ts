import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as url from 'url';
import isDev from 'electron-is-dev';

let mainWindow: BrowserWindow | null;

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false, // Disable Node.js integration in renderer for security
            contextIsolation: true, // Protect against prototype pollution
            preload: path.join(__dirname, 'preload.js'), // Optional: path to a preload script
        },
    });

    // Construct the path to index.html.
    // __dirname in Electron's main process (after compilation to dist_electron/main.js)
    // refers to the dist_electron directory. So, index.html is one level up.
    const indexPath = path.join(__dirname, '../index.html');

    if (isDev) {
        // In development, Electron will load index.html from the project root.
        // The path from dist_electron/main.js to project_root/index.html is '../index.html'
        mainWindow.loadFile(indexPath);
        // Open DevTools automatically if in development
        mainWindow.webContents.openDevTools();
    } else {
        // In production (packaged app), load the bundled index.html.
        // After packaging, index.html will be at the root of the app.asar archive,
        // and __dirname will be relative to the app.asar root.
        // So, path.join(__dirname, '../index.html') should still resolve correctly
        // if index.html is placed at the root level of the files included in the package.
        // Electron Builder typically copies files specified in 'files' config to the app root.
         mainWindow.loadURL(
            url.format({
                pathname: indexPath,
                protocol: 'file:',
                slashes: true,
            })
        );
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    // On macOS it's common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Optional: Create a basic preload.js if you want to expose specific Node.js/Electron APIs safely
// For now, we don't strictly need it if script.ts doesn't require Node.js APIs.
// If created, preload.js would be:
// console.log('Preload script loaded');
// (This would require adding preload.ts to tsconfig.electron.json and compiling it too)
