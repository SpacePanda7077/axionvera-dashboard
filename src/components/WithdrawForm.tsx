import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput } from './FormInput';
import { createWithdrawSchema, WithdrawFormData } from '@/utils/validation';
import { notify } from '@/utils/notifications';
import { formatAmount, shortenAddress, type TransactionSimulation } from '@/utils/contractHelpers';
import { ConfirmTransactionModal } from './ConfirmTransactionModal';

type WithdrawFormProps = {
  isConnected: boolean;
  isSubmitting: boolean;
  balance: string;
  onWithdraw: (amount: string) => Promise<void>;
  status: "idle" | "pending" | "success" | "error";
  statusMessage?: string | null;
  transactionHash?: string | null;
  onSimulate?: (amount: string) => Promise<TransactionSimulation>;
};

export default function WithdrawForm({
  isConnected,
  isSubmitting,
  balance,
  onWithdraw,
  status,
  statusMessage,
  transactionHash,
  onSimulate
}: WithdrawFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [simulationData, setSimulationData] = useState<TransactionSimulation | null>(null);
  const [pendingAmount, setPendingAmount] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty }
  } = useForm<WithdrawFormData>({
    resolver: zodResolver(createWithdrawSchema(parseFloat(balance))),
    mode: 'onChange',
    defaultValues: {
      amount: '' as any,
    }
  });

  const onSubmit = async (data: WithdrawFormData) => {
    const amountStr = data.amount.toString();
    if (onSimulate) {
      setPendingAmount(amountStr);
      setIsModalOpen(true);
      setSimulationData(null);
      setIsSimulating(true);
      try {
        const sim = await onSimulate(amountStr);
        setSimulationData(sim);
      } catch (error) {
        console.error('Simulation error:', error);
        setIsModalOpen(false);
        notify.error("Simulation Failed", "Could not simulate transaction.");
      } finally {
        setIsSimulating(false);
      }
    } else {
      executeWithdraw(amountStr);
    }
  };

  const executeWithdraw = async (amount: string) => {
    try {
      await onWithdraw(amount);
      notify.success("Withdrawal Successful", `You have withdrawn ${amount} tokens.`);
      reset();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Withdrawal error:', error);
      setIsModalOpen(false);
    }
  };

  const handleConfirm = () => {
    if (pendingAmount) {
      executeWithdraw(pendingAmount);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSimulationData(null);
  };

  const shouldDisableSubmit = !isConnected || !isValid || !isDirty || isSubmitting || isSimulating;

  return (
    <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      <div className="text-sm font-semibold text-text-primary">Withdraw</div>
      <div className="mt-1 text-xs text-text-muted">Withdraw tokens from the Axionvera vault.</div>
      <div className="mt-3 rounded-xl border border-border-primary bg-background-secondary/20 px-4 py-3 text-xs text-text-secondary">
        Available balance: <span className="font-medium text-text-primary">{formatAmount(balance)}</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
        <FormInput
          {...register('amount')}
          id="withdraw-amount"
          inputMode="decimal"
          placeholder="0.0"
          label="Amount"
          required
          error={errors.amount}
          helperText={`Enter amount between 0.0001 and ${formatAmount(balance)}`}
        />

        {status !== 'idle' ? (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-xl border px-4 py-3 text-sm ${
              status === 'success'
                ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-200'
                : status === 'error'
                  ? 'border-rose-900/50 bg-rose-950/30 text-rose-200'
                  : 'border-border-primary bg-background-secondary/30 text-text-primary'
            }`}
          >
            <div className="font-medium">
              {status === 'pending' ? 'Withdrawal transaction pending' : status === 'success' ? 'Withdrawal completed' : 'Withdrawal failed'}
            </div>
            {statusMessage ? <div className="mt-1 text-xs opacity-90">{statusMessage}</div> : null}
            {transactionHash ? (
              <div className="mt-1 text-xs opacity-80">Tx: {shortenAddress(transactionHash, 8)}</div>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={shouldDisableSubmit}
          aria-label={isSubmitting ? "Submitting withdrawal" : "Withdraw tokens"}
          className="w-full rounded-xl border border-border-primary bg-background-secondary/30 px-4 py-3 text-sm font-medium text-text-primary transition hover:bg-background-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Withdraw"}
        </button>
      </form>

      <ConfirmTransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirm}
        action="withdraw"
        amount={pendingAmount}
        simulation={simulationData}
        isConfirming={isSubmitting}
      />
    </section>
  );
}
