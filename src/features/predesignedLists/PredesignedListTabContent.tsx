import { Card } from 'antd';
import { PredesignedList, PredesignedGift } from 'src/services/predesignedList.service';
import { GiftCard } from '../../components/shared/GiftCard';
import { GiftItem } from 'routes/couple/ManageRegistry';

interface PredesignedListTabContentProps {
  registry: PredesignedList;
  addedGifts: Set<number>;
  onAddGift: (gift: PredesignedGift, registryName: string) => void;
}

export function PredesignedListTabContent({ registry, addedGifts, onAddGift }: PredesignedListTabContentProps) {
  const isGiftAdded = (giftId: number) => addedGifts.has(giftId);

  const convertPredesignedGiftToGiftItem = (gift: PredesignedGift): GiftItem => ({
    id: gift.id,
    title: gift.title,
    description: gift.description,
    price: gift.price,
    imageUrl: gift.imageUrl,
    isPurchased: false,
    isMostWanted: false,
    weddingListId: gift.predesignedListId,
    quantity: 0,
    order: gift.order,
    createdAt: new Date(gift.createdAt),
    updatedAt: new Date(gift.updatedAt),
    categories: gift.categories
      ? gift.categories.map((category, index) => ({ id: index, name: category, createdAt: new Date(), updatedAt: new Date() }))
      : [],
  });

  return (
    <div className="space-y-12 mt-4">
      {/* Registry Header */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl">
        <div className="h-96 relative">
          <img src={registry.imageUrl} alt={registry.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
            <h2 className="text-4xl mb-3">{registry.name}</h2>
            <p className="text-xl opacity-90 max-w-2xl">{registry.description}</p>
          </div>
        </div>
      </div>

      {/* Gift Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-border/30 shadow-lg">
          <div className="text-center pt-6">
            <div className="text-3xl text-primary mb-2">{registry.gifts.length}</div>
            <div className="text-sm text-muted-foreground">Regalos Disponibles</div>
          </div>
        </Card>

        <Card className="bg-white border-border/30 shadow-lg">
          <div className="text-center pt-6">
            <div className="text-3xl text-primary mb-2">
              ${Math.min(...registry.gifts.map((g: PredesignedGift) => g.price)).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Precio Mínimo</div>
          </div>
        </Card>

        <Card className="bg-white border-border/30 shadow-lg">
          <div className="text-center pt-6">
            <div className="text-3xl text-primary mb-2">
              ${registry.gifts.reduce((sum: number, g: PredesignedGift) => sum + g.price, 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Valor Total</div>
          </div>
        </Card>
      </div>

      {/* Gift Grid */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {registry.gifts.map((gift: PredesignedGift) => {
            const giftItem = convertPredesignedGiftToGiftItem(gift);
            const added = isGiftAdded(gift.id);
            return (
              <div
                key={gift.id}
                onClick={() => !added && onAddGift(gift, registry.name)}
                className={`h-full ${added ? 'opacity-75 pointer-events-none' : ''}`}>
                <GiftCard gift={giftItem} variant="predesigned" onAddToCart={() => onAddGift(gift, registry.name)} isGuest={true} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
