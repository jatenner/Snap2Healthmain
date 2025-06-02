import { useState } from 'react';

const ProfileForm = ({ profile, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    gender: profile?.gender || 'neutral',
    age: profile?.age || '',
    weight: profile?.weight || '',
    height: profile?.height || '',
    activityLevel: profile?.activityLevel || 'moderate',
    defaultGoal: profile?.defaultGoal || 'General Wellness'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your first name"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your last name"
            />
          </div>
        </div>

        {/* Health Information Section */}
        <div className="border-2 border-blue-100 rounded-lg p-4 bg-blue-50">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">Health Information</h2>
          <p className="text-blue-700 mb-4 text-sm">
            This information helps us provide personalized nutrition recommendations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Height field */}
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                Height <span className="text-blue-600 font-semibold">(inches)</span>
              </label>
              <div className="relative">
                <input
                  id="height"
                  name="height"
                  type="number"
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Height in inches"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  in
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-600">5'10" = 70 inches</p>
            </div>
            
            {/* Weight field */}
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                Weight <span className="text-blue-600 font-semibold">(pounds)</span>
              </label>
              <div className="relative">
                <input
                  id="weight"
                  name="weight"
                  type="number"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Weight in pounds"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  lbs
                </div>
              </div>
            </div>
            
            {/* Age field */}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your age"
              />
            </div>
            
            {/* Gender field */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="neutral">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {/* Activity level field */}
            <div>
              <label htmlFor="activityLevel" className="block text-sm font-medium text-gray-700 mb-1">
                Activity Level
              </label>
              <select
                id="activityLevel"
                name="activityLevel"
                value={formData.activityLevel}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="sedentary">Sedentary (little or no exercise)</option>
                <option value="light">Light (light exercise 1-3 days/week)</option>
                <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
                <option value="active">Active (hard exercise 6-7 days/week)</option>
                <option value="very_active">Very Active (intense exercise daily)</option>
              </select>
            </div>
            
            {/* Nutritional Goal field */}
            <div>
              <label htmlFor="defaultGoal" className="block text-sm font-medium text-gray-700 mb-1">
                Nutritional Goal
              </label>
              <select
                id="defaultGoal"
                name="defaultGoal"
                value={formData.defaultGoal}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="General Wellness">General Wellness</option>
                <option value="Weight Loss">Weight Loss</option>
                <option value="Muscle Gain">Muscle Gain</option>
                <option value="Heart Health">Heart Health</option>
                <option value="Diabetes Management">Diabetes Management</option>
                <option value="Sports Performance">Sports Performance</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Submit button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow transition duration-200"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm; 