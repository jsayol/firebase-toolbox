import { Component } from '@angular/core';
import { ElectronService } from './providers/electron.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(public electronService: ElectronService) {
    console.log('AppConfig', environment);

    if (!environment.production) {
      if (electronService.isElectron()) {
        console.log('Mode electron');
        console.log('Electron ipcRenderer', electronService.ipcRenderer);
      } else {
        console.log('Mode web');
      }
    }
  }
}
