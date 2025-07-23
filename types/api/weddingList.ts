export interface CreateWeddingListRequest {
  coupleId: number;
  title: string;
  description?: string | null;
  coupleName: string;
  weddingDate: string;
  imageUrl?: string | null;
}

export interface UpdateWeddingListRequest {
  id: number;
  title?: string;
  description?: string | null;
  coupleName?: string;
  weddingDate?: string;
  imageUrl?: string | null;
}
