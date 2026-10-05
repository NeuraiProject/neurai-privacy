/* Canonical ordinary-asset transfers for the reviewed C6 TEST contract.
 * Asset outputs carry no XNA; a separate transparent sponsor pays the fee.
 * Ownership, restricted and DePIN tokens require different authorization rules.
 */
const hex=b=>Array.from(b,v=>v.toString(16).padStart(2,'0')).join('');
const text=s=>new TextEncoder().encode(s);
const MAX=2100000000000000000n;
const need=(ok,msg)=>{if(!ok)throw Error('C6 asset: '+msg);};
export function c6AssetMetadata(manifest){
 need(manifest?.profile==='C6-ORDINARY-ASSET-TEST-J2-v1','ordinary asset profile');
 const name=manifest.asset;
 need(typeof name==='string'&&/^[A-Z0-9_.\/]+(?:#[A-Za-z0-9_.@-]+)?$/.test(name)&&text(name).length<=64,'ordinary asset name');
 need(Number.isInteger(manifest.units)&&manifest.units>=0&&manifest.units<=8,'asset precision');
 const unit=10n**BigInt(8-manifest.units);
 need(String(manifest.unit)===String(unit)&&String(manifest.private_fee)==='0'&&manifest.sponsor_index===2,'asset denomination/fee policy');
 return {name,unit,units:manifest.units};
}
export function c6NativeDestination(script){
 need(script instanceof Uint8Array&&((script.length===25&&hex(script.slice(0,3))==='76a914'&&hex(script.slice(-2))==='88ac')||(script.length===34&&[82,83].includes(script[0])&&script[1]===32)),'Legacy or strict PQ/ECDSA destination');
 return script;
}
export function c6AssetTransferScript(destination,asset,amountAtomic,{allowContract=false}={}){
 if(!(allowContract&&destination.length===34&&destination[0]===81&&destination[1]===32))c6NativeDestination(destination);c6AssetMetadata({profile:'C6-ORDINARY-ASSET-TEST-J2-v1',asset,units:8,unit:'1',private_fee:0,sponsor_index:2});
 const name=text(asset);let n=BigInt(amountAtomic);need(n>0n&&n<=MAX,'quantity range');
 const payload=new Uint8Array(5+name.length+8);payload.set(text('xnat'));payload[4]=name.length;payload.set(name,5);
 for(let i=0;i<8;i++,n>>=8n)payload[5+name.length+i]=Number(n&255n);
 const push=payload.length<=75?Uint8Array.of(payload.length):Uint8Array.of(76,payload.length);
 const out=new Uint8Array(destination.length+1+push.length+payload.length+1);let at=0;
 for(const part of [destination,Uint8Array.of(192),push,payload,Uint8Array.of(117)]){out.set(part,at);at+=part.length;}return out;
}
export function c6ReadAssetTransfer(script,{asset,unit='1',allowContract=false}={}){
 need(script instanceof Uint8Array,'transfer bytes');const at=script[0]===118?25:34;
 const dest=script.slice(0,at);
 if(allowContract&&dest.length===34&&dest[0]===81&&dest[1]===32){}else c6NativeDestination(dest);
 need(script[at]===192,'asset suffix');let pos=at+1,size=script[pos++];
 if(size===76){size=script[pos++];need(size>75,'minimal payload push');}else need(size<=75,'bounded payload push');
 const payload=script.slice(pos,pos+size);need(pos+size+1===script.length&&script.at(-1)===117&&hex(payload.slice(0,4))==='786e6174','exact transfer framing');
 const len=payload[4];need(len>0&&len<=64&&payload.length===5+len+8,'exact name/quantity payload');
 const name=new TextDecoder('utf-8',{fatal:true}).decode(payload.slice(5,5+len));need(asset===undefined||name===asset,'wrong asset');
 c6AssetMetadata({profile:'C6-ORDINARY-ASSET-TEST-J2-v1',asset:name,units:8,unit:'1',private_fee:0,sponsor_index:2});
 let amount=0n;for(let i=7;i>=0;i--)amount=(amount<<8n)|BigInt(payload[5+len+i]);
 need(amount>0n&&amount<=MAX&&amount%BigInt(unit)===0n,'asset quantity/precision');return {asset:name,amountAtomic:String(amount),destination:dest};
}
export function parseAssetAmount(value,units){
 need(Number.isInteger(units)&&units>=0&&units<=8,'precision');
 need(typeof value==='string'&&/^(0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(value),'exact decimal quantity');
 const [whole,fraction='']=value.split('.');need(fraction.length<=units,'too many asset decimals');
 const n=BigInt(whole)*100000000n+BigInt((fraction+'0'.repeat(8)).slice(0,8));need(n>0n&&n<=MAX,'quantity range');return n;
}
