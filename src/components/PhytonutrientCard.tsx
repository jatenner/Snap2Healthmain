interface PhytonutrientProps {
  nutrient: {
    name: string;
    amount: number;
    unit: string;
    benefits: string[];
  };
}

export default function PhytonutrientCard({ nutrient }: PhytonutrientProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-800">{nutrient.name}</h3>
        <div className="text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
          {nutrient.amount} {nutrient.unit}
        </div>
      </div>
      
      {nutrient.benefits.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-1">Benefits:</p>
          <ul className="text-sm text-gray-700 pl-5 list-disc">
            {nutrient.benefits.map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 