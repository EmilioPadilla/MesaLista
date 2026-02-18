import { Modal, Radio, Button, Space, Alert } from 'antd';
import { Mail, Send } from 'lucide-react';
import { useState } from 'react';
import { MARKETING_EMAIL_TEMPLATES, type MarketingEmailType } from 'src/config/marketingEmailTemplates';

interface SendMarketingEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  onSend: (emailType: MarketingEmailType) => Promise<void>;
}

export function SendMarketingEmailModal({ isOpen, onClose, userName, userEmail, onSend }: SendMarketingEmailModalProps) {
  const [selectedEmail, setSelectedEmail] = useState<MarketingEmailType>('inactive_warning');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSend(selectedEmail);
      onClose();
    } catch (error) {
      // Error is handled by the parent component
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-semibold">Enviar Email de Marketing</div>
            <div className="text-sm font-normal text-gray-500">
              Para: {userName} ({userEmail})
            </div>
          </div>
        </div>
      }
      width={600}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={isSending}>
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<Send className="h-4 w-4" />}
            onClick={handleSend}
            loading={isSending}
            className="bg-[#d4704a] hover:bg-[#c25f3a]">
            Enviar Email
          </Button>
        </div>
      }>
      <div className="space-y-4">
        <Alert
          className="my-3!"
          message="Importante"
          description="Este email se enviará inmediatamente al usuario seleccionado. Asegúrate de que sea el email correcto antes de enviarlo."
          type="warning"
          showIcon
        />

        <Radio.Group value={selectedEmail} onChange={(e) => setSelectedEmail(e.target.value)} className="w-full">
          <Space direction="vertical" className="w-full" size="middle">
            {MARKETING_EMAIL_TEMPLATES.map((template) => (
              <div
                key={template.type}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  selectedEmail === template.type ? 'border-[#d4704a] bg-[#d4704a]/5' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedEmail(template.type)}>
                <Radio value={template.type} className="w-full">
                  <div className="flex items-start gap-3 ml-2">
                    <div
                      className={`w-10 h-10 rounded-lg bg-linear-to-br ${template.color} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-xl">{template.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">{template.title}</div>
                      <div className="text-sm text-gray-600">{template.description}</div>
                    </div>
                  </div>
                </Radio>
              </div>
            ))}
          </Space>
        </Radio.Group>
      </div>
    </Modal>
  );
}
