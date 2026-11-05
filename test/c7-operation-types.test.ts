import {createC7OperationWallet,type C7DepositRequest,type C7TransferRequest,type C7WithdrawalRequest} from '../src/browser.js';
const wallet=createC7OperationWallet({expectedGenesis:'11'.repeat(32),expectedCommitment:'22'.repeat(32)});
wallet.prepareDeposit({} as C7DepositRequest);
wallet.prepareTransfer({} as C7TransferRequest);
wallet.prepareWithdrawal({} as C7WithdrawalRequest);
// @ts-expect-error Application-pinned instance identifiers are required.
createC7OperationWallet();
const transfer={} as C7TransferRequest;
// @ts-expect-error Change is Boolean, never a script-number truthy value.
wallet.prepareTransfer({...transfer,outputs:[{amountAtomic:'1',isChange:2}]});
// @ts-expect-error A C7 transfer needs the address of the spent note for its change.
wallet.prepareTransfer({...transfer,change:undefined});
import {startC7PoolWorker,startC6PoolWorker,scanC7Pool} from '../src/worker.js';
void scanC7Pool;void startC6PoolWorker;
// @ts-expect-error A reviewed deployment, artifact pins and journal are mandatory.
startC7PoolWorker({});
