import { Users2 } from 'lucide-react';
import logo from '../assets/logo.png';

export function Footer({ message, thanks, companyName = 'Knowles', tagline = 'Life above all', onClick }) {
  return (
    <button type="button" className="footer-card footer-card--interactive" onClick={() => onClick?.()}>
      <div className="footer-card__copy">
        <span className="footer-card__icon">
          <Users2 size={22} strokeWidth={2.4} />
        </span>
        <div>
          <p className="footer-card__message">{message}</p>
          <p className="footer-card__thanks">{thanks}</p>
        </div>
      </div>
      <div className="footer-brand">
        <img src={logo} alt={`${companyName} logo`} className="footer-brand__logo" />
        <div>
          <p className="footer-brand__name">{companyName.toLowerCase()}</p>
          <p className="footer-brand__tagline">{tagline}</p>
        </div>
      </div>
    </button>
  );
}
