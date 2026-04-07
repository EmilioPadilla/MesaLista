import { MarketingTab } from 'src/features/admin/analytics';

export function Marketing() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Marketing</h1>
          <p className="text-gray-600">Gestiona campañas de email y comunicación con usuarios</p>
        </div>

        <MarketingTab />
      </div>
    </div>
  );
}
