import { useMemo } from 'react';
import { Modal, Card, Statistic, Spin, Table, Empty, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useGiftListPaymentDetails } from 'hooks/usePaymentAnalytics';
import type { GiftListPaymentAnalytics, GiftPaymentDetail } from 'services/paymentAnalytics.service';

interface GiftPaymentsReportModalProps {
  open: boolean;
  selectedGiftList: GiftListPaymentAnalytics | null;
  onClose: () => void;
}

export function GiftPaymentsReportModal({ open, selectedGiftList, onClose }: GiftPaymentsReportModalProps) {
  const selectedGiftListId = selectedGiftList?.id;
  const { data: paymentDetails, isLoading: isPaymentDetailsLoading } = useGiftListPaymentDetails(selectedGiftListId, open && !!selectedGiftListId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return dayjs(date).format('DD/MMM/YYYY');
  };

  const paymentDetailsTotals = useMemo(() => {
    if (!paymentDetails) {
      return {
        totalGiftAmount: 0,
        totalPaymentFees: 0,
        totalMesaListaCommissions: 0,
        totalCoupleReceives: 0,
      };
    }

    return paymentDetails.reduce(
      (acc, item) => {
        acc.totalGiftAmount += item.paymentAmount;
        acc.totalPaymentFees += item.paymentFee;
        acc.totalMesaListaCommissions += item.mesaListaCommission;
        acc.totalCoupleReceives += item.coupleReceives;
        return acc;
      },
      {
        totalGiftAmount: 0,
        totalPaymentFees: 0,
        totalMesaListaCommissions: 0,
        totalCoupleReceives: 0,
      },
    );
  }, [paymentDetails]);

  const paymentDetailsColumns: ColumnsType<GiftPaymentDetail> = [
    {
      title: 'Regalo',
      key: 'giftTitle',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.giftTitle}</div>
          <div className="text-xs text-gray-500">ID #{record.giftId}</div>
        </div>
      ),
    },
    {
      title: 'Invitado',
      key: 'guest',
      render: (_, record) => (
        <div>
          <div>{record.guestName}</div>
          <div className="text-xs text-gray-500">{record.guestEmail || '-'}</div>
        </div>
      ),
    },
    {
      title: 'Método',
      dataIndex: 'paymentType',
      key: 'paymentType',
      width: 100,
      render: (paymentType: GiftPaymentDetail['paymentType']) => <Tag color={paymentType === 'PAYPAL' ? 'blue' : 'purple'}>{paymentType}</Tag>,
    },
    {
      title: 'Monto Regalo',
      dataIndex: 'paymentAmount',
      key: 'paymentAmount',
      align: 'right' as const,
      render: (value: number) => <span className="font-medium">{formatCurrency(value)}</span>,
    },
    {
      title: 'Comisión Pago',
      dataIndex: 'paymentFee',
      key: 'paymentFee',
      align: 'right' as const,
      render: (value: number) => <span className={value > 0 ? 'text-orange-600' : 'text-gray-400'}>{formatCurrency(value)}</span>,
    },
    {
      title: 'Neto',
      dataIndex: 'netAmount',
      key: 'netAmount',
      align: 'right' as const,
      render: (value: number) => <span className="text-blue-700">{formatCurrency(value)}</span>,
    },
    {
      title: 'Comisión MesaLista',
      dataIndex: 'mesaListaCommission',
      key: 'mesaListaCommission',
      align: 'right' as const,
      render: (value: number) => <span className={value > 0 ? 'text-purple-600' : 'text-gray-400'}>{formatCurrency(value)}</span>,
    },
    {
      title: 'Pareja Recibe',
      dataIndex: 'coupleReceives',
      key: 'coupleReceives',
      align: 'right' as const,
      render: (value: number) => <span className="font-semibold text-green-600">{formatCurrency(value)}</span>,
    },
    {
      title: 'Fecha',
      dataIndex: 'paidAt',
      key: 'paidAt',
      width: 120,
      render: (value: string) => formatDate(value),
    },
  ];

  return (
    <Modal title={selectedGiftList ? `Reporte de pagos - ${selectedGiftList.title}` : 'Reporte de pagos'} open={open} onCancel={onClose} footer={null} width={1200}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card size="small">
            <Statistic title="Monto Regalos" value={paymentDetailsTotals.totalGiftAmount} formatter={(value) => formatCurrency(Number(value))} />
          </Card>
          <Card size="small">
            <Statistic title="Comisiones Pago" value={paymentDetailsTotals.totalPaymentFees} formatter={(value) => formatCurrency(Number(value))} />
          </Card>
          <Card size="small">
            <Statistic
              title="Comisión MesaLista"
              value={paymentDetailsTotals.totalMesaListaCommissions}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
          <Card size="small">
            <Statistic
              title="Total a Transferir"
              value={paymentDetailsTotals.totalCoupleReceives}
              valueStyle={{ color: '#16a34a' }}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
        </div>

        {isPaymentDetailsLoading ? (
          <div className="py-10 flex justify-center">
            <Spin size="large" />
          </div>
        ) : paymentDetails && paymentDetails.length > 0 ? (
          <Table
            columns={paymentDetailsColumns}
            dataSource={paymentDetails}
            rowKey={(record, index) => `${record.paymentId}-${record.giftId}-${index}`}
            pagination={{ pageSize: 8, showSizeChanger: true }}
            scroll={{ x: 1200 }}
          />
        ) : (
          <Empty description="No hay pagos para esta lista" />
        )}
      </div>
    </Modal>
  );
}
