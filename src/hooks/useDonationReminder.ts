import { useState, useEffect, useCallback } from 'react';

const WORKER_URL = 'https://neocalcu-donations.diegosteinberg.workers.dev';

const OPEN_COUNT_KEY = 'neo_open_count';
const DONATED_AT_KEY = 'neo_donated_at';
const DONATED_PLAN_KEY = 'neo_donated_plan';
const DEVICE_ID_KEY = 'neo_device_id';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

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
  const plan = localStorage.getItem(DONATED_PLAN_KEY) ?? 'mensual';
  const duration = plan === 'anual' ? ONE_YEAR_MS : THIRTY_DAYS_MS;
  return Date.now() - parseInt(donatedAt) < duration;
}

export interface MembershipInfo {
  active: boolean;
  plan: 'mensual' | 'anual' | null;
  expiresAt: Date | null;
}

function getMembershipInfo(): MembershipInfo {
  const donatedAt = localStorage.getItem(DONATED_AT_KEY);
  if (!donatedAt) return { active: false, plan: null, expiresAt: null };
  const plan = (localStorage.getItem(DONATED_PLAN_KEY) ?? 'mensual') as 'mensual' | 'anual';
  const duration = plan === 'anual' ? ONE_YEAR_MS : THIRTY_DAYS_MS;
  const ts = parseInt(donatedAt);
  const active = Date.now() - ts < duration;
  return { active, plan, expiresAt: new Date(ts + duration) };
}

interface VerifyResponse {
  donated: boolean;
  timestamp?: string;
  plan?: 'mensual' | 'anual';
}

interface CreatePaymentResponse {
  init_point: string;
}

interface RedeemResponse {
  success?: boolean;
  plan?: 'mensual' | 'anual';
  error?: string;
}

export type RedeemResult = 'success' | 'invalid' | 'used' | 'error';

export function useDonationReminder() {
  const [showToast, setShowToast] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<'mensual' | 'anual' | null>(null);
  const [membership, setMembership] = useState<MembershipInfo>(() => getMembershipInfo());

  const refreshMembership = useCallback(() => {
    setMembership(getMembershipInfo());
  }, []);

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
          refreshMembership();
        } else {
          setShowToast(true);
        }
      })
      .catch(() => {
        // Sin conexión — no molestar al usuario
      });
  }, [refreshMembership]);

  const dismissToast = useCallback(() => {
    setShowToast(false);
  }, []);

  const handleDonate = useCallback(async (plan: 'mensual' | 'anual' = 'mensual') => {
    setLoadingPlan(plan);
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch(`${WORKER_URL}/crear-pago?device=${deviceId}&plan=${plan}`);
      const data: CreatePaymentResponse = await res.json();
      window.location.href = data.init_point;
    } catch {
      // Sin conexión — falla silenciosamente
    } finally {
      setLoadingPlan(null);
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
        refreshMembership();
      }
    } catch {
      // Sin conexión — falla silenciosamente
    }
  }, [refreshMembership]);

  const handleRedeem = useCallback(async (code: string): Promise<RedeemResult> => {
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch(`${WORKER_URL}/canjear-cupon?device=${deviceId}&code=${encodeURIComponent(code.trim().toUpperCase())}`);
      const data: RedeemResponse = await res.json();
      if (data.success) {
        localStorage.setItem(DONATED_AT_KEY, Date.now().toString());
        localStorage.setItem(DONATED_PLAN_KEY, data.plan ?? 'mensual');
        setShowToast(false);
        refreshMembership();
        return 'success';
      }
      if (data.error === 'invalid_code') return 'invalid';
      if (data.error === 'used_code') return 'used';
      return 'error';
    } catch {
      return 'error';
    }
  }, [refreshMembership]);

  return { showToast, dismissToast, handleDonate, handleVerify, handleRedeem, loadingPlan, membership };
}
