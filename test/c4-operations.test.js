import test from 'node:test';
import assert from 'node:assert/strict';
import { BrowserTestIdentity } from '../src/browser-wallet.js';
import { parseRecipient, encodeNzkAddress } from '../src/zk-wallet.js';
import { planC4Operation } from '../src/worker.js';
import { checkPoolCoin, selectPoolCoins, withdrawalScript } from '../src/pool-client.js';
const domain='11'.repeat(32), assetId='22'.repeat(32);
const bytes=s=>Uint8Array.from(Buffer.from(s,'hex'));
const wallet=n=>new BrowserTestIdentity(new Uint8Array(32).fill(n),new Uint8Array(32).fill(n+1),bytes(domain),bytes(assetId),null);

test('C4 distributes 900 XNA to three owners, or four notes including private change',()=>{
  const identities=[1,3,5,7,9].map(wallet);
  const [alice,...others]=identities;
  try {
    const consumed={cm:'ab'.repeat(32),amountAtomic:90000000000n,spent:false};
    const options={identity:alice,scan:{reserveAtomic:consumed.amountAtomic,notes:[consumed]},action:'transfer',note:consumed.cm,pool:{network:'testnet',domain,assetId}};
    const targets=['40000000000','30000000000','20000000000'].map((amountAtomic,i)=>({recipient:others[i].recipient(),amountAtomic}));
    const plan=planC4Operation({...options,recipients:targets});
    assert.equal(plan.form,'T3'); assert.equal(plan.amountAtomic,'90000000000');
    plan.created.forEach((note,i)=>assert.equal(others[i].openRecord(note.record,note.cm).amountAtomic,BigInt(targets[i].amountAtomic)));
    const partial=planC4Operation({...options,recipients:targets.map(x=>({...x,amountAtomic:'10000000000'}))});
    assert.equal(partial.form,'T4');
    assert.equal(alice.openRecord(partial.created[3].record,partial.created[3].cm).amountAtomic,60000000000n);
    assert.throws(()=>others[0].openRecord(partial.created[3].record,partial.created[3].cm));
    const four=others.map(w=>({recipient:w.recipient(),amountAtomic:'22500000000'}));
    assert.equal(planC4Operation({...options,recipients:four}).form,'T4');
    for(const recipients of [[],[...four,four[0]],four.map(x=>({...x,amountAtomic:'1'}))]) assert.throws(()=>planC4Operation({...options,recipients}));
    for(const amountAtomic of ['0','-1','1.5','01','90000000001',90000000000]) assert.throws(()=>planC4Operation({...options,recipients:[{...targets[0],amountAtomic}]}));
    assert.throws(()=>planC4Operation({...options,recipients:[{recipient:{...others[0].recipient(),domain:'33'.repeat(32)},amountAtomic:'1'}]}));
    assert.throws(()=>planC4Operation({...options,scan:{...options.scan,notes:[{...consumed,spent:true}]},recipients:targets}));
  } finally { identities.forEach(w=>w.lock()); }
});

test('C4 checks each funding family and leaves its actual dust threshold as fee change',async()=>{
  const scripts=['76a914'+'11'.repeat(20)+'88ac','5220'+'22'.repeat(32),'5320'+'33'.repeat(32)];
  for(const [i,scriptHex] of scripts.entries()) {
    const coin={txid:'aa'.repeat(32),vout:0,scriptHex,valueSats:'10000'};
    const live={confirmations:1,value:'0.00010000',scriptPubKey:{hex:scriptHex}};
    const rpc=async()=>live;
    await checkPoolCoin(rpc,coin,{profile:'C4'});
    if(i) await assert.rejects(checkPoolCoin(rpc,coin));
    const dust=[546n,3060n,336n][i];
    assert.equal(selectPoolCoins([coin],{profile:'C4',action:'transfer',feeAtomic:10000n-dust}).sponsor,coin);
    assert.throws(()=>selectPoolCoins([coin],{profile:'C4',action:'transfer',feeAtomic:10001n-dust}),/separate confirmed/);
    await assert.rejects(checkPoolCoin(rpc,{...coin,valueSats:'10001'},{profile:'C4'}),/value mismatch/);
    assert.equal(await withdrawalScript(async()=>({isvalid:true,scriptPubKey:scriptHex}),'TEST',{profile:'C4'}),scriptHex);
  }
  for(const scriptHex of ['5120'+'11'.repeat(32),'5420'+'11'.repeat(32),scripts[1]+'75']) {
    await assert.rejects(withdrawalScript(async()=>({isvalid:true,scriptPubKey:scriptHex}),'TEST',{profile:'C4'}));
  }
});


test('C4 object, JSON and nzk recipients share validation and cannot bypass ownership checks',()=>{
  const alice=wallet(11), bob=wallet(13);
  try {
    const pool={network:'testnet',domain,assetId};
    const descriptor=bob.recipient();
    const options={identity:alice,scan:{reserveAtomic:900n,notes:[{cm:'aa'.repeat(32),amountAtomic:900n,spent:false}]},
      action:'transfer',note:'aa'.repeat(32),pool};
    for(const recipient of [descriptor,JSON.stringify(descriptor),encodeNzkAddress(descriptor,'testnet')]) {
      assert.deepEqual(parseRecipient(recipient,pool),descriptor);
      const plan=planC4Operation({...options,recipients:[{recipient,amountAtomic:'900'}]});
      assert.equal(plan.form,'T1');
      assert.equal(bob.openRecord(plan.created[0].record,plan.created[0].cm).amountAtomic,900n);
    }
    for(const override of [{domain:'33'.repeat(32)},{asset_id:'33'.repeat(32)},
      {owner:'00'.repeat(32)},{owner:'ff'.repeat(32)},{view_pub:'00'.repeat(32)},
      {view_pub:'ff'.repeat(32)},{owner:'01'},{view_pub:'not-hex'}]) {
      const bad={...descriptor,...override};
      for(const recipient of [bad,JSON.stringify(bad)]) {
        assert.throws(()=>planC4Operation({...options,recipients:[{recipient,amountAtomic:'1'}]}));
      }
    }
    for(const recipient of [null,undefined,42,[],{},'', '{', 'tnzk1bad',encodeNzkAddress(descriptor,'mainnet')]) {
      assert.throws(()=>planC4Operation({...options,recipients:[{recipient,amountAtomic:'1'}]}));
    }
  } finally {alice.lock();bob.lock();}
});
