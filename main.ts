import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as childProcess from 'child_process';
// import * as mockRequire from 'mock-require';
// import * as inquirer from 'inquirer';

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
      const child = childProcess.fork('./fbtools.js', [], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
      });

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

// function getRandomId(): string {
//   const ID_LENGTH = 15;

//   let id = '';
//   do {
//     id += Math.random()
//       .toString(36)
//       .substr(2);
//   } while (id.length < ID_LENGTH);

//   id = id.substr(0, ID_LENGTH);

//   return id;
// }

// function interceptCliPrompt() {
//   // Path to the prompt module we need to intercept
//   const PROMPT_PATH = './node_modules/firebase-tools/lib/prompt';

//   interface PromptOptions {
//     [k: string]: any;
//   }

//   const originalPrompt = require(PROMPT_PATH);

//   const prompt = function(
//     options: PromptOptions,
//     questions: inquirer.Question[]
//   ) {
//     return new Promise(async (resolve, reject) => {
//       const id = getRandomId();

//       const prompts: Promise<any>[] = [];

//       for (let i = 0; i < questions.length; i++) {
//         const question = questions[i];

//         if (!options[question.name]) {
//           const ipcPrompt = new Promise((ipcResolve, ipcReject) => {
//             ipcMain.once(
//               'prompt-response--' + id,
//               (event: any, answer: any, error: any) => {
//                 if (error) {
//                   ipcReject(error);
//                 } else {
//                   ipcResolve({ name: question.name, response: answer });
//                 }
//               }
//             );

//             win.webContents.send('prompt', { id, options, question });
//           });

//           prompts.push(ipcPrompt);
//         }
//       }

//       try {
//         const responses = await Promise.all(prompts);
//         responses.forEach(({ name, response }) => {
//           options[name] = response;
//         });
//         resolve(options);
//       } catch (err) {
//         reject(err);
//       }
//     });
//   };

//   prompt.once = (question: inquirer.Question) => {
//     question.name = question.name || 'question';
//     return prompt({}, [question]).then((answers: PromptOptions) => {
//       return answers[question.name];
//     });
//   };

//   prompt.convertLabeledListChoices = originalPrompt.convertLabeledListChoices;
//   prompt.listLabelToValue = originalPrompt.listLabelToValue;

//   mockRequire(PROMPT_PATH, prompt);
// }

function addWinstonConsoleTransport() {
  try {
    const logger = require('firebase-tools').logger;
    const winston = require('winston');
    logger.add(winston.transports.Console, {
      level: 'info',
      showLevel: false,
      colorize: true
    });
  } catch (e) {
    console.error('Failed patching winston logger:', e);
  }
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
