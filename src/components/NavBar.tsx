import React from 'react';
import Link from 'next/link';
import { HomeIcon, UserIcon, ArrowUpTrayIcon, ArrowRightOnRectangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { cn } from '../lib/utils';

interface NavBarProps {
  className?: string;
}

const NavBar: React.FC<NavBarProps> = ({ className }) => {
  const navItems = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Upload', href: '/upload', icon: ArrowUpTrayIcon },
    { name: 'Meal History', href: '/meal-history', icon: ClockIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
  ];

  return (
    <nav className={cn('bg-white shadow-sm', className)}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-4">
            {navItems.map((item) => (
              <Link 
                key={item.name}
                href={item.href}
                className="flex items-center px-3 py-2 text-gray-700 hover:text-indigo-600"
              >
                <item.icon className="h-5 w-5 mr-1" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar; 