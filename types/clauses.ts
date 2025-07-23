export interface WhereClause {
  weddingListId: number;
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
