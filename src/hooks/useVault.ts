import { useCallback, useEffect, useMemo, useState } from "react";
import { notify } from "@/utils/notifications";

import { createAxionveraVaultSdk, parsePositiveAmount } from "@/utils/contractHelpers";
import { NETWORK } from "@/utils/networkConfig";
import type { VaultTx } from "@/utils/contractHelpers";

type UseVaultArgs = {
  walletAddress: string | null;
};

type VaultState = {
  balance: string;
  rewards: string;
  transactions: VaultTx[];
  isLoading: boolean;
  isSubmitting: boolean;
  isClaiming: boolean;
  error: string | null;
};

export function useVault({ walletAddress }: UseVaultArgs) {
  const sdk = useMemo(() => createAxionveraVaultSdk(), []);
  const [state, setState] = useState<VaultState>({
    balance: "0",
    rewards: "0",
    transactions: [],
    isLoading: false,
    isSubmitting: false,
    isClaiming: false,
    error: null
  });

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setState((s) => ({ ...s, balance: "0", rewards: "0", transactions: [], error: null }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const [balances, txs] = await Promise.all([
        sdk.getBalances({ walletAddress, network: NETWORK }),
        sdk.getTransactions({ walletAddress, network: NETWORK })
      ]);
      setState((s) => ({
        ...s,
        balance: balances.balance,
        rewards: balances.rewards,
        transactions: txs,
        isLoading: false
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load vault state.";
      notify.error("Vault Update Failed", message);
      setState((s) => ({ ...s, isLoading: false, error: message }));
    }
  }, [sdk, walletAddress]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deposit = useCallback(
    async (amountInput: string) => {
      const amount = parsePositiveAmount(amountInput);
      if (!walletAddress) {
        setState((s) => ({ ...s, error: "Connect a wallet to deposit." }));
        return;
      }
      if (!amount) {
        setState((s) => ({ ...s, error: "Enter a valid amount greater than zero." }));
        return;
      }

      setState((s) => ({ ...s, isSubmitting: true, error: null }));
      try {
        await sdk.deposit({ walletAddress, network: NETWORK, amount });
        await refresh();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Deposit failed.";
        notify.error("Deposit Failed", message);
        setState((s) => ({ ...s, error: message }));
      } finally {
        setState((s) => ({ ...s, isSubmitting: false }));
      }
    },
    [refresh, sdk, walletAddress]
  );

  const withdraw = useCallback(
    async (amountInput: string) => {
      const amount = parsePositiveAmount(amountInput);
      if (!walletAddress) {
        setState((s) => ({ ...s, error: "Connect a wallet to withdraw." }));
        return;
      }
      if (!amount) {
        setState((s) => ({ ...s, error: "Enter a valid amount greater than zero." }));
        return;
      }

      setState((s) => ({ ...s, isSubmitting: true, error: null }));
      try {
        await sdk.withdraw({ walletAddress, network: NETWORK, amount });
        await refresh();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Withdraw failed.";
        notify.error("Withdrawal Failed", message);
        setState((s) => ({ ...s, error: message }));
      } finally {
        setState((s) => ({ ...s, isSubmitting: false }));
      }
    },
    [refresh, sdk, walletAddress]
  );

  const claimRewards = useCallback(async () => {
    if (!walletAddress) {
      setState((s) => ({ ...s, error: "Connect a wallet to claim rewards." }));
      return;
    }

    setState((s) => ({ ...s, isClaiming: true, error: null }));
    try {
      await sdk.claimRewards({ walletAddress, network: NETWORK });
      await refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Claim failed.";
      notify.error("Claim Failed", message);
      setState((s) => ({ ...s, error: message }));
    } finally {
      setState((s) => ({ ...s, isClaiming: false }));
    }
  }, [refresh, sdk, walletAddress]);

  return {
    balance: state.balance,
    rewards: state.rewards,
    transactions: state.transactions,
    isLoading: state.isLoading,
    isSubmitting: state.isSubmitting,
    isClaiming: state.isClaiming,
    error: state.error,
    refresh,
    deposit,
    withdraw,
    claimRewards
  };
}
