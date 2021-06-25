const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const robot = require('robotjs')

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1300,
        height: 900,
        webPreferences: {
            // The path.join API joins multiple path segments together, creating a combined path string that works across all platforms.
            preload: path.join(__dirname, 'preload.js')
        }
    })
    win.loadURL('http://localhost:3000')
    ipcMain.on('get-screen-size', (event, args) => {
        event.sender.send('reply-screen-size', robot.getScreenSize().width, robot.getScreenSize().height);
    })
}

// In Electron, browser windows can only be created after the app module's ready event is fired.
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if(BrowserWindow.getAllWindows().length===0) createWindow();
    })
})

app.on('window-all-closed', () => {
    if(process.platform!=='darwin') app.quit();
})