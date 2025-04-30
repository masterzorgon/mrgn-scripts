import { Connection, PublicKey } from "@solana/web3.js";
import { MarginfiClient, getConfig, instructions, } from '@mrgnlabs/marginfi-client-v2';
import { NodeWallet } from "@mrgnlabs/mrgn-common";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import BN from "bn.js";

import dotenv from 'dotenv';
import { getSimulationComputeUnits } from "@solana-developers/helpers";

dotenv.config();

const RPC_ENDPOINT = process.env.RPC_ENDPOINT;

const getBank = async (client, wallet, mint) => {
    const bank = client.getBankByMint(mint);
    const signerTokenAccountPk = getAssociatedTokenAddressSync(
        mint,
        wallet.publicKey
    );

    return { bank, signerTokenAccountPk };
}

const getInstructions = async (client, wallet, bank, signerTokenAccountPk, amount, ixType) => {
    switch (ixType) {
        case "deposit":
            return instructions.makeDepositIx(
                client.program,
                {
                    marginfiGroupPk: new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"),
                    marginfiAccountPk: new PublicKey("75YYwTfCPatxCcP871cwd69Pe9MQac6mEdPckbqH4Euc"),
                    authorityPk: wallet.publicKey,
                    signerTokenAccountPk: signerTokenAccountPk,
                    bankPk: bank.address,
                    tokenProgramPk: TOKEN_PROGRAM_ID,
                },
                {
                    amount: new BN(amount),
                }
            );
        case "withdraw":
            return instructions.makeWithdrawIx(
                client.program,
                {
                  marginfiGroupPk: new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8"),
                  marginfiAccountPk: new PublicKey("75YYwTfCPatxCcP871cwd69Pe9MQac6mEdPckbqH4Euc"),
                  signerPk: wallet.publicKey,
                  bankPk: bank.address,
                  destinationTokenAccountPk: signerTokenAccountPk,
                  tokenProgramPk: TOKEN_PROGRAM_ID,
                },
                {
                  amount: new BN(amount),
                }
              );
    }

    throw new Error(`Invalid instruction type: ${ixType}`);
}

const simulateComputeUnits = async (connection, ix, walletPk, lookupTables = []) => {
    const computeUnits = await getSimulationComputeUnits(
        connection,
        [ix],
        walletPk,
        lookupTables
    );

    return computeUnits;
}

const main = async () => {
    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    const wallet = NodeWallet.local();
    const config = getConfig("production");
    const client = await MarginfiClient.fetch(config, wallet, connection);

    // get bank and signer token account pk
    const wsolMint = new PublicKey("So11111111111111111111111111111111111111112");
    const { bank, signerTokenAccountPk } = await getBank(client, wallet, wsolMint);

    // create ix and simulate cus for deposit ix
    // const depositIx = await getInstructions(client, wallet, bank, signerTokenAccountPk, 1, "deposit");
    // const dpeositComputeUnits = await simulateComputeUnits(connection, depositIx, wallet.publicKey, []);
    // console.log("Deposit CUs: ", dpeositComputeUnits);

    // create ix and simulate cus for withdraw ix
    const withdrawIx = await getInstructions(client, wallet, bank, signerTokenAccountPk, 0.2, "withdraw");
    const withdrawComputeUnits = await simulateComputeUnits(connection, withdrawIx, wallet.publicKey, []);
    console.log("Withdraw CUs: ", withdrawComputeUnits);
};

main().catch((e) => console.log(e));
