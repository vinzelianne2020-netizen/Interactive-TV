import { ChevronsRight } from 'lucide-react';

export function Header({ title, subtitle, onActionClick }) {
  return (
    <header className="header-shell">
      <div>
        <p className="eyebrow">Interactive bulletin board</p>
        <h1 className="header-title">{title}</h1>
        <p className="header-subtitle">{subtitle}</p>
      </div>
      <button
        type="button"
        className="header-action"
        aria-label="Open admin controls"
        onClick={() => onActionClick?.()}
      >
        <ChevronsRight size={34} strokeWidth={2.6} />
      </button>
    </header>
  );
}
