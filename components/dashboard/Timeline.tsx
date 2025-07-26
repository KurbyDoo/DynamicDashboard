interface TimelineProps {
  assignments: Array<{
    name: string;
    dueDate: string;
    weight: number;
  }>;
}

export default function Timeline({ assignments }: TimelineProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Assignment Timeline
      </h3>
      <div className="space-y-3">
        {assignments.map((assignment, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium text-gray-900">{assignment.name}</p>
              <p className="text-sm text-gray-600">Due: {assignment.dueDate}</p>
            </div>
            <div className="text-sm font-medium text-blue-600">
              {assignment.weight}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
