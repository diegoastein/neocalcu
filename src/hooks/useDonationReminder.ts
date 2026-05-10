import { useState, useEffect, useCallback } from 'react';

const WORKER_URL = 'https://neocalcu-donations.diegosteinberg.workers.dev';

const OPEN_COUNT_KEY = 'neo_open_count';
const DONATED_AT_KEY = 'neo_donated_at';
const DONATED_PLAN_KEY = 'neo_donated_plan';
const DEVICE_ID_KEY = 'neo_device_id';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export type Plan = 'mensual' | 'anual';

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function isDonationActive(): boolean {
  const donatedAt = localStorage.getItem(DONATED_AT_KEY);
  if (!donatedAt) return false;
  const plan = (localStorage.getItem(DONATED_PLAN_KEY) as Plan) || 'mensual';
  const duration = plan === 'anual' ? ONE_YEAR_MS : THIRTY_DAYS_MS;
  return Date.now() - parseInt(donatedAt) < duration;
}

interface VerifyResponse {
  donated: boolean;
  timestamp?: string;
  plan?: string;
}

interface CreatePaymentResponse {
  init_point: string;
}

interface RedeemResponse {
  ok: boolean;
  plan?: string;
  error?: string;
}

export function useDonationReminder() {
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isDonationActive()) return;

    const count = parseInt(localStorage.getItem(OPEN_COUNT_KEY) || '0') + 1;
    localStorage.setItem(OPEN_COUNT_KEY, count.toString());

    if (count % 5 !== 0) return;

    const deviceId = getOrCreateDeviceId();
    fetch(`${WORKER_URL}/verificar?device=${deviceId}`)
      .then(res => res.json())
      .then((data: VerifyResponse) => {
        if (data.donated) {
          localStorage.setItem(DONATED_AT_KEY, data.timestamp ?? Date.now().toString());
          if (data.plan) localStorage.setItem(DONATED_PLAN_KEY, data.plan);
        } else {
          setShowToast(true);
        }
      })
      .catch(() => {
        // Sin conexión — no molestar al usuario
      });
  }, []);

  const dismissToast = useCallback(() => {
    setShowToast(false);
  }, []);

  const handleDonate = useCallback(async (plan: Plan = 'mensual') => {
    setLoading(true);
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch(`${WORKER_URL}/crear-pago?device=${deviceId}&plan=${plan}`);
      const data: CreatePaymentResponse = await res.json();
      window.location.href = data.init_point;
    } catch {
      // Sin conexión — falla silenciosamente
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch(`${WORKER_URL}/verificar?device=${deviceId}`);
      const data: VerifyResponse = await res.json();
      if (data.donated) {
        localStorage.setItem(DONATED_AT_KEY, data.timestamp ?? Date.now().toString());
        if (data.plan) localStorage.setItem(DONATED_PLAN_KEY, data.plan);
        setShowToast(false);
      }
    } catch {
      // Sin conexión — falla silenciosamente
    }
  }, []);

  const handleRedeemCoupon = useCallback(async (code: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch(
        `${WORKER_URL}/canjear-cupon?device=${deviceId}&code=${encodeURIComponent(code)}`
      );
      const data: RedeemResponse = await res.json();
      if (data.ok) {
        localStorage.setItem(DONATED_AT_KEY, Date.now().toString());
        localStorage.setItem(DONATED_PLAN_KEY, data.plan ?? 'anual');
        setShowToast(false);
      }
      return data;
    } catch {
      return { ok: false, error: 'Sin conexión' };
    }
  }, []);

  return { showToast, dismissToast, handleDonate, handleVerify, handleRedeemCoupon, loading };
}
