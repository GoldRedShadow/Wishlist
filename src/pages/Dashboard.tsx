import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, ArrowRight, Check, Trash2, Edit3, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

interface Wishlist {
  id: string;
  title: string;
  creatorId: string;
  image: string;
  createdAt: any;
}

const AVAILABLE_IMAGES = [
  { id: 'linen', url: '/linen.png', label: 'Klassisches Leinen' },
  { id: 'abstract', url: '/abstract.png', label: 'Moderne Abstraktion' },
  { id: 'birthday', url: '/birthday.png', label: 'Feierlichkeit' },
  { id: 'tech', url: '/tech.png', label: 'Innovation' },
  { id: 'travel', url: '/travel.png', label: 'Entdeckung' },
  { id: 'fashion', url: '/fashion.png', label: 'Eleganz' },
];

export default function Dashboard() {
  const { user, loginWithGoogle, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [lists, setLists] = useState<Wishlist[]>([]);
  
  // Create / Edit state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [listTitle, setListTitle] = useState('');
  const [selectedImage, setSelectedImage] = useState(AVAILABLE_IMAGES[0].url);

  // Sync with Firestore
  useEffect(() => {
    if (!user) {
      setLists([]);
      return;
    }

    const q = query(
      collection(db, "wishlists"), 
      where("creatorId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLists = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Wishlist[];
      setLists(fetchedLists);
    });

    return () => unsubscribe();
  }, [user]);

  const handleOpenCreate = () => {
    setEditingListId(null);
    setListTitle('');
    setSelectedImage(AVAILABLE_IMAGES[0].url);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, list: Wishlist) => {
    e.stopPropagation();
    setEditingListId(list.id);
    setListTitle(list.title);
    setSelectedImage(list.image);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listTitle.trim() || !user) return;
    
    try {
      if (editingListId) {
        await updateDoc(doc(db, "wishlists", editingListId), {
          title: listTitle.trim(),
          image: selectedImage
        });
      } else {
        await addDoc(collection(db, "wishlists"), {
          title: listTitle.trim(),
          creatorId: user.uid,
          image: selectedImage,
          createdAt: serverTimestamp()
        });
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error saving wishlist:", error);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Möchtest du diese gesamte Wunschliste wirklich löschen?")) {
      try {
        await deleteDoc(doc(db, "wishlists", id));
      } catch (error) {
        console.error("Error deleting wishlist:", error);
      }
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <p className="title-sm">Wird geladen...</p>
    </div>
  );

  if (!user) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
        <header style={{ marginBottom: '4rem' }}>
          <h1 className="display-lg">Deine Wunschlisten.</h1>
          <p className="title-sm" style={{ opacity: 0.7, marginTop: '1.5rem' }}>Bitte melde dich an, um deine Listen zu verwalten.</p>
        </header>
        <button className="btn-primary" onClick={loginWithGoogle} style={{ padding: '1.5rem 3rem' }}>
          <LogIn size={20} /> Mit Google anmelden
        </button>
      </div>
    );
  }

  return (
    <div className="container section-padding">
      <header className="dashboard-header">
        <div style={{ maxWidth: '800px' }}>
          <p className="label-md" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} /> Willkommen zurück, {user.displayName?.split(' ')[0] || 'Kurator'}
          </p>
          <h1 className="display-lg">Deine Wunschlisten.</h1>
          <p className="title-sm" style={{ color: 'var(--primary)', marginTop: '1.5rem', opacity: 0.8, maxWidth: '600px' }}>
            Deine private Sammlung von Sehnsüchten und Ästhetik.
          </p>
        </div>
        <button className="btn-tertiary" onClick={logout} style={{ fontSize: '1rem', textDecoration: 'none' }}>
          <LogOut size={18} /> Abmelden
        </button>
      </header>

      <div className="editorial-divider">
        <span className="label-md">Deine Wunschlisten ({lists.length})</span>
      </div>

      <div className="grid-masonry">
        <div className="card" style={{ minHeight: 'clamp(300px, 50vh, 450px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: 'var(--surface-container-low)', border: '1px dashed var(--outline-variant)', boxShadow: 'none' }}>
          {isFormOpen ? (
            <form onSubmit={handleSubmit} style={{ width: '100%', animation: 'fadeIn 0.5s ease' }}>
              <label className="input-label">{editingListId ? "Wunschliste bearbeiten" : "Name der Wunschliste"}</label>
              <input
                autoFocus
                className="input-field"
                placeholder="z.B. Sommer-Reisen"
                value={listTitle}
                onChange={(e) => setListTitle(e.target.value)}
                style={{ marginBottom: '2rem' }}
              />

              <label className="input-label" style={{ marginBottom: '1rem' }}>Thema wählen</label>
              <div className="image-selection-grid">
                {AVAILABLE_IMAGES.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImage(img.url)}
                    style={{ 
                      position: 'relative',
                      height: '60px', 
                      borderRadius: 'var(--radius-sm)', 
                      overflow: 'hidden',
                      border: selectedImage === img.url ? '2px solid var(--on-surface)' : '1px solid var(--outline-variant)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <img src={img.url} alt={img.label} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: selectedImage === img.url ? 1 : 0.6 }} />
                    {selectedImage === img.url && (
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'var(--on-surface)', borderRadius: '50%', padding: '2px', color: 'white' }}>
                        <Check size={12} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button type="submit" className="btn-primary">{editingListId ? "Speichern" : "Initialisieren"}</button>
                <button type="button" className="btn-tertiary" onClick={() => setIsFormOpen(false)}>Abbrechen</button>
              </div>
            </form>
          ) : (
            <button 
              className="btn-tertiary" 
              style={{ fontSize: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}
              onClick={handleOpenCreate}
            >
              <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'var(--surface)' }}>
                <Plus size={32} />
              </div>
              Wunschliste erstellen
            </button>
          )}
        </div>

        {lists.map((list) => (
          <div 
            key={list.id} 
            className="card" 
            onClick={() => navigate(`/list/${list.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-image-wrapper">
              <img src={list.image} alt={list.title} />
              
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={(e) => handleOpenEdit(e, list)}
                  style={{ backgroundColor: 'var(--surface-bright)', backdropFilter: 'blur(10px)', padding: '0.5rem', borderRadius: '50%' }}
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={(e) => handleDelete(e, list.id)}
                  style={{ backgroundColor: 'var(--surface-bright)', backdropFilter: 'blur(10px)', padding: '0.5rem', borderRadius: '50%', color: '#a66a68' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="card-content">
              <h2 className="title-lg" style={{ marginBottom: '1rem' }}>{list.title}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <span className="label-md" style={{ color: 'inherit' }}>Entdecken</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
