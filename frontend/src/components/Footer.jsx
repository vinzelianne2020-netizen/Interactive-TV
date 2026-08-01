import { Building2, Users2 } from 'lucide-react';

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
        <Building2 size={28} strokeWidth={2.4} />
        <div>
          <p className="footer-brand__name">{companyName}</p>
          <p className="footer-brand__tagline">{tagline}™</p>
        </div>
      </div>
    </button>
  );
}
