import { Bell, Building2, Gift, LayoutGrid, Megaphone, Menu, ShieldCheck, User, Users, Users2 } from 'lucide-react';

const items = [
  { icon: Menu, label: 'Menu' },
  { icon: LayoutGrid, label: 'Dashboard', active: true },
  { icon: Users, label: 'Teams' },
  { icon: Gift, label: 'Perks' },
  { icon: User, label: 'Profile' },
  { icon: Users2, label: 'People' },
  { icon: Megaphone, label: 'Announcements' },
  { icon: ShieldCheck, label: 'Safety' },
  { icon: Bell, label: 'Alerts' },
  { icon: Building2, label: 'Company' },
];

export function SidebarNav() {
  return (
    <aside className="sidebar-rail" aria-label="Primary navigation">
      {items.map(({ icon: Icon, label, active }) => (
        <button
          key={label}
          type="button"
          className={active ? 'sidebar-item sidebar-item--active' : 'sidebar-item'}
          aria-label={label}
          aria-current={active ? 'page' : undefined}
        >
          <Icon size={22} strokeWidth={2.5} />
        </button>
      ))}
    </aside>
  );
}
