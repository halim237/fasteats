import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '../store/cartStore';
import type { MenuItem } from '../types';
import './CartDrawer.css';

interface CartDrawerProps {
  onCheckout?: () => void;
}

export const CartDrawer = ({ onCheckout }: CartDrawerProps) => {
  const { items, isDrawerOpen, setDrawerOpen, updateQuantity, removeItem, getTotal } = useCart();

  // Group items for display
  const groupedItems = items.reduce((acc, item) => {
    const existing = acc.find(i => i.item.itemId === item.itemId);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ item, count: 1 });
    }
    return acc;
  }, [] as { item: MenuItem; count: number }[]);

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
            className="drawer-overlay"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="drawer-content"
          >
            <div className="drawer-header">
              <div className="header-title">
                <ShoppingBag className="icon-primary" />
                <h2>Votre Panier</h2>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="close-btn">
                <X size={24} />
              </button>
            </div>

            <div className="drawer-items">
              {groupedItems.length === 0 ? (
                <div className="empty-cart">
                  <ShoppingBag size={64} opacity={0.2} />
                  <p>Votre panier est vide</p>
                  <span>Ajoutez des plats délicieux !</span>
                </div>
              ) : (
                groupedItems.map(({ item, count }) => (
                  <div key={item.itemId} className="cart-item">
                    {item.image && <img src={item.image} alt={item.name} className="item-img" />}
                    <div className="item-info">
                      <h3>{item.name}</h3>
                      <p className="item-price">{item.price.toLocaleString()} DA</p>
                      <div className="item-controls">
                        <div className="quantity-selector">
                          <button onClick={() => updateQuantity(item.itemId, -1)}><Minus size={14} /></button>
                          <span>{count}</span>
                          <button onClick={() => updateQuantity(item.itemId, 1)}><Plus size={14} /></button>
                        </div>
                        <button onClick={() => removeItem(item.itemId)} className="delete-btn">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="drawer-footer">
                <div className="total-row">
                  <span>Total</span>
                  <span className="total-amount">{getTotal().toLocaleString()} DA</span>
                </div>
                <button className="checkout-btn" onClick={onCheckout}>
                  Passer à la commande
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
