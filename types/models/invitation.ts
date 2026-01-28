export type InvitationStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Invitation {
  id: number;
  giftListId: number;
  templateId: string;
  eventName: string;
  slug: string;
  htmlContent: string;
  formData: Record<string, any>;
  customColors?: Record<string, string>;
  status: InvitationStatus;
  publishedAt?: Date | string;
  viewCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface InvitationWithGiftList extends Invitation {
  giftList: {
    id: number;
    title: string;
    slug: string;
    coupleName: string;
    eventDate: Date | string;
  };
}

export interface InvitationTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'wedding' | 'birthday' | 'baby-shower' | 'anniversary';
  fields: InvitationField[];
  previewComponent: string;
}

export interface InvitationField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'time' | 'location';
  placeholder: string;
  defaultValue?: string;
}
