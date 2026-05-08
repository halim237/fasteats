import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, MapPin, Plus, CheckCircle2, QrCode, Truck, ArrowLeft, Loader2 } from 'lucide-react';
import { useCart } from '../store/cartStore';
import { restaurantApi } from '../api/restaurants';
import { Layout } from '../components/Layout';
import { motion } from 'framer-motion';
import type { Order, Restaurant } from '../types';
import './RestaurantPage.css';

export const RestaurantPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, createOrder, clearCart, currentUser } = useCart();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);

  // ===== جلب المطعم من قاعدة البيانات =====
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    restaurantApi.getById(id)
      .then((data) => setRestaurant(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePlaceOrder = async () => {
    if (!restaurant) return;
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setOrderLoading(true);
    try {
      const order = await createOrder(restaurant.restaurantId);
      setActiveOrder(order);
      clearCart();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'خطأ في إنشاء الطلب';
      alert(message);
    } finally {
      setOrderLoading(false);
    }
  };

  // ===== حالة التحميل =====
  if (loading) {
    return (
      <Layout showSearch={false}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ opacity: 0.6 }}>Chargement du restaurant...</p>
        </div>
      </Layout>
    );
  }

  if (error || !restaurant) {
    return (
      <Layout showSearch={false}>
        <div className="error-page">
          <p>{error || 'Restaurant non trouvé'}</p>
          <button onClick={() => navigate('/')}>← Retour</button>
        </div>
      </Layout>
    );
  }

  // ===== تأكيد الطلب =====
  if (activeOrder) {
    return (
      <Layout showSearch={false}>
        <main className="main-content order-tracking">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="order-success-card glass"
          >
            <CheckCircle2 size={64} className="icon-success" />
            <h2>Commande Confirmée !</h2>
            <p className="order-id">#{activeOrder.orderId}</p>

            <div className="tracking-steps">
              <div className="step active">
                <Clock size={20} />
                <span>Préparation</span>
              </div>
              <div className="step">
                <Truck size={20} />
                <span>En livraison</span>
              </div>
            </div>

            <div className="qr-section">
              <p>Montrez ce code au livreur :</p>
              <div className="qr-placeholder glass">
                <QrCode size={120} />
                <span className="qr-code-text">{activeOrder.qrSeal.qrCode}</span>
              </div>
              <span className="qr-hint">Sécurisé par FastEats Seal</span>
            </div>

            <div className="order-summary-box">
              <h3>Récapitulatif</h3>
              <div className="summary-row">
                <span>Total</span>
                <span className="bold">{activeOrder.totalPrice.toLocaleString()} DA</span>
              </div>
            </div>
          </motion.div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout showSearch={false} onCheckout={handlePlaceOrder}>
      <div className="restaurant-hero">
        <img src={restaurant.image} alt={restaurant.name} className="hero-img" />
        <div className="hero-overlay">
          <div className="hero-info">
            <button className="back-btn" onClick={() => navigate('/')}>
              <ArrowLeft size={20} />
            </button>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {restaurant.name}
            </motion.h1>
            <div className="hero-meta">
              <div className="meta-item"><Star size={16} fill="currentColor" /> {restaurant.rating}</div>
              <div className="meta-item"><Clock size={16} /> 25-35 min</div>
              <div className="meta-item"><MapPin size={16} /> {restaurant.location}</div>
            </div>
          </div>
        </div>
      </div>

      <main className="main-content">
        <section className="menu-section">
          <div className="section-header">
            <h2>{restaurant.menu.name}</h2>
          </div>
          <div className="menu-grid">
            {restaurant.menu.items.map((item, idx) => (
              <motion.div
                key={item.itemId}
                className="menu-card glass"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="menu-info">
                  <h3>{item.name}</h3>
                  <p className="menu-desc">{item.description}</p>
                  <p className="menu-price">{item.price.toLocaleString()} DA</p>
                </div>
                <div className="menu-action">
                  {item.image && <img src={item.image} alt={item.name} className="menu-img" />}
                  <button
                    className="add-item-btn"
                    onClick={() => addItem(item, restaurant.restaurantId)}
                    disabled={orderLoading}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
};
