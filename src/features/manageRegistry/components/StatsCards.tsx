import React from 'react';
import { Card } from 'antd';
import { Package, TrendingUp, Target, DollarSign } from 'lucide-react';
import { GiftItem } from 'src/app/routes/couple/ManageRegistry';
import { generateStats } from 'src/features/manageRegistry/utils/manageRegistryUtils';

interface StatsCardsProps {
  gifts: GiftItem[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ gifts }) => {
  // Enhanced statistics
  const stats = generateStats(gifts);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card
        title="Total de Regalos"
        extra={<Package className="h-4 w-4 text-muted-foreground" />}
        className="shadow-md hover:shadow-lg transition-shadow duration-200">
        <div>
          <div className="text-2xl text-primary">{stats.totalItems}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.purchasedItems} comprados, {stats.totalItems - stats.purchasedItems} pendientes
          </p>
        </div>
      </Card>

      <Card
        title="Progreso"
        extra={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        className="shadow-md hover:shadow-lg transition-shadow duration-200">
        <div>
          <div className="text-2xl text-green-600">
            {stats.totalItems > 0 ? Math.round((stats.purchasedItems / stats.totalItems) * 100) : 0}%
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(stats.purchasedItems / stats.totalItems) * 100}%` }}></div>
          </div>
        </div>
      </Card>

      <Card
        title="Rango de Precios"
        extra={<Target className="h-4 w-4 text-muted-foreground" />}
        className="shadow-md hover:shadow-lg transition-shadow duration-200">
        <div>
          <div className="text-2xl text-primary">
            ${stats.minPrice.toLocaleString()} - ${stats.maxPrice.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Promedio: ${stats.averagePrice.toLocaleString()}</p>
        </div>
      </Card>

      <Card
        title="Valor Total"
        extra={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        className="shadow-md hover:shadow-lg transition-shadow duration-200">
        <div>
          <div className="text-2xl text-primary">${stats.totalValue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Comprado: ${stats.purchasedValue.toLocaleString()}</p>
        </div>
      </Card>
    </div>
  );
};
