import { Image, Pressable, Text, View } from 'react-native';
import type { Gift } from 'types/models/gift';
import type { CartItem } from 'types/models/cart';

import { isFullyFunded, isGroupGift, shareAmount } from 'utils/giftFunding';

import { formatCurrency } from '@/lib/format';
import { FundingMeter } from './FundingMeter';

interface GuestGiftCardProps {
  gift: Gift;
  cartItems: CartItem[];
  onAddToCart: (giftId: number) => void;
  onUpdateQuantity: (cartItemId: number, quantity: number) => void;
  onRemove: (cartItemId: number) => void;
  onPress: (gift: Gift) => void;
  /** Opens the contribution sheet — group gifts need a choice before a price. */
  onContribute: (gift: Gift) => void;
}

export function GuestGiftCard({
  gift,
  cartItems,
  onAddToCart,
  onUpdateQuantity,
  onRemove,
  onPress,
  onContribute,
}: GuestGiftCardProps) {
  const cartItem = cartItems.find((item) => item.giftId === gift.id);
  const inCart = !!cartItem;

  // A group gift is never added straight from the card: the guest picks how many
  // shares or how much to give first, so tapping opens the sheet instead.
  const isGroup = isGroupGift(gift);
  const isComplete = gift.isPurchased || (isGroup && isFullyFunded(gift));

  return (
    <Pressable
      onPress={() => (isGroup ? onContribute(gift) : onPress(gift))}
      className="mb-4 overflow-hidden rounded-ml border border-gray-200 bg-white active:opacity-90"
    >
      <View className="relative">
        {gift.imageUrl ? (
          <Image source={{ uri: gift.imageUrl }} className="h-44 w-full bg-gray-100" resizeMode="cover" />
        ) : (
          <View className="h-44 w-full items-center justify-center bg-muted">
            <Text className="text-4xl">🎁</Text>
          </View>
        )}

        {gift.isMostWanted ? (
          <View className="absolute left-3 top-3 rounded-full bg-oak px-2.5 py-1">
            <Text className="text-[10px] font-bold uppercase tracking-wide text-white">Más deseado</Text>
          </View>
        ) : null}

        {isComplete ? (
          <View className="absolute inset-0 items-center justify-center bg-white/70">
            <View className="rounded-full bg-success px-4 py-1.5">
              <Text className="text-sm font-bold text-white">{isGroup ? 'Completo 🎉' : 'Regalado 🎉'}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View className="px-4 py-3">
        <Text className="text-base font-semibold text-ink" numberOfLines={2}>
          {gift.title}
        </Text>
        {/* For a split gift the per-person share is the headline; the full price
            is context, shown small underneath. */}
        {isGroup && gift.giftType === 'GROUP_FIXED' ? (
          <>
            <Text className="mt-1 text-lg font-bold text-oak">{formatCurrency(shareAmount(gift))} por persona</Text>
            <Text className="text-xs text-mutedForeground">Regalo completo: {formatCurrency(gift.price)}</Text>
          </>
        ) : (
          <Text className="mt-1 text-lg font-bold text-oak">{formatCurrency(gift.price)}</Text>
        )}

        {isGroup ? <View className="mt-3"><FundingMeter gift={gift} compact /></View> : null}

        {isComplete ? null : isGroup ? (
          <Pressable
            onPress={() => onContribute(gift)}
            className={`mt-3 items-center rounded-full py-2 ${inCart ? 'border border-oak bg-white' : 'bg-oak active:bg-oakDark'}`}
          >
            <Text className={`text-sm font-semibold ${inCart ? 'text-oak' : 'text-white'}`}>
              {inCart ? 'Cambiar mi aportación' : 'Aportar'}
            </Text>
          </Pressable>
        ) : inCart ? (
          <View className="mt-3 flex-row items-center justify-between rounded-full border border-oak/30 bg-oak/5 px-2 py-1">
            <Stepper
              label="−"
              onPress={() =>
                cartItem!.quantity <= 1 ? onRemove(cartItem!.id) : onUpdateQuantity(cartItem!.id, cartItem!.quantity - 1)
              }
            />
            <Text className="text-base font-bold text-ink">{cartItem!.quantity}</Text>
            <Stepper label="+" onPress={() => onUpdateQuantity(cartItem!.id, cartItem!.quantity + 1)} />
          </View>
        ) : (
          <Pressable
            onPress={() => onAddToCart(gift.id)}
            className="mt-3 items-center rounded-full bg-oak py-2 active:bg-oakDark"
          >
            <Text className="text-sm font-semibold text-white">Agregar al carrito</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

function Stepper({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      className="h-8 w-8 items-center justify-center rounded-full bg-white active:bg-gray-100"
    >
      <Text className="text-lg font-bold text-oak">{label}</Text>
    </Pressable>
  );
}
