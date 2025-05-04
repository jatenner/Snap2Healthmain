import { FaCheck } from 'react-icons/fa';

interface BenefitProps {
  benefit: {
    title: string;
    description: string;
  };
}

export default function BenefitCard({ benefit }: BenefitProps) {
  return (
    <div className="bg-green-50 border border-green-100 rounded-lg p-4">
      <div className="flex items-start">
        <div className="mt-0.5 mr-3 bg-green-100 rounded-full p-1">
          <FaCheck className="text-green-600 text-sm" />
        </div>
        <div>
          <h3 className="font-medium text-green-800 mb-1">{benefit.title}</h3>
          <p className="text-sm text-green-700">{benefit.description}</p>
        </div>
      </div>
    </div>
  );
} 