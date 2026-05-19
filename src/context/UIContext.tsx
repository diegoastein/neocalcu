import { createContext, useContext } from 'react';

const UIContext = createContext(false);

export const useAnyModalOpen = () => useContext(UIContext);
export const UIProvider = UIContext.Provider;
