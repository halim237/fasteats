import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Clock, ChevronRight, Flame, Utensils, Zap, Coffee, Pizza, Soup, Globe, Heart } from 'lucide-react';
import { Layout } from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../store/cartStore';
import { restaurantApi } from '../api/restaurants';
import { useFavorites } from '../store/favoritesStore';
import type { Restaurant } from '../types';
import './HomePage.css';

const CATEGORIES = [
  { id: 'Tous', name: 'Tous', icon: <Zap size={18} /> },
  { id: 'Favoris', name: 'Favoris', icon: <Heart size={18} /> },
  { id: 'Populaires', name: 'Populaires', icon: <Flame size={18} /> },
  { id: 'Algérien', name: 'Algérien', icon: <Utensils size={18} /> },
  { id: 'Japonais', name: 'Japonais', icon: <Soup size={18} /> },
  { id: 'Italien', name: 'Italien', icon: <Pizza size={18} /> },
  { id: 'Fast Food', name: 'Fast Food', icon: <Zap size={18} /> },
  { id: 'Gourmet', name: 'Gourmet', icon: <Star size={18} /> },
  { id: 'Asiatique', name: 'Asiatique', icon: <Soup size={18} /> },
  { id: 'Desserts', name: 'Desserts', icon: <Coffee size={18} /> },
  { id: 'International', name: 'International', icon: <Globe size={18} /> },
];

export const HomePage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('Tous');
  const { searchQuery, setSearchQuery } = useCart();
  const { favorites, toggleFavorite } = useFavorites();

  // ===== جلب المطاعم من قاعدة البيانات =====
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    restaurantApi.getAll()
      .then((data) => setRestaurants(data))
      .catch((err) => setFetchError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((res) => {
      const isFavTab = activeCategory === 'Favoris';
      const matchesCategory = isFavTab 
        ? favorites.includes(res.restaurantId) 
        : (activeCategory === 'Tous' || res.tags.includes(activeCategory));
      
      const matchesSearch =
        res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [restaurants, activeCategory, searchQuery, favorites]);

  return (
    <Layout>
      <div className="home-container">
        <section className="home-hero">
          <div className="hero-content">
            <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              Le goût de la ville, <span>chez vous.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Profitez des meilleurs menus livrés avec soin.
            </motion.p>
          </div>
        </section>

        <div className="main-content">
          <div className="categories-container">
            <div className="categories-scroll">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.icon}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <section className="restaurants-section">
            <div className="section-header">
              <h2>{activeCategory === 'Tous' ? 'Les plus demandés' : activeCategory}</h2>
              <button
                className="view-all-btn"
                onClick={() => { setActiveCategory('Tous'); setSearchQuery(''); }}
              >
                Tout voir <ChevronRight size={18} />
              </button>
            </div>

            {/* حالة التحميل */}
            {loading && (
              <div className="restaurant-grid">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="premium-card" style={{ minHeight: 280, background: 'var(--glass)', borderRadius: 16, opacity: 0.5, animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            )}

            {/* حالة الخطأ */}
            {fetchError && !loading && (
              <div className="no-results">
                <Search size={48} className="muted-icon" />
                <h3>تعذّر الاتصال بالخادم</h3>
                <p>{fetchError}</p>
                <button className="view-all-btn" onClick={() => window.location.reload()}>
                  إعادة المحاولة
                </button>
              </div>
            )}

            {/* قائمة المطاعم */}
            {!loading && !fetchError && (
              <div className="restaurant-grid">
                <AnimatePresence mode="popLayout">
                  {filteredRestaurants.map((res, index) => (
                    <motion.div
                      key={res.restaurantId}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="premium-card clickable"
                      onClick={() => navigate(`/restaurant/${res.restaurantId}`)}
                    >
                      <div className="res-image-wrapper">
                        <img src={res.image} alt={res.name} />
                        <div className="res-overlay-tag">25-30 min</div>
                        <button 
                          className="favorite-btn" 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(res.restaurantId); }}
                          style={{
                            position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.95)', 
                            border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'all 0.2s ease'
                          }}
                        >
                          <Heart size={20} fill={favorites.includes(res.restaurantId) ? '#ea580c' : 'none'} color={favorites.includes(res.restaurantId) ? '#ea580c' : '#64748b'} />
                        </button>
                      </div>
                      <div className="res-info">
                        <div className="res-header">
                          <h3>{res.name}</h3>
                          <div className="res-rating-chip">
                            <Star size={14} fill="currentColor" />
                            {res.rating}
                          </div>
                        </div>
                        <div className="res-tags">
                          {res.tags.slice(0, 2).map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                        <div className="res-footer">
                          <div className="res-meta-item">
                            <Clock size={14} />
                            <span>150.00 DA</span>
                          </div>
                          <span className="res-delivery-fee">PROMO</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredRestaurants.length === 0 && (
                  <div className="no-results">
                    <Search size={48} className="muted-icon" />
                    <h3>Aucun restaurant trouvé</h3>
                    <p>Essayez une autre recherche ou une autre catégorie.</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
};
