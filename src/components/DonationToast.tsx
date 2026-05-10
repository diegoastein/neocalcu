import { useEffect, useState } from 'react';
import { Plan } from '../hooks/useDonationReminder';

const COUNTDOWN_SECONDS = 30;

interface Props {
  onDonate: (plan: Plan) => Promise<void>;
  onDismiss: () => void;
  onRedeemCoupon: (code: string) => Promise<{ ok: boolean; error?: string }>;
  loading: boolean;
}

const PLAN_OPTIONS: { plan: Plan; label: string; price: string; badge: string }[] = [
  { plan: 'mensual', label: 'Mensual', price: '$3.500', badge: '30 días' },
  { plan: 'anual',   label: 'Anual',   price: '$28.000', badge: '12 meses ✦' },
];

export default function DonationToast({ onDonate, onDismiss, onRedeemCoupon, loading }: Props) {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [selectedPlan, setSelectedPlan] = useState<Plan>('mensual');
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      onDismiss();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onDismiss]);

  const handleRedeem = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    const result = await onRedeemCoupon(couponCode.trim());
    if (!result.ok) {
      const msg = result.error === 'used'
        ? 'Este cupón ya fue usado'
        : result.error === 'invalid'
        ? 'Cupón no válido'
        : 'Sin conexión, intentá más tarde';
      setCouponError(msg);
    }
    setCouponLoading(false);
  };

  const selectedOption = PLAN_OPTIONS.find(o => o.plan === selectedPlan)!;

  return (
    <div
      className={`fixed bottom-20 left-4 right-4 z-50 transition-all duration-300 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-brand-200 dark:border-slate-600 p-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl">☕</span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Se cierra en {countdown}s
          </span>
        </div>

        <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-0.5">
          ¿Te resulta útil NeoCalcu?
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
          Apoyá este proyecto y ayudás a que siga creciendo.
        </p>

        {/* Plan selector */}
        <div className="flex gap-2 mb-3">
          {PLAN_OPTIONS.map(({ plan, label, price, badge }) => (
            <button
              key={plan}
              onClick={() => setSelectedPlan(plan)}
              className={`flex-1 rounded-xl border py-2.5 px-2 text-center transition-colors ${
                selectedPlan === plan
                  ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/40 dark:border-brand-500'
                  : 'border-slate-200 dark:border-slate-600 hover:border-brand-300 dark:hover:border-slate-500'
              }`}
            >
              <div className={`text-xs font-semibold mb-0.5 ${
                selectedPlan === plan
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-slate-600 dark:text-slate-300'
              }`}>
                {label}
              </div>
              <div className={`text-sm font-bold ${
                selectedPlan === plan
                  ? 'text-brand-800 dark:text-brand-200'
                  : 'text-slate-700 dark:text-slate-200'
              }`}>
                {price}
              </div>
              <div className={`text-xs mt-0.5 ${
                selectedPlan === plan
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}>
                {badge}
              </div>
            </button>
          ))}
        </div>

        {selectedPlan === 'anual' && (
          <p className="text-xs text-brand-700 dark:text-brand-300 mb-3 -mt-1">
            Ahorrás $14.000 respecto al plan mensual ✦
          </p>
        )}

        {/* Donate button */}
        <button
          onClick={() => onDonate(selectedPlan)}
          disabled={loading}
          className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-semibold rounded-xl py-3 px-4 transition-colors flex items-center justify-center gap-2 text-base mb-3"
        >
          {loading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Preparando pago...
            </>
          ) : (
            `Apoyá — ${selectedOption.price} / ${selectedOption.badge}`
          )}
        </button>

        {/* Coupon section */}
        {!showCoupon ? (
          <button
            onClick={() => setShowCoupon(true)}
            className="w-full text-xs text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-center"
          >
            ¿Tenés un cupón de sorteo? →
          </button>
        ) : (
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <input
                type="text"
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleRedeem()}
                placeholder="Código de cupón"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 uppercase"
                autoFocus
              />
              {couponError && (
                <p className="text-xs text-red-500 mt-1">{couponError}</p>
              )}
            </div>
            <button
              onClick={handleRedeem}
              disabled={couponLoading || !couponCode.trim()}
              className="px-3 py-2 rounded-lg bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-sm font-medium transition-colors whitespace-nowrap"
            >
              {couponLoading ? '...' : 'Canjear'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
