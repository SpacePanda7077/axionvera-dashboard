import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput } from './FormInput';
import { depositSchema, DepositFormData } from '@/utils/validation';
import { notify } from '@/utils/notifications';
import { shortenAddress, type TransactionSimulation } from '@/utils/contractHelpers';
import { ConfirmTransactionModal } from './ConfirmTransactionModal';

type DepositFormProps = {
  isConnected: boolean;
  isSubmitting: boolean;
  onDeposit: (amount: string) => Promise<void>;
  status: "idle" | "pending" | "success" | "error";
  statusMessage?: string | null;
  transactionHash?: string | null;
  walletBalance?: number | null;
  onSimulate?: (amount: string) => Promise<TransactionSimulation>;
  isNetworkMismatch?: boolean;
};

export default function DepositForm({
  isConnected,
  isSubmitting,
  onDeposit,
  status,
  statusMessage,
  transactionHash,
  walletBalance,
  onSimulate,
  isNetworkMismatch,
}: DepositFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [simulationData, setSimulationData] = useState<TransactionSimulation | null>(null);
  const [pendingAmount, setPendingAmount] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty }
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    mode: 'onChange',
    defaultValues: {
      amount: '' as any,
    }
  });

  const onSubmit = async (data: DepositFormData) => {
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
      executeDeposit(amountStr);
    }
  };

  const executeDeposit = async (amount: string) => {
    try {
      await onDeposit(amount);
      notify.success("Deposit Successful", `You have deposited ${amount} tokens.`);
      reset();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Deposit error:', error);
      setIsModalOpen(false);
    }
  };

  const handleConfirm = () => {
    if (pendingAmount) {
      executeDeposit(pendingAmount);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSimulationData(null);
  };

  const shouldDisableSubmit = !isConnected || !isValid || !isDirty || isSubmitting || isSimulating || !!isNetworkMismatch;

  return (
    <>
      <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
        <div className="text-sm font-semibold text-text-primary">Deposit</div>
        <div className="mt-1 text-xs text-text-muted">Deposit tokens into the Axionvera vault.</div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <FormInput
            {...register('amount')}
            id="deposit-amount"
            inputMode="decimal"
            placeholder="0.0"
            label="Amount"
            required
            error={errors.amount}
            helperText="Enter amount between 0.0001 and 10,000"
          />

          {status !== 'idle' ? (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-xl border px-4 py-3 text-sm ${
                status === 'error'
                  ? 'border-rose-900/50 bg-rose-950/30 text-rose-200'
                  : status === 'success'
                  ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-200'
                  : 'border-border-primary bg-background-secondary/30 text-text-primary'
              }`}
            >
              <div className="font-medium">
                {status === 'pending' ? 'Deposit transaction pending' : status === 'success' ? 'Deposit completed' : 'Deposit failed'}
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
            aria-label={isSubmitting ? "Submitting deposit" : "Deposit tokens"}
            className="w-full rounded-xl bg-axion-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Submitting..." : "Deposit"}
          </button>
        </form>
      </section>

      <ConfirmTransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirm}
        action="deposit"
        amount={pendingAmount}
        simulation={simulationData}
        isConfirming={isSubmitting}
      />
    </>
  );
}

