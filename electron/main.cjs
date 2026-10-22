const { app, BrowserWindow, screen } = require('electron');
const fs = require('fs');
const path = require('path');

const DIST_INDEX = path.join(__dirname, '../dist/index.html');

app.setName('扇贝日语');

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });
}

function createWindow() {
  const area = screen.getPrimaryDisplay().workAreaSize;
  const win = new BrowserWindow({
    width: Math.min(1180, area.width),
    height: Math.min(900, area.height),
    minWidth: Math.min(960, area.width),
    minHeight: Math.min(640, area.height),
    title: '扇贝日语',
    backgroundColor: '#e7eee9',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => win.show());

  const startUrl = process.env.ELECTRON_START_URL;
  if (startUrl) {
    win.loadURL(startUrl);
    return;
  }
  if (fs.existsSync(DIST_INDEX)) {
    win.loadFile(DIST_INDEX);
    return;
  }
  win.loadURL(
    'data:text/html;charset=utf-8,' +
      encodeURIComponent(`<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>扇贝日语</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#e7eee9;color:#17241d;font-family:sans-serif">
  <main style="max-width:420px;padding:32px">
    <h1 style="font-weight:600">扇贝日语还没打包好</h1>
    <p>在项目目录里运行 <code>npm run desktop</code>，窗口会自己打开。</p>
  </main>
</body></html>`),
  );
}

if (gotLock) {
  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}
