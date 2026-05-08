import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Truck, MapPin, CheckCircle, Navigation, Loader2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/apiClient';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../store/cartStore'; 
import './DriverPage.css';

interface Order {
  order_id: string;
  total_price: string;
  order_time: string;
  status: string;
  restaurant_name: string;
  restaurant_location: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_id: string | null;
  delivery_status?: string;
}

export const DriverPage = () => {
  const [activeTab, setActiveTab] = useState<'available' | 'my_deliveries'>('available');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentUser } = useCart();

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => {} });

  const [messageDialog, setMessageDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isError: boolean;
  }>({ isOpen: false, title: '', message: '', isError: false });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.role !== 'Driver' && currentUser.role !== 'Admin') {
      alert('Accès refusé. Vous devez être un chauffeur pour accéder à cette page.');
      navigate('/');
      return;
    }
    fetchOrders();
  }, [activeTab, currentUser, navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'available' ? '/drivers/orders/available' : '/drivers/orders/my';
      const data = await api.get<Order[]>(endpoint);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await api.post(`/drivers/orders/${orderId}/accept`, {});
      setMessageDialog({
        isOpen: true,
        title: 'Succès',
        message: 'Commande acceptée avec succès !',
        isError: false
      });
      setActiveTab('my_deliveries');
    } catch (err: any) {
      setMessageDialog({
        isOpen: true,
        title: 'Erreur',
        message: err.message || 'Erreur lors de l\'acceptation de la commande',
        isError: true
      });
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Confirmez-vous que cette commande a été livrée au client ?',
      onConfirm: async () => {
        try {
          await api.post(`/drivers/orders/${orderId}/deliver`, {});
          setMessageDialog({
            isOpen: true,
            title: 'Livraison réussie',
            message: 'Commande marquée comme livrée !',
            isError: false
          });
          fetchOrders();
        } catch (err: any) {
          setMessageDialog({
            isOpen: true,
            title: 'Erreur',
            message: err.message || 'Erreur lors de la mise à jour du statut',
            isError: true
          });
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <Layout showSearch={false}>
      <div className="driver-container">
        <header className="driver-header">
          <div>
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              Espace Chauffeur
            </motion.h1>
            <p>Gérez vos livraisons et gagnez de l'argent avec FastEats.</p>
          </div>
          <div className="driver-status">
            <span className="status-dot"></span>
            En ligne
          </div>
        </header>

        <div className="driver-tabs">
          <button 
            className={activeTab === 'available' ? 'active' : ''} 
            onClick={() => setActiveTab('available')}
          >
            Nouvelles Commandes
          </button>
          <button 
            className={activeTab === 'my_deliveries' ? 'active' : ''} 
            onClick={() => setActiveTab('my_deliveries')}
          >
            Mes Livraisons
          </button>
        </div>

        <main className="driver-main">
          {loading ? (
            <div className="driver-loading">
              <Loader2 size={40} className="spin" />
              <p>Chargement des données...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="driver-empty">
              <Truck size={64} />
              <h3>Aucune commande trouvée</h3>
              <p>{activeTab === 'available' ? 'Il n\'y a pas de nouvelles commandes pour le moment. Réessayez plus tard.' : 'Vous n\'avez aucune livraison en cours.'}</p>
              <button className="refresh-btn" onClick={fetchOrders}>Rafraîchir</button>
            </div>
          ) : (
            <div className="orders-grid">
              <AnimatePresence>
                {orders.map((order, i) => (
                  <motion.div 
                    key={order.order_id}
                    className="order-card glass"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="order-card-header">
                      <div className="order-id-badge">#{order.order_id.slice(0, 8)}</div>
                      <div className="order-price">{parseFloat(order.total_price).toFixed(2)} DA</div>
                    </div>
                    
                    <div className="order-route">
                      <div className="route-point pickup">
                        <MapPin size={18} />
                        <div>
                          <strong>{order.restaurant_name}</strong>
                          <span>{order.restaurant_location}</span>
                        </div>
                      </div>
                      <div className="route-line"></div>
                      <div className="route-point dropoff">
                        <Navigation size={18} />
                        <div>
                          <strong>{order.customer_name}</strong>
                          <span>{order.customer_address}</span>
                          <span className="phone">{order.customer_phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="order-card-footer">
                      {activeTab === 'available' ? (
                        <button className="accept-btn" onClick={() => handleAcceptOrder(order.order_id)}>
                          Accepter la livraison
                        </button>
                      ) : (
                        <button className="deliver-btn" onClick={() => handleMarkDelivered(order.order_id)}>
                          <CheckCircle size={18} />
                          Marquer comme livré
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="modal-overlay" style={{ zIndex: 10000 }}>
            <motion.div 
              className="modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ maxWidth: 400, textAlign: 'center', padding: '2rem' }}
            >
              <div style={{ marginBottom: '1.5rem', color: '#3b82f6' }}>
                <CheckCircle size={48} style={{ margin: '0 auto' }} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
                Confirmation
              </h2>
              <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.5 }}>
                {confirmDialog.message}
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: '12px',
                    background: '#f1f5f9', color: '#0f172a', fontWeight: 700,
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmDialog.onConfirm}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: '12px',
                    background: '#3b82f6', color: 'white', fontWeight: 700,
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {messageDialog.isOpen && (
          <div className="modal-overlay" style={{ zIndex: 10000 }}>
            <motion.div 
              className="modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ maxWidth: 400, textAlign: 'center', padding: '2rem' }}
            >
              <div style={{ marginBottom: '1.5rem', color: messageDialog.isError ? '#ef4444' : '#10b981' }}>
                {messageDialog.isError ? (
                  <XCircle size={48} style={{ margin: '0 auto' }} />
                ) : (
                  <CheckCircle size={48} style={{ margin: '0 auto' }} />
                )}
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
                {messageDialog.title}
              </h2>
              <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.5 }}>
                {messageDialog.message}
              </p>
              <button 
                onClick={() => setMessageDialog(prev => ({ ...prev, isOpen: false }))}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '12px',
                  background: messageDialog.isError ? '#ef4444' : '#10b981', color: 'white', fontWeight: 700,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                Fermer
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
};
