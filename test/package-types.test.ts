import { poseidonBytes, C7WalletIdentity } from '@neuraiproject/neurai-privacy';
import { decodeC7Address } from '@neuraiproject/neurai-privacy/browser';
import { C7WorkerClient, C6WorkerClient, createWalletServiceRpc } from '@neuraiproject/neurai-privacy/client';
import { startC7PoolWorker, startC6PoolWorker } from '@neuraiproject/neurai-privacy/worker';

const digest: Uint8Array = poseidonBytes(new Uint8Array());
const identity: typeof C7WalletIdentity = C7WalletIdentity;
const decode: typeof decodeC7Address = decodeC7Address;
const client: typeof C7WorkerClient = C6WorkerClient;
const worker: typeof startC7PoolWorker = startC6PoolWorker;
void [digest, identity, decode, client, worker];
void createWalletServiceRpc;
