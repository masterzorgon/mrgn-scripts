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

const buildInstructions = async ({
    client,
    wallet,
    bank,
    mfiAccount,
    signerTokenAccountPk,
    amount,
    ixType
}) => {
    const marginfiGroupPk = new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8");

    switch (ixType) {
        case "deposit":
            return instructions.makeDepositIx(
                client.program,
                {
                    marginfiGroupPk: marginfiGroupPk,
                    marginfiAccountPk: mfiAccount,
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
                  marginfiGroupPk: marginfiGroupPk,
                  marginfiAccountPk: mfiAccount,
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
    const mfiAccount = new PublicKey("2rVUjQ6C4tCFMHzf6RuqmGoMBrUv9ZEcucg2Y3XDUVKf");;

    const TOKENS = {
        USDC: {
            mint: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
        },
        USDT: {
            mint: new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB")
        },
    };

    const usdcBankInfo = await getBank(client, wallet, TOKENS.USDC.mint);
    const usdtBankInfo = await getBank(client, wallet, TOKENS.USDT.mint);

    try {
        // create ix and simulate cus for deposit ix
        const depositIx = await buildInstructions({
            client,
            wallet,
            bank: usdcBankInfo.bank,
            mfiAccount,
            signerTokenAccountPk: usdcBankInfo.signerTokenAccountPk,
            amount: 1,
            ixType: "deposit"
        });
        const depositComputeUnits = await simulateComputeUnits(connection, depositIx, wallet.publicKey, []);
    
        // create ix and simulate cus for withdraw ix
        const withdrawIx = await buildInstructions({
            client,
            wallet,
            bank: usdcBankInfo.bank,
            mfiAccount,
            signerTokenAccountPk: usdtBankInfo.signerTokenAccountPk,
            amount: 0.2,
            ixType: "withdraw"
        });
        const withdrawComputeUnits = await simulateComputeUnits(connection, withdrawIx, wallet.publicKey, []);
    
        console.log("== Compute Unit Estimates ==");
        console.log("Deposit CUs: ", depositComputeUnits);
        console.log("Withdraw CUs: ", withdrawComputeUnits);
    } catch (error) {
        console.log(error);
    }
};

main()
