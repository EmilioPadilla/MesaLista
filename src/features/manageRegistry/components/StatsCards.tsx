import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'components/core/Card';
import { Package, TrendingUp, Target, DollarSign } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalItems: number;
    purchasedItems: number;
    minPrice: number;
    maxPrice: number;
    averagePrice: number;
    totalValue: number;
    purchasedValue: number;
  };
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">Total de Regalos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl text-primary">{stats.totalItems}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.purchasedItems} comprados, {stats.totalItems - stats.purchasedItems} pendientes
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">Progreso</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl text-green-600">{Math.round((stats.purchasedItems / stats.totalItems) * 100)}%</div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(stats.purchasedItems / stats.totalItems) * 100}%` }}></div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">Rango de Precios</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg text-primary">
            ${stats.minPrice.toLocaleString()} - ${stats.maxPrice.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Promedio: ${stats.averagePrice.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">Valor Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl text-primary">${stats.totalValue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Comprado: ${stats.purchasedValue.toLocaleString()}</p>
        </CardContent>
      </Card>
    </div>
  );
};
