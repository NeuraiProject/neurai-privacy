import privacy = require('@neuraiproject/neurai-privacy');

const digest: Uint8Array = privacy.poseidonBytes(new Uint8Array());
const identity: typeof privacy.C7WalletIdentity = privacy.C7WalletIdentity;
// Exports re-exported from the client and worker declarations are typed too.
const amount: bigint = privacy.parseXna('1');
const client: typeof privacy.C7WorkerClient = privacy.C6WorkerClient;
const worker: typeof privacy.startC7PoolWorker = privacy.startC6PoolWorker;
void [digest, identity, amount, client, worker];
