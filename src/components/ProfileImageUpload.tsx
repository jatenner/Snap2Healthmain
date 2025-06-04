import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { uploadImageToSupabase } from '@/lib/uploadImageToSupabase';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, Camera } from 'lucide-react';

interface ProfileImageUploadProps {
  user: any;
  onImageUploaded?: (url: string) => void;
}

function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function ProfileImageUpload({ user, onImageUploaded }: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.user_metadata?.avatar_url || null
  );
  const supabase = getSupabaseClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      
      // Create a preview
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);
      
      // Upload the image
      const imageUrl = await uploadImageToSupabase(file);
      
      // Update the user's metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          avatar_url: imageUrl,
        },
      });
      
      if (error) throw error;
      
      // Call the callback function if provided
      if (onImageUploaded) {
        onImageUploaded(imageUrl);
      }
      
    } catch (error) {
      console.error('Error uploading profile image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="mb-4 flex flex-col items-center">
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md mb-4">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-4xl">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>
        
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          id="profile-image-upload"
          className="hidden"
          disabled={isUploading}
        />
        
        <label htmlFor="profile-image-upload">
          <Button 
            variant="outline" 
            size="sm"
            disabled={isUploading}
            className="cursor-pointer"
            asChild
          >
            <span>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Change Photo
                </>
              )}
            </span>
          </Button>
        </label>
      </div>
    </div>
  );
} 