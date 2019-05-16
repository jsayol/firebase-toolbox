import { Titlebar, TitlebarOptions, Color } from 'custom-electron-titlebar';
import { BrowserWindow } from 'electron';

const isElectron = window && window.process && window.process.type;

if (isElectron) {
  const options: TitlebarOptions = {
    icon: 'favicon.128x128.png',
    backgroundColor: Color.fromHex('#039BE5')
  };

  const titlebar = new Titlebar(options);

  window.addEventListener('beforeunload', () => {
    titlebar.dispose();
    const win: BrowserWindow = require('electron').remote.getCurrentWindow();
    win.removeAllListeners();
  });
}
