import { Connection, PublicKey } from "@solana/web3.js";
import { MarginfiAccount, MarginfiClient, getConfig, instructions, } from '@mrgnlabs/marginfi-client-v2';
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
    program,
    wallet,
    bankPk,
    account,
    signerTokenAccountPk,
    amount,
    ixType
}) => {
    const marginfiGroupPk = new PublicKey("4qp6Fx6tnZkY5Wropq9wUYgtFxXKwE6viZxFHg3rdAG8");

    switch (ixType) {
        case "deposit":
            return instructions.makeDepositIx(
                program,
                {
                    marginfiGroupPk: marginfiGroupPk,
                    marginfiAccountPk: account,
                    authorityPk: wallet.publicKey,
                    signerTokenAccountPk: signerTokenAccountPk,
                    bankPk: bankPk,
                    tokenProgramPk: TOKEN_PROGRAM_ID,
                },
                {
                    amount: new BN(amount),
                }
            );
        case "withdraw":
            return instructions.makeWithdrawIx(
                program,
                {
                //   marginfiGroupPk: marginfiGroupPk,
                //   marginfiAccountPk: account,
                //   signerPk: wallet.publicKey,
                //   bankPk: bank.address,
                //   destinationTokenAccountPk: signerTokenAccountPk,
                //   tokenProgramPk: TOKEN_PROGRAM_ID,
                    marginfiAccount: account,
                    bank: bankPk,
                    destinationTokenAccount: wallet.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
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
    const account = await MarginfiAccount.fetch(
        new PublicKey("2rVUjQ6C4tCFMHzf6RuqmGoMBrUv9ZEcucg2Y3XDUVKf"),
        client
    );

    const TOKENS = {
        USDC: {
            mint: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
        },
        USDT: {
            mint: new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB")
        },
    };

    const { bank: usdcBank, signerTokenAccountPk: usdcSignerTokenAccountPk } = await getBank(client, wallet, TOKENS.USDC.mint);
    const { bank: usdtBank, signerTokenAccountPk: usdtSignerTokenAccountPk } = await getBank(client, wallet, TOKENS.USDT.mint);

    try {
        // create ix and simulate cus for deposit ix
        // const depositIx = await buildInstructions({
        //     program: client.program,
        //     wallet,
        //     bank: usdcBankInfo.bank,
        //     account: account.address,
        //     signerTokenAccountPk: usdcBankInfo.signerTokenAccountPk,
        //     amount: 1,
        //     ixType: "deposit"
        // });
        // const depositComputeUnits = await simulateComputeUnits(connection, depositIx, wallet.publicKey, []);
    
        // create ix and simulate cus for withdraw ix
        const withdrawIx = await buildInstructions({
            program: client.program,
            wallet,
            bank: usdcBank.address,
            account: account.address,
            signerTokenAccountPk: usdtSignerTokenAccountPk,
            amount: 0.2,
            ixType: "withdraw"
        });
        const withdrawComputeUnits = await simulateComputeUnits(connection, withdrawIx, wallet.publicKey, []);
    
        console.log("== Compute Unit Estimates ==");
        // console.log("Deposit CUs: ", depositComputeUnits);
        console.log("Withdraw CUs: ", withdrawComputeUnits);
    } catch (error) {
        console.log(error);
    }
};

main()
