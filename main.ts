import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as childProcess from 'child_process';

import { addWinstonConsoleTransport } from './utils';

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
      (serve ? 'app-angular/src/' : '') +
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
        pathname: path.join(__dirname, 'app-angular/dist/index.html'),
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

  interface FbToolsErrorMessage {
    type: 'error';
    error: any;
  }

  interface FbToolsRunCommandResultMessage {
    type: 'run-command-result';
    result: any;
  }

  interface FbToolsRunCommandErrorMessage {
    type: 'run-command-error';
    error: any;
  }

  interface FbToolsPromptMessage {
    type: 'prompt';
    id: string;
    options: any;
    question: any;
  }

  type FbToolsMessage =
    | FbToolsErrorMessage
    | FbToolsRunCommandResultMessage
    | FbToolsRunCommandErrorMessage
    | FbToolsPromptMessage;

  ipcMain.on(
    'fbtools',
    (
      event: any,
      replyId: string,
      command: string,
      args: any[],
      options: any
    ) => {
      const child = childProcess.fork(
        path.resolve(__dirname, './fbtools.js'),
        [],
        {
          stdio: ['pipe', 'pipe', 'pipe', 'ipc']
        }
      );

      child.on('message', (msg: FbToolsMessage) => {
        if (msg.type === 'error' || msg.type === 'run-command-error') {
          win.webContents.send(replyId, undefined, msg.error);
          child.kill();
          return;
        }

        if (msg.type === 'run-command-result') {
          win.webContents.send(replyId, msg.result);
          child.kill();
          return;
        }

        if (msg.type === 'prompt') {
          const { id, options, question } = msg;
          ipcMain.once(
            'prompt-response--' + id,
            (event: any, answer: any, error: any) => {
              child.send({ type: 'prompt-response', id, answer, error });
            }
          );
          win.webContents.send('prompt', { id, options, question });
          return;
        }
      });

      child.stdout.on('data', (data: any) => {
        win.webContents.send('stdout-' + replyId, data.toString());
      });

      child.stderr.on('data', (data: any) => {
        win.webContents.send('stderr-' + replyId, data.toString());
      });

      child.send({
        type: 'run-command',
        command,
        args,
        options
      });
    }
  );

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

try {
  addWinstonConsoleTransport();

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
