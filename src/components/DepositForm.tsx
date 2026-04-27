import { useState } from 'react';
import { FormInput } from './FormInput';
import { TransactionStepper } from './TransactionStepper';
import { useFormValidation } from '@/hooks/useFormValidation';
import { depositSchema } from '@/utils/validation';
import { notify } from '@/utils/notifications';
import { shortenAddress, type TransactionSimulation } from '@/utils/contractHelpers';
import { ConfirmTransactionModal } from './ConfirmTransactionModal';
import type { TxStep } from '@/utils/pollTransaction';

type DepositFormProps = {
  isConnected: boolean;
  isSubmitting: boolean;
  onDeposit: (amount: string) => Promise<void>;
  status: 'idle' | 'pending' | 'success' | 'error';
  txStep?: TxStep | null;
  statusMessage?: string | null;
  transactionHash?: string | null;
  walletBalance?: number | null;
  onSimulate?: (amount: string) => Promise<TransactionSimulation>;
};

export default function DepositForm({
  isConnected,
  isSubmitting,
  onDeposit,
  status,
  txStep,
  statusMessage,
  transactionHash,
  walletBalance,
  onSimulate,
}: DepositFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [simulationData, setSimulationData] = useState<TransactionSimulation | null>(null);
  const [pendingAmount, setPendingAmount] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const { values, errors, isDirty, isValid, shouldDisableSubmit, updateField, handleBlur, handleSubmit, reset } =
    useFormValidation({
      schema: depositSchema,
      initialValues: { amount: '' },
    });

  const executeDeposit = async (amount: string) => {
    try {
      await onDeposit(amount);
      reset();
      setIsModalOpen(false);
    } catch {
      setIsModalOpen(false);
    }
  };

  const onSubmit = async () => {
    const { isValid: valid } = depositSchema.safeParse(values)
      ? { isValid: depositSchema.safeParse(values).success }
      : { isValid: false };

    if (!valid) return;

    const amountStr = values.amount.toString();

    if (onSimulate) {
      setPendingAmount(amountStr);
      setIsModalOpen(true);
      setSimulationData(null);
      setIsSimulating(true);
      try {
        const sim = await onSimulate(amountStr);
        setSimulationData(sim);
      } catch {
        setIsModalOpen(false);
        notify.error('Simulation Failed', 'Could not simulate transaction.');
      } finally {
        setIsSimulating(false);
      }
    } else {
      await executeDeposit(amountStr);
    }
  };

  const isDisabled = !isConnected || shouldDisableSubmit() || isSubmitting || isSimulating;

  return (
    <>
      <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
        <div className="text-sm font-semibold text-text-primary">Deposit</div>
        <div className="mt-1 text-xs text-text-muted">Deposit tokens into the Axionvera vault.</div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
            onSubmit();
          }}
          className="mt-5 space-y-4"
        >
          <FormInput
            id="deposit-amount"
            inputMode="decimal"
            placeholder="0.0"
            label="Amount"
            required
            value={values.amount}
            onChange={(v) => updateField('amount', v)}
            onBlur={() => handleBlur('amount')}
            error={errors.amount}
            helperText="Enter amount between 0.0001 and 10,000"
          />

          {txStep && status === 'pending' ? (
            <div role="status" aria-live="polite" className="pt-1">
              <TransactionStepper txStep={txStep} />
            </div>
          ) : status !== 'idle' && status !== 'success' ? (
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
                {status === 'pending' ? 'Confirming Transaction...' : 'Deposit failed'}
              </div>
              {statusMessage ? <div className="mt-1 text-xs opacity-90">{statusMessage}</div> : null}
              {transactionHash && status === 'error' ? (
                <div className="mt-1 text-xs opacity-80">Tx: {shortenAddress(transactionHash, 8)}</div>
              ) : null}
            </div>
          ) : status === 'success' && transactionHash ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border border-axion-500/30 bg-axion-500/10 px-4 py-3 text-sm text-axion-300"
            >
              <div className="font-medium">Deposit completed</div>
              <div className="mt-1 text-xs opacity-80">Tx: {shortenAddress(transactionHash, 8)}</div>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isDisabled}
            aria-label={isSubmitting ? 'Submitting deposit' : 'Deposit tokens'}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-axion-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Depositing...
              </>
            ) : (
              'Deposit'
            )}
          </button>
        </form>
      </section>

      <ConfirmTransactionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSimulationData(null); }}
        onConfirm={() => { if (pendingAmount) executeDeposit(pendingAmount); }}
        action="deposit"
        amount={pendingAmount}
        simulation={simulationData}
        isConfirming={isSubmitting}
      />
    </>
  );
}
