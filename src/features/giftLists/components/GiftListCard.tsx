import { Card } from 'antd';
import { Calendar, Eye, Trash2, TrendingUp, Users, Sparkles, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import type { GiftListWithGifts } from 'types/models/giftList';
import { MLButton } from 'src/components/core/MLButton';
import { InvitationButton } from './InvitationButton';

interface GiftListCardProps {
  list: GiftListWithGifts;
  index: number;
  onViewList: (listId: number) => void;
  onDeleteList: (listId: number, listTitle: string) => void;
  onManageInvitation: (listId: number) => void;
  onViewInvitation: (listId: number) => void;
}

export function GiftListCard({ list, index, onViewList, onDeleteList, onManageInvitation, onViewInvitation }: GiftListCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const progressPercentage = (() => {
    if (!list.gifts || list.gifts.length === 0) return 0;
    const purchased = list.gifts.filter((g) => g.isPurchased).length;
    return Math.round((purchased / list.gifts.length) * 100);
  })();

  const totalValue = list.gifts?.reduce((sum, gift) => sum + gift.price, 0) || 0;
  const raisedAmount = list.gifts?.filter((g) => g.isPurchased).reduce((sum, gift) => sum + gift.price, 0) || 0;
  const purchasedGifts = list.gifts?.filter((g) => g.isPurchased).length || 0;
  const totalGiftsCount = list.gifts?.length || 0;

  return (
    <motion.div
      key={list.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}>
      <Card
        styles={{ body: { padding: '0px' } }}
        className="border-0 shadow-md! hover:shadow-xl! transition-all! duration-300! rounded-2xl! overflow-hidden! group">
        <div className="p-0">
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left Section - Main Info */}
            <div className="lg:col-span-7 p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-medium text-foreground">{list.title || list.coupleName}</h3>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-light ${
                        list.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {list.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-light capitalize">{formatDate(list.eventDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-light">{list.invitationCount || 0} invitados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-light">{list.planType === 'FIXED' ? 'Plan Fijo' : 'Comisión'}</span>
                    </div>
                  </div>
                </div>

                <MLButton onClick={() => onDeleteList(list.id, list.title || list.coupleName)} buttonType="danger" type="text">
                  <Trash2 className="h-5 w-5" />
                </MLButton>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground font-light">Progreso de regalos</span>
                  <span className="text-sm font-medium text-foreground">{progressPercentage}%</span>
                </div>
                <div className="h-2 bg-[#f5f5f7] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-linear-to-r to-[#d08140] from-gray-50"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground font-light">
                    {purchasedGifts} de {totalGiftsCount} regalos comprados
                  </span>
                </div>
              </div>

              {/* Invitation Section */}
              <InvitationButton
                listId={list.id}
                onManageInvitation={() => onManageInvitation(list.id)}
                onViewInvitation={() => onViewInvitation(list.id)}
              />

              {list.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-4">{list.description}</p>}
            </div>

            {/* Right Section - Stats */}
            <div className="lg:col-span-5 bg-linear-to-br from-[#f5f5f7] to-white p-8 border-l border-border/30">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground font-light mb-2">Valor Total</p>
                  <p className="text-3xl font-light text-foreground">{formatCurrency(totalValue)}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground font-light mb-2">Recaudado</p>
                    <p className="text-xl font-medium text-[#34c759]">{formatCurrency(raisedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-light mb-2">Pendiente</p>
                    <p className="text-xl font-medium text-[#ff9500]">{formatCurrency(totalValue - raisedAmount)}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/30">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-[#007aff]" />
                    <p className="text-sm font-medium text-foreground">Estadísticas</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-light">Regalos totales</span>
                      <span className="text-sm font-medium text-foreground">{totalGiftsCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-light">Regalos comprados</span>
                      <span className="text-sm font-medium text-foreground">{purchasedGifts}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-light">Tasa de compra</span>
                      <span className="text-sm font-medium text-foreground">{progressPercentage}%</span>
                    </div>
                  </div>
                </div>

                <MLButton onClick={() => onViewList(list.id)} buttonType="primary" className="w-full">
                  <Eye className="h-5 w-5 mr-2" />
                  Gestionar Lista
                </MLButton>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
