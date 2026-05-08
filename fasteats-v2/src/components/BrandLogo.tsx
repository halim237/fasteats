import logoImg from '../assets/6028503856192359647.jpg';

export const BrandLogo = ({ size = 40 }: { size?: number }) => (
  <img 
    src={logoImg} 
    alt="FastEats Logo" 
    width={size} 
    height={size} 
    style={{ borderRadius: '8px', objectFit: 'contain' }} 
  />
);
