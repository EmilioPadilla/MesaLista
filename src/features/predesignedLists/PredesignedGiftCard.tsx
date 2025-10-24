import { Card, Tag, Tooltip, Button } from 'antd';
import { Plus } from 'lucide-react';
import { GiftItem } from 'src/app/routes/couple/ManageRegistry';

interface PredesignedGiftCardProps {
  gift: GiftItem;
  onAddToCart: (giftId: number) => void;
}

export const PredesignedGiftCard = ({ gift, onAddToCart }: PredesignedGiftCardProps) => {
  const handleAddToCart = () => {
    onAddToCart(gift.id);
  };
  return (
    <Card
      styles={{ body: { height: '100%' } }}
      className="group bg-white border-border/30 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden rounded-2xl h-full flex flex-col"
      cover={
        <div className="relative overflow-hidden h-40">
          <img
            src={gift.imageUrl}
            alt={gift.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      }>
      <div className="flex flex-col flex-1 h-full">
        <div className="space-y-2 flex-1">
          <h3 className="text-xl mb-2 text-primary font-semibold">{gift.title}</h3>
          <p className="text-muted-foreground line-clamp-2">{gift.description}</p>
        </div>

        <div className="flex flex-col justify-end items-center gap-4 mt-4 flex-1 h-full">
          <div className={`flex items-center w-full ${gift.categories && gift.categories?.length > 0 ? 'justify-between' : 'justify-end'}`}>
            {/* <div> */}
            {gift.categories && gift.categories.length > 0 ? (
              <div className="flex items-center gap-1">
                <Tag bordered={false} className="shadow-sm !bg-white font-bold">
                  {gift.categories[0].name}
                </Tag>
                {gift.categories.length > 1 && (
                  <Tooltip
                    title={
                      <div className="space-y-1">
                        {gift.categories.slice(1).map((category) => (
                          <div key={category.id}>{category.name}</div>
                        ))}
                      </div>
                    }>
                    <div className="flex items-center justify-center w-6 h-6 rounded shadow-sm bg-white border border-border/30 cursor-pointer hover:bg-primary/10 transition-colors">
                      <Plus className="h-3 w-3 text-primary" />
                    </div>
                  </Tooltip>
                )}
              </div>
            ) : null}
            {/* </div> */}
            <span className="text-lg text-primary">${gift.price.toLocaleString()}</span>
          </div>
          <Button
            onClick={handleAddToCart}
            className="rounded-full transition-all duration-200 !border-primary !text-primary hover:!bg-primary hover:!text-white w-full"
            size="large">
            <Plus className="h-4 w-4 mr-2" />
            Agregar
          </Button>
        </div>
      </div>
    </Card>
  );
};
