import { Connection } from "@solana/web3.js";
import { MarginfiClient, getConfig } from '@mrgnlabs/marginfi-client-v2';
import { NodeWallet } from "@mrgnlabs/mrgn-common";

import dotenv from 'dotenv';
dotenv.config();

const RPC_ENDPOINT = process.env.RPC_ENDPOINT;

const main = async () => {
    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    const wallet = NodeWallet.local();
    const config = getConfig("production");
    const client = await MarginfiClient.fetch(config, wallet, connection);

    const solBank = await client.getBankByPk("So11111111111111111111111111111111111111112");

    const marginfiAccount = await client.createMarginfiAccount();
    marginfiAccount.deposit(1, solBank.address, { wrapAndUnwrapSol: false }, );

    marginfiAccount.makeDepositIx(100, solBank.address);
}

main().catch((e) => console.log(e));
