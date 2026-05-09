import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import {
  Users, Store, ShoppingBag, Settings, Plus,
  Search, ChevronRight, Edit2, Trash2, Loader2, X, TrendingUp
} from 'lucide-react';
import { api } from '../api/apiClient';
import type { Restaurant } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import './AdminPage.css';

interface AdminStats {
  restaurantCount: number;
  orderCount: number;
  userCount: number;
  monthlyRevenue?: number;
}

type TabType = 'restaurants' | 'orders' | 'users' | 'settings';

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('restaurants');
  const [searchTerm, setSearchTerm] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<AdminStats>({ restaurantCount: 0, orderCount: 0, userCount: 0, monthlyRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Custom Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => {} });

  // Form State
  const [newRes, setNewRes] = useState({
    name: '',
    location: '',
    phone: '',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    tags: 'Pizza, Burger'
  });

  // Menu Management State
  const [manageMenuResId, setManageMenuResId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({
    name: '', price: 0, description: '', image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&q=80&w=400', isAvailable: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resData, statsData, ordersData] = await Promise.all([
        api.get<Restaurant[]>('/restaurants'),
        api.get<AdminStats>('/admin/stats').catch(() => ({ restaurantCount: 0, orderCount: 0, userCount: 0, monthlyRevenue: 0 })),
        api.get<any[]>('/orders/admin').catch(() => []),
      ]);
      setRestaurants(resData);
      setOrders(ordersData);
      
      // Fallback: If stats API returns 0 but we have items, use the local length
      setStats({
        restaurantCount: statsData.restaurantCount || resData.length,
        orderCount: statsData.orderCount || ordersData.length,
        userCount: statsData.userCount,
        monthlyRevenue: statsData.monthlyRevenue
      });
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') {
      api.get<any[]>('/orders/admin').then(setOrders).catch(console.error);
    }
  }, [activeTab]);

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      setOrders(orders.map(o => o.order_id === orderId ? { ...o, status } : o));
    } catch (err) {
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleEditClick = (res: Restaurant) => {
    setEditingId(res.restaurantId);
    setNewRes({
      name: res.name,
      location: res.location,
      phone: res.phone,
      image: res.image,
      tags: (res.tags || []).join(', ')
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Voulez-vous vraiment supprimer ce restaurant ?',
      onConfirm: async () => {
        try {
          await api.delete(`/restaurants/${id}`);
          setRestaurants(restaurants.filter(r => r.restaurantId !== id));
          setStats(prev => ({ ...prev, restaurantCount: prev.restaurantCount - 1 }));
        } catch (err) {
          alert('Erreur lors de la suppression');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSaveRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newRes,
        tags: newRes.tags.split(',').map(t => t.trim())
      };

      if (editingId) {
        await api.patch(`/restaurants/${editingId}`, payload);
      } else {
        await api.post('/restaurants', payload);
      }

      setIsModalOpen(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleManageMenu = async (restaurantId: string) => {
    setManageMenuResId(restaurantId);
    setLoading(true);
    try {
      const res = await api.get<Restaurant>(`/restaurants/${restaurantId}?all=true`);
      setMenuItems(res.menu?.items || []);
    } catch (err) {
      alert('Erreur de chargement du menu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageMenuResId) return;
    try {
      await api.post(`/restaurants/${manageMenuResId}/menu`, newMenuItem);
      setIsMenuModalOpen(false);
      setNewMenuItem({ name: '', price: 0, description: '', image: newMenuItem.image, isAvailable: true });
      // Refresh menu
      handleManageMenu(manageMenuResId);
    } catch (err) {
      alert('Erreur lors de l\'ajout de l\'article');
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    if (!manageMenuResId) return;
    setConfirmDialog({
      isOpen: true,
      message: 'Voulez-vous vraiment supprimer cet article ?',
      onConfirm: async () => {
        try {
          await api.delete(`/restaurants/${manageMenuResId}/menu/${itemId}`);
          handleManageMenu(manageMenuResId);
        } catch (err) {
          alert('Erreur lors de la suppression de l\'article');
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    if (!manageMenuResId) return;
    try {
      await api.patch(`/restaurants/${manageMenuResId}/menu/${itemId}/availability`, { isAvailable: !currentStatus });
      // Refresh menu
      handleManageMenu(manageMenuResId);
    } catch (err) {
      alert('Erreur lors de la mise à jour de la disponibilité');
    }
  };

  const filteredRestaurants = restaurants.filter((res) =>
    res.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(o => 
    o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.order_id?.includes(searchTerm)
  );

  const statCards = [
    { label: 'Restaurants', value: stats.restaurantCount, icon: <Store />, color: '#FF7D33', bg: '#fff7ed' },
    { label: 'Commandes', value: stats.orderCount, icon: <ShoppingBag />, color: '#020617', bg: '#f1f5f9' },
    { label: 'Utilisateurs', value: stats.userCount, icon: <Users />, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Revenu Total', value: `${stats.monthlyRevenue?.toFixed(2)} DA`, icon: <TrendingUp />, color: '#FF7D33', bg: '#fff7ed' },
  ];

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

  const renderContent = () => {
    return (
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'restaurants' && !manageMenuResId && (
          <>
            <div className="table-header">
              <div className="table-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Rechercher un restaurant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                <Loader2 size={40} className="spin" style={{ color: '#FF7D33' }} />
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Restaurant</th>
                    <th>Localisation</th>
                    <th>Note</th>
                    <th>Menu</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRestaurants.map((res) => (
                    <tr key={res.restaurantId}>
                      <td>
                        <div className="table-res-cell">
                          <img src={res.image} alt={res.name} />
                          <div className="name-area">
                            <span className="res-name">{res.name}</span>
                            <span className="res-id">ID: {res.restaurantId.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td>{res.location}</td>
                      <td>
                        <div className="rating-pill">
                          <StarIcon size={14} fill="#FF7D33" stroke="#FF7D33" />
                          {res.rating}
                        </div>
                      </td>
                      <td>
                        {(res.menu as any)?.itemsCount ?? (res.menu?.items?.length) ?? 0} Articles
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="action-btn" onClick={() => handleEditClick(res)} title="Modifier"><Edit2 size={16} /></button>
                          <button className="action-btn delete" onClick={() => handleDelete(res.restaurantId)} title="Supprimer"><Trash2 size={16} /></button>
                          <button className="action-btn" onClick={() => handleManageMenu(res.restaurantId)} title="Gérer le Menu"><ChevronRight size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {activeTab === 'restaurants' && manageMenuResId && (
          <div className="menu-manager">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <button 
                onClick={() => setManageMenuResId(null)}
                style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, color: '#64748b' }}
              >
                <ArrowLeft size={18} /> Retour aux restaurants
              </button>
              <button 
                className="save-btn" 
                onClick={() => setIsMenuModalOpen(true)}
              >
                <Plus size={16} style={{ display: 'inline', marginRight: 4 }} />
                Ajouter un article
              </button>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                <Loader2 size={40} className="spin" style={{ color: '#FF7D33' }} />
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Description</th>
                    <th>Prix</th>
                    <th>Disponibilité</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map((item: any) => (
                    <tr key={item.itemId}>
                      <td>
                        <div className="table-res-cell">
                          {item.image && <img src={item.image} alt={item.name} />}
                          <span className="res-name">{item.name}</span>
                        </div>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{item.description}</td>
                      <td style={{ fontWeight: 700, color: '#1e293b' }}>{parseFloat(item.price).toFixed(2)} DA</td>
                      <td>
                        <span 
                          onClick={() => handleToggleAvailability(item.itemId, item.isAvailable)}
                          title="Cliquez pour changer la disponibilité"
                          style={{ 
                            padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
                            background: item.isAvailable ? '#ecfdf5' : '#fef2f2',
                            color: item.isAvailable ? '#10b981' : '#ef4444',
                            cursor: 'pointer'
                          }}
                        >
                          {item.isAvailable ? 'Disponible' : 'Épuisé'}
                        </span>
                      </td>
                      <td>
                        <button className="action-btn delete" onClick={() => handleDeleteMenuItem(item.itemId)} title="Supprimer">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {menuItems.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        Aucun article dans ce menu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <>
            <div className="table-header">
              <div className="table-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Chercher commande ou client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID Commande</th>
                  <th>Client</th>
                  <th>Restaurant</th>
                  <th>Total</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.order_id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{order.order_id.slice(0, 8)}</span></td>
                    <td>{order.customer_name}</td>
                    <td>{order.restaurant_name}</td>
                    <td style={{ fontWeight: 700, color: '#1e293b' }}>{parseFloat(order.total_price).toFixed(2)} DA</td>
                    <td>
                      <span style={{ 
                        background: getStatusColor(order.status) + '15',
                        color: getStatusColor(order.status),
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        display: 'inline-block'
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <select 
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.order_id, e.target.value)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          fontSize: '0.85rem',
                          background: '#f8fafc',
                          fontWeight: 600,
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="pending">En attente</option>
                        <option value="preparing">Préparation</option>
                        <option value="delivering">Livraison</option>
                        <option value="delivered">Livré</option>
                        <option value="cancelled">Annulé</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {activeTab === 'users' && (
          <div style={{ padding: '6rem 0', textAlign: 'center' }}>
            <Users size={64} style={{ opacity: 0.1, marginBottom: 24, color: '#0f172a' }} />
            <h2 style={{ color: '#0f172a', fontSize: '1.75rem', marginBottom: '0.5rem' }}>Gestion des Utilisateurs</h2>
            <p style={{ color: '#64748b' }}>Vous avez actuellement {stats.userCount} membres inscrits.</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ padding: '6rem 0', textAlign: 'center' }}>
            <Settings size={64} style={{ opacity: 0.1, marginBottom: 24, color: '#0f172a' }} />
            <h2 style={{ color: '#0f172a', fontSize: '1.75rem', marginBottom: '0.5rem' }}>Paramètres du Système</h2>
            <p style={{ color: '#64748b' }}>Configuration globale de la plateforme FastEats.</p>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <Layout showSearch={false}>
      <div className="admin-container">
        <aside className="admin-sidebar">
          <div className="sidebar-header">
            <Settings size={20} />
            <span>Dashboard Admin</span>
          </div>
          <nav className="sidebar-nav">
            <button 
              className={activeTab === 'restaurants' ? 'active' : ''} 
              onClick={() => setActiveTab('restaurants')}
            >
              <Store size={20} /> Restaurants
            </button>
            <button 
              className={activeTab === 'orders' ? 'active' : ''} 
              onClick={() => setActiveTab('orders')}
            >
              <ShoppingBag size={20} /> Commandes
            </button>
            <button 
              className={activeTab === 'users' ? 'active' : ''} 
              onClick={() => setActiveTab('users')}
            >
              <Users size={20} /> Utilisateurs
            </button>
            <button 
              className={activeTab === 'settings' ? 'active' : ''} 
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={20} /> Paramètres
            </button>
          </nav>
        </aside>

        <main className="admin-main">
          <header className="admin-main-header">
            <div className="title-area">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {activeTab === 'restaurants' ? 'Gestion des Restaurants' : 
                 activeTab === 'orders' ? 'Suivi des Commandes' :
                 activeTab === 'users' ? 'Utilisateurs' : 'Paramètres'}
              </motion.h1>
              <p>Interface de pilotage FastEats v2.0</p>
            </div>
            {activeTab === 'restaurants' && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="add-res-btn" 
                onClick={() => { setEditingId(null); setIsModalOpen(true); }}
              >
                <Plus size={20} /> Nouveau Restaurant
              </motion.button>
            )}
          </header>

          <div className="stats-grid">
            {statCards.map((stat, i) => (
              <motion.div 
                key={i} 
                className="stat-card" 
                style={{ color: stat.color }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="stat-icon" style={{ background: stat.bg }}>{stat.icon}</div>
                <div className="stat-info">
                  <span className="stat-label">{stat.label}</span>
                  <span className="stat-value">{stat.value}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="admin-table-container">
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay">
            <motion.div 
              className="modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>{editingId ? 'Modifier le Restaurant' : 'Nouveau Restaurant'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveRestaurant} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label>Nom du Restaurant</label>
                <input required type="text" value={newRes.name} onChange={e => setNewRes({...newRes, name: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Localisation</label>
                  <input required type="text" value={newRes.location} onChange={e => setNewRes({...newRes, location: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Téléphone</label>
                  <input required type="text" value={newRes.phone} onChange={e => setNewRes({...newRes, phone: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>URL Image</label>
                <input type="text" value={newRes.image} onChange={e => setNewRes({...newRes, image: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Tags (Pizza, FastFood...)</label>
                <input type="text" value={newRes.tags} onChange={e => setNewRes({...newRes, tags: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Annuler</button>
                <button type="submit" className="save-btn">Enregistrer</button>
              </div>
            </form>
          </motion.div>
        </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMenuModalOpen && (
          <div className="modal-overlay">
            <motion.div 
              className="modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Ajouter un Article</h2>
              <button onClick={() => setIsMenuModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveMenuItem} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label>Nom de l'article</label>
                <input required type="text" value={newMenuItem.name} onChange={e => setNewMenuItem({...newMenuItem, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" value={newMenuItem.description} onChange={e => setNewMenuItem({...newMenuItem, description: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Prix (DA)</label>
                  <input required type="number" min="0" step="0.01" value={newMenuItem.price || ''} onChange={e => setNewMenuItem({...newMenuItem, price: parseFloat(e.target.value)})} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newMenuItem.isAvailable} onChange={e => setNewMenuItem({...newMenuItem, isAvailable: e.target.checked})} style={{ width: 'auto', padding: 0, height: 'auto' }} />
                    Disponible
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label>URL Image</label>
                <input type="text" value={newMenuItem.image} onChange={e => setNewMenuItem({...newMenuItem, image: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setIsMenuModalOpen(false)}>Annuler</button>
                <button type="submit" className="save-btn">Ajouter</button>
              </div>
            </form>
          </motion.div>
        </div>
        )}
      </AnimatePresence>

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
              <div style={{ marginBottom: '1.5rem', color: '#ef4444' }}>
                <Trash2 size={48} style={{ margin: '0 auto' }} />
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
                    background: '#ef4444', color: 'white', fontWeight: 700,
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  Oui, supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

const StarIcon = ({ size, fill, stroke }: { size: number; fill: string; stroke: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
