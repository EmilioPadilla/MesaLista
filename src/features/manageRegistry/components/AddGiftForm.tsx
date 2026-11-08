import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Collapsible } from 'src/components/core/Collapsible';
import { Plus, X, Eye, ExternalLink, Link2, Check } from 'lucide-react';
import { UploadOutlined, CaretDownFilled } from '@ant-design/icons';
import { Checkbox, Form, Input, Upload, Select, message, Image, Button, Card } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { UploadChangeParam } from 'antd/es/upload';
import { useCreateGift } from 'src/hooks/useGift';
import { useUploadFile } from 'src/hooks/useFiles';
import { convertHeicToJpegIfNeeded, isHeic } from '../utils/heicToJpeg';
import { GiftTypeSelector } from './GiftTypeSelector';
import type { GiftType } from 'types/models/gift';
import { MIN_CONTRIBUTOR_TARGET } from 'src/utils/giftFunding';
import { publicRegistryPath, publicRegistryUrl } from 'src/utils/registryLinks';

interface AddGiftFormProps {
  giftListId?: number;
  /** With several lists the slug alone can't say which one, so links carry the id. */
  hasMultipleLists?: boolean;
  /** A draft's link doesn't work for guests yet, so there's nothing to copy. */
  isDraft?: boolean;
  categoryOptions?: Array<{ value: string; label: string }>;
  onGiftCreated?: () => void;
}

