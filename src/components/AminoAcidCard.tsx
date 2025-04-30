interface AminoAcidProps {
  amino: {
    name: string;
    amount: number;
    unit: string;
    essential: boolean;
    description?: string;
  };
}

export default function AminoAcidCard({ amino }: AminoAcidProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-800">{amino.name}</h3>
        {amino.essential && (
          <div className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
            Essential
          </div>
        )}
      </div>
      
      <div className="text-sm">
        <span className="font-semibold">{amino.amount}</span> {amino.unit}
      </div>
      
      {amino.description && (
        <p className="text-xs text-gray-500 mt-2">{amino.description}</p>
      )}
    </div>
  );
} 