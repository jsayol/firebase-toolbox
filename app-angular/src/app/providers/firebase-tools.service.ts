import { Injectable } from '@angular/core';
import {
  ElectronService,
  OutputCapture,
  RunningCommand
} from './electron.service';

// IMPORTANT: These imports should only be used for types!
import * as Configstore_Type from 'configstore';
import * as firebaseTools_Type from 'firebase-tools';
import { GoogleApis } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

const CLI_CLIENT_ID =
  '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

@Injectable({
  providedIn: 'root'
})
export class FirebaseToolsService {
  readonly tools: typeof firebaseTools_Type;
  private configstore: Configstore_Type;
  private oauth2Client: OAuth2Client;
  private google: GoogleApis;

  constructor(private electron: ElectronService) {
    const Configstore = this.electron.remote.require('configstore');
    this.tools = this.electron.remote.require('firebase-tools');
    this.google = this.electron.remote.require('googleapis').google;

    this.configstore = new Configstore('firebase-tools');
    this.oauth2Client = new this.google.auth.OAuth2(
      CLI_CLIENT_ID,
      CLI_CLIENT_SECRET
    ) as any;
  }

  get version(): string {
    return this.tools.cli._version;
  }

  async login(options?: firebaseTools_Type.LoginOptions): Promise<void> {
    await this.tools.login(options);
  }

  async logout(options?: firebaseTools_Type.LoginOptions): Promise<void> {
    await this.tools.logout(options);
  }

  getUserEmail(): string | null {
    const user = this.configstore.get('user') as firebaseTools_Type.AccountUser;
    if (!user) {
      return null;
    }

    const tokens = this.configstore.get(
      'tokens'
    ) as firebaseTools_Type.AccountTokens;
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
          const stat = await this.electron.fs.promises.stat(path);
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
    return this.tools.list();
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

  async getWorkspaceFeatures(
    workspace: Workspace
  ): Promise<firebaseTools_Type.InitFeatureName[]> {
    const features: firebaseTools_Type.InitFeatureName[] = [
      'database',
      'firestore',
      'functions',
      'hosting',
      'storage'
    ];

    try {
      const path = this.electron.path.join(workspace.path, 'firebase.json');
      const json = JSON.parse(
        await this.electron.fs.promises.readFile(path, 'utf8')
      );
      return features.filter(feature => contains(json, feature));
    } catch (err) {
      // Either "firebase.json" doesn't exist or is corrupted
      return [];
    }
  }

  init(
    output: OutputCapture,
    path: string,
    feature: firebaseTools_Type.InitFeatureName
  ): RunningCommand<void> {
    return this.electron.runToolsCommand(output, 'fbtools', 'init', [feature], {
      cwd: path,
      interactive: true
    });
  }

  serve(
    output: OutputCapture,
    path: string,
    targets: firebaseTools_Type.InitFeatureName[],
    host = 'localhost',
    port = 5000,
    nodeVersion: 'system' | 'self'
  ): RunningCommand<void> {
    return this.electron.runToolsCommand(
      output,
      'fbtools',
      'serve',
      [],
      {
        cwd: path,
        interactive: true,
        only: targets.join(','),
        host,
        port
      },
      nodeVersion
    );
  }

  private async rcFile(
    workspace: Workspace
  ): Promise<{ [k: string]: any } | null> {
    try {
      const path = this.electron.path.join(workspace.path, '.firebaserc');
      return JSON.parse(await this.electron.fs.promises.readFile(path, 'utf8'));
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

export type FirebaseProject = firebaseTools_Type.FirebaseProject;

// TODO: decide if we want this, and finish it if so
interface Commands {
  init: typeof firebaseTools_Type.init;
}
