interface PieChartProps {
  data: Array<{
    label: string;
    value: number;
    color: string;
  }>;
}

export default function PieChart({ data }: PieChartProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Grade Breakdown
      </h3>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded mr-3"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm text-gray-700">{item.label}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {item.value}%
            </span>
          </div>
        ))}
      </div>
      {/* TODO: Implement actual pie chart visualization */}
      <div className="mt-4 text-center text-gray-500 text-sm">
        Pie chart visualization to be implemented
      </div>
    </div>
  );
}
