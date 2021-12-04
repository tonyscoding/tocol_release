const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater')
const robot = require('robotjs')
const vkey = require("vkey")

let isSocialLogin = false
let win = null;

let startUrl = "https://www.topolar.co.kr/login?redirectPath=/student/new-classroom"
// let startUrl = "http://localhost:3000/login?redirectPath=/student/new-classroom"
// let startUrl = "https://tocol.info/login?redirectPath=/student/new-classroom"

// Ask for media access for Mac user
if(process.platform==='darwin' && !isDev){
  require('electron').systemPreferences.askForMediaAccess('microphone');
}

const createWindow = (paramUrl) => {
  const process = require('process')
  const cachePath = process.env.APPDATA + "\\"+app.getName()+"\\Cache"
  require("fs").rmdirSync(cachePath, {recursive: true})

  win = new BrowserWindow({
      width: 1300,
      height: 900,
      icon: path.join(__dirname, 'topolar_logo.ico'),
      webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          plugins: true,
          enableRemoteModule: true,
          // The path.join API joins multiple path segments together, creating a combined path string that works across all platforms.
          preload: path.join(__dirname, 'preload.js')
      }
  })
  win.webContents.session.clearStorageData();

  if(process.argv[1] && process.argv[1].startsWith("topolarapp")) {
    startUrl += process.argv[1].split("///")[1]
  }
  if(paramUrl) startUrl+=paramUrl.split("//")[1]

  win.webContents.on('new-window', (e, url, frameName, disposition, options) => {
    e.preventDefault();
    require('electron').shell.openExternal(url);
  })

  win.on('close', (e) => {
    if(!isSocialLogin) {
      const choice = dialog.showMessageBoxSync({
        type: 'question',
        buttons: ["네", "아니요"],
        icon: `${__dirname}/topolar_logo.png`,
        title: '종료',
        message: '정말 종료하시겠습니까?',
        cancelId: 1
      })
      if(choice===1) e.preventDefault();
      else win = null;
    }
  })
  
  win.setMenuBarVisibility(false)
  win.loadURL(startUrl)
}

let mouseDown = false
const timeStamp = new Date().getTime();
let gotTheLock = false
let paramUrl;

while(!gotTheLock){
  let tempTimeStamp = new Date().getTime();
  if(tempTimeStamp - timeStamp > 5000) break;
  gotTheLock = app.requestSingleInstanceLock()
  if (gotTheLock){
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      isSocialLogin = true
      app.quit()
    })

    // In Electron, browser windows can only be created after the app module's ready event is fired.
    app.whenReady().then(() => {
      createWindow(paramUrl);
      if(!isDev) {
        // autoUpdater.setFeedURL({
        //   provider: 'github',
        //   repo: 'tocol_release',
        //   owner: 'tonyscoding',
        //   private: true,
        //   token: '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'
        // })
        autoUpdater.checkForUpdates();
      }
  
      app.on('activate', () => {
          if(BrowserWindow.getAllWindows().length===0) createWindow(paramUrl);
      })
    })
    
    app.on('window-all-closed', () => {
        if(process.platform!=='darwin') app.quit();
    })

  }
  tempTimeStamp = null;
}

app.on('open-url', (event, url) => {
  if(process.platform==="darwin") paramUrl = url 
})

if (!app.isDefaultProtocolClient('topolarapp')) {
  // Define custom protocol handler. Deep linking works on packaged versions of the application!
  app.setAsDefaultProtocolClient('topolarapp')
}

ipcMain.on('get-screen-size', (event, args) => {
  event.sender.send('reply-screen-size', robot.getScreenSize().width, robot.getScreenSize().height);
})

ipcMain.on("get-screen-size", (event, args) => {
  var screenSize = robot.getScreenSize()
  event.sender.send("reply-screen-size", screenSize.width, screenSize.height)
})

ipcMain.on("mouse-click", (event, x, y) => {
  robot.moveMouse(x, y)
  robot.mouseClick()
})

ipcMain.on("mouse-down", (event, x, y) => {
  robot.moveMouse(x, y)
  robot.mouseToggle("down")
  mouseDown = true
})

ipcMain.on("mouse-up", event => {
  robot.mouseToggle("up")
  mouseDown = false
})

ipcMain.on("mouse-move", (event, x, y) => {
  if (mouseDown) {
    robot.dragMouse(x, y)
  } else {
    robot.moveMouse(x, y)
  }
})

ipcMain.on("right-mouse-down", (event, x, y) => {
  robot.moveMouse(x, y)
  robot.mouseToggle("down", "right")
  mouseDown = true
})

ipcMain.on("key-press", (event, keyCode, modifiers) => {
  var k = vkey[keyCode].toLowerCase()
  if (k === "<space>") k = " "

  if (k[0] !== "<") {
    if (modifiers.length > 0 && modifiers[0]) robot.keyTap(k, modifiers)
    else robot.keyTap(k)
  } else {
    let key = mapVkeyToRobotKey(k)
    if(key){
      if (modifiers.length > 0 && modifiers[0]) robot.keyTap(key, modifiers)
      else robot.keyTap(key)
    }
  }
})

function mapVkeyToRobotKey(vkey){
  if (vkey === "<enter>") return "enter"
  else if (vkey === "<backspace>") return "backspace"
  else if (vkey === "<up>") return "up"
  else if (vkey === "<down>") return "down"
  else if (vkey === "<left>") return "left"
  else if (vkey === "<right>") return "right"
  else if (vkey === "<delete>") return "delete"
  else if (vkey === "<home>") return "home"
  else if (vkey === "<end>") return "end"
  else if (vkey === "<page-up>") return "pageup"
  else if (vkey === "<page-down>") return "pagedown"
  else if (vkey === "<control>") return "control"
  else if (vkey === "<meta>") return "command"
  else if (vkey === "<alt>") return "alt"
  else if (vkey === "<shift>") return "shift"
  else if (vkey === "<tab>") return "tab"
  else if (vkey == "<ime-hangul>") return "right_alt"
  else return null
}

ipcMain.on("mouse-click-test", (event, args) => {
  robot.setMouseDelay(2)

  var twoPI = Math.PI * 2.0
  var screenSize = robot.getScreenSize()
  var height = screenSize.height / 2 - 10
  var width = screenSize.width

  for (var x = 0; x < width; x++) {
    var y = height * Math.sin((twoPI * x) / width) + height
    robot.moveMouse(x, y)
  }
})

autoUpdater.on('checking-for-update', (event) => {
  log.info("Checking for update: ")
})

autoUpdater.on('update-available', (event) => {
  log.info("Update Available : " + event.version)
})

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    log.info("Update downloaded")
    const dialogOpts = {
        type: 'info',
        buttons: ['재시작', '나중에'],
        title: 'Application Update',
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: '새로운 버전이 다운로드 되었습니다. 업데이트를 적용하기 위해 앱을 재시작하세요.'
    }
    
    dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) autoUpdater.quitAndInstall()
    })
})

autoUpdater.on('download-progress', (progressObj) => {
  log.info("Progress:" + progressObj.percent + '%')
})

autoUpdater.on('error', (message,error) => {
    log.info(error)
})