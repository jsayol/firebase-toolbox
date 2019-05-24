import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as childProcess from 'child_process';
import { addWinstonConsoleTransport } from './utils';

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

interface IpcFirebaseToolsOptions {
  nodeVersion?: 'system' | 'self';
}

const args = process.argv.slice(1);
const serve = args.some(val => val === '--serve');

let win: BrowserWindow;

function createWindow() {
  const size = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    center: true,
    width: Math.min(serve ? 1800 : 1000, size.width),
    height: Math.min(serve ? 950 : 700, size.height),
    minWidth: 450,
    minHeight: 500,
    frame: false,
    transparent: true,
    titleBarStyle: 'hidden',
    backgroundColor: '#FFFFFFFF',
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: false,
      webSecurity: false
    },
    icon:
      (serve ? 'app-angular/src/' : '') +
      'favicon.64x64.' +
      (process.platform === 'win32' ? 'ico' : 'png')
  });

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(path.resolve(__dirname, '../../node_modules/electron'))
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(
      url.format({
        pathname: path.resolve(__dirname, '../../app-angular/dist/index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }

  if (serve) {
    win.webContents.openDevTools();
  }

  captureOutput(win);
  ipcFirebaseTools(win);

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

function captureOutput(win: BrowserWindow): void {
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
}

function ipcFirebaseTools(win: BrowserWindow): void {
  ipcMain.on(
    'fbtools',
    (
      event: any,
      id: string,
      command: string,
      args: any[] = [],
      options: any = {},
      ownOptions: IpcFirebaseToolsOptions = {}
    ) => {
      let child: childProcess.ChildProcess;
      const fbtoolsPath = path.resolve(__dirname, './fbtools.js');

      ownOptions = {
        nodeVersion: 'self',
        ...ownOptions
      };

      if (ownOptions.nodeVersion === 'self') {
        // TODO: this doesn't work in prod mode either, don't know why
        child = childProcess.fork(fbtoolsPath, [], {
          execArgv: [],
          // cwd: options.cwd,
          stdio: ['pipe', 'pipe', 'pipe', 'ipc']
        });
      } else {
        // TODO: this doesn't work when running in prod mode, since the
        // fbtools.js file is inside the app.asar package, plus none of the
        // node modules used in there are available in the user's node.
        child = childProcess.spawn('node', [fbtoolsPath], {
          // cwd: options.cwd,
          stdio: ['pipe', 'pipe', 'pipe', 'ipc']
        });
      }

      let resultSent = false;

      child.on('message', (msg: FbToolsMessage) => {
        if (msg.type === 'error' || msg.type === 'run-command-error') {
          resultSent = true;
          win.webContents.send(`result-${id}`, undefined, msg.error);
          return;
        }

        if (msg.type === 'run-command-result') {
          resultSent = true;
          win.webContents.send(`result-${id}`, msg.result);
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
        win.webContents.send('stdout-' + id, data.toString());
      });

      child.stderr.on('data', (data: any) => {
        win.webContents.send('stderr-' + id, data.toString());
      });

      const onKillRequest = () => {
        child.kill();
      };

      const onStdinRequest = (event: any, data: string) => {
        child.stdin.write(data);
      };

      ipcMain.on(`kill-${id}`, onKillRequest);
      ipcMain.on(`stdin-${id}`, onStdinRequest);

      child.once('exit', () => {
        ipcMain.removeListener(`kill-${id}`, onKillRequest);
        if (!resultSent) {
          win.webContents.send(
            `result-${id}`,
            undefined,
            'Child process exited unexpectedly.'
          );
        }
      });

      child.send({
        type: 'run-command',
        command,
        args,
        options
      });
    }
  );
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
