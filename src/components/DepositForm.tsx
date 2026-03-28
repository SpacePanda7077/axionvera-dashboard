import { FormInput } from './FormInput';
import { useFormValidation } from '@/hooks/useFormValidation';
import { depositSchema, DepositFormData } from '@/utils/validation';
import { notify } from '@/utils/notifications';
import { shortenAddress } from '@/utils/contractHelpers';

type DepositFormProps = {
  isConnected: boolean;
  isSubmitting: boolean;
  onDeposit: (amount: string) => Promise<void>;
  status: "idle" | "pending" | "success" | "error";
  statusMessage?: string | null;
  transactionHash?: string | null;
};

export default function DepositForm({
  isConnected,
  isSubmitting,
  onDeposit,
  status,
  statusMessage,
  transactionHash
}: DepositFormProps) {
  const initialValues: DepositFormData = {
    amount: '',
  };

  const {
    getFieldProps,
    shouldDisableSubmit,
    handleSubmit,
    reset,
  } = useFormValidation({
    schema: depositSchema,
    initialValues,
    onSubmit: async (data) => {
      await onDeposit(data.amount);
      notify.success("Deposit Successful", `You have deposited ${data.amount} tokens.`);
      reset();
    },
  });

  const amountProps = getFieldProps('amount');

  return (
    <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      <div className="text-sm font-semibold text-text-primary">Deposit</div>
      <div className="mt-1 text-xs text-text-muted">Deposit tokens into the Axionvera vault.</div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="mt-5 space-y-4">
        <FormInput
          {...amountProps}
          id="deposit-amount"
          inputMode="decimal"
          placeholder="0.0"
          label="Amount"
          required
          helperText="Enter amount between 0.0001 and 10,000"
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
          disabled={!isConnected || shouldDisableSubmit() || isSubmitting}
          aria-label={isSubmitting ? "Submitting deposit" : "Deposit tokens"}
          className="w-full rounded-xl bg-axion-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Submitting..." : "Deposit"}
        </button>
      </form>
    </section>
  );
}
