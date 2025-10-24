import { GiftItem } from 'src/app/routes/couple/ManageRegistry';

export const generateStats = (gifts: GiftItem[]) => {
  return {
    totalItems: gifts.length,
    purchasedItems: gifts.filter((g) => g.isPurchased).length,
    totalValue: gifts.reduce((sum, g) => sum + g.price, 0),
    purchasedValue: gifts.filter((g) => g.isPurchased).reduce((sum, g) => sum + g.price, 0),
    averagePrice: gifts.length > 0 ? Math.round(gifts.reduce((sum, g) => sum + g.price, 0) / gifts.length) : 0,
    minPrice: gifts.length > 0 ? Math.min(...gifts.map((g) => g.price)) : 0,
    maxPrice: gifts.length > 0 ? Math.max(...gifts.map((g) => g.price)) : 0,
    priceRanges: {
      low: gifts.filter((g) => g.price < 1000).length,
      medium: gifts.filter((g) => g.price >= 1000 && g.price < 5000).length,
      high: gifts.filter((g) => g.price >= 5000).length,
    },
    categoryDistribution: gifts.reduce(
      (acc, gift) => {
        gift.categories?.forEach((category) => {
          acc[category.name] = (acc[category.name] || 0) + 1;
        });
        return acc;
      },
      {} as Record<string, number>,
    ),
  };
};
