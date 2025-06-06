'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './client/ClientAuthProvider';
import Logo from './Logo';
import { Home, Upload, History, User, LogOut, UserCircle, CheckCircle, Settings } from 'lucide-react';

export default function SimpleNavBar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get user display name from email or profile
  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    if (user.user_metadata?.username) return user.user_metadata.username;
    if (user.email) return user.email.split('@')[0];
    return 'User';
  };

  return (
    <nav className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Logo />
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-gray-800 text-blue-400' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>
            
            {user ? (
              <>
                <Link
                  href="/upload"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/upload') 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-600/80 text-white hover:bg-blue-700'
                  }`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Link>
                
                <Link
                  href="/meal-history"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/meal-history') 
                      ? 'bg-gray-800 text-blue-400' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <History className="w-4 h-4 mr-2" />
                  History
                </Link>
                
                {/* User Profile Section - Enhanced for signed-in state */}
                <div className="flex items-center space-x-3 px-3 py-2 rounded-md bg-gray-800/50 border border-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <UserCircle className="w-6 h-6 text-blue-400" />
                      <CheckCircle className="w-3 h-3 text-green-400 absolute -top-1 -right-1 bg-gray-900 rounded-full" />
                    </div>
                    <span className="text-sm font-medium text-gray-200">
                      {getUserDisplayName()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Link
                      href="/profile"
                      className={`p-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActive('/profile') 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                      title="Profile Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                    
                    <button
                      onClick={handleSignOut}
                      className="p-1.5 rounded-md text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Guest User Indicator */}
                <div className="flex items-center space-x-2 px-3 py-2 rounded-md bg-gray-800/30 border border-gray-700/50">
                  <UserCircle className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-400">Not signed in</span>
                </div>
                
                <Link
                  href="/login"
                  className="flex items-center px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md"
                >
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 