import { createContext, ReactNode, useContext } from 'react';
import { MembershipInfo } from '../hooks/useDonationReminder';
import { isPlayStoreTWA } from '../utils/platform';

const MembershipContext = createContext<MembershipInfo>({ active: false, plan: null, expiresAt: null });

const TWA_MEMBERSHIP: MembershipInfo = { active: true, plan: null, expiresAt: null };

export function MembershipProvider({ membership, children }: { membership: MembershipInfo; children: ReactNode }) {
  return (
    <MembershipContext.Provider value={isPlayStoreTWA ? TWA_MEMBERSHIP : membership}>
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership(): MembershipInfo {
  return useContext(MembershipContext);
}
