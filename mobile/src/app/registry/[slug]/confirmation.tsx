import { useLocalSearchParams } from 'expo-router';

import { OrderConfirmationScreen } from '@/features/guestRegistry';

export default function ConfirmationRoute() {
  const { slug, cartSession, method, token, PayerID } = useLocalSearchParams<{
    slug: string;
    cartSession?: string;
    method?: string;
    token?: string;
    PayerID?: string;
  }>();
  if (!slug) return null;
  return (
    <OrderConfirmationScreen
      slug={slug}
      cartSession={cartSession}
      method={method}
      paypalToken={token}
      payerId={PayerID}
    />
  );
}
