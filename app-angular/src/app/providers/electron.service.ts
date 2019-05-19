import { Injectable } from '@angular/core';

import { PromptService } from './prompt.service';
import { getRandomId } from '../../utils';

// IMPORTANT: These imports should only be used for types!
import * as electron_Type from 'electron';
import * as path_Type from 'path';
import * as fs_Type from 'fs';
import * as os_Type from 'os';
import * as inquirer_Type from 'inquirer';

export interface OutputCapture {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
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
  readonly path: typeof path_Type;
  readonly fs: typeof fs_Type;
  readonly os: typeof os_Type;

  private readonly electron: typeof electron_Type;

  constructor(private prompt: PromptService) {
    if (this.isElectron()) {
      this.electron = window.require('electron');

      this.ipcRenderer = this.electron.ipcRenderer;
      this.webFrame = this.electron.webFrame;
      this.remote = this.electron.remote;
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

  send(channel: string, ...args: any[]): void {
    this.ipcRenderer.send(channel, ...args);
  }

  sendAndWait<T = any>(
    output: OutputCapture,
    channel: string,
    ...args: any[]
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const replyId = getRandomId();

      const onStdout = (event: any, data: string) => {
        console.log('STDOUT:', { data });
        output.stdout(data);
      };

      const onStderr = (event: any, data: string) => {
        console.error('STDERR:', { data });
        console.log(data);
        output.stderr(data);
      };

      this.ipcRenderer.once(
        `result-${replyId}`,
        (event: any, response: any, error: any) => {
          console.log('RESULT', { replyId, response, error });
          this.ipcRenderer.removeListener(`stdout-${replyId}`, onStdout);
          this.ipcRenderer.removeListener(`stderr-${replyId}`, onStderr);

          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        }
      );

      this.ipcRenderer.on(`stdout-${replyId}`, onStdout);
      this.ipcRenderer.on(`stderr-${replyId}`, onStderr);
      this.ipcRenderer.send(channel, replyId, ...args);
    });
  }

  sendSync(channel: string, ...args: any[]): any {
    return this.ipcRenderer.sendSync(channel, ...args);
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
        let answer: string;
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
