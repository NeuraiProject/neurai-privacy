import privacy = require('@neuraiproject/neurai-privacy');

const digest: Uint8Array = privacy.poseidonBytes(new Uint8Array());
const backend: typeof privacy.CliTestBackend = privacy.CliTestBackend;
// Exports re-exported from the client and worker declarations are typed too.
const amount: bigint = privacy.parseXna('1');
const client: typeof privacy.PoolWorkerClient = privacy.PoolWorkerClient;
const worker: typeof privacy.startPoolWorker = privacy.startPoolWorker;
void [digest, backend, amount, client, worker];
