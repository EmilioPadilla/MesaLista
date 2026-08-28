import type { GiftItem } from '../types';

export const generateStats = (gifts: GiftItem[]) => {
  return {
    totalItems: gifts.length,
    purchasedItems: gifts.filter((g) => g.isPurchased).length,
    totalValue: gifts.reduce((sum, g) => sum + g.price, 0),
    // Money actually raised. A partly-funded group gift has real money against it
    // even though it isn't purchased yet, so counting only purchased gifts would
    // under-report what the couple has coming — the number they care about most.
    purchasedValue: gifts.reduce((sum, g) => {
      if (g.giftType && g.giftType !== 'SINGLE') return sum + (g.amountFunded ?? 0);
      return g.isPurchased ? sum + g.price : sum;
    }, 0),
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
