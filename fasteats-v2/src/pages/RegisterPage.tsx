import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Phone, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { useCart } from '../store/cartStore';
import { BrandLogo } from '../components/BrandLogo';
import { motion } from 'framer-motion';
import './LoginPage.css';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { registerUser, authLoading, authError } = useCart();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await registerUser(formData);
    if (success) {
      setIsSuccess(true);
      setTimeout(() => navigate('/'), 1500);
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
            <h1>Créer un compte</h1>
            <p>Rejoignez FastEats pour une expérience de livraison d'élite</p>
          </div>

          {isSuccess ? (
            <motion.div
              className="register-success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="success-icon-bg">✓</div>
              <h2>Compte créé avec succès !</h2>
              <p>Votre compte a été enregistré dans notre base de données. Redirection...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleRegister} className="login-form">
              {authError && (
                <div className="login-error" style={{ marginBottom: 12 }}>
                  <span>{authError}</span>
                </div>
              )}

              <div className="input-group">
                <UserIcon size={20} className="input-icon" />
                <input
                  type="text"
                  placeholder="Nom complet"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <Mail size={20} className="input-icon" />
                <input
                  type="email"
                  placeholder="Adresse email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <Phone size={20} className="input-icon" />
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="input-group">
                <MapPin size={20} className="input-icon" />
                <input
                  type="text"
                  placeholder="Adresse de livraison"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="input-group">
                <Lock size={20} className="input-icon" />
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="login-submit-btn" disabled={authLoading}>
                {authLoading ? (
                  <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Création...</>
                ) : (
                  <>S'inscrire <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          )}

          <p className="login-footer">
            Déjà un compte ?{' '}
            <a href="#" onClick={() => navigate('/login')}>Se connecter</a>
          </p>
        </motion.div>
      </div>
    </Layout>
  );
};
