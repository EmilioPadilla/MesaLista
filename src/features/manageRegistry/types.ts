import type { Gift } from 'types/models/gift';

// A gift augmented with manage-registry-specific display fields.
// purchasedBy comes from joining the gift with the cart-payer info.
export interface GiftItem extends Gift {
  purchasedBy?: string;
}

export type SortOption = 'name' | 'price-asc' | 'price-desc' | 'category' | 'status' | 'original';

export type FilterOption = 'all' | 'purchased' | 'pending' | 'mostWanted';
