import {BrowserWindow} from 'electron';
import {app, ipcMain, Tray} from 'electron';
import './security-restrictions';
import {restoreOrCreateWindow} from '/@/mainWindow';
import {autoUpdater} from 'electron-updater';
/**
 * Prevent electron from running multiple instances.
 */
const isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
  app.quit();
  process.exit(0);
}
app.on('second-instance', restoreOrCreateWindow);

/**
 * Disable Hardware Acceleration to save more system resources.
 */
app.disableHardwareAcceleration();

/**
 * Shout down background process if all windows was closed
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * @see https://www.electronjs.org/docs/latest/api/app#event-activate-macos Event: 'activate'.
 */
app.on('activate', restoreOrCreateWindow);

/**
 * Create the application window when the background process is ready.
 */
app
  .whenReady()
  .then(restoreOrCreateWindow)
  .catch(e => console.error('Failed create window:', e));

app.whenReady().then(() => {
  const filepath = require('path').join(__dirname, 'favicon.png');
  const tray = new Tray(filepath);

  // Call this to modify the context menu
  // const contextMenu = Menu.buildFromTemplate([]);
  // tray.setContextMenu(contextMenu);
  tray.setToolTip(
    `${app.name} - ${`${app.getVersion()}${!import.meta.env.VITE_AUTO_UPDATE ? '-DEV' : ''}`}`,
  );

  tray.on('double-click', () => {
    restoreOrCreateWindow();
  });
});

/**
 * Install Vue.js or any other extension in development mode only.
 * Note: You must install `electron-devtools-installer` manually
 */
// if (import.meta.env.DEV) {
//   app.whenReady()
//     .then(() => import('electron-devtools-installer'))
//     .then(({default: installExtension, VUEJS3_DEVTOOLS}) => installExtension(VUEJS3_DEVTOOLS, {
//       loadExtensionOptions: {
//         allowFileAccess: true,
//       },
//     }))
//     .catch(e => console.error('Failed install extension:', e));
// }

/**
 * Check for new version of the application - production mode only.
 */
if (import.meta.env.VITE_AUTO_UPDATE) {
  console.log('Auto Update started...');
  app
    .whenReady()
    .then(async () => {
      await autoUpdater.checkForUpdatesAndNotify();

      autoUpdater.on('update-downloaded', () => {
        const w = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());

        w!.webContents.send('update_downloaded');
      });
    })
    .catch(e => console.error('Failed check updates:', e));
}

const Store = require('electron-store');

Store.initRenderer();

ipcMain.handle('get-version', () => {
  return `${app.getVersion()}${!import.meta.env.VITE_AUTO_UPDATE ? '-DEV' : ''}`;
});

const AutoLaunch = require('auto-launch');
ipcMain.handle('toggle-boot', (event, value: boolean) => {
  const autoLaunch = new AutoLaunch({
    name: 'LeStudioGameList',
    path: app.getPath('exe'),
  });

  if (value) {
    autoLaunch.enable();
  } else {
    autoLaunch.disable();
  }
});
