/**
 * @module preload
 */

export {sha256sum} from './nodeCrypto';
export {versions} from './versions';

import * as ps from 'ps-node';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import tasklist from 'tasklist';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import uniqBy from 'lodash.uniqby';

export const getProcessesList = async (): Promise<{processName: string; windowTitle: string}[]> => {
  if (process.platform === 'win32') {
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
          return split[0];
        } else {
          return command;
        }
      }

      return command.split('/').pop();
    };

    return new Promise((resolve, reject) => {
      ps.lookup({}, (err: Error, resultList: {arguments: string[]}[]) => {
        if (err) {
          reject(err);
        }

        resolve(
          uniqBy(
            resultList?.map(item => ({
              processName: getProcessName(item.arguments.join(' ')),
              windowTitle: getProcessName(item.arguments.join(' ')) as string,
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
      },
    },
  },
};

const store = new Store({schema, clearInvalidConfig: true});

export const getToken = () => store.get('token');
export const saveToken = (value: string) => store.set('token', value);

export const getSavedList = () => store.get('savedList');
export const setSavedList = (value: {processName: string; windowTitle: string; igdbId: string}[]) =>
  store.set('savedList', value);
