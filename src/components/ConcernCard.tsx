import { FaExclamationTriangle } from 'react-icons/fa';

interface ConcernProps {
  concern: {
    title: string;
    description: string;
    severity?: 'low' | 'medium' | 'high';
  };
}

export default function ConcernCard({ concern }: ConcernProps) {
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-100 border-red-100';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'low':
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-100';
    }
  };

  const colorClasses = getSeverityColor(concern.severity);

  return (
    <div className={`${colorClasses} rounded-lg p-4`}>
      <div className="flex items-start">
        <div className={`mt-0.5 mr-3 rounded-full p-1 ${
          concern.severity === 'high' ? 'bg-red-200' : 
          concern.severity === 'medium' ? 'bg-orange-200' : 'bg-yellow-200'
        }`}>
          <FaExclamationTriangle className={`text-sm ${
            concern.severity === 'high' ? 'text-red-600' : 
            concern.severity === 'medium' ? 'text-orange-600' : 'text-yellow-600'
          }`} />
        </div>
        <div>
          <h3 className={`font-medium mb-1 ${
            concern.severity === 'high' ? 'text-red-800' : 
            concern.severity === 'medium' ? 'text-orange-800' : 'text-yellow-800'
          }`}>{concern.title}</h3>
          <p className={`text-sm ${
            concern.severity === 'high' ? 'text-red-700' : 
            concern.severity === 'medium' ? 'text-orange-700' : 'text-yellow-700'
          }`}>{concern.description}</p>
        </div>
      </div>
    </div>
  );
} 