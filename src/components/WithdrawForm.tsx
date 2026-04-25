'use client';

import { useState, useEffect } from 'react';
import { FormInput } from './FormInput';
import TransactionSuccess from './TransactionSuccess';
import { useFormValidation } from '@/hooks/useFormValidation';
import { withdrawSchema, WithdrawFormData } from '@/utils/validation';
import { notify } from '@/utils/notifications';
import { formatAmount, shortenAddress } from '@/utils/contractHelpers';

type WithdrawFormProps = {
  isConnected: boolean;
  isSubmitting: boolean;
  balance: string;
  onWithdraw: (amount: string) => Promise<void>;
  status: "idle" | "pending" | "success" | "error";
  statusMessage?: string | null;
  transactionHash?: string | null;
};

export default function WithdrawForm({
  isConnected,
  isSubmitting,
  balance,
  onWithdraw,
  status,
  statusMessage,
  transactionHash
}: WithdrawFormProps) {

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const initialValues: WithdrawFormData = {
    amount: '',
  };

  const {
    register,
    handleSubmit,
    reset,
  } = useFormValidation({
    schema: withdrawSchema,
    initialValues,
    onSubmit: async (data) => {
      setWithdrawAmount(data.amount);
      await onWithdraw(data.amount);
    },
  });

  // Show success modal when status changes to success and we have a hash
  useEffect(() => {
    if (status === 'success' && transactionHash) {
      setShowSuccessModal(true);
      notify.success("Withdrawal Successful", `You have withdrawn ${withdrawAmount} tokens.`);
    }
  }, [status, transactionHash, withdrawAmount]);

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setWithdrawAmount('');
    reset();
  };

  const amountProps = getFieldProps('amount');

  return (
    <>
      <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
        <div className="text-sm font-semibold text-text-primary">Withdraw</div>
        <div className="mt-1 text-xs text-text-muted">Withdraw tokens from the Axionvera vault.</div>
        <div className="mt-3 rounded-xl border border-border-primary bg-background-secondary/20 px-4 py-3 text-xs text-text-secondary">
          Available balance: <span className="font-medium text-text-primary">{formatAmount(balance)}</span>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="mt-5 space-y-4">
          <FormInput
            {...amountProps}
            id="withdraw-amount"
            inputMode="decimal"
            placeholder="0.0"
            label="Amount"
            required
            helperText="Enter amount between 0.0001 and 10,000"
          />

          {status !== 'idle' && status !== 'success' ? (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-xl border px-4 py-3 text-sm ${
                status === 'error'
                  ? 'border-rose-900/50 bg-rose-950/30 text-rose-200'
                  : 'border-border-primary bg-background-secondary/30 text-text-primary'
              }`}
            >
              <div className="font-medium">
                {status === 'pending' ? 'Withdrawal transaction pending' : 'Withdrawal failed'}
              </div>
              {statusMessage ? <div className="mt-1 text-xs opacity-90">{statusMessage}</div> : null}
              {transactionHash && status === 'error' ? (
                <div className="mt-1 text-xs opacity-80">Tx: {shortenAddress(transactionHash, 8)}</div>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!isConnected || shouldDisableSubmit() || isSubmitting}
            aria-label={isSubmitting ? "Submitting withdrawal" : "Withdraw tokens"}
            className="w-full rounded-xl border border-border-primary bg-background-secondary/30 px-4 py-3 text-sm font-medium text-text-primary transition hover:bg-background-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Withdraw"}
          </button>
        </form>
      </section>

      {/* Transaction Success Modal */}
      {showSuccessModal && transactionHash && (
        <TransactionSuccess
          amount={withdrawAmount}
          assetSymbol="AXNV"
          transactionHash={transactionHash}
          type="withdraw"
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
