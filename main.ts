import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';

const args = process.argv.slice(1);
const serve = args.some(val => val === '--serve');
let win: BrowserWindow;

function createWindow() {
  const size = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    center: true,
    width: Math.min(serve ? 1500 : 1000, size.width),
    height: Math.min(serve ? 850 : 700, size.height),
    minWidth: 450,
    minHeight: 500,
    frame: false,
    transparent: true,
    titleBarStyle: 'hidden',
    backgroundColor: '#FFFFFFFF',
    webPreferences: {
      nodeIntegration: true
    },
    icon:
      (serve ? 'src/' : '') +
      'favicon.64x64.' +
      (process.platform === 'win32' ? 'ico' : 'png')
  });

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, 'dist/index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }

  if (serve) {
    win.webContents.openDevTools();
  }

  process.stdout._write = (
    chunk: any,
    encoding: string,
    done: Function
  ): void => {
    win.webContents.send('stdout', chunk.toString());
    done();
  };

  process.stderr._write = (
    chunk: any,
    encoding: string,
    done: Function
  ): void => {
    win.webContents.send('stderr', chunk.toString());
    done();
  };

  ipcMain.on('winston-add-console-transport', () => {
    try {
      require('firebase-tools').logger.add(
        require('firebase-tools/node_modules/winston').transports.Console,
        {
          level: process.env.DEBUG ? 'debug' : 'info',
          showLevel: false,
          colorize: true
        }
      );
    } catch (e) {
      // ignore
    }
  });

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });
} catch (e) {
  // Catch Error
  // throw e;
}
