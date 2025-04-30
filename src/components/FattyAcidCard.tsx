interface FattyAcidProps {
  fatty: {
    name: string;
    amount: number;
    unit: string;
    type: string;
    description?: string;
  };
}

export default function FattyAcidCard({ fatty }: FattyAcidProps) {
  // Determine badge color based on fatty acid type
  const getBadgeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('unsaturated')) return 'bg-green-100 text-green-800';
    if (lowerType.includes('saturated')) return 'bg-yellow-100 text-yellow-800';
    if (lowerType.includes('trans')) return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-800">{fatty.name}</h3>
        <div className={`text-xs px-2 py-0.5 rounded-full ${getBadgeColor(fatty.type)}`}>
          {fatty.type}
        </div>
      </div>
      
      <div className="text-sm">
        <span className="font-semibold">{fatty.amount}</span> {fatty.unit}
      </div>
      
      {fatty.description && (
        <p className="text-xs text-gray-500 mt-2">{fatty.description}</p>
      )}
    </div>
  );
} 