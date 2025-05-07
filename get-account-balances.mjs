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
  const mfiAccounts = await client.getMarginfiAccountsForAuthority(wallet.publicKey);

  if (!mfiAccounts.length) {
    console.log("No marginfi accounts found for this wallet.");
    return;
  }

  for (const [i, accountWrapper] of mfiAccounts.entries()) {
    const balances = accountWrapper._marginfiAccount.balances;

    const nonZeroBalances = balances.filter((balance) => {
      return (
        parseFloat(balance.assetShares.toString()) > 0 ||
        parseFloat(balance.liabilityShares.toString()) > 0
      );
    });

    if (!nonZeroBalances.length) continue;

    console.log(`\n🔹 Account ${i + 1}: ${accountWrapper.address.toBase58()}`);

    nonZeroBalances.forEach((balance, j) => {
      console.log(`  Balance ${j + 1}:`);
      console.log({
        bankAddress: balance.bankPk.toBase58(),
        assetShares: balance.assetShares.toString(),
        liabilityShares: balance.liabilityShares.toString(),
      });
    });
  }
};

main().catch((e) => console.error(e));
