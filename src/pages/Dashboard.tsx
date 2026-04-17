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
  serverTimestamp
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Deletion confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Sync with Firestore
  useEffect(() => {
    if (!user) {
      setLists([]);
      return;
    }

    const q = query(
      collection(db, "wishlists"), 
      where("creatorId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLists = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Wishlist[];
      
      // Sort client-side to avoid needing a composite index
      fetchedLists.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
        const timeB = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
        return timeB - timeA;
      });
      
      setLists(fetchedLists);
    }, (error) => {
      console.error("Error fetching wishlists:", error);
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
    if (confirmDeleteId === id) {
      try {
        await deleteDoc(doc(db, "wishlists", id));
        setConfirmDeleteId(null);
      } catch (error) {
        console.error("Error deleting wishlist:", error);
      }
    } else {
      setConfirmDeleteId(id);
      // Automatically clear confirm state after 3 seconds
      setTimeout(() => {
        setConfirmDeleteId((prev) => (prev === id ? null : prev));
      }, 3000);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <p className="title-sm">Wird geladen...</p>
    </div>
  );

  if (!user) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
        <header style={{ marginBottom: '4rem' }}>
          <h1 className="display-lg">Deine Wunschlisten.</h1>
          <p className="title-sm" style={{ opacity: 0.7, marginTop: '1.5rem' }}>Bitte melde dich an, um deine Listen zu verwalten.</p>
        </header>
        <button className="btn-primary" onClick={loginWithGoogle} style={{ padding: '1.5rem 3rem' }}>
          <LogIn size={20} /> Mit Google anmelden
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container section-padding"
    >
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
        <motion.div layout className="card" style={{ minHeight: 'clamp(300px, 50vh, 450px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: 'var(--surface-container-low)', border: '1px dashed var(--outline-variant)', boxShadow: 'none' }}>
          {isFormOpen ? (
            <motion.form 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleSubmit} 
              style={{ width: '100%' }}
            >
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
            </motion.form>
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
        </motion.div>

        <AnimatePresence mode="popLayout">
          {lists.map((list) => (
            <motion.div 
              layout
              layoutId={`list-${list.id}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
                    style={{ 
                      backgroundColor: confirmDeleteId === list.id ? '#a66a68' : 'var(--surface-bright)', 
                      color: confirmDeleteId === list.id ? 'white' : '#a66a68',
                      backdropFilter: 'blur(10px)', 
                      padding: '0.5rem', 
                      borderRadius: '50%',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: confirmDeleteId === list.id ? '0.5rem' : '0',
                      paddingRight: confirmDeleteId === list.id ? '1rem' : '0.5rem',
                      paddingLeft: confirmDeleteId === list.id ? '1rem' : '0.5rem',
                    }}
                  >
                    <Trash2 size={16} />
                    {confirmDeleteId === list.id && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 600 }}>Sicher?</span>}
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
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
