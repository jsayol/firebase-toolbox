import { Component, OnInit } from '@angular/core';
import { ElectronService } from './providers/electron.service';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    public electronService: ElectronService,
    private translate: TranslateService
  ) {
    translate.setDefaultLang('en');
    console.log('AppConfig', environment);

    if (!environment.production) {
      if (electronService.isElectron()) {
        console.log('Mode electron');
        console.log('Electron ipcRenderer', electronService.ipcRenderer);
        console.log('NodeJS childProcess', electronService.childProcess);
      } else {
        console.log('Mode web');
      }
    }
  }

  ngOnInit(): void {
    document.querySelector('#bootanim').classList.add('is-destroying');
    setTimeout(() => document.querySelector('#bootanim').remove(), 0);
  }
}
