import React from 'react';
import { NavLink } from 'react-router-dom';

type NavItem = {
  to: string;
  label: string;
};

const items: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/goals', label: 'Goals' },
  { to: '/chat', label: 'Chat' },
  { to: '/recommendations', label: 'Audit • Log' },
];

export default function BottomNav() {
  return (
    <div className="bottomNav" role="navigation" aria-label="Primary">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          className={({ isActive }) => (isActive ? 'bottomNavItem active' : 'bottomNavItem')}
        >
          {it.label}
        </NavLink>
      ))}
    </div>
  );
}

