import { createContext, ReactNode, useContext } from 'react';
import { MembershipInfo } from '../hooks/useDonationReminder';

const MembershipContext = createContext<MembershipInfo>({ active: false, plan: null, expiresAt: null });

export function MembershipProvider({ membership, children }: { membership: MembershipInfo; children: ReactNode }) {
  return (
    <MembershipContext.Provider value={membership}>
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership(): MembershipInfo {
  return useContext(MembershipContext);
}
