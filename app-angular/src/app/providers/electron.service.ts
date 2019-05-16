import { Injectable } from '@angular/core';

// IMPORTANT: These imports should only be used for types!
import { ipcRenderer, webFrame, remote, IpcRenderer } from 'electron';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ElectronService {
  readonly ipcRenderer: typeof ipcRenderer;
  readonly webFrame: typeof webFrame;
  readonly remote: typeof remote;
  readonly childProcess: typeof childProcess;
  readonly path: typeof path;
  readonly fs: typeof fs;

  constructor() {
    if (this.isElectron()) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;
      this.remote = window.require('electron').remote;

      this.childProcess = window.require('child_process');
      this.path = window.require('path');
      this.fs = window.require('fs');

      this.ipcEvents();
    }
  }

  isElectron = () => {
    return window && window.process && window.process.type;
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
  }
}

interface IpcEvent {
  sender: IpcRenderer;
  senderId: number;
}
