'use client';

import { useState, useEffect } from 'react';

type ProfileFormProps = {
  profile: {
    firstName: string;
    lastName: string;
    gender: string;
    age: string | number;
    weight: string | number;
    height: string | number;
    activityLevel: string;
    defaultGoal: string;
  };
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
};

export default function ProfileForm({ profile, onSubmit, loading }: ProfileFormProps) {
  // Set up form state with initial values from profile
  const [formData, setFormData] = useState({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    gender: profile.gender || 'neutral',
    age: profile.age || '',
    weight: profile.weight || '',
    height: profile.height || '',
    activityLevel: profile.activityLevel || 'moderate',
    defaultGoal: profile.defaultGoal || 'General Wellness'
  });
  
  // Update form when profile changes (e.g., data is loaded)
  useEffect(() => {
    setFormData({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      gender: profile.gender || 'neutral',
      age: profile.age || '',
      weight: profile.weight || '',
      height: profile.height || '',
      activityLevel: profile.activityLevel || 'moderate',
      defaultGoal: profile.defaultGoal || 'General Wellness'
    });
  }, [profile]);
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      {/* Name fields */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="John"
          />
        </div>
        
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Doe"
          />
        </div>
      </div>
      
      {/* Age, gender */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
            Age
          </label>
          <input
            id="age"
            name="age"
            type="number"
            value={formData.age}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="30"
            min="0"
            max="120"
          />
        </div>
        
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="neutral">Prefer not to say</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      
      {/* Height, weight */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
            Height (cm)
          </label>
          <input
            id="height"
            name="height"
            type="number"
            value={formData.height}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="175"
            min="0"
            max="300"
          />
        </div>
        
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
            Weight (kg)
          </label>
          <input
            id="weight"
            name="weight"
            type="number"
            value={formData.weight}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="70"
            min="0"
            max="500"
          />
        </div>
      </div>
      
      {/* Activity level */}
      <div className="mb-4">
        <label htmlFor="activityLevel" className="block text-sm font-medium text-gray-700 mb-1">
          Activity Level
        </label>
        <select
          id="activityLevel"
          name="activityLevel"
          value={formData.activityLevel}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="sedentary">Sedentary (little or no exercise)</option>
          <option value="light">Light (light exercise 1-3 days/week)</option>
          <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
          <option value="active">Active (hard exercise 6-7 days/week)</option>
          <option value="veryActive">Very Active (very hard exercise or physical job)</option>
        </select>
      </div>
      
      {/* Default goal */}
      <div className="mb-6">
        <label htmlFor="defaultGoal" className="block text-sm font-medium text-gray-700 mb-1">
          Default Health Goal
        </label>
        <select
          id="defaultGoal"
          name="defaultGoal"
          value={formData.defaultGoal}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="General Wellness">General Wellness</option>
          <option value="Weight Loss">Weight Loss</option>
          <option value="Muscle Gain">Muscle Gain</option>
          <option value="Athletic Performance">Athletic Performance</option>
          <option value="Heart Health">Heart Health</option>
          <option value="Diabetes Management">Diabetes Management</option>
        </select>
      </div>
      
      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md ${
          loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
        }`}
      >
        {loading ? 'Saving Changes...' : 'Save Changes'}
      </button>
    </form>
  );
} 