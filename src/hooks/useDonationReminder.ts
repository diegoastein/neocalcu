import { useState, useEffect, useCallback } from 'react';
import { trackEvent } from '../utils/analytics';

const WORKER_URL = 'https://neocalcu-donations.diegosteinberg.workers.dev';

const OPEN_COUNT_KEY = 'neo_open_count';
const DONATED_AT_KEY = 'neo_donated_at';
const DONATED_PLAN_KEY = 'neo_donated_plan';
const DEVICE_ID_KEY = 'neo_device_id';
const EMAIL_REGISTERED_KEY = 'neo_email_registered';
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
  email?: string;
  error?: string;
}

interface UserData {
  favorites: string[];
  notes: Record<string, string>;
}

export type RedeemResult = 'success' | 'invalid' | 'used' | 'error';
export type RecoverResult = 'success' | 'not_found' | 'expired' | 'error';
export type RegisterEmailResult = 'success' | 'error';

export function useDonationReminder() {
  const [showToast, setShowToast] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<'mensual' | 'anual' | null>(null);
  const [membership, setMembership] = useState<MembershipInfo>(() => getMembershipInfo());

  const refreshMembership = useCallback(() => {
    setMembership(getMembershipInfo());
  }, []);

  const syncUserDataNow = useCallback(async () => {
    try {
      const deviceId = getOrCreateDeviceId();
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]') as string[];
      const notes = JSON.parse(localStorage.getItem('neo_procedure_notes') || '{}') as Record<string, string>;
      await fetch(`${WORKER_URL}/guardar-datos?device=${deviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites, notes }),
      });
    } catch {
      // fail silently
    }
  }, []);

  useEffect(() => {
    const count = parseInt(localStorage.getItem(OPEN_COUNT_KEY) || '0') + 1;
    localStorage.setItem(OPEN_COUNT_KEY, count.toString());

    // Si la membresía está activa en localStorage, no hace falta llamar al worker.
    // Pero si el email no está registrado, recordárselo en cada apertura.
    if (isDonationActive()) {
      if (!localStorage.getItem(EMAIL_REGISTERED_KEY)) setShowEmailCapture(true);
      // Sincronizar favoritos y notas al worker si el email está registrado
      if (localStorage.getItem(EMAIL_REGISTERED_KEY)) {
        syncUserDataNow();
      }
      return;
    }
    // Sin membresía en localStorage: siempre verificar contra el worker.
    // Así se restaura automáticamente si el storage fue borrado pero el device_id sigue en KV.
    const deviceId = getOrCreateDeviceId();
    fetch(`${WORKER_URL}/verificar?device=${deviceId}`)
      .then(res => res.json())
      .then((data: VerifyResponse) => {
        if (data.donated) {
          localStorage.setItem(DONATED_AT_KEY, data.timestamp ?? Date.now().toString());
          if (data.plan) localStorage.setItem(DONATED_PLAN_KEY, data.plan);
          refreshMembership();
        } else if (count % 3 === 0) {
          setShowToast(true);
        }
      })
      .catch(() => {
        // Sin conexión — no molestar al usuario
      });
  }, [refreshMembership, syncUserDataNow]);

  // Sync al salir/minimizar la app para no perder cambios hechos durante la sesión
  useEffect(() => {
    const handleHide = () => {
      if (isDonationActive() && localStorage.getItem(EMAIL_REGISTERED_KEY)) {
        syncUserDataNow();
      }
    };
    document.addEventListener('visibilitychange', handleHide);
    return () => document.removeEventListener('visibilitychange', handleHide);
  }, [syncUserDataNow]);

  const dismissToast = useCallback(() => {
    setShowToast(false);
  }, []);

  const dismissEmailCapture = useCallback(() => {
    setShowEmailCapture(false);
  }, []);

  const handleDonate = useCallback(async (plan: 'mensual' | 'anual' = 'mensual') => {
    setLoadingPlan(plan);
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch(`${WORKER_URL}/crear-pago?device=${deviceId}&plan=${plan}`);
      const data: CreatePaymentResponse = await res.json();
      trackEvent('payment_started', { plan });
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
        trackEvent('payment_success', { plan: data.plan ?? 'mensual' });
        setShowToast(false);
        refreshMembership();
        if (!localStorage.getItem(EMAIL_REGISTERED_KEY)) {
          setShowEmailCapture(true);
        } else {
          syncUserDataNow();
        }
      }
    } catch {
      // Sin conexión — falla silenciosamente
    }
  }, [refreshMembership, syncUserDataNow]);

  const handleRedeem = useCallback(async (code: string): Promise<RedeemResult> => {
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch(`${WORKER_URL}/canjear-cupon?device=${deviceId}&code=${encodeURIComponent(code.trim().toUpperCase())}`);
      const data: RedeemResponse = await res.json();
      if (data.success) {
        localStorage.setItem(DONATED_AT_KEY, Date.now().toString());
        localStorage.setItem(DONATED_PLAN_KEY, data.plan ?? 'mensual');
        // Si el cupón tenía email asignado, ya está registrado en KV — no hace falta el modal
        if (data.email) localStorage.setItem(EMAIL_REGISTERED_KEY, '1');
        trackEvent('coupon_redeemed', { plan: data.plan ?? 'mensual' });
        setShowToast(false);
        refreshMembership();
        if (!localStorage.getItem(EMAIL_REGISTERED_KEY)) {
          setShowEmailCapture(true);
        } else {
          syncUserDataNow();
        }
        return 'success';
      }
      if (data.error === 'invalid_code') return 'invalid';
      if (data.error === 'used_code') return 'used';
      return 'error';
    } catch {
      return 'error';
    }
  }, [refreshMembership, syncUserDataNow]);

  const handleRecover = useCallback(async (email: string): Promise<RecoverResult> => {
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch(`${WORKER_URL}/recuperar?device=${deviceId}&email=${encodeURIComponent(email.trim().toLowerCase())}`);
      const data = await res.json() as { success: boolean; error?: string; plan?: 'mensual' | 'anual'; timestamp?: string; userData?: UserData };
      if (data.success) {
        localStorage.setItem(DONATED_AT_KEY, data.timestamp ?? Date.now().toString());
        localStorage.setItem(DONATED_PLAN_KEY, data.plan ?? 'mensual');
        // Restaurar favoritos y notas si el worker los devolvió
        if (data.userData) {
          if (data.userData.favorites?.length) {
            localStorage.setItem('favorites', JSON.stringify(data.userData.favorites));
          }
          if (data.userData.notes && Object.keys(data.userData.notes).length) {
            localStorage.setItem('neo_procedure_notes', JSON.stringify(data.userData.notes));
          }
          window.dispatchEvent(new CustomEvent('neo:data-restored'));
        }
        setShowToast(false);
        refreshMembership();
        return 'success';
      }
      if (data.error === 'not_found') return 'not_found';
      if (data.error === 'expired') return 'expired';
      return 'error';
    } catch {
      return 'error';
    }
  }, [refreshMembership]);

  const handleRegisterEmail = useCallback(async (email: string): Promise<RegisterEmailResult> => {
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch(
        `${WORKER_URL}/registrar-email?device=${deviceId}&email=${encodeURIComponent(email.trim().toLowerCase())}`
      );
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.success) {
        localStorage.setItem(EMAIL_REGISTERED_KEY, '1');
        setShowEmailCapture(false);
        // Ahora que email y dispositivo están vinculados, subir datos inmediatamente
        syncUserDataNow();
        return 'success';
      }
      return 'error';
    } catch {
      return 'error';
    }
  }, [syncUserDataNow]);

  return {
    showToast, dismissToast,
    showEmailCapture, dismissEmailCapture,
    handleDonate, handleVerify, handleRedeem, handleRecover, handleRegisterEmail,
    loadingPlan, membership,
  };
}
