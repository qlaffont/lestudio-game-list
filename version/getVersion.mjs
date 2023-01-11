/**
 * Entry function for get app version.
 * In current implementation, it returns `version` from `package.json`, but you can implement any logic here.
 * Runs several times for each vite configs and electNODE_ENVron-builder config.
 * @return {string}
 */

import pkg from '../package.json' assert {type: 'json'};
export function getVersion() {
  const suffix = process.env.NODE_ENV === 'dev' ? `-${process.env.COMMIT_HASH}` : '';
  return `${pkg.version}${suffix}`;
}
