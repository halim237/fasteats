import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useCart } from '../store/cartStore';
import { Layout } from '../components/Layout';
import { BrandLogo } from '../components/BrandLogo';
import { motion } from 'framer-motion';
import './LoginPage.css';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, authLoading, authError } = useCart();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      const user = useCart.getState().currentUser;
      if (user?.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <Layout showSearch={false}>
      <div className="login-container">
        <motion.div
          className="login-card glass"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="login-header">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <BrandLogo size={64} />
            </div>
            <h1>Bienvenue sur FastEats</h1>
            <p>Connectez-vous pour commander vos plats préférés</p>
          </div>

          {authError && (
            <div className="login-error">
              <AlertCircle size={18} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <Mail size={20} className="input-icon" />
              <input
                type="email"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <Lock size={20} className="input-icon" />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-submit-btn" disabled={authLoading}>
              {authLoading ? (
                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Connexion...</>
              ) : (
                <>Se connecter <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="login-footer">
            Nouveau sur FastEats ?{' '}
            <a href="#" onClick={() => navigate('/register')}>Créer un compte</a>
          </p>
        </motion.div>
      </div>
    </Layout>
  );
};
