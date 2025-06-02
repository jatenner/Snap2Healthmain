'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../app/context/auth';
import { FiMenu, FiX } from 'react-icons/fi';
import { BiHome, BiHistory, BiUser, BiAnalyse } from 'react-icons/bi';

export function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
  };

  // Add visibility styles to ensure the NavBar is always shown
  const navbarStyles = {
    backgroundColor: '#020e2c',
    display: 'flex',
    position: 'relative',
    zIndex: 50, // High z-index to ensure visibility
    opacity: 1,
    visibility: 'visible'
  } as React.CSSProperties;

  return (
    <nav style={navbarStyles} className="sticky top-0 w-full shadow-md p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <h1 className="text-xl font-bold mr-2">Snap2Health</h1>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden flex items-center"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
        </button>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/" className="text-white hover:text-blue-300 flex items-center">
            <BiHome className="mr-1" /> Home
          </Link>
          {user && (
            <Link href="/upload" className="text-white hover:text-blue-300 flex items-center">
              <BiAnalyse className="mr-1" /> Upload Meal
            </Link>
          )}
          <Link href="/history" className="text-white hover:text-blue-300 flex items-center">
            <BiHistory className="mr-1" /> History
          </Link>
          {user ? (
            <>
              <Link href="/profile" className="text-white hover:text-blue-300 flex items-center">
                <BiUser className="mr-1" /> Profile
              </Link>
              <button 
                onClick={handleSignOut} 
                className="text-white bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md text-sm"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link 
              href="/login" 
              className="text-white bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md text-sm"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="absolute top-16 right-0 left-0 bg-[#031642] shadow-lg rounded-b-lg p-4 md:hidden">
            <div className="flex flex-col space-y-4">
              <Link href="/" 
                className="text-white hover:text-blue-300 flex items-center"
                onClick={() => setIsOpen(false)}
              >
                <BiHome className="mr-2" /> Home
              </Link>
              {user && (
                <Link href="/upload" 
                  className="text-white hover:text-blue-300 flex items-center"
                  onClick={() => setIsOpen(false)}
                >
                  <BiAnalyse className="mr-2" /> Upload Meal
                </Link>
              )}
              <Link href="/history" 
                className="text-white hover:text-blue-300 flex items-center"
                onClick={() => setIsOpen(false)}
              >
                <BiHistory className="mr-2" /> History
              </Link>
              {user ? (
                <>
                  <Link href="/profile" 
                    className="text-white hover:text-blue-300 flex items-center"
                    onClick={() => setIsOpen(false)}
                  >
                    <BiUser className="mr-2" /> Profile
                  </Link>
                  <button 
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }} 
                    className="text-white bg-blue-700 hover:bg-blue-800 py-2 px-4 rounded-md w-full text-left flex items-center"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link 
                  href="/login" 
                  className="text-white bg-blue-700 hover:bg-blue-800 py-2 px-4 rounded-md w-full text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
