import { Injectable } from '@angular/core';
import { ElectronService, OutputCapture } from './electron.service';

// IMPORTANT: These imports should only be used for types!
import * as path from 'path';
import { promises as fs } from 'fs';
import * as Configstore from 'configstore';
import * as cli from 'firebase-tools';
import { GoogleApis } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

const CLI_CLIENT_ID =
  '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

@Injectable({
  providedIn: 'root'
})
export class FirebaseToolsService {
  readonly cli: typeof cli;
  private fs: typeof fs;
  private path: typeof path;
  private configstore: Configstore;
  private oauth2Client: OAuth2Client;
  private google: GoogleApis;

  constructor(private electron: ElectronService) {
    const Configstore = this.electron.remote.require('configstore');
    this.fs = this.electron.remote.require('fs').promises;
    this.cli = this.electron.remote.require('firebase-tools');
    this.path = this.electron.remote.require('path');
    this.google = this.electron.remote.require('googleapis').google;

    this.configstore = new Configstore('firebase-tools');
    this.oauth2Client = new this.google.auth.OAuth2(
      CLI_CLIENT_ID,
      CLI_CLIENT_SECRET
    ) as any;
  }

  async login(options?: cli.LoginOptions): Promise<void> {
    await this.cli.login(options);
  }

  async logout(options?: cli.LoginOptions): Promise<void> {
    await this.cli.logout(options);
  }

  getUserEmail(): string | null {
    const user = this.configstore.get('user') as cli.AccountUser;
    if (!user) {
      return null;
    }

    const tokens = this.configstore.get('tokens') as cli.AccountTokens;
    if (!tokens) {
      return null;
    }

    try {
      this.oauth2Client.setCredentials(tokens);
    } catch (_) {
      return null;
    }

    return user.email;
  }

  getUserInfo(): Promise<UserInfo | null> {
    return new Promise<UserInfo | null>((resolve, reject) => {
      this.google.plus({ version: 'v1' }).people.get(
        {
          auth: this.oauth2Client,
          userId: 'me'
        },
        (error, response) => {
          if (error) {
            console.error(error);
            reject(error);
            return;
          } else {
            resolve({
              name: response.data.displayName,
              imageUrl: response.data.image.url
            });
          }
        }
      );
    });
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const activeProjects = this.configstore.get('activeProjects') as {
      [path: string]: string;
    };

    if (!activeProjects) {
      return [];
    }

    const workspaces: (Workspace | null)[] = await Promise.all(
      Object.entries(activeProjects).map(async ([path, name]) => {
        try {
          const stat = await this.fs.stat(path);
          if (!stat.isDirectory()) {
            return null;
          }
        } catch (err) {
          return null;
        }

        const workspace: Workspace = {
          path,
          projectId: name,
          projectAlias: name
        };

        const rc = await this.rcFile(workspace);
        if (rc && contains(rc, 'projects') && contains(rc.projects, name)) {
          workspace.projectId = rc.projects[name];
        }

        return workspace;
      })
    );

    return workspaces.filter(workspace => !!workspace);
  }

  getProjects(): Promise<FirebaseProject[]> {
    return this.cli.list();
  }

  async getWorkspaceProjects(
    workspace: Workspace
  ): Promise<Array<{ id: string; alias: string }>> {
    const rc = await this.rcFile(workspace);

    if (
      !rc ||
      !contains(rc, 'projects') ||
      Object.keys(rc.projects).length === 0
    ) {
      return [{ id: workspace.projectId, alias: workspace.projectAlias }];
    }

    const projects: Array<{ id: string; alias: string }> = [];
    let hasActiveProject = false;

    for (const alias in rc.projects) {
      const id = rc.projects[alias];
      projects.push({ id, alias });
      if (id === workspace.projectId) {
        hasActiveProject = true;
      }
    }

    if (!hasActiveProject) {
      projects.unshift({
        id: workspace.projectId,
        alias: workspace.projectAlias
      });
    }

    return projects;
  }

  init(
    output: OutputCapture,
    path: string,
    feature: cli.InitFeatureName
  ): Promise<void> {
    return this.electron.sendAndWait(output, 'fbtools', 'init', [feature], {
      cwd: path,
      interactive: true
    });
  }

  useProject(workspace) {}

  private async rcFile(
    workspace: Workspace
  ): Promise<{ [k: string]: any } | null> {
    try {
      const rcPath = this.path.join(workspace.path, '.firebaserc');
      return JSON.parse(await fs.readFile(rcPath, 'utf8'));
    } catch (err) {
      // Either ".firebaserc" doesn't exist or is corrupted
      return null;
    }
  }
}

export interface UserInfo {
  name: string;
  imageUrl: string;
}

export interface Workspace {
  path: string;
  projectId: string;
  projectAlias: string;
}

function contains(obj: { [k: string]: any }, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export type FirebaseProject = cli.FirebaseProject;

// TODO: decide if we want this, and finish it if so
interface Commands {
  init: typeof cli.init;
}