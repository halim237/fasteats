import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, Settings, Truck } from 'lucide-react';
import { useCart } from '../store/cartStore';
import { CartDrawer } from './CartDrawer';
import { motion } from 'framer-motion';
import { BrandLogo } from './BrandLogo';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
  onCheckout?: () => void;
}

export const Layout = ({ children, showSearch = true, onCheckout }: LayoutProps) => {
  const navigate = useNavigate();
  const { items, setDrawerOpen, currentUser, searchQuery, setSearchQuery } = useCart();
  const cartCount = items.length;

  return (
    <div className="app-layout">
      <header className="header glass">
        <div className="nav-content">
          <motion.div 
            className="logo" 
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <BrandLogo size={70} />
          </motion.div>
          
          {showSearch && (
            <div className="search-bar-container">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Plats, cuisines, restaurants..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          <div className="header-actions">
             {currentUser ? (
               <div className="user-profile-bar-group">
                 {(currentUser.role === 'Admin' || currentUser.role === 'Driver') && (
                   <button 
                     className="admin-link-btn"
                     onClick={() => navigate('/driver')}
                     title="Espace Chauffeur"
                     style={currentUser.role === 'Driver' ? { background: '#ecfdf5', color: '#10b981', borderColor: '#10b981' } : {}}
                   >
                     <Truck size={20} />
                   </button>
                 )}
                 {currentUser.role === 'Admin' && (
                   <button 
                     className="admin-link-btn"
                     onClick={() => navigate('/admin')}
                     title="Dashboard Admin"
                   >
                     <Settings size={20} />
                   </button>
                 )}
                 <div className="user-profile-bar" onClick={() => navigate('/account')} style={{ cursor: 'pointer' }}>
                   <span className="user-name">Bonjour, {currentUser.name.split(' ')[0]}</span>
                   <button className="icon-btn">
                     <User size={22} />
                   </button>
                 </div>
               </div>
            ) : (
              <button className="icon-btn profile-btn" onClick={() => navigate('/login')}>
                <User size={22} />
              </button>
            )}
            
            <button onClick={() => setDrawerOpen(true)} className="cart-trigger-btn">
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="cart-badge"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </header>

      <motion.main 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="layout-main"
      >
        {children}
      </motion.main>

      <CartDrawer onCheckout={onCheckout} />

      {/* Replacement Modal */}
      {useCart().pendingReplacement && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <motion.div 
            className="modal-content"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ maxWidth: 400, textAlign: 'center', padding: '2rem' }}
          >
            <div style={{ marginBottom: '1.5rem', color: '#ea580c' }}>
              <ShoppingBag size={48} style={{ margin: '0 auto' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
              Vider le panier ?
            </h2>
            <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.5 }}>
              Votre panier contient déjà des plats d'un autre restaurant. Voulez-vous le vider pour pouvoir commander dans ce nouveau restaurant ?
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => useCart.getState().setPendingReplacement(null)}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '12px',
                  background: '#f1f5f9', color: '#0f172a', fontWeight: 700,
                  border: 'none', cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button 
                onClick={() => useCart.getState().confirmReplacement()}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '12px',
                  background: '#ea580c', color: 'white', fontWeight: 700,
                  border: 'none', cursor: 'pointer'
                }}
              >
                Oui, vider
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
