/**
 * Entry function for get app version.
 * In current implementation, it returns `version` from `package.json`, but you can implement any logic here.
 * Runs several times for each vite configs and electNODE_ENVron-builder config.
 * @return {string}
 */

import {version} from '../package.json';
export function getVersion() {
  const suffix = process.env.NODE_ENV === 'dev' ? `-${Date.now()}` : '';
  return `${version}${suffix}`;
}
