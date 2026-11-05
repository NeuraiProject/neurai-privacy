import {createC7JoinWallet,createC6JoinWallet,type C7JoinRequest,type C6JoinRequest} from '../src/browser.js';
import {createC7JoinWallet as workerFactory} from '../src/worker.js';
const wallet=createC7JoinWallet({expectedGenesis:'11'.repeat(32),expectedCommitment:'22'.repeat(32)});
const request={} as C7JoinRequest;
const prepared=wallet.prepare(request);
const privateInputs:Record<string,unknown>=prepared.input;
// @ts-expect-error Independent instance pins are required.
createC7JoinWallet();
// @ts-expect-error Two real notes, not an optional input array.
wallet.prepare({...request,notes:[]});
// @ts-expect-error The joined note needs the address of note 0.
wallet.prepare({...request,change:undefined});
// @ts-expect-error C7 pools hold XNA only.
createC7JoinWallet({expectedGenesis:'11'.repeat(32),expectedCommitment:'22'.repeat(32),kind:'asset'});
const worker=workerFactory({expectedGenesis:'11'.repeat(32),expectedCommitment:'22'.repeat(32)});
// The deprecated names are the same function and type.
const same:typeof createC7JoinWallet=createC6JoinWallet;const old:C6JoinRequest=request;
void privateInputs;void worker;void same;void old;
