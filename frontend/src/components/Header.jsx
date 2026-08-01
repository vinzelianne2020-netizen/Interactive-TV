import { ChevronsLeft } from 'lucide-react';

export function Header({ title, subtitle, onActionClick }) {
  return (
    <header className="header-shell">
      <div>
        <h1 className="header-title">{title}</h1>
        <p className="header-subtitle">{subtitle}</p>
      </div>
      <button
        type="button"
        className="header-action"
        aria-label="Open admin controls"
        onClick={() => onActionClick?.()}
      >
        <ChevronsLeft size={38} strokeWidth={2.8} />
      </button>
    </header>
  );
}
