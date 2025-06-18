// preload.ts
// All Node.js APIs are available in the preload process.
// It has whatever privileges you give it. But by default, it has
// access to Node.js and Electron APIs.

// window.addEventListener('DOMContentLoaded', () => {
//   const replaceText = (selector: string, text: string) => {
//     const element = document.getElementById(selector);
//     if (element) {
//       element.innerText = text;
//     }
//   };

//   for (const type of ['chrome', 'node', 'electron']) {
//     replaceText(`${type}-version`, process.versions[type as keyof NodeJS.ProcessVersions] || 'unknown');
//   }
// });

console.log('[preload.ts] Preload script loaded. This script runs before the renderer page is loaded.');

// If you want to expose specific APIs to the renderer in a safe way:
// import { contextBridge, ipcRenderer } from 'electron';
// contextBridge.exposeInMainWorld('myAPI', {
//   doSomething: () => ipcRenderer.send('do-something'),
//   // Add other functions you want to expose
// });
