import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { startWith, tap, map } from 'rxjs/operators';

import {
  ElectronService,
  OutputCapture,
  RunningCommand
} from './electron.service';
import { CLI_CLIENT_ID, CLI_CLIENT_SECRET } from '../../utils';

// IMPORTANT: These imports should only be used for types!
import * as Configstore_Type from 'configstore';
import * as firebaseTools_Type from 'firebase-tools';
import { GoogleApis } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

@Injectable({
  providedIn: 'root'
})
export class FirebaseToolsService {
  readonly tools: typeof firebaseTools_Type;
  private configstore: Configstore_Type;
  private google: GoogleApis;
  private oauth2Client: OAuth2Client;
  private databaseInstances: {
    [path: string]: firebaseTools_Type.DatabaseInstance[];
  } = {};

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

  async readRcFile(workspace: Workspace): Promise<{ [k: string]: any } | null> {
    try {
      const path = this.electron.path.join(workspace.path, '.firebaserc');
      return JSON.parse(await this.electron.fs.promises.readFile(path, 'utf8'));
    } catch (err) {
      // Either ".firebaserc" doesn't exist or is corrupted
      return null;
    }
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

        const rc = await this.readRcFile(workspace);
        if (rc && contains(rc, 'projects') && contains(rc.projects, name)) {
          workspace.projectId = rc.projects[name];
        }

        return workspace;
      })
    );

    return workspaces.filter(workspace => !!workspace);
  }

  removeWorkspace(workspace: Workspace): void {
    const activeProjects = (this.configstore.get('activeProjects') || {}) as {
      [path: string]: string;
    };
    activeProjects[workspace.path] = undefined;
    this.configstore.set('activeProjects', activeProjects);
  }

  getProjects(): Promise<FirebaseProject[]> {
    return this.tools.list();
  }

  async getWorkspaceProjects(
    workspace: Workspace
  ): Promise<Array<{ id: string; alias: string }>> {
    const rc = await this.readRcFile(workspace);

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

    if (!hasActiveProject && workspace.projectId !== null) {
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

  isWorkspaceInitialized(workspace: Workspace): boolean {
    try {
      const stat = this.electron.fs.statSync(
        this.electron.path.join(workspace.path, 'firebase.json')
      );
      return stat.isFile();
    } catch (err) {
      return false;
    }
  }

  async getAccessToken(): Promise<string> {
    const response = await this.oauth2Client.getAccessToken();
    return response.token;
  }

  getDatabaseInstances(
    workspace: Workspace,
    skipCache = false
  ): Observable<firebaseTools_Type.DatabaseInstance[]> {
    return from(
      this.tools.database.instances.list({ cwd: workspace.path })
    ).pipe(
      map(instances => {
        // Sort default instance at the top, and then by name
        return instances.sort((a, b) => {
          if (a.type === b.type) {
            return a.instance < b.instance ? -1 : 1;
          }
          return a.type === 'DEFAULT_REALTIME_DATABASE' ? -1 : 1;
        });
      }),
      tap(instances => {
        this.databaseInstances[workspace.projectId] = instances;
      }),
      startWith(
        skipCache ? null : this.databaseInstances[workspace.projectId] || null
      )
    );
  }

  init(
    output: OutputCapture,
    workspace: Workspace,
    feature: firebaseTools_Type.InitFeatureName
  ): RunningCommand<void> {
    return this.electron.runToolsCommand(output, 'init', [feature], {
      cwd: workspace.path,
      project: workspace.projectId,
      interactive: true
    });
  }

  serve(
    output: OutputCapture,
    workspace: Workspace,
    targets: firebaseTools_Type.InitFeatureName[],
    host = 'localhost',
    port = 5000,
    nodeVersion: 'system' | 'self'
  ): RunningCommand<void> {
    return this.electron.runToolsCommand(
      output,
      'serve',
      [],
      {
        cwd: workspace.path,
        project: workspace.projectId,
        interactive: true,
        only: targets.join(','),
        host,
        port
      },
      { nodeVersion }
    );
  }

  databaseProfile(
    output: OutputCapture,
    workspace: Workspace,
    options: firebaseTools_Type.DatabaseProfileOptions = {}
  ): RunningCommand<any> {
    return this.electron.runToolsCommand(output, 'database.profile', [], {
      cwd: workspace.path,
      project: workspace.projectId,
      interactive: true,
      ...options
    });
  }

  firestoreDelete(
    output: OutputCapture,
    workspace: Workspace,
    firestorePath: string,
    options: firebaseTools_Type.FirestoreDeleteOptions = {}
  ): RunningCommand<void> {
    return this.electron.runToolsCommand(
      output,
      'firestore.delete',
      [firestorePath],
      {
        cwd: workspace.path,
        project: workspace.projectId,
        interactive: true,
        ...options
      }
    );
  }

  firestoreIndexes(
    output: OutputCapture,
    workspace: Workspace,
    options: firebaseTools_Type.FirestoreIndexesOptions = {}
  ): RunningCommand<void> {
    return this.electron.runToolsCommand(output, 'firestore.indexes', [], {
      cwd: workspace.path,
      project: workspace.projectId,
      interactive: true,
      ...options
    });
  }

  functionsDelete(
    output: OutputCapture,
    workspace: Workspace,
    filters: string[],
    options: firebaseTools_Type.FunctionsDeleteOptions = {}
  ): RunningCommand<void> {
    return this.electron.runToolsCommand(output, 'functions.delete', [filters], {
      cwd: workspace.path,
      project: workspace.projectId,
      interactive: true,
      ...options
    });
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
  isBeingAdded?: boolean;
}

function contains(obj: { [k: string]: any }, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export type FirebaseProject = firebaseTools_Type.FirebaseProject;

// TODO: decide if we want this, and finish it if so
interface Commands {
  init: typeof firebaseTools_Type.init;
}
