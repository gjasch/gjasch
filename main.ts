import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as url from 'url';
// REMOVED: import isDev from 'electron-is-dev';

let mainWindow: BrowserWindow | null;

async function createWindow(): Promise<void> { // Added async
    const isDev = (await import('electron-is-dev')).default; // Dynamic import

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    const indexPath = path.join(__dirname, '../index.html');

    if (isDev) {
        mainWindow.loadFile(indexPath);
        mainWindow.webContents.openDevTools();
    } else {
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

// app.on('ready', createWindow); // Original line, to be replaced or modified

app.whenReady().then(async () => { // MODIFIED for async createWindow
    await createWindow();

    app.on('activate', () => { // This activate logic should be fine.
        if (BrowserWindow.getAllWindows().length === 0) {
            // If createWindow must be awaited, this might need adjustment,
            // but usually, activate is for re-creating a window if none exist.
            // For simplicity, we'll assume if it gets called, a new createWindow()
            // can be initiated. If issues arise, this could be wrapped.
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
