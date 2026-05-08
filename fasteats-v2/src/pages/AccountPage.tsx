import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Package, LogOut, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { useCart } from '../store/cartStore';
import { Layout } from '../components/Layout';
import { api } from '../api/apiClient';
import './AccountPage.css';

export const AccountPage = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      api.get<any[]>('/orders/my')
        .then(data => {
          setOrders(data);
        })
        .catch(err => console.error("Erreur de chargement des commandes", err))
        .finally(() => setLoading(false));
    }
  }, [currentUser]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#fbbf24';
      case 'preparing': return '#60a5fa';
      case 'delivering': return '#a855f7';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <Layout showSearch={false}>
      <div className="account-container">
        <div className="account-header">
          <div className="profile-badge">
            {currentUser.name.charAt(0)}
          </div>
          <div className="profile-info">
            <h1>{currentUser.name}</h1>
            <p>Membre FastEats depuis 2024</p>
          </div>
          <button className="logout-btn-outline" onClick={handleLogout}>
            <LogOut size={18} /> Déconnexion
          </button>
        </div>

        <div className="account-grid">
          <section className="account-section glass">
            <div className="section-title">
              <User size={20} className="icon-navy" />
              <h2>Informations personnelles</h2>
            </div>
            <div className="info-list">
              <div className="info-item">
                <Mail size={18} />
                <div className="details">
                  <label>Email</label>
                  <span>{currentUser.email}</span>
                </div>
              </div>
              <div className="info-item">
                <Phone size={18} />
                <div className="details">
                  <label>Téléphone</label>
                  <span>{currentUser.phone}</span>
                </div>
              </div>
              <div className="info-item">
                <MapPin size={18} />
                <div className="details">
                  <label>Adresse par défaut</label>
                  <span>{currentUser.address || 'Aucune adresse spécifiée'}</span>
                </div>
              </div>
            </div>
            <button className="edit-profile-btn">Modifier le profil</button>
          </section>

          <section className="account-section glass">
            <div className="section-title">
              <Package size={20} className="icon-navy" />
              <h2>Historique des commandes</h2>
            </div>
            
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Loader2 className="spin" size={32} style={{ color: '#ea580c' }} />
              </div>
            ) : orders.length === 0 ? (
              <div className="orders-placeholder">
                <div className="empty-state">
                  <Package size={48} className="muted-icon" />
                  <p>Vous n'avez pas encore passé de commande.</p>
                  <button className="start-order-btn" onClick={() => navigate('/')}>
                    Commander maintenant <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div key={order.order_id} className="order-history-card">
                    <div className="order-header">
                      <div>
                        <h3>{order.restaurant_name}</h3>
                        <p className="order-date">
                          <Clock size={14} style={{ display: 'inline', marginRight: 4 }} />
                          {new Date(order.order_time).toLocaleString('fr-FR', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span style={{
                        background: getStatusColor(order.status) + '15',
                        color: getStatusColor(order.status),
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textTransform: 'capitalize'
                      }}>
                        {order.status}
                      </span>
                    </div>
                    
                    <div className="order-footer">
                      <div className="order-meta">
                        <span className="order-id">#{order.order_id.slice(0, 8)}</span>
                        <span className="order-price">{parseFloat(order.total_price).toLocaleString()} DA</span>
                      </div>
                      <button className="view-order-btn">Détails <ChevronRight size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
};
