export interface WhereClause {
  weddingListId?: number;
  giftListId?: number;
  categories?: {
    some: {
      category: {
        name: string;
      };
    };
  };
  price?:
    | {
        gte: number;
        lte: number;
      }
    | {};
}
