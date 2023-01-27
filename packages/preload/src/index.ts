/**
 * @module preload
 */

export {sha256sum} from './nodeCrypto';
export {versions} from './versions';
import {platform} from 'process';

const Store = require('electron-store');

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

export const getToken = () => store.get('token');
export const saveToken = (value: string) => store.set('token', value);

export const getNotFoundAction = () => store.get('notFoundAction');
export const saveNotFoundAction = (value: string) => store.set('notFoundAction', value);

export const getPlatform = () => platform;

import {ipcRenderer} from 'electron';

export const getCurrentVersion = async () => {
  return ipcRenderer.invoke('get-version');
};

export const getOnBoot = async () => {
  return store.get('startOnBoot');
};

export const toggleBoot = async () => {
  const newValue = (await store.get('startOnBoot')) ? false : true;
  store.set('startOnBoot', newValue);
  return ipcRenderer.invoke('toggle-boot', newValue);
};

export const onUpdate = async (callback: (version: string) => void) => {
  return ipcRenderer.on('update_downloaded', (event, version: string) => {
    callback(version);
  });
};

export const getSavedList = async () => {
  return ipcRenderer.invoke('get-saved-list');
};

export const setSavedList = async (data: unknown[]) => {
  await ipcRenderer.invoke('set-saved-list', data);
};

export const getLocalList = async () => {
  return ipcRenderer.invoke('get-local-list');
};

export const addToLocalList = async (data: unknown) => {
  const list = await getLocalList();

  await ipcRenderer.invoke('set-local-list', [...list, data]);
};

export const getProcessesList = async () => {
  return ipcRenderer.invoke('get-processes-list');
};

export const onNewGame = async (
  callback: (game: {id: string; name: string; box_art_url: string; processName: string}) => void,
) => {
  return ipcRenderer.on('current-game', (event, game) => {
    callback(game);
  });
};
