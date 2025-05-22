import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SidebarGroupProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const SidebarGroup: React.FC<SidebarGroupProps> = ({
  title,
  icon,
  children,
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span>{title}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="mt-1 ml-4 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}