export const AddGiftForm: React.FC<AddGiftFormProps> = ({
  giftListId,
  hasMultipleLists = false,
  isDraft = false,
  categoryOptions = [],
  onGiftCreated,
}) => {
  const [form] = useForm();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Extract slug from current URL path
  const slug = location.pathname.split('/')[1];
  const linkListId = hasMultipleLists ? giftListId : undefined;
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  // Check URL query parameter to determine initial modal state
  const shouldShowModal = searchParams.get('addGift') === 'true';
  const [showAddGiftModal, setShowAddGiftModal] = useState(shouldShowModal);
  const [imageState, setImageState] = useState<{
    file: File | null;
    url: string | undefined;
    name: string | undefined;
  }>({ file: null, url: undefined, name: undefined });
  // Funding shape for the gift being created. New gifts default to the original
  // single-buyer behaviour, so nothing changes for a couple who ignores this.
  const [giftType, setGiftType] = useState<GiftType>('SINGLE');
  const [contributorTarget, setContributorTarget] = useState<number | null>(null);
  const [minContribution, setMinContribution] = useState<number | null>(null);
  const [priceDraft, setPriceDraft] = useState<number>(0);

  const { mutate: createGift, isSuccess: createSuccess, isError: createError } = useCreateGift();
  const { mutate: uploadFile } = useUploadFile();

  // Update modal state when URL parameter changes
  useEffect(() => {
    const shouldShow = searchParams.get('addGift') === 'true';
    setShowAddGiftModal(shouldShow);
  }, [searchParams]);

  useEffect(() => {
    if (createSuccess) {
      message.success('Regalo agregado correctamente!');
      form.resetFields();
      setImageState({ file: null, url: undefined, name: undefined });
      setGiftType('SINGLE');
      setContributorTarget(null);
      setMinContribution(null);
      setPriceDraft(0);
      onGiftCreated?.();
    }
    if (createError) {
      message.error('Error al agregar el regalo');
    }
  }, [createSuccess, createError]);

  useEffect(() => {
    if (!isLinkCopied) return;
    const timer = setTimeout(() => setIsLinkCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [isLinkCopied]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicRegistryUrl(slug, linkListId));
      setIsLinkCopied(true);
    } catch {
      message.error('No se pudo copiar el enlace. Inténtalo de nuevo.');
    }
  };

  const handleCloseModal = () => {
    setShowAddGiftModal(false);
    // Remove the query parameter from URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('addGift');
    setSearchParams(newSearchParams);
  };

  const handleAddGift = (values: any) => {
    let categoriesPayload = values.categories;
    if (Array.isArray(categoriesPayload)) {
      categoriesPayload = categoriesPayload.map((cat: string) => ({ name: cat }));
    }

    if (giftType === 'GROUP_FIXED' && (!contributorTarget || contributorTarget < MIN_CONTRIBUTOR_TARGET)) {
      message.error(`Un regalo en partes se divide entre al menos ${MIN_CONTRIBUTOR_TARGET} personas`);
      return;
    }

    // Only the selected variant's field travels; the other is explicitly null so
    // the server never stores a leftover from a type the couple moved away from.
    const fundingShape = {
      giftType,
      contributorTarget: giftType === 'GROUP_FIXED' ? contributorTarget : null,
      minContribution: giftType === 'GROUP_OPEN' ? minContribution : null,
    };

    if (imageState.file) {
      uploadFile(imageState.file, {
        onSuccess: (data) => {
          const newGift = {
            ...values,
            ...fundingShape,
            categories: categoriesPayload,
            giftListId: giftListId,
            imageUrl: data,
            isPurchased: false,
          };
          createGift(newGift);
        },
      });
    } else {
      const newGift = {
        ...values,
        ...fundingShape,
        categories: categoriesPayload,
        giftListId: giftListId,
        imageUrl: undefined,
        isPurchased: false,
      };
      createGift(newGift);
    }
  };

  const handleImageChange = (info: UploadChangeParam) => {
    if (!info.fileList || !info.fileList[0]) {
      setImageState({ name: '', file: null, url: '' });
      return;
    }

    const originalFile = info.fileList[0].originFileObj as File;

    // Non-HEIC files (JPEG/PNG/etc) must update state synchronously. An
    // unconditional `await` here defers the setState by a microtask, racing
    // with a quick Save click and submitting with `imageState.file` still null.
    if (!isHeic(originalFile)) {
      setImageState({
        name: originalFile.name,
        file: originalFile,
        url: URL.createObjectURL(originalFile),
      });
      return;
    }

    convertHeicToJpegIfNeeded(originalFile)
      .then((usableFile) => {
        setImageState({
          name: usableFile.name,
          file: usableFile,
          url: URL.createObjectURL(usableFile),
        });
      })
      .catch(() => {
        message.error('No pudimos procesar esa imagen. Intenta con otro formato (JPG o PNG).');
      });
  };

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-x-4 !mb-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Button to take user to see the list of gifts as a guest */}
          <Button
            type="default"
            icon={<Eye className="h-4 w-4" />}
            onClick={() => window.open(publicRegistryPath(slug, linkListId), '_blank')}
            className="mt-2 group">
            Ver como Invitado <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </Button>

          {!isDraft && (
            <Button
              type="default"
              icon={isLinkCopied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              onClick={handleCopyLink}
              className="mt-2">
              <span aria-live="polite">{isLinkCopied ? 'Enlace copiado' : 'Copiar enlace'}</span>
            </Button>
          )}
        </div>

        <div className="flex items-center">
          {showAddGiftModal ? (
            <Button
              type="text"
              className="cursor-pointer flex items-center !mb-0 mt-2 flex text-gray-300 hover:text-gray-400 transition-colors"
              onClick={handleCloseModal}>
              <CaretDownFilled className="h-5 w-5" /> Ocultar Nuevo Regalo
            </Button>
          ) : (
            <Button type="primary" onClick={() => setShowAddGiftModal(true)} className="!mb-0 mt-2">
              <Plus className="h-5 w-5" /> Agregar Nuevo Regalo
            </Button>
          )}
        </div>
      </div>
      <Collapsible isOpen={showAddGiftModal}>
        <Card className="shadow-lg" title="Agregar Nuevo Regalo">
          <div className="space-y-4">
            <Form form={form} onFinish={handleAddGift} layout="vertical" className="space-y-4" validateTrigger="onSubmit">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Form.Item
                    name="title"
                    label="Nombre del Regalo"
                    className="!mb-0"
                    rules={[{ required: true, message: 'Por favor, ingresa el nombre del regalo' }]}>
                    <Input id="title" placeholder="Ej. Juego de sábanas" />
                  </Form.Item>
                </div>

                <div className="space-y-2">
                  <Form.Item
                    name="price"
                    label={giftType === 'SINGLE' ? 'Precio (MXN)' : 'Meta (MXN)'}
                    className="!mb-0"
                    rules={[{ required: true, message: 'Por favor, ingresa el precio del regalo' }]}>
                    <Input
                      id="price"
                      type="number"
                      placeholder="1500"
                      onChange={(event) => setPriceDraft(Number(event.target.value) || 0)}
                    />
                  </Form.Item>
                </div>

                <div className="space-y-2 ">
                  <Form.Item
                    name="categories"
                    label="Categoría"
                    className="!mb-0"
                    rules={[{ required: true, message: 'Por favor, selecciona una categoría' }]}>
                    <Select
                      mode="tags"
                      allowClear
                      suffixIcon={<CaretDownFilled />}
                      optionFilterProp="label"
                      style={{ width: '100%' }}
                      placeholder="Selecciona (o crea) de 1 a 3 categorías"
                      options={categoryOptions}
                      maxCount={3}
                    />
                  </Form.Item>
                </div>
                <div className="space-y-2  flex items-center">
                  <Form.Item className="!mb-0" name="isMostWanted" valuePropName="checked">
                    <Checkbox>Más Deseado</Checkbox>
                  </Form.Item>
                </div>
              </div>

              <GiftTypeSelector
                value={giftType}
                onChange={setGiftType}
                price={priceDraft}
                contributorTarget={contributorTarget}
                onContributorTargetChange={setContributorTarget}
                minContribution={minContribution}
                onMinContributionChange={setMinContribution}
              />

              <div className="space-y-2">
                <Form.Item name="description" label="Descripción" className="!mb-0">
                  <Input.TextArea id="description" placeholder="Descripción detallada del regalo..." />
                </Form.Item>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="image">Imagen del Regalo</label>
                  <div className="flex gap-2 !mt-2">
                    <div className="relative w-full">
                      <Upload
                        onChange={handleImageChange}
                        accept="image/*"
                        listType="picture"
                        maxCount={1}
                        beforeUpload={(_file) => {
                          // Return false to prevent actual upload since we're just previewing
                          return false;
                        }}
                        showUploadList={false}>
                        <Button type="default" className="w-full border !border-primary !text-primary">
                          <UploadOutlined /> Seleccionar Imagen
                        </Button>
                      </Upload>
                      {imageState.file && <span className="ml-3 !text-md">{imageState.name}</span>}
                    </div>
                  </div>
                </div>

                {imageState.url && (
                  <div className="space-y-2">
                    <label>Vista Previa</label>
                    <div className="relative flex items-center justify-center w-full max-w-[200px] mx-auto">
                      <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          src={imageState.url}
                          alt="Vista previa"
                          className="w-full h-full object-cover"
                          style={{ maxHeight: '200px' }}
                        />
                      </div>
                      <Button
                        type="default"
                        shape="circle"
                        size="small"
                        aria-label="Quitar imagen"
                        icon={<X className="h-4 w-4" />}
                        className="!absolute top-2 right-2 !inline-flex items-center justify-center shadow-md [&_.ant-btn-icon]:flex"
                        onClick={() => {
                          setImageState({ name: '', file: null, url: '' });
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button htmlType="submit" type="primary" className="w-full shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Regalo
              </Button>
            </Form>
          </div>
        </Card>
      </Collapsible>
    </>
  );
};
