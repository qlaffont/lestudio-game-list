/**
 * @module preload
 */

export {sha256sum} from './nodeCrypto';
export {versions} from './versions';

import * as ps from 'ps-node';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import uniqBy from 'lodash.uniqby';
import {platform} from 'process';

export const getProcessesList = async (): Promise<{processName: string; windowTitle: string}[]> => {
  if (process.platform === 'win32') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const tasklist = await import('tasklist');

    //Windows
    return uniqBy(
      (
        await tasklist({
          verbose: true,
        })
      )?.map((item: {imageName: string; windowTitle: string}) => ({
        processName: item.imageName,
        windowTitle: item.windowTitle,
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
            resultList?.map(item => ({
              processName: cleanProcessName(getProcessName(item.arguments.join(' '))),
              windowTitle: cleanProcessName(getProcessName(item.arguments.join(' '))) as string,
            })),
            'processName',
          ),
        );
      });
    });
  }
};

const Store = require('electron-store');

const schema = {
  token: {
    type: 'string',
  },
  savedList: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        processName: {type: 'string'},
        windowTitle: {type: 'string'},
        igdbId: {type: 'string'},
        twitchCategoryId: {type: 'string'},
      },
    },
  },
  localList: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        processName: {type: 'string'},
        windowTitle: {type: 'string'},
        igdbId: {type: 'string'},
        twitchCategoryId: {type: 'string'},
      },
    },
  },
};

const store = new Store({schema, clearInvalidConfig: true});

export const getToken = () => store.get('token');
export const saveToken = (value: string) => store.set('token', value);

export const getSavedList = () => store.get('savedList') || [];
export const setSavedList = (
  value: {processName: string; windowTitle: string; igdbId: string; twitchCategoryId: string}[],
) => store.set('savedList', value);

export const getLocalList = () => store.get('localList') || [];
export const addToLocalList = (value: {
  processName: string;
  windowTitle: string;
  igdbId: string;
  twitchCategoryId: string;
}) => store.set('localList', [...getLocalList(), value]);

export const getPlatform = () => platform;
