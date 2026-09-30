import { poseidonBytes, CliTestBackend } from '@neuraiproject/neurai-privacy';
import { scanBrowserPool } from '@neuraiproject/neurai-privacy/browser';
import { PoolWorkerClient } from '@neuraiproject/neurai-privacy/client';
import { startPoolWorker } from '@neuraiproject/neurai-privacy/worker';

const digest: Uint8Array = poseidonBytes(new Uint8Array());
const backend: typeof CliTestBackend = CliTestBackend;
const scanner: typeof scanBrowserPool = scanBrowserPool;
const client: typeof PoolWorkerClient = PoolWorkerClient;
const worker: typeof startPoolWorker = startPoolWorker;
void [digest, backend, scanner, client, worker];
