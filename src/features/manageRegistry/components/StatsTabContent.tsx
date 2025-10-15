import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'components/core/Card';
import { BarChart3, TrendingUp } from 'lucide-react';

interface StatsTabContentProps {
  stats: {
    totalItems: number;
    purchasedItems: number;
    totalValue: number;
    purchasedValue: number;
    priceRanges: {
      low: number;
      medium: number;
      high: number;
    };
    categoryDistribution: Record<string, number>;
  };
}

export const StatsTabContent: React.FC<StatsTabContentProps> = ({ stats }) => {
  return (
    <div className="space-y-6">
      {/* Price Range Analysis */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análisis de Rangos de Precios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="text-2xl text-green-700">{stats.priceRanges.low}</div>
              <div className="text-md text-green-600">Regalos &lt; $1,000</div>
              <div className="text-xs text-green-500 mt-1">
                {stats.totalItems > 0 ? Math.round((stats.priceRanges.low / stats.totalItems) * 100) : 0}% del total
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
              <div className="text-2xl text-yellow-700">{stats.priceRanges.medium}</div>
              <div className="text-md text-yellow-600">Regalos $1,000 - $5,000</div>
              <div className="text-xs text-yellow-500 mt-1">
                {stats.totalItems > 0 ? Math.round((stats.priceRanges.medium / stats.totalItems) * 100) : 0}% del total
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
              <div className="text-2xl text-red-700">{stats.priceRanges.high}</div>
              <div className="text-md text-red-600">Regalos &gt; $5,000</div>
              <div className="text-xs text-red-500 mt-1">
                {stats.totalItems > 0 ? Math.round((stats.priceRanges.high / stats.totalItems) * 100) : 0}% del total
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg text-primary">Distribución por Categorías</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(stats.categoryDistribution).map(([category, count]) => (
                <div key={category} className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg text-primary">{count}</div>
                  <div className="text-md text-muted-foreground">{category}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Progress */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progreso General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Progreso de la Mesa</span>
              <span className="text-primary">
                {stats.totalItems > 0 ? Math.round((stats.purchasedItems / stats.totalItems) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-4 shadow-inner">
              <div
                className="bg-gradient-to-r from-primary to-primary/80 h-4 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${stats.totalItems > 0 ? Math.round((stats.purchasedItems / stats.totalItems) * 100) : 0}%` }}></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm">
              <div className="text-2xl text-green-700">${stats.purchasedValue.toLocaleString()}</div>
              <div className="text-md text-green-600">Valor Comprado</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-muted/30 to-muted/50 rounded-lg shadow-sm">
              <div className="text-2xl text-muted-foreground">${(stats.totalValue - stats.purchasedValue).toLocaleString()}</div>
              <div className="text-md text-muted-foreground">Valor Pendiente</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
