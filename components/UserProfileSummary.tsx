'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/client/ClientAuthProvider';

interface UserProfileSummaryProps {
  compact?: boolean;
}

const UserProfileSummary: React.FC<UserProfileSummaryProps> = ({ compact = false }) => {
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }
  
  const metadata = user.user_metadata || {};
  const name = metadata.name || metadata.full_name || metadata.username || user.email?.split('@')[0] || 'User';
  
  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-cyan-accent/20 text-cyan-accent flex items-center justify-center font-semibold">
          {name.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm text-blue-100">{name}</span>
      </div>
    );
  }
  
  return (
    <div className="bg-darkBlue-accent/20 p-4 rounded-lg border border-darkBlue-accent/40">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 rounded-full bg-cyan-accent/20 text-cyan-accent flex items-center justify-center text-lg font-semibold">
          {name.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-medium text-blue-100">{name}</h3>
          <p className="text-sm text-blue-100/70">{user.email}</p>
          
          {metadata.defaultGoal && (
            <div className="mt-2 bg-darkBlue-secondary/60 px-3 py-1 rounded inline-block">
              <span className="text-xs text-blue-100/90">Goal: {metadata.defaultGoal}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileSummary; 