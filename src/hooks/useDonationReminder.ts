import { useState, useEffect, useCallback } from 'react';

const WORKER_URL = 'https://neocalcu-donations.diegosteinberg.workers.dev';

const OPEN_COUNT_KEY = 'neo_open_count';
const DONATED_AT_KEY = 'neo_donated_at';
const DEVICE_ID_KEY = 'neo_device_id';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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
  return Date.now() - parseInt(donatedAt) < THIRTY_DAYS_MS;
}

interface VerifyResponse {
  donated: boolean;
  timestamp?: string;
}

interface CreatePaymentResponse {
  init_point: string;
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

  const handleDonate = useCallback(async () => {
    setLoading(true);
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch(`${WORKER_URL}/crear-pago?device=${deviceId}`);
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
        setShowToast(false);
      }
    } catch {
      // Sin conexión — falla silenciosamente
    }
  }, []);

  return { showToast, dismissToast, handleDonate, handleVerify, loading };
}
