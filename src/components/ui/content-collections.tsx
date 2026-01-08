import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FolderPlus, Folder, MoreVertical, Edit, Trash2, Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CollectionItem {
  id: string;
  title: string;
  slug: string;
  type: 'review' | 'blog' | 'guide';
  image?: string;
  addedAt: string;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  items: CollectionItem[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  color: string;
}

interface CollectionsContextType {
  collections: Collection[];
  createCollection: (name: string, description?: string) => Collection;
  deleteCollection: (id: string) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  addToCollection: (collectionId: string, item: Omit<CollectionItem, 'id' | 'addedAt'>) => void;
  removeFromCollection: (collectionId: string, itemId: string) => void;
  isInCollection: (collectionId: string, slug: string) => boolean;
  getCollectionsForItem: (slug: string) => Collection[];
}

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined);

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#10B981', '#6366F1', '#EF4444', '#14B8A6'];

export function CollectionsProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<Collection[]>(() => {
    const saved = localStorage.getItem('techtrendi_collections');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('techtrendi_collections', JSON.stringify(collections));
  }, [collections]);

  const createCollection = (name: string, description?: string) => {
    const newCollection: Collection = {
      id: Date.now().toString(),
      name,
      description,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: false,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
    setCollections((prev) => [...prev, newCollection]);
    return newCollection;
  };

  const deleteCollection = (id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCollection = (id: string, updates: Partial<Collection>) => {
    setCollections((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      )
    );
  };

  const addToCollection = (collectionId: string, item: Omit<CollectionItem, 'id' | 'addedAt'>) => {
    setCollections((prev) =>
      prev.map((c) => {
        if (c.id !== collectionId) return c;
        if (c.items.some((i) => i.slug === item.slug)) return c;
        return {
          ...c,
          items: [...c.items, { ...item, id: Date.now().toString(), addedAt: new Date().toISOString() }],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const removeFromCollection = (collectionId: string, itemId: string) => {
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collectionId
          ? { ...c, items: c.items.filter((i) => i.id !== itemId), updatedAt: new Date().toISOString() }
          : c
      )
    );
  };

  const isInCollection = (collectionId: string, slug: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    return collection?.items.some((i) => i.slug === slug) ?? false;
  };

  const getCollectionsForItem = (slug: string) => {
    return collections.filter((c) => c.items.some((i) => i.slug === slug));
  };

  return (
    <CollectionsContext.Provider
      value={{
        collections,
        createCollection,
        deleteCollection,
        updateCollection,
        addToCollection,
        removeFromCollection,
        isInCollection,
        getCollectionsForItem,
      }}
    >
      {children}
    </CollectionsContext.Provider>
  );
}

export function useCollections() {
  const context = useContext(CollectionsContext);
  if (!context) {
    throw new Error('useCollections must be used within CollectionsProvider');
  }
  return context;
}

export function CollectionsList({ className }: { className?: string }) {
  const { collections, createCollection, deleteCollection } = useCollections();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    if (newName.trim()) {
      createCollection(newName.trim());
      setNewName('');
      setIsCreating(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">My Collections</h3>
        <Button variant="outline" size="sm" onClick={() => setIsCreating(true)}>
          <FolderPlus className="w-4 h-4 mr-2" />
          New
        </Button>
      </div>
      {isCreating && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Collection name..."
            className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-sm"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button onClick={handleCreate} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => setIsCreating(false)} className="p-1.5 text-muted-foreground hover:bg-muted rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {collections.length === 0 && !isCreating ? (
        <div className="text-center py-8">
          <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="font-medium text-foreground mb-2">No collections yet</h4>
          <p className="text-sm text-muted-foreground mb-4">Create collections to organize your saved content</p>
          <Button onClick={() => setIsCreating(true)}>
            <FolderPlus className="w-4 h-4 mr-2" />
            Create Collection
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${collection.color}20` }}>
                <Folder className="w-5 h-5" style={{ color: collection.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">{collection.name}</h4>
                <p className="text-sm text-muted-foreground">{collection.items.length} items</p>
              </div>
              <button
                onClick={() => deleteCollection(collection.id)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AddToCollectionButtonProps {
  item: Omit<CollectionItem, 'id' | 'addedAt'>;
  className?: string;
}

export function AddToCollectionButton({ item, className }: AddToCollectionButtonProps) {
  const { collections, addToCollection, removeFromCollection, isInCollection, createCollection } = useCollections();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleToggle = (collectionId: string) => {
    if (isInCollection(collectionId, item.slug)) {
      const collection = collections.find((c) => c.id === collectionId);
      const collectionItem = collection?.items.find((i) => i.slug === item.slug);
      if (collectionItem) removeFromCollection(collectionId, collectionItem.id);
    } else {
      addToCollection(collectionId, item);
    }
  };

  const handleCreate = () => {
    if (newName.trim()) {
      const collection = createCollection(newName.trim());
      addToCollection(collection.id, item);
      setNewName('');
      setIsCreating(false);
    }
  };

  const itemCollections = collections.filter((c) => isInCollection(c.id, item.slug));

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
          itemCollections.length > 0 ? 'bg-primary/10 text-primary' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
        )}
      >
        <FolderPlus className="w-4 h-4" />
        <span className="text-sm">{itemCollections.length > 0 ? `In ${itemCollections.length} collection${itemCollections.length > 1 ? 's' : ''}` : 'Add to collection'}</span>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-50 p-2">
            <div className="max-h-64 overflow-y-auto space-y-1">
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleToggle(collection.id)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: `${collection.color}20` }}>
                    <Folder className="w-4 h-4" style={{ color: collection.color }} />
                  </div>
                  <span className="flex-1 text-sm text-foreground truncate">{collection.name}</span>
                  {isInCollection(collection.id, item.slug) && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
            <div className="border-t border-border mt-2 pt-2">
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="New collection..."
                    className="flex-1 px-2 py-1 bg-background border border-border rounded text-sm"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  />
                  <button onClick={handleCreate} className="p-1 text-green-500">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center gap-2 p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New collection
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CollectionsList;
