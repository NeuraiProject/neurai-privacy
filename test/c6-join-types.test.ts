import {createC6JoinWallet,type C6JoinRequest} from '../src/browser.js';
import {createC6JoinWallet as workerFactory} from '../src/worker.js';
const wallet=createC6JoinWallet({expectedGenesis:'11'.repeat(32),expectedCommitment:'22'.repeat(32)});
const request={} as C6JoinRequest;
const prepared=wallet.prepare(request);
const privateInputs:Record<string,unknown>=prepared.input;
// @ts-expect-error Independent instance pins are required.
createC6JoinWallet();
// @ts-expect-error Two real notes, not an optional input array.
wallet.prepare({...request,notes:[]});
const worker=workerFactory({expectedGenesis:'11'.repeat(32),expectedCommitment:'22'.repeat(32)});
void privateInputs;void worker;
