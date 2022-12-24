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

    return new Promise((resolve, reject) => {
      ps.lookup({}, (err: Error, resultList: {arguments: string[]}[]) => {
        if (err) {
          reject(err);
        }

        resolve(
          uniqBy(
            resultList?.map(item => ({
              processName: item.arguments[0].split('/').pop() as string,
              windowTitle: item.arguments[0].split('/').pop() as string,
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

const store = new Store({schema});

export const getToken = () => store.get('token');
export const saveToken = (value: string) => store.set('token', value);

export const getSavedList = () => store.get('savedList');
export const setSavedList = (value: {processName: string; windowTitle: string; igdbId: string}[]) =>
  store.set('savedList', value);
