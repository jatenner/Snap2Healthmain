'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/auth';
import { User, History, Upload, LogOut, Menu, X, Home, LogIn, UserPlus, UserCircle } from 'lucide-react';

// Define the type for navigation links
type NavLink = {
  name: string;
  href: string;
  icon: React.ReactNode;
  highlight?: boolean;
};

export default function NavBar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [displayName, setDisplayName] = useState('');
  
  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true);
    if (user?.email) {
      // Extract name from email or use email
      const emailParts = user.email.split('@');
      const firstName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
      setUserName(firstName);
      
      // Try to get a display name from localStorage
      try {
        const profileData = localStorage.getItem('user_profile');
        if (profileData) {
          const profile = JSON.parse(profileData);
          if (profile.full_name) {
            setDisplayName(profile.full_name.split(' ')[0]); // Just use first name
          }
        }
      } catch (e) {
        console.error('Error reading profile from localStorage:', e);
      }
    }
  }, [user]);
  
  // Function to toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  // Close mobile menu
  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      await logout();
      closeMenu();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Check if the current path matches the given path
  const isActivePath = (path: string) => {
    return pathname === path;
  };
  
  // Navigation links for unauthenticated users
  const publicLinks: NavLink[] = [
    { name: 'Home', href: '/', icon: <Home size={18} className="mr-2" /> },
    { name: 'Sign In', href: '/login', icon: <LogIn size={18} className="mr-2" /> },
    { name: 'Sign Up', href: '/signup', icon: <UserPlus size={18} className="mr-2" /> }
  ];
  
  // Navigation links for authenticated users
  const privateLinks: NavLink[] = [
    { name: 'Home', href: '/', icon: <Home size={18} className="mr-2" /> },
    { name: 'Upload', href: '/upload', icon: <Upload size={18} className="mr-2" />, highlight: true },
    { name: 'History', href: '/meal-history', icon: <History size={18} className="mr-2" /> }
  ];
  
  // Determine which links to display based on auth state
  const navLinks = user ? privateLinks : publicLinks;
  
  return (
    <nav className="bg-gray-900 shadow-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center" onClick={closeMenu}>
              <span className="text-2xl font-bold text-blue-400">Snap2Health</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex space-x-4 items-center">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    isActivePath(link.href)
                      ? 'bg-gray-800 text-blue-400'
                      : link.highlight && user
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
              
              {isClient && (
                <>
                  {user ? (
                    <div className="flex items-center ml-2">
                      <Link 
                        href="/profile"
                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                          isActivePath('/profile')
                            ? 'bg-gray-800 text-blue-400'
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white mr-2">
                            <User size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="md:inline font-medium">{displayName || userName || 'Profile'}</span>
                            <span className="md:inline text-xs text-gray-400">Signed In</span>
                          </div>
                        </div>
                      </Link>
                      
                      <button
                        onClick={handleSignOut}
                        className="ml-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 flex items-center"
                      >
                        <LogOut size={18} className="mr-2" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <Link 
                      href="/login"
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                        isActivePath('/login')
                          ? 'bg-gray-800 text-blue-400'
                          : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 mr-2">
                          <UserCircle size={16} />
                        </div>
                        <span className="md:inline">Sign In</span>
                      </div>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            {isClient && user && (
              <Link 
                href="/profile"
                className="mr-2 px-2 py-1 rounded-md text-sm font-medium flex items-center text-gray-300 hover:text-white"
              >
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white">
                  <User size={16} />
                </div>
              </Link>
            )}
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
              onClick={toggleMenu}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, toggle based on menu state */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          {isClient && user && (
            <div className="px-3 py-2 flex items-center border-b border-gray-700 mb-2 pb-3">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white mr-3">
                <User size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-white">{displayName || userName || 'User'}</span>
                <span className="text-xs text-gray-400">{user.email}</span>
                <span className="text-xs text-green-400 mt-1">Signed In</span>
              </div>
            </div>
          )}
          
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                isActivePath(link.href)
                  ? 'bg-gray-800 text-blue-400'
                  : link.highlight && user
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
              onClick={closeMenu}
            >
              {link.icon}
              {link.name}
            </Link>
          ))}
          
          {isClient && user && (
            <>
              <Link
                href="/profile"
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                  isActivePath('/profile')
                    ? 'bg-gray-800 text-blue-400'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
                onClick={closeMenu}
              >
                <User size={18} className="mr-2" />
                <span>Profile</span>
              </Link>
              
              <button
                onClick={handleSignOut}
                className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <LogOut size={18} className="mr-2" />
                <span>Sign Out</span>
              </button>
            </>
          )}
          
          {isClient && !user && (
            <Link
              href="/login"
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                isActivePath('/login')
                  ? 'bg-gray-800 text-blue-400'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
              onClick={closeMenu}
            >
              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 mr-2">
                <UserCircle size={14} />
              </div>
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
} 