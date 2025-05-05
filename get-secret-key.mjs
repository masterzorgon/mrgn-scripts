import fs from 'fs';
import bs58 from 'bs58';

import dotenv from 'dotenv';
dotenv.config();

const filePath = process.env.KEY_PATH;

const keyArray = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const uint8Array = new Uint8Array(keyArray);
const base58Key = bs58.encode(uint8Array);

console.log('Base58 private key for Phantom:', base58Key);
