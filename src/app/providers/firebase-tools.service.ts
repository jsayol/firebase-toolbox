import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';
import { HttpClient } from '@angular/common/http';

// Only used for types!
import * as path from 'path';
import { promises as fs } from 'fs';
import * as Configstore from 'configstore';
import * as firebaseTools from 'firebase-tools';
import { GoogleApis, plus_v1 } from 'googleapis';
import { OAuth2Client } from 'googleapis/node_modules/google-auth-library';

const CLI_CLIENT_ID =
  '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

@Injectable({
  providedIn: 'root'
})
export class FirebaseToolsService {
  private path: typeof path;
  private fs: typeof fs;
  private fb: typeof firebaseTools;
  private configstore: Configstore;
  private google: GoogleApis;
  private oauth2Client: OAuth2Client;
  private googlePlus: plus_v1.Plus;

  constructor(private electron: ElectronService, private http: HttpClient) {
    const Configstore = this.electron.remote.require('configstore');
    this.path = this.electron.remote.require('path');
    this.fs = this.electron.remote.require('fs').promises;
    this.fb = this.electron.remote.require('firebase-tools');
    this.google = this.electron.remote.require('googleapis').google;

    this.googlePlus = this.google.plus({ version: 'v1' });
    this.configstore = new Configstore('firebase-tools');
    this.oauth2Client = new this.google.auth.OAuth2(
      CLI_CLIENT_ID,
      CLI_CLIENT_SECRET
    ) as any;
  }

  getUser(): Promise<UserInfo | null> {
    return new Promise<UserInfo | null>((resolve, reject) => {
      const user = this.configstore.get('user') as firebaseTools.AccountUser;
      if (user) {
        const tokens = this.configstore.get(
          'tokens'
        ) as firebaseTools.AccountTokens;
        this.oauth2Client.setCredentials(tokens);
        this.googlePlus.people.get(
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
                email: user.email,
                displayName: response.data.displayName,
                imageUrl: response.data.image.url
              });
            }
          }
        );
      } else {
        resolve(null);
      }
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
          alias: name
        };

        try {
          const rcPath = this.path.join(path, '.firebaserc');
          const rc = JSON.parse(await fs.readFile(rcPath, 'utf8'));
          if (contains(rc, 'projects') && contains(rc.projects, name)) {
            workspace.projectId = rc.projects[name];
          }
        } catch (err) {
          // Either ".firebaserc" doesn't exists or is incorrect. No problem.
        }

        return workspace;
      })
    );

    return workspaces.filter(workspace => !!workspace);
  }

  getProjects(): Promise<FirebaseProject[]> {
    return this.fb.list();
  }
}

export interface UserInfo {
  email: string;
  displayName: string;
  imageUrl: string;
}

export interface Workspace {
  path: string;
  projectId: string;
  alias: string;
}

function contains(obj: { [k: string]: any }, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export type FirebaseProject = firebaseTools.FirebaseProject;
