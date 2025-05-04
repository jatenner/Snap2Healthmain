'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface FoodUploadProps {
  onUpload: (file: File, goal: string) => void;
  isLoading: boolean;
}

export default function FoodUpload({ onUpload, isLoading }: FoodUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [healthGoal, setHealthGoal] = useState('General Wellness');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    // Create preview URL
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setPreviewUrl(fileReader.result as string);
    };
    fileReader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      onUpload(selectedFile, healthGoal);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative w-full aspect-square overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Food preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="text-center p-6">
                  <p className="text-gray-500">Upload a photo of your food</p>
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-2">
              <label htmlFor="health-goal" className="text-sm font-medium">
                Select health goal:
              </label>
              <select
                id="health-goal"
                value={healthGoal}
                onChange={(e) => setHealthGoal(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={isLoading}
              >
                <option value="Weight Loss">Weight Loss</option>
                <option value="Muscle Gain">Muscle Gain</option>
                <option value="Heart Health">Heart Health</option>
                <option value="Diabetes Management">Diabetes Management</option>
                <option value="General Wellness">General Wellness</option>
              </select>
            </div>

            <div className="flex flex-col space-y-4">
              <input
                type="file"
                id="food-image"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
              />
              
              <label
                htmlFor="food-image"
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md text-center cursor-pointer hover:bg-blue-600 transition"
              >
                {previewUrl ? 'Change Image' : 'Upload Image'}
              </label>
              
              <Button
                type="submit"
                className="w-full"
                disabled={!selectedFile || isLoading}
              >
                {isLoading ? 'Analyzing...' : 'Analyze Food'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 