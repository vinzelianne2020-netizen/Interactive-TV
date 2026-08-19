import {
  Award,
  Bell,
  Building2,
  CalendarDays,
  Gift,
  HandCoins,
  House,
  Leaf,
  ShieldCheck,
  Sofa,
  UserPlus,
} from 'lucide-react';

const ICON_MAP = {
  dashboard: House,
  holidays: CalendarDays,
  benefits: HandCoins,
  awards: Award,
  new_hires: UserPlus,
  training: Bell,
  safety: ShieldCheck,
  esg: Leaf,
  amenities: Sofa,
  menu: Building2,
  perks: Gift,
};

export function SidebarNav({ items = [], activeKey = 'dashboard', onSelect }) {
  return (
    <aside className="sidebar-rail" aria-label="Primary navigation">
      {items.map((item) => {
        const Icon = ICON_MAP[item.key] ?? CalendarDays;
        const isActive = item.key === activeKey || (item.default && !activeKey);

        return (
          <button
            key={item.key}
            type="button"
            className={`sidebar-item ${isActive ? 'sidebar-item--active' : ''}`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onSelect?.(item.key)}
          >
            <Icon size={22} strokeWidth={2.5} />
          </button>
        );
      })}
    </aside>
  );
}
