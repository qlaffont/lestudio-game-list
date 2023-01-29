/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import {BrowserWindow} from 'electron';
import {app, ipcMain, Tray} from 'electron';
import './security-restrictions';
import {restoreOrCreateWindow} from '/@/mainWindow';
import {autoUpdater} from 'electron-updater';
import {join} from 'path';
import {existsSync, readFileSync, mkdirSync, writeFileSync} from 'fs';
import * as ps from 'ps-node';
//@ts-ignore
import uniqBy from 'lodash.uniqby';
//@ts-ignore
import tasklist from 'tasklist';
//@ts-ignore
import fetch from 'node-fetch';
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
  const filepath = join(__dirname, 'favicon.png');
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
//   app.whenReady()event
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

      autoUpdater.on('update-downloaded', ({version}) => {
        const w = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());

        w!.webContents.send('update_downloaded', version);

        if (process.platform === 'win32') {
          setTimeout(() => {
            autoUpdater.quitAndInstall();
          }, 5000);
        }
      });
    })
    .catch(e => console.error('Failed check updates:', e));
}

const Store = require('electron-store');

Store.initRenderer();
const schema = {
  token: {
    type: 'string',
  },
  notFoundAction: {
    type: 'string',
  },
  startOnBoot: {
    type: 'boolean',
  },
};

const store = new Store({schema, clearInvalidConfig: true});

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

//Store logic for list
const userConfigPathFolder = join(app.getPath('documents'), 'LeStudioGameList');
const savedListPath = join(userConfigPathFolder, 'savedList.json');
const localListPath = join(userConfigPathFolder, 'localList.json');

//Check if folder & files don't exist
if (!existsSync(userConfigPathFolder)) {
  mkdirSync(userConfigPathFolder);
}
if (!existsSync(savedListPath)) {
  writeFileSync(savedListPath, JSON.stringify([]), {encoding: 'utf-8'});
}
if (!existsSync(localListPath)) {
  writeFileSync(localListPath, JSON.stringify([]), {encoding: 'utf-8'});
}
const getSavedList = () => {
  return JSON.parse(readFileSync(savedListPath, {encoding: 'utf-8'}));
};
ipcMain.handle('get-saved-list', async () => {
  return getSavedList();
});

ipcMain.handle('set-saved-list', async (event, data: unknown[]) => {
  writeFileSync(savedListPath, JSON.stringify(data), {encoding: 'utf-8'});
});

const getLocalList = () => {
  return JSON.parse(readFileSync(localListPath, {encoding: 'utf-8'}));
};
ipcMain.handle('get-local-list', async () => {
  return getLocalList();
});

ipcMain.handle('set-local-list', async (event, data: unknown[]) => {
  writeFileSync(localListPath, JSON.stringify(data), {encoding: 'utf-8'});
});

// Game Detection logic
const API_BASE = 'https://api.lestudio.qlaffont.com';

let processesList: {
  processName: string;
  windowTitle: string;
}[] = [];
const getProcessesList = async (): Promise<{processName: string; windowTitle: string}[]> => {
  if (process.platform === 'win32') {
    //Windows
    return uniqBy(
      (await tasklist())?.map((item: {imageName: string; windowTitle: string}) => ({
        processName: item.imageName,
        windowTitle: item.imageName,
      })),
      'processName',
    );
  } else {
    //Linux / Mac

    const getProcessName = (command: string) => {
      if (command.startsWith('/Applications/')) {
        const split = command.replace('/Applications/', '').split('/');

        const containApp = split.find(s => s.includes('.app'));

        if (containApp) {
          return split[0] as string;
        } else {
          return command as string;
        }
      }

      return command.split('/').pop() as string;
    };

    const cleanProcessName = (processName: string) => {
      return processName.trim().split('--')[0].trim().split(' -')[0];
    };

    return new Promise((resolve, reject) => {
      ps.lookup({}, (err: Error, resultList: {arguments: string[]}[]) => {
        if (err) {
          reject(err);
        }

        resolve(
          uniqBy(
            resultList
              ?.map(item => {
                return {
                  processName: cleanProcessName(
                    getProcessName((item?.arguments || ['']).join(' ')),
                  ),
                  windowTitle: cleanProcessName(
                    getProcessName((item?.arguments || ['']).join(' ')),
                  ) as string,
                };
              })
              ?.filter(v => v.processName?.length !== 0),
            'processName',
          ),
        );
      });
    });
  }
};
ipcMain.handle('get-processes-list', async () => {
  return processesList;
});

let lastGame: any = {processName: 'Fake to force send new game on boot'};

const updateGame = async () => {
  const token = store.get('token');
  const notFoundAction = store.get('notFoundAction');

  if (token && token?.length > 0) {
    const list = [...getLocalList(), ...getSavedList()];
    processesList = await getProcessesList();

    const detectedGame = list.find(({processName, windowTitle}) =>
      processesList.find(
        process => process.processName === processName || process.windowTitle === windowTitle,
      ),
    );

    if (detectedGame?.processName !== lastGame?.processName) {
      lastGame = detectedGame;

      if (detectedGame) {
        const res = await fetch(
          `${API_BASE}/twitch/games/${detectedGame.twitchCategoryId}?token=${token}`,
          {cache: 'reload'},
        );

        const game = (await res.json()).data.getTwitchGameFromId;

        if (game) {
          await fetch(`${API_BASE}/twitch/games?twitchCategoryId=${game.id}&token=${token}`, {
            method: 'POST',
          });

          const w = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());

          w &&
            w!.webContents.send('current-game', {...game, processName: detectedGame.processName});
        } else {
          const w = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());

          w && w!.webContents.send('current-game', undefined);
          if (notFoundAction === 'clear') {
            await fetch(`${API_BASE}/twitch/games?twitchCategoryId=undefined&token=${token}`, {
              method: 'POST',
            });
          }
          if (notFoundAction === 'justchatting') {
            await fetch(`${API_BASE}/twitch/games?twitchCategoryId=509658&token=${token}`, {
              method: 'POST',
            });
          }
        }
      } else {
        const w = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());

        w && w!.webContents.send('current-game', undefined);
        if (notFoundAction === 'clear') {
          await fetch(`${API_BASE}/twitch/games?twitchCategoryId=undefined&token=${token}`, {
            method: 'POST',
          });
        }
        if (notFoundAction === 'justchatting') {
          await fetch(`${API_BASE}/twitch/games?twitchCategoryId=509658&token=${token}`, {
            method: 'POST',
          });
        }
      }
    }
  }

  setTimeout(() => {
    updateGame();
  }, 10000);
};

updateGame();
