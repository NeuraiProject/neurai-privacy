#!/usr/bin/env python3
"""Independent TEST-only NeuraiZK/v2 vectors. No production JS imports.

Requires argon2-cffi and cryptography. Default mode checks frozen vectors;
--write is only for creating/reviewing a new specification's fixture.
All inputs are public TEST data. Never supply real wallet secrets here.
"""
import argparse
import hashlib
import hmac
import json
import struct
import unicodedata
from pathlib import Path
from argon2.low_level import hash_secret_raw, Type
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey
from cryptography.hazmat.primitives import serialization

BASE = Path(__file__).resolve().parent.parent
FIX = BASE / 'test/fixtures'
FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617
CONSTANTS = json.loads((FIX / 'nzk-poseidon.json').read_text())
RC = list(map(int, CONSTANTS['POSEIDON_RC']))
MDS = list(map(int, CONSTANTS['POSEIDON_MDS']))
assert len(RC) == 195 and len(MDS) == 9

def sha(b): return hashlib.sha256(b).digest()
def mac(k, m): return hmac.digest(k, m, 'sha256')
def u32(n): return struct.pack('<I', n)
def norm(s): return unicodedata.normalize('NFKD', s).encode()
def label(s): return b'NeuraiZK/v2/' + s.encode()

def poseidon(data):
    data += b'\x01'
    data += bytes((-len(data)) % 31)
    chunks = [int.from_bytes(data[i:i+31], 'big') for i in range(0,len(data),31)]
    state = [0, 0, 0]
    for i in range(0, len(chunks), 2):
        for j, value in enumerate(chunks[i:i+2]): state[j] = (state[j] + value) % FIELD
        for r in range(65):
            t = [(state[j] + RC[3*r+j]) % FIELD for j in range(3)]
            for j in range(3):
                if r < 4 or r >= 61 or j == 0: t[j] = pow(t[j],5,FIELD)
            state = [sum(MDS[row*3+j]*t[j] for j in range(3)) % FIELD for row in range(3)]
    return state[0].to_bytes(32,'big')

def bech(hrp, payload):
    bits = ''.join(f'{b:08b}' for b in payload)
    bits += '0' * (-len(bits) % 5)
    words = [int(bits[i:i+5],2) for i in range(0,len(bits),5)]
    values = [ord(c)>>5 for c in hrp]+[0]+[ord(c)&31 for c in hrp]+words+[0]*6
    chk=1
    for v in values:
        top=chk>>25
        chk=((chk&0x1ffffff)<<5)^v
        for j,g in enumerate([0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3]):
            if top>>j&1: chk^=g
    chk^=0x2bc830a3
    return hrp+'1'+''.join('qpzry9x8gf2tvdw0s3jn54khce6mua7l'[v] for v in words+[(chk>>i)&31 for i in [25,20,15,10,5,0]])

roots={}
def vector(inp):
    seed=hashlib.pbkdf2_hmac('sha512',norm(' '.join(inp['mnemonic'].split())),b'mnemonic'+norm(inp['passphrase']),2048,64)
    z=norm(inp['zk_passphrase'])
    password=seed+u32(len(z))+z
    if password not in roots:
        roots[password]=hash_secret_raw(password,label('root'),3,65536,1,64,Type.ID,19)
    root=roots[password];prk=mac(label('account'),root)
    expand=lambda info:mac(prk,info+b'\x01')
    family=bytes([{'legacy':0,'ecdsa':1,'pq':2}[inp['family']]])
    domain=bytes.fromhex(inp['domain']);asset=bytes.fromhex(inp['asset_id'])
    q=family+u32(inp['account'])+domain+asset
    p=family+u32(inp['account'])+u32(inp['chain'])+u32(inp['index'])+domain+asset
    assert len(q)==69 and len(p)==77
    spend=expand(label('spend')+p);view=expand(label('view')+p)
    kem=b'KEM\x00\x20'
    dkp=mac(b'',b'HPKE-v1'+kem+b'dkp_prk'+view)
    sk=mac(dkp,b'\x00\x20HPKE-v1'+kem+b'sk\x01')
    pub=X25519PrivateKey.from_private_bytes(sk).public_key().public_bytes(serialization.Encoding.Raw,serialization.PublicFormat.Raw)
    owner=poseidon(b'NIP043/owner/CP1'+domain+spend)
    nk=poseidon(b'NIP043/nk/CP1'+domain+spend)
    tag=sha(b'NeuraiZK/v1/instance'+domain+asset)[:4]
    payload=b'\x01'+owner+pub+tag
    out={k:v.hex() for k,v in dict(seed=seed,zk_root=root,prk=prk,account_scope=q,address_scope=p,spend_secret=spend,view_seed=view,view_pub=pub,owner=owner,nk=nk,instance_tag=tag,payload=payload,checkpoint_key=expand(label('scan-checkpoint')+q),storage_id=sha(expand(label('storage')+q))).items()}
    out['fingerprint']=sha(expand(label('fingerprint')+q))[:4].hex()
    out['address']=bech({'testnet':'tnzk','mainnet':'nzk','regtest':'rnzk'}[inp['network']],payload)
    out['address_length']=len(out['address'])
    return {'name':f"{inp['family']} account {inp['account']} branch {inp['chain']} index {inp['index']} ZK {inp['zk_passphrase']!r}",'input':inp,'output':out}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true');args=parser.parse_args()
    inputs=json.loads((FIX/'nzk-v2-inputs.json').read_text())
    result={'spec':'NeuraiZK/v2 2026-10-01','poseidon_constants_sha256':sha((FIX/'nzk-poseidon.json').read_bytes()).hex(),'argon2id':{'t':3,'m':65536,'p':1,'dkLen':64},'vectors':[vector(i) for i in inputs]}
    target=FIX/'nzk-vectors.json'
    if args.write: target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    else: assert result==json.loads(target.read_text()),'Frozen vectors differ'
    print(f"Verified {len(result['vectors'])} independent NeuraiZK/v2 vectors")
