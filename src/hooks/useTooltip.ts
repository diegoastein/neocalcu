import { useState } from 'react';

export function useTooltip(key: string) {
  const storageKey = `neo_tip_${key}`;
  const [visible, setVisible] = useState(() => localStorage.getItem(storageKey) !== '1');

  const dismiss = () => {
    localStorage.setItem(storageKey, '1');
    setVisible(false);
  };

  return { visible, dismiss };
}
