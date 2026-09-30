/** Runtime configuration shared by the live privacy-library checks. */
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { CliTestBackend, NeuraiPrivacy } from '../src/index.js';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error('Missing ' + name);
  return value;
}

export const repository = required('NEURAI_PRIVACY_REPOSITORY');
const artifacts = required('NEURAI_PRIVACY_ARTIFACTS');
export const work = required('NEURAI_PRIVACY_PRIVATE_WORK');
export const node = required('NEURAI_PRIVACY_NODE');
const manifestSha256 = required('NEURAI_PRIVACY_MANIFEST_SHA256');
const source = required('NEURAI_PRIVACY_SOURCE');
const proverCode = required('NEURAI_PRIVACY_PROVER_CODE');
const rpcModule = required('NEURAI_PRIVACY_RPC_MODULE');
const rpcClass = process.env.NEURAI_PRIVACY_RPC_CLASS || 'DockerRPC';
const python = process.env.NEURAI_PRIVACY_PYTHON || 'python3';
const pythonPath = required('NEURAI_PRIVACY_PYTHONPATH');
let backendEnvironment;
try { backendEnvironment = JSON.parse(process.env.NEURAI_PRIVACY_BACKEND_ENV_JSON || '{}'); }
catch { throw new Error('NEURAI_PRIVACY_BACKEND_ENV_JSON must be a JSON object'); }
if (!backendEnvironment || Array.isArray(backendEnvironment) || typeof backendEnvironment !== 'object' ||
    Object.values(backendEnvironment).some(value => typeof value !== 'string')) {
  throw new Error('NEURAI_PRIVACY_BACKEND_ENV_JSON must contain string environment values');
}
const environment = { ...backendEnvironment, PYTHONPATH: pythonPath };

const rpcCode = `import json,sys
from importlib import import_module
rpc_class = getattr(import_module(sys.argv[1]), sys.argv[2])
with rpc_class(sys.argv[3]) as client:
 print(json.dumps(client(sys.argv[4], *json.loads(sys.argv[5])), default=str))`;

export function rpc(method, params = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(python, ['-c', rpcCode, rpcModule, rpcClass, node, method, JSON.stringify(params)], {
      cwd: repository, env: { ...process.env, ...environment }
    });
    let out = '', err = '';
    child.stdout.on('data', chunk => { out += chunk; });
    child.stderr.on('data', chunk => { err += chunk; });
    child.on('error', reject);
    child.on('close', status => {
      if (status !== 0) return reject(new Error('RPC ' + method + ': ' + err.slice(-400)));
      try { resolve(JSON.parse(out)); } catch (error) { reject(error); }
    });
  });
}

export function walletAt(name, passwordName) {
  const backend = new CliTestBackend({
    repository, artifacts, node, source, proverCode, profile: 'xna', manifestSha256,
    python, environment, wallet: isAbsolute(name) ? name : join(work, name),
    getPassword: async () => (await readFile(work + '/' + passwordName, 'utf8')).trim()
  });
  return new NeuraiPrivacy({ rpc, backend });
}
