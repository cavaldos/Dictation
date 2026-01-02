import { app, BrowserWindow } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'


const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.DIST_ELECTRON = path.join(__dirname, '..')
process.env.DIST = path.join(__dirname, '../dist-electron')

let win: BrowserWindow | null = null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset', // macOS: ẩn title bar, giữ traffic lights
    trafficLightPosition: { x: 12, y: 12 }, // Vị trí nút đỏ/vàng/xanh
    backgroundColor: '#191919', // Màu nền trùng với app background
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    const distElectron = process.env.DIST_ELECTRON
    if (distElectron) {
      win.loadFile(path.join(distElectron, 'dist/index.html'))
    }
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()
})
