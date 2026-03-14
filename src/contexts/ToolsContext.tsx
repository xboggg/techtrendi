import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { allTools, Tool } from '@/data/tools';

interface ToolUsage {
  toolId: string;
  lastUsed: number;
  useCount: number;
}

interface ToolRating {
  toolId: string;
  rating: number;
  ratedAt: number;
}

interface ToolsContextType {
  favorites: string[];
  recentlyUsed: ToolUsage[];
  ratings: ToolRating[];
  addFavorite: (toolId: string) => void;
  removeFavorite: (toolId: string) => void;
  toggleFavorite: (toolId: string) => void;
  isFavorite: (toolId: string) => boolean;
  recordToolUse: (toolId: string) => void;
  getRecentTools: (limit?: number) => Tool[];
  getMostUsedTools: (limit?: number) => Tool[];
  rateTool: (toolId: string, rating: number) => void;
  getToolRating: (toolId: string) => number | null;
  getAverageRating: (toolId: string) => number;
  getFavoriteTools: () => Tool[];
}

const ToolsContext = createContext<ToolsContextType | undefined>(undefined);

const STORAGE_KEYS = {
  FAVORITES: 'techtrendi_tool_favorites',
  RECENT: 'techtrendi_tool_recent',
  RATINGS: 'techtrendi_tool_ratings',
};

export function ToolsProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<ToolUsage[]>([]);
  const [ratings, setRatings] = useState<ToolRating[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    const savedRecent = localStorage.getItem(STORAGE_KEYS.RECENT);
    const savedRatings = localStorage.getItem(STORAGE_KEYS.RATINGS);

    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Failed to parse favorites', e);
      }
    }

    if (savedRecent) {
      try {
        setRecentlyUsed(JSON.parse(savedRecent));
      } catch (e) {
        console.error('Failed to parse recent tools', e);
      }
    }

    if (savedRatings) {
      try {
        setRatings(JSON.parse(savedRatings));
      } catch (e) {
        console.error('Failed to parse ratings', e);
      }
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  // Save recent to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(recentlyUsed));
  }, [recentlyUsed]);

  // Save ratings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(ratings));
  }, [ratings]);

  const addFavorite = (toolId: string) => {
    setFavorites(prev => {
      if (prev.includes(toolId)) return prev;
      return [...prev, toolId];
    });
  };

  const removeFavorite = (toolId: string) => {
    setFavorites(prev => prev.filter(id => id !== toolId));
  };

  const toggleFavorite = (toolId: string) => {
    if (favorites.includes(toolId)) {
      removeFavorite(toolId);
    } else {
      addFavorite(toolId);
    }
  };

  const isFavorite = (toolId: string) => favorites.includes(toolId);

  const recordToolUse = (toolId: string) => {
    setRecentlyUsed(prev => {
      const existing = prev.find(u => u.toolId === toolId);
      const now = Date.now();

      if (existing) {
        return prev
          .map(u => u.toolId === toolId
            ? { ...u, lastUsed: now, useCount: u.useCount + 1 }
            : u
          )
          .sort((a, b) => b.lastUsed - a.lastUsed)
          .slice(0, 50); // Keep last 50 tools
      }

      return [
        { toolId, lastUsed: now, useCount: 1 },
        ...prev
      ].slice(0, 50);
    });
  };

  const getRecentTools = (limit = 10): Tool[] => {
    const sortedByRecent = [...recentlyUsed].sort((a, b) => b.lastUsed - a.lastUsed);
    return sortedByRecent
      .slice(0, limit)
      .map(u => allTools.find(t => t.id === u.toolId))
      .filter((t): t is Tool => t !== undefined);
  };

  const getMostUsedTools = (limit = 10): Tool[] => {
    const sortedByUse = [...recentlyUsed].sort((a, b) => b.useCount - a.useCount);
    return sortedByUse
      .slice(0, limit)
      .map(u => allTools.find(t => t.id === u.toolId))
      .filter((t): t is Tool => t !== undefined);
  };

  const rateTool = (toolId: string, rating: number) => {
    setRatings(prev => {
      const existing = prev.findIndex(r => r.toolId === toolId);
      const newRating: ToolRating = { toolId, rating, ratedAt: Date.now() };

      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newRating;
        return updated;
      }

      return [...prev, newRating];
    });
  };

  const getToolRating = (toolId: string): number | null => {
    const rating = ratings.find(r => r.toolId === toolId);
    return rating ? rating.rating : null;
  };

  const getAverageRating = (toolId: string): number => {
    // In a real app, this would aggregate all user ratings
    // For now, return the user's rating or a default
    const rating = getToolRating(toolId);
    return rating ?? 4.5;
  };

  const getFavoriteTools = (): Tool[] => {
    return favorites
      .map(id => allTools.find(t => t.id === id))
      .filter((t): t is Tool => t !== undefined);
  };

  return (
    <ToolsContext.Provider value={{
      favorites,
      recentlyUsed,
      ratings,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      isFavorite,
      recordToolUse,
      getRecentTools,
      getMostUsedTools,
      rateTool,
      getToolRating,
      getAverageRating,
      getFavoriteTools,
    }}>
      {children}
    </ToolsContext.Provider>
  );
}

export function useTools() {
  const context = useContext(ToolsContext);
  if (context === undefined) {
    throw new Error('useTools must be used within a ToolsProvider');
  }
  return context;
}
