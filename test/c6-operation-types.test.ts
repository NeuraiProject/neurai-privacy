import {createC6OperationWallet,type C6DepositRequest,type C6TransferRequest,type C6WithdrawalRequest} from '../src/browser.js';
const wallet=createC6OperationWallet({expectedGenesis:'11'.repeat(32),expectedCommitment:'22'.repeat(32)});
wallet.prepareDeposit({} as C6DepositRequest);
wallet.prepareTransfer({} as C6TransferRequest);
wallet.prepareWithdrawal({} as C6WithdrawalRequest);
// @ts-expect-error Application-pinned instance identifiers are required.
createC6OperationWallet();
const transfer={} as C6TransferRequest;
// @ts-expect-error Change is Boolean, never a script-number truthy value.
wallet.prepareTransfer({...transfer,outputs:[{amountAtomic:'1',isChange:2}]});
import {startC6PoolWorker,scanC6Pool} from '../src/worker.js';
void scanC6Pool;
// @ts-expect-error A reviewed deployment, artifact pins and journal are mandatory.
startC6PoolWorker({});
