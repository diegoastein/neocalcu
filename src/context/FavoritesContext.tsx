import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { trackEvent } from '../utils/analytics';

interface FavoritesContextType {
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('favorites');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  // Escuchar evento de restauración tras recuperar suscripción
  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem('favorites');
      setFavorites(stored ? new Set(JSON.parse(stored)) : new Set());
    };
    window.addEventListener('neo:data-restored', handler);
    return () => window.removeEventListener('neo:data-restored', handler);
  }, []);

  const toggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
      trackEvent('favorite_added', { id });
    }
    setFavorites(newFavorites);
  };

  const isFavorite = (id: string) => favorites.has(id);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites debe usarse dentro de FavoritesProvider');
  }
  return context;
}
