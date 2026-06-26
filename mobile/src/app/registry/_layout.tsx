import { Stack } from 'expo-router';

/**
 * Public guest flow (no auth): registry landing, gifts, cart, checkout,
 * confirmation and RSVP. Lives outside the (app) group so shoppers reach it
 * via Explore or a deep link without signing in.
 */
export default function RegistryLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fefdfb' } }} />;
}
