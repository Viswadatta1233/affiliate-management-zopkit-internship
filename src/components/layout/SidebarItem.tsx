import React from 'react';
import { Link } from 'react-router-dom';

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  isCurrent: boolean;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  href,
  icon,
  title,
  isCurrent
}) => {
  return (
    <Link
      to={href}
      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
        isCurrent
          ? 'bg-gray-100 text-gray-900 font-medium'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      <span>{title}</span>
    </Link>
  );
}