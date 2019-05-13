import {
  Titlebar,
  TitlebarOptions,
  Color,
  Themebar
} from 'custom-electron-titlebar';

const isElectron = window && window.process && window.process.type;

if (isElectron) {
  const options: TitlebarOptions = {
    backgroundColor: Color.fromHex('#039BE5')
  };

  if (process.platform === 'darwin') {
    options.iconsTheme = Themebar.mac;
    options.order = 'first-buttons';
    options.menu = null;
  } else {
    options.icon = 'assets/firebase_96dp.png';
  }

  new Titlebar(options);
}
