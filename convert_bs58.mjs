import fs from 'fs';
import dotenv from 'dotenv';
import bs58 from 'bs58';

dotenv.config();

const main = () => {
    const secretKeyBase58 = process.env.WALLET_SEC;
    const secretKey = bs58.decode(secretKeyBase58);
    
    fs.writeFileSync(
      `${process.env.WALLET_PATH}/.config/solana/id.json`,
      JSON.stringify(Array.from(secretKey))
    );
};

main();
