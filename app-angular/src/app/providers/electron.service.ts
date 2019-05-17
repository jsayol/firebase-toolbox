import { Injectable } from '@angular/core';

import { PromptService } from './prompt.service';
import { getRandomId } from '../../utils';

// IMPORTANT: These imports should only be used for types!
import { ipcRenderer, webFrame, remote, IpcRenderer } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as inquirer from 'inquirer';

interface PromptRequest {
  id: string;
  question: inquirer.Question;
}

@Injectable()
export class ElectronService {
  readonly ipcRenderer: typeof ipcRenderer;
  readonly webFrame: typeof webFrame;
  readonly remote: typeof remote;
  readonly path: typeof path;
  readonly fs: typeof fs;

  constructor(private prompt: PromptService) {
    if (this.isElectron()) {
      const electron = window.require('electron');

      this.ipcRenderer = electron.ipcRenderer;
      this.webFrame = electron.webFrame;
      this.remote = electron.remote;
      this.path = window.require('path');
      this.fs = window.require('fs');

      this.ipcEvents();
    }
  }

  isElectron = () => {
    return window && window.process && window.process.type;
  }

  send(channel: string, ...args: any[]): void {
    this.ipcRenderer.send(channel, ...args);
  }

  sendAndWait<T = any>(channel: string, ...args: any[]): Promise<T> {
    return new Promise((resolve, reject) => {
      const replyId = getRandomId();

      this.ipcRenderer.on(replyId, (event: any, response: any, error: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });

      this.ipcRenderer.on('stdout-' + replyId, (event: any, data: string) => {
        console.log(`STDOUT[${replyId}]: ${data}`);
      });

      this.ipcRenderer.on('stderr-' + replyId, (event: any, data: string) => {
        console.log(`STDERR[${replyId}]: ${data}`);
      });

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
  sender: IpcRenderer;
  senderId: number;
}
