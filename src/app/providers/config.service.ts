import { Injectable } from '@angular/core';

import { ElectronService } from './electron.service';
import { FirebaseProject } from '../models/projects.model';
import { UserInfo } from '../models/user.model';

// IMPORTANT: These imports should only be used for types!
import * as ElectronStore from 'electron-store';

interface Config {
  userinfo: {
    [email: string]: UserInfo;
  };
  userprojects: {
    [email: string]: FirebaseProject[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly config: ElectronStore;

  constructor(private electron: ElectronService) {
    const ElectronStore = this.electron.remote.require('electron-store');
    this.config = new ElectronStore();
  }

  private set(key: string, value: any): void {
    this.config.set(key, value);
  }

  private get<T = any>(
    key: string,
    defaultValue?: T | undefined
  ): T | undefined {
    return this.config.get(key, defaultValue) as T;
  }

  getUserInfo(email: string): UserInfo | null {
    if (this.electron.isElectron()) {
      const config = this.get<Config['userinfo']>('userinfo');
      if (!config) {
        return null;
      }
      return config[email];
    } else {
      return null;
    }
  }

  setUserInfo(email: string, info: UserInfo): void {
    if (this.electron.isElectron()) {
      const config = this.get('userinfo', {});
      config[email] = info;
      this.set('userinfo', config);
    }
  }

  getUserProjects(email: string): FirebaseProject[] {
    if (this.electron.isElectron()) {
      const config = this.get<Config['userprojects']>('userprojects');
      if (!config) {
        return [];
      }
      return config[email];
    } else {
      return [];
    }
  }

  setUserProjects(email: string, projects: FirebaseProject[]): void {
    if (this.electron.isElectron()) {
      const config = this.get('userprojects', {});
      config[email] = projects;
      this.set('userprojects', config);
    }
  }
}
