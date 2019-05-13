import { Injectable } from '@angular/core';
import * as ElectronStore from 'electron-store';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame, remote } from 'electron';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { UserInfo } from '../models/user.model';
import { FirebaseProject } from '../models/projects.model';

@Injectable()
export class ElectronService {
  readonly ipcRenderer: typeof ipcRenderer;
  readonly webFrame: typeof webFrame;
  readonly remote: typeof remote;
  readonly childProcess: typeof childProcess;
  readonly path: typeof path;
  readonly fs: typeof fs;
  private readonly config = new ElectronStore();

  constructor() {
    // Conditional imports
    if (this.isElectron()) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;
      this.remote = window.require('electron').remote;

      this.childProcess = window.require('child_process');
      this.path = window.require('path');
      this.fs = window.require('fs');
    }
  }

  isElectron = () => {
    return window && window.process && window.process.type;
  }

  configSet(key: string, value: any): void {
    if (this.isElectron()) {
      this.config.set(key, value);
    }
  }

  configGet<T = any>(key: string, defaultValue?: T | undefined): T | undefined {
    if (this.isElectron()) {
      return this.config.get(key, defaultValue) as T;
    } else {
      return defaultValue;
    }
  }

  // TODO: this should go on a PersistenceService
  getCachedUserInfo(email: string): UserInfo | null {
    if (this.isElectron()) {
      const config = this.configGet<{ [email: string]: UserInfo }>('userinfo');
      if (!config) {
        return null;
      }
      return config[email];
    } else {
      return null;
    }
  }

  // TODO: this should go on a PersistenceService
  getCachedUserProjects(email: string): FirebaseProject[] {
    if (this.isElectron()) {
      const config = this.configGet<{ [email: string]: FirebaseProject[] }>(
        'userprojects'
      );
      if (!config) {
        return [];
      }
      return config[email];
    } else {
      return [];
    }
  }
}
