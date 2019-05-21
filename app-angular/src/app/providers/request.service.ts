import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { FirebaseToolsService } from './firebase-tools.service';

export interface HalshAlgoConfig {
  hashAlgo: 'SCRYPT' | '';
  hashKey: string;
  saltSeparator: string;
  rounds: number;
  memCost: number;
}

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  constructor(private http: HttpClient, private fb: FirebaseToolsService) {}

  getHttpClient(): HttpClient {
    return this.http;
  }

  async getProjectNumber(projectId: string): Promise<string> {
    const info = await this.http
      .get(
        `https://cloudresourcemanager.googleapis.com/v1beta1/projects/${projectId}`,
        {
          headers: {
            Authorization: 'Bearer ' + (await this.fb.getAccessToken())
          }
        }
      )
      .toPromise();

    return info['projectNumber'];
  }

  async getProjectHashAlgoConfig(projectId: string): Promise<HalshAlgoConfig> {
    const projectNumber = await this.getProjectNumber(projectId);

    const url = 'https://console.firebase.google.com/m/idtoolkit/getconfig';
    const postData = `pid=${projectNumber}&returnAllHashConfig=true`;

    const response = await this.http
      .post(url, postData, {
        responseType: 'text',
        headers: {
          Authorization: 'Bearer ' + (await this.fb.getAccessToken()),
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8'
        }
      })
      .toPromise();

    const json: any = JSON.parse(response.replace(/^\)\]\}'/, '').trim());
    const data: any[] = json[0][1][20][0];

    return {
      hashAlgo: data[1] === 4 ? 'SCRYPT' : '',
      hashKey: data[2],
      saltSeparator: data[4],
      rounds: data[6],
      memCost: data[7]
    };
  }
}
