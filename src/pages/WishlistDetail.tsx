import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Gift, Check, Share, Plus, Trash2, CheckCircle2, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { 
  doc, 
  setDoc,
  onSnapshot, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';

interface Wish {
  id: string;
  name: string;
  url: string;
  price?: string;
  isGranted?: boolean;
}

interface Reservation {
  id: string; // wishId
  reservedBy: string;
}

interface Wishlist {
  title: string;
  creatorId: string;
  image: string;
}

export default function WishlistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [reservations, setReservations] = useState<Record<string, Reservation>>({});
  const [loading, setLoading] = useState(true);

  // Derive Guest View: If explicitly shared OR if current user is not the creator
  const isCreator = user && wishlist && user.uid === wishlist.creatorId;
  const isGuestView = !isCreator;

  // 1. Fetch Wishlist Metadata
  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, "wishlists", id), (docSnap) => {
      if (docSnap.exists()) {
        setWishlist(docSnap.data() as Wishlist);
      } else {
        navigate('/');
      }
    }, (error) => {
      console.error("Error fetching wishlist metadata:", error);
      navigate('/');
    });
    return () => unsubscribe();
  }, [id, navigate]);

  // 2. Fetch Wishes
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "wishlists", id, "wishes"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Wish[];
      setWishes(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching wishes:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  // 3. Fetch Reservations (Secret: Creator will fail this due to Security Rules)
  useEffect(() => {
    // If we already know we are the creator, don't even try to subscribe.
    // This avoids "Permission Denied" errors in the console.
    if (!id || isCreator) {
      setReservations({});
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "wishlists", id, "reservations"), 
      (snapshot) => {
        const resMap: Record<string, Reservation> = {};
        snapshot.docs.forEach(doc => {
          resMap[doc.id] = { id: doc.id, ...doc.data() } as Reservation;
        });
        setReservations(resMap);
      },
      (_error) => {
        // This will trigger if the user becomes the creator or if rules change
        console.log("Secrecy active: Reservation data hidden.");
        setReservations({}); 
      }
    );
    return () => unsubscribe();
  }, [id, isCreator]);

  // Add Item State
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newPrice, setNewPrice] = useState('');

  // Editing State
  const [editingWishId, setEditingWishId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // Reservation State for Guest
  const [reservingWishId, setReservingWishId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');

  const handleAddWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !id) return;

    try {
      const wishData: any = {
        name: newName.trim(),
        url: newUrl.trim(),
        isGranted: false,
        createdAt: serverTimestamp()
      };
      if (newPrice.trim()) wishData.price = newPrice.trim();

      await addDoc(collection(db, "wishlists", id, "wishes"), wishData);
      setNewName(''); setNewUrl(''); setNewPrice(''); setIsAdding(false);
    } catch (e: any) {
      console.error(e);
      alert("Fehler beim Hinzufügen: " + (e.message || "Unbekannter Fehler"));
    }
  };

  const handleStartEdit = (wish: Wish) => {
    if (isGuestView) return;
    setEditingWishId(wish.id);
    setEditName(wish.name);
    setEditUrl(wish.url);
    setEditPrice(wish.price || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editingWishId || !id) return;

    try {
      const wishData: any = {
        name: editName.trim(),
        url: editUrl.trim()
      };
      if (editPrice.trim()) wishData.price = editPrice.trim();
      else wishData.price = null; // Use null to clear it if it was there before

      await updateDoc(doc(db, "wishlists", id, "wishes", editingWishId), wishData);
      setEditingWishId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenReserve = (e: React.MouseEvent, wishId: string) => {
    e.stopPropagation();
    setReservingWishId(wishId);
  };

  const handleConfirmReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservingWishId || !guestName.trim() || !id) return;

    try {
      // Ensure user is at least anonymously authenticated
      let currentUid = user?.uid;
      if (!currentUid) {
        const { signInAnonymously } = await import("firebase/auth");
        const { auth } = await import("../firebase/config");
        const cred = await signInAnonymously(auth);
        currentUid = cred.user.uid;
      }

      await setDoc(doc(db, "wishlists", id, "reservations", reservingWishId), {
        reservedBy: guestName.trim(),
        reservedByUid: currentUid,
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error reserving wish:", error);
      alert("Reservierung fehlgeschlagen. Bitte versuche es erneut.");
    }

    setReservingWishId(null);
    setGuestName('');
  };

  const handleCancelReserve = async (e: React.MouseEvent, wishId: string) => {
    e.stopPropagation();
    if (!id) return;
    try {
      await deleteDoc(doc(db, "wishlists", id, "reservations", wishId));
    } catch (e) { console.error(e); }
  };

  const handleToggleGranted = async (e: React.MouseEvent, wishId: string, currentStatus?: boolean) => {
    e.stopPropagation();
    if (!id) return;
    try {
      await updateDoc(doc(db, "wishlists", id, "wishes", wishId), {
        isGranted: !currentStatus
      });
    } catch (e) { console.error(e); }
  };

  const handleDeleteItem = async (e: React.MouseEvent, wishId: string) => {
    e.stopPropagation();
    if (!id) return;
    if (confirm("Möchtest du diesen Wunsch wirklich unwiderruflich löschen?")) {
      try {
        await deleteDoc(doc(db, "wishlists", id, "wishes", wishId));
      } catch (e) { console.error(e); }
    }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/list/${id}?shared=true`;
    navigator.clipboard.writeText(url);
    alert('Link in die Zwischenablage kopiert!');
  };

  const activeWishes = wishes.filter(w => !w.isGranted);
  const grantedWishes = wishes.filter(w => w.isGranted);

  const renderWishItem = (wish: Wish, isGrantedSection: boolean = false) => {
    const reservation = reservations[wish.id];

    if (editingWishId === wish.id) {
      return (
        <div key={`edit-${wish.id}`} className="card" style={{ padding: '2rem', border: '1px solid var(--outline-variant)' }}>
          <h3 className="title-lg" style={{ marginBottom: '2rem' }}>Wunsch bearbeiten</h3>
          <form onSubmit={handleSaveEdit}>
            <div style={{ marginBottom: '2rem' }}>
              <label className="input-label">Titel des Wunsches</label>
              <input autoFocus className="input-field" value={editName} onChange={e => setEditName(e.target.value)} required />
            </div>
            <div className="form-grid">
              <div>
                <label className="input-label">Shop-Link (URL)</label>
                <input type="url" className="input-field" value={editUrl} onChange={e => setEditUrl(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Preis (Optional)</label>
                <input className="input-field" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn-primary">Speichern</button>
              <button type="button" className="btn-tertiary" onClick={() => setEditingWishId(null)}>Abbrechen</button>
            </div>
          </form>
        </div>
      );
    }

    return (
      <div key={wish.id} className="wish-item" onClick={() => handleStartEdit(wish)} style={{ opacity: isGrantedSection ? 0.6 : 1, filter: isGrantedSection ? 'grayscale(80%)' : 'none' }}>
        <div style={{ flex: 1 }}>
          <h2 className="title-lg" style={{ marginBottom: '0.5rem', textDecoration: isGrantedSection ? 'line-through' : 'none', color: isGrantedSection ? 'var(--outline-variant)' : 'var(--on-surface)' }}>
            {wish.name}
          </h2>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            {wish.price && <span className="label-md" style={{ color: 'var(--on-surface)' }}>{wish.price}</span>}
            {wish.url && (
              <a href={wish.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }} className="btn-tertiary" onClick={(e) => e.stopPropagation()}>
                <span style={{ fontSize: '0.875rem', fontFamily: 'var(--font-sans)' }}>Zum Shop</span>
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>

        <div className="hover-actions-wrapper" style={{ marginLeft: 'auto', zIndex: 2 }}>
          {!isGuestView && (
            <>
              <button onClick={(e) => handleToggleGranted(e, wish.id, wish.isGranted)} className="hover-action-btn">
                <span className="label-part">{wish.isGranted ? 'Rückgängig' : 'Erfüllt'}</span>
                <span className="icon-part"><CheckCircle2 size={16} /></span>
              </button>
              <button onClick={(e) => handleDeleteItem(e, wish.id)} className="hover-action-btn delete-btn">
                <span className="label-part">Löschen</span>
                <span className="icon-part"><Trash2 size={16} /></span>
              </button>
            </>
          )}

          {isGuestView && !isGrantedSection && (
            <>
              {reservation ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div className="chip" style={{ background: 'var(--surface)', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)' }}>
                    <Check size={16} /> Reserviert von {reservation.reservedBy}
                  </div>
                  {/* Only show cancel button if the current user is the one who reserved it */}
                  {(user?.uid === (reservation as any).reservedByUid) && (
                    <button onClick={(e) => handleCancelReserve(e, wish.id)} className="btn-tertiary" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                      Löschen
                    </button>
                  )}
                </div>
              ) : (
                <button onClick={(e) => handleOpenReserve(e, wish.id)} className="btn-primary">
                  <Gift size={16} /> Schenken
                </button>
              )}
            </>
          )}
          
          {isGuestView && isGrantedSection && (
            <div className="chip" style={{ background: 'transparent', color: 'var(--outline-variant)' }}>
              Bereits erhalten
            </div>
          )}
        </div>

        {/* Modal handled at top level */}
      </div>
    );
  };

  if (loading || !wishlist) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <p className="title-sm">Inhalte werden geladen...</p>
    </div>
  );

  return (
    <>
      <nav className="nav-glass main-nav">
        <button className="btn-tertiary" onClick={() => navigate('/')} style={{ textDecoration: 'none', fontSize: '1rem' }}>
          <ArrowLeft size={18} /> Zurück
        </button>
        {!isGuestView && (
          <button className="btn-tertiary" onClick={copyShareLink} style={{ textDecoration: 'none', fontSize: '1rem' }}>
            <Share size={18} /> Link kopieren
          </button>
        )}
      </nav>

      <div className="wishlist-hero">
        <img src={wishlist.image} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div className="hero-content">
          <div className="container" style={{ padding: 0 }}>
            <h1 className="display-lg" style={{ marginBottom: '0.5rem' }}>{wishlist.title}.</h1>
            <p className="title-sm" style={{ opacity: 0.8 }}>
              {isGuestView ? "Eine kuratierte Wunschliste. Du kannst Wünsche anonym reservieren." : "Deine private Wunschliste. Klicke auf einen Wunsch zum Bearbeiten."}
            </p>
          </div>
        </div>
      </div>

      <main className="container" style={{ maxWidth: '900px', paddingBottom: '8rem' }}>
        {!isGuestView && (
          <div style={{ marginBottom: '4rem' }}>
            {isAdding ? (
              <div className="card" style={{ padding: '2rem' }}>
                <h3 className="title-lg" style={{ marginBottom: '2rem' }}>Neuen Wunsch hinzufügen</h3>
                <form onSubmit={handleAddWish}>
                  <div style={{ marginBottom: '2rem' }}>
                    <label className="input-label">Name des Wunsches</label>
                    <input autoFocus className="input-field" placeholder="z.B. Vintage Ledertasche" value={newName} onChange={e => setNewName(e.target.value)} required />
                  </div>
                  <div className="form-grid">
                    <div>
                      <label className="input-label">Shop-Link (URL)</label>
                      <input type="url" className="input-field" placeholder="https://" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                    </div>
                    <div>
                      <label className="input-label">Preis (Optional)</label>
                      <input className="input-field" placeholder="z.B. 350,00 €" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn-primary">Hinzufügen</button>
                    <button type="button" className="btn-tertiary" onClick={() => setIsAdding(false)}>Verwerfen</button>
                  </div>
                </form>
              </div>
            ) : (
              <button 
                className="btn-tertiary" 
                onClick={() => setIsAdding(true)}
                style={{ fontSize: '1.25rem', padding: '1rem 0' }}
              >
                <Plus size={20} /> Wunsch hinzufügen
              </button>
            )}
          </div>
        )}

        <div className="editorial-divider">
          <span className="label-md" style={{ letterSpacing: '0.1em' }}>Offene Wünsche</span>
        </div>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '4rem' }}>
          {activeWishes.map((wish) => renderWishItem(wish, false))}
          {activeWishes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem 0', opacity: 0.5 }}>
              <p className="title-sm" style={{ fontStyle: 'italic' }}>Aktuell keine offenen Wünsche.</p>
            </div>
          )}
        </section>

        {grantedWishes.length > 0 && (
          <>
            <div className="editorial-divider">
              <span className="label-md" style={{ letterSpacing: '0.1em', color: 'var(--outline-variant)' }}>Bereits erhalten</span>
            </div>
            <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {grantedWishes.map((wish) => renderWishItem(wish, true))}
            </section>
          </>
        )}
      </main>

      {reservingWishId && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} 
          onClick={() => setReservingWishId(null)}
        >
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="title-lg" style={{ marginBottom: '1.5rem' }}>Reservierung</h3>
            <p className="label-md" style={{ marginBottom: '2rem', textTransform: 'none' }}>Bitte gib deinen Namen an.</p>
            <form onSubmit={handleConfirmReserve}>
              <div style={{ marginBottom: '2rem' }}>
                <label className="input-label">Dein Name</label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={18} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                  <input autoFocus className="input-field" style={{ paddingLeft: '2rem' }} placeholder="z.B. Lukas" value={guestName} onChange={e => setGuestName(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Bestätigen</button>
                <button type="button" className="btn-tertiary" onClick={() => setReservingWishId(null)}>Abbrechen</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
