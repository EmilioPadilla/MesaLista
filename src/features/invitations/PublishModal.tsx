import { useState } from 'react';
import { Button, Input, Modal, Typography } from 'antd';
import { Check, Copy, Eye, Share2 } from 'lucide-react';

const { Title, Text, Paragraph } = Typography;

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  slug: string;
  eventName: string;
}

export function PublishModal({ isOpen, onClose, onConfirm, slug, eventName }: PublishModalProps) {
  const [copied, setCopied] = useState(false);
  const publicUrl = `https://mesalista.com/i/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePublish = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal open={isOpen} onCancel={onClose} footer={null} width={600} className="rounded-3xl overflow-hidden" closable={false}>
      {/* Header with Gradient */}
      <div className="bg-gradient-to-br from-[#007aff] to-[#0051d0] p-8 text-white -m-6 mb-6">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Share2 className="h-8 w-8" />
        </div>
        <Title level={3} className="text-2xl font-light text-white text-center mb-2">
          Publicar Invitación
        </Title>
        <Text className="text-white/80 text-center font-light block">Tu invitación estará disponible públicamente</Text>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <div>
          <Text className="text-sm text-muted-foreground font-light block mb-2">Nombre del evento</Text>
          <Text className="text-lg text-foreground font-medium block">{eventName || 'Sin nombre'}</Text>
        </div>

        <div className="space-y-3">
          <Text className="text-sm text-muted-foreground font-light block">URL pública de la invitación</Text>
          <div className="flex gap-2">
            <Input value={publicUrl} readOnly className="bg-[#f5f5f7] border-0 rounded-xl font-mono flex-1" size="large" />
            <Button
              onClick={handleCopy}
              className="border-border rounded-xl px-6"
              size="large"
              icon={copied ? <Check className="h-5 w-5 text-[#34c759]" /> : <Copy className="h-5 w-5" />}
            />
          </div>
          {copied && (
            <Text className="text-sm text-[#34c759] font-light flex items-center gap-2">
              <Check className="h-4 w-4" />
              URL copiada al portapapeles
            </Text>
          )}
        </div>

        <div className="bg-[#e8f5e9] rounded-2xl p-6">
          <Title level={5} className="font-medium text-foreground mb-2 flex items-center gap-2">
            <Eye className="h-5 w-5 text-[#34c759]" />
            Después de publicar
          </Title>
          <ul className="space-y-2 text-sm text-muted-foreground font-light">
            <li className="flex items-start gap-2">
              <span className="text-[#34c759] mt-0.5">•</span>
              <span>Tu invitación será visible públicamente</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#34c759] mt-0.5">•</span>
              <span>Podrás compartir el enlace con tus invitados</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#34c759] mt-0.5">•</span>
              <span>Los invitados podrán ver la mesa de regalos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#34c759] mt-0.5">•</span>
              <span>Podrás editar la invitación en cualquier momento</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-3 mt-6">
        <Button onClick={onClose} className="flex-1 rounded-full border-border hover:bg-[#f5f5f7] font-light" size="large">
          Cancelar
        </Button>
        <Button
          onClick={handlePublish}
          type="primary"
          className="flex-1 bg-[#007aff] hover:bg-[#0051d0] text-white rounded-full font-light"
          size="large">
          Publicar Ahora
        </Button>
      </div>
    </Modal>
  );
}
