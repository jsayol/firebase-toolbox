import { Injectable } from '@angular/core';

import { PromptService } from './prompt.service';
import { getRandomId } from '../../utils';

// IMPORTANT: These imports should only be used for types!
import * as electron_Type from 'electron';
import * as childProcess_Type from 'child_process';
import * as inquirer_Type from 'inquirer';
import * as path_Type from 'path';
import * as fs_Type from 'fs';
import * as os_Type from 'os';

export interface OutputCapture {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

export interface RunningCommand<T = any> {
  done: Promise<T>;
  kill: () => void;
  stdin: (data: string) => void;
}

interface PromptRequest {
  id: string;
  question: inquirer_Type.Question;
}

@Injectable()
export class ElectronService {
  readonly ipcRenderer: typeof electron_Type.ipcRenderer;
  readonly webFrame: typeof electron_Type.webFrame;
  readonly remote: typeof electron_Type.remote;
  readonly childProcess: typeof childProcess_Type;
  readonly path: typeof path_Type;
  readonly fs: typeof fs_Type;
  readonly os: typeof os_Type;

  private readonly electron: typeof electron_Type;
  private readonly electronMain: typeof electron_Type;

  constructor(private prompt: PromptService) {
    if (this.isElectron()) {
      this.electron = window.require('electron');
      this.electronMain = this.electron.remote.require('electron');

      this.ipcRenderer = this.electron.ipcRenderer;
      this.webFrame = this.electron.webFrame;
      this.remote = this.electron.remote;
      this.childProcess = window.require('child_process');
      this.path = window.require('path');
      this.fs = window.require('fs');
      this.os = window.require('os');

      this.ipcEvents();
    }
  }

  isElectron = () => {
    return window && window.process && window.process.type;
  }

  get app(): electron_Type.App {
    return this.electron.remote.app;
  }

  get clipboard(): electron_Type.Clipboard {
    return this.electron.clipboard;
  }

  get shell(): electron_Type.Shell {
    return this.electron.shell;
  }

  get dialog(): electron_Type.Dialog {
    return this.electronMain.dialog;
  }

  send(channel: string, ...args: any[]): void {
    this.ipcRenderer.send(channel, ...args);
  }

  sendSync(channel: string, ...args: any[]): any {
    return this.ipcRenderer.sendSync(channel, ...args);
  }

  runToolsCommand<T = any>(
    output: OutputCapture,
    command: string,
    args: any[] = [],
    options: { [k: string]: any } = {},
    ownOptions: { nodeVersion?: 'self' | 'system' } = {}
  ): RunningCommand<T> {
    const id = getRandomId();
    const channel = 'fbtools';

    const promise = new Promise<T>((resolve, reject) => {
      const onStdout = (event: any, data: string) => {
        output.stdout(data);
      };

      const onStderr = (event: any, data: string) => {
        output.stderr(data);
      };

      this.ipcRenderer.once(
        `result-${id}`,
        (event: any, response: any, error: any) => {
          console.log('RESULT', { id, response, error });
          this.ipcRenderer.removeListener(`stdout-${id}`, onStdout);
          this.ipcRenderer.removeListener(`stderr-${id}`, onStderr);

          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        }
      );

      this.ipcRenderer.on(`stdout-${id}`, onStdout);
      this.ipcRenderer.on(`stderr-${id}`, onStderr);
      this.ipcRenderer.send(channel, id, command, args, options, ownOptions);
    });

    return {
      done: promise,
      kill: () => {
        this.send(`kill-${id}`);
      },
      stdin: (data: string) => {
        this.send(`stdin-${id}`, data);
      }
    };
  }

  getSystemNodeVersion(): string | null {
    const { stdout } = this.childProcess.spawnSync('node', ['--version'], {
      killSignal: 'SIGKILL',
      timeout: 1000,
      maxBuffer: 10,
      encoding: 'utf8'
    });

    const possibleVersion = stdout && stdout.trim();

    if (/^v(\d+)\.(\d+)\.(\d+)$/.test(possibleVersion)) {
      return possibleVersion;
    } else {
      return null;
    }
  }

  private ipcEvents(): void {
    this.ipcRenderer.on('stdout', (event: IpcEvent, data: string) => {
      console.log('STDOUT:');
      console.log(data);
    });

    this.ipcRenderer.on('stderr', (event: IpcEvent, data: string) => {
      console.error('STDERR:');
      console.log(data);
    });

    this.ipcRenderer.on(
      'prompt',
      async (event: IpcEvent, promptReq: PromptRequest) => {
        console.error('PROMPT:');
        console.log(promptReq);
        let answer: string | string[];
        let error: any;

        try {
          answer = await this.prompt.show(promptReq.id, promptReq.question);
        } catch (err) {
          error = err;
        }

        console.log({ answer, error });
        event.sender.send('prompt-response--' + promptReq.id, answer, error);
      }
    );
  }
}

interface IpcEvent {
  sender: electron_Type.IpcRenderer;
  senderId: number;
}
