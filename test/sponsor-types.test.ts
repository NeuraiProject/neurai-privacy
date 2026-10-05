import { SponsorJournal, IndexedDbSponsorStore, prepareSponsorSweep, type SponsorOffer, type SponsorSnapshot } from '../src/client.js';
const offer: SponsorOffer = { outpoint: '00'.repeat(32)+':0', inputAtomic: '100000000', changeAtomic: '90000000', inputScript: '', changeScript: '', index: 2, sighash: 131 };
const store = new IndexedDbSponsorStore();
const journal = new SponsorJournal({ store, genesis: '00'.repeat(32), walletId: '11'.repeat(32), budgetAtomic: '30000000' });
async function compileOnly() {
  const s: SponsorSnapshot = await journal.initialize();
  await journal.reserveOperation({ operationId: '22'.repeat(32), budgetAtomic: '10000000', notes: [{ cm: '33'.repeat(32), nf: '44'.repeat(32) }] });
  await journal.signAuthorization('22'.repeat(32), offer, { rpc: async () => null, sign: async ({ hashType }) => String(hashType) });
  const sweep = prepareSponsorSweep(offer, '1000');
  // @ts-expect-error Exact integer strings are required, never floats.
  prepareSponsorSweep(offer, 0.001);
  // @ts-expect-error Atomic CAS is required, localStorage is not accepted.
  new SponsorJournal({ store: localStorage, genesis: '', walletId: '', budgetAtomic: '1' });
  void s; void sweep;
}
void compileOnly;

async function restoreOnly(){ await journal.restore(await journal.export()); }
void restoreOnly;
