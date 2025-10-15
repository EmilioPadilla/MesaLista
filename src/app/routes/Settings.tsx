import { useEffect, useState } from 'react';
import { Form, Input, message, Checkbox, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { Button } from 'components/core/Button';
import { Collapsible } from 'components/core/Collapsible';
import { Camera, Save } from 'lucide-react';
import { useCurrentUser, useUpdateCurrentUserProfile, useUpdateCurrentUserPassword, useCheckSlugAvailability } from 'hooks/useUser';
import { useWeddingListByCouple, useUpdateWeddingList } from 'hooks/useWeddingList';
import { useUploadFile } from 'hooks/useFiles';
import { PasswordStrengthIndicator } from 'components/auth/PasswordStrengthIndicator';
import { useWatch } from 'antd/es/form/Form';

export function Settings() {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const password = useWatch('newPassword', passwordForm);
  const [coverImage, setCoverImage] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isWeddingAccount, setIsWeddingAccount] = useState(false);
  const [coupleSlug, setCoupleSlug] = useState('');
  const [debouncedSlug, setDebouncedSlug] = useState('');
  const [slugError, setSlugError] = useState('');
  const [hasProfileChanges, setHasProfileChanges] = useState(false);
  const [hasPasswordChanges, setHasPasswordChanges] = useState(false);

  // Fetch current user data
  const { data: userData, isLoading: isLoadingUser } = useCurrentUser();
  const { data: weddingListData, isLoading: isLoadingWeddingList } = useWeddingListByCouple(userData?.id);

  // Mutations
  const { mutateAsync: updateProfile, isPending: isUpdatingProfile } = useUpdateCurrentUserProfile();
  const { mutateAsync: updatePassword, isPending: isUpdatingPassword } = useUpdateCurrentUserPassword();
  const { mutateAsync: updateWeddingList } = useUpdateWeddingList();
  const { mutateAsync: uploadFile } = useUploadFile();

  // Check slug availability (excluding current user)
  const { data: slugCheck, isLoading: isCheckingSlug } = useCheckSlugAvailability(debouncedSlug, userData?.id);

  // Load user data into form when available
  useEffect(() => {
    if (userData) {
      profileForm.setFieldsValue({
        firstName: userData.firstName,
        lastName: userData.lastName,
        spouseFirstName: userData.spouseFirstName || '',
        spouseLastName: userData.spouseLastName || '',
        phoneNumber: userData.phoneNumber || '',
        coupleSlug: userData.coupleSlug || '',
      });

      // Check if user has spouse information to determine if it's a wedding account
      const hasSpouseInfo = !!(userData.spouseFirstName || userData.spouseLastName);
      setIsWeddingAccount(hasSpouseInfo);

      // Set initial couple slug
      if (userData.coupleSlug) {
        setCoupleSlug(userData.coupleSlug);
      }
    }
  }, [userData, profileForm]);

  // Debounce slug input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSlug(coupleSlug);
    }, 500);

    return () => clearTimeout(timer);
  }, [coupleSlug]);

  // Update slug error based on availability check
  useEffect(() => {
    if (slugCheck && coupleSlug && coupleSlug !== userData?.coupleSlug) {
      if (!slugCheck.available) {
        setSlugError('Este enlace ya está en uso. Por favor elige otro.');
      } else {
        setSlugError('');
      }
    } else if (coupleSlug === userData?.coupleSlug) {
      // Clear error if it's the user's current slug
      setSlugError('');
    }
  }, [slugCheck, coupleSlug, userData?.coupleSlug]);

  // Load wedding list cover image, description, location, and venue
  useEffect(() => {
    if (weddingListData?.imageUrl) {
      setCoverImage(weddingListData.imageUrl);
    }
    if (weddingListData?.description) {
      profileForm.setFieldValue('weddingListDescription', weddingListData.description);
    }
    if (weddingListData?.weddingLocation) {
      profileForm.setFieldValue('weddingLocation', weddingListData.weddingLocation);
    }
    if (weddingListData?.weddingVenue) {
      profileForm.setFieldValue('weddingVenue', weddingListData.weddingVenue);
    }
    if (weddingListData?.weddingDate) {
      profileForm.setFieldValue('weddingDate', dayjs(weddingListData.weddingDate));
    }
  }, [weddingListData, profileForm]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !weddingListData) return;

    try {
      setIsUploadingImage(true);

      // Upload file to server
      const uploadedFile = await uploadFile(file);
      const imageUrl = uploadedFile;

      // Update wedding list with new image URL
      await updateWeddingList({
        id: weddingListData.id,
        data: { imageUrl },
      });

      setCoverImage(imageUrl);
      message.success('Imagen de portada actualizada');
    } catch (error) {
      console.error('Error uploading image:', error);
      message.error('Error al subir la imagen');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const values = await profileForm.validateFields();

      // Update user profile
      await updateProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        spouseFirstName: values.spouseFirstName,
        spouseLastName: values.spouseLastName,
        phoneNumber: values.phoneNumber,
        coupleSlug: values.coupleSlug,
      });

      // Update wedding list data if it exists
      if (weddingListData) {
        const weddingListUpdates: any = {};

        if (values.weddingListDescription !== undefined) {
          weddingListUpdates.description = values.weddingListDescription;
        }
        if (values.weddingLocation !== undefined) {
          weddingListUpdates.weddingLocation = values.weddingLocation;
        }
        if (values.weddingVenue !== undefined) {
          weddingListUpdates.weddingVenue = values.weddingVenue;
        }
        if (values.weddingDate !== undefined) {
          weddingListUpdates.weddingDate = values.weddingDate ? values.weddingDate.toISOString() : null;
        }

        // Only update if there are changes
        if (Object.keys(weddingListUpdates).length > 0) {
          await updateWeddingList({
            id: weddingListData.id,
            data: weddingListUpdates,
          });
        }
      }

      // Reset change flag after successful save
      setHasProfileChanges(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleSavePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      await updatePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.resetFields();
      setHasPasswordChanges(false);
    } catch (error) {
      console.error('Error updating password:', error);
    }
  };

  if (isLoadingUser || isLoadingWeddingList) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#faf9f8] to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center space-y-4">
            <h1 className="text-5xl sm:text-6xl tracking-tight text-foreground">Configuración</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light">Personaliza tu perfil y la página de regalos</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Cover Image Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-3xl tracking-tight text-foreground mb-2">Imagen de portada</h2>
            <p className="text-muted-foreground font-light">Esta imagen aparecerá en tu página de regalos</p>
          </div>

          <div className="space-y-4">
            <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl bg-muted">
              {coverImage ? (
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <p className="text-muted-foreground">Sin imagen de portada</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/20" />
              <label htmlFor="cover-upload" className="absolute bottom-6 right-6 cursor-pointer">
                <div className="bg-white/90 backdrop-blur-xl hover:bg-white transition-all duration-200 rounded-full p-4 shadow-lg">
                  <Camera className="h-6 w-6 text-[#d4704a]" />
                </div>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploadingImage}
                />
              </label>
            </div>
            <p className="text-sm text-muted-foreground font-light">
              {isUploadingImage ? 'Subiendo imagen...' : 'Recomendado: 1920 x 820 píxeles'}
            </p>
          </div>
        </section>

        {/* Personal Information */}
        <section className="space-y-6">
          <div>
            <h2 className="text-3xl tracking-tight text-foreground mb-2">Información personal</h2>
            <p className="text-muted-foreground font-light">Actualiza tu información de contacto</p>
          </div>

          <Form form={profileForm} layout="vertical" onValuesChange={() => setHasProfileChanges(true)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item
                name="firstName"
                className="!mb-0"
                label={<span className="text-sm text-muted-foreground">Nombre</span>}
                rules={[{ required: true, message: 'El nombre es requerido' }]}>
                <Input className="h-12 px-4 !bg-[#f5f5f7]" />
              </Form.Item>

              <Form.Item
                name="lastName"
                className="!mb-0"
                label={<span className="text-sm text-muted-foreground">Apellido</span>}
                rules={[{ required: true, message: 'El apellido es requerido' }]}>
                <Input className="h-12 px-4 !bg-[#f5f5f7]" />
              </Form.Item>

              <Form.Item
                name="phoneNumber"
                label={<span className="text-sm text-muted-foreground">Teléfono</span>}
                className="md:col-span-2 !mb-0"
                rules={[
                  { required: true, message: 'El teléfono es requerido' },
                  { pattern: /^[\d\s\-\+\(\)]{10,}$/, message: 'Teléfono inválido' },
                ]}>
                <Input className="h-12 px-4 !bg-[#f5f5f7]" placeholder="55 1234 5678" />
              </Form.Item>
            </div>
          </Form>
        </section>

        {/* Couple Information */}
        <section className="space-y-6">
          <div>
            <h2 className="text-3xl tracking-tight text-foreground mb-2">Información de la pareja</h2>
            <p className="text-muted-foreground font-light">Datos de tu pareja para la mesa de regalos</p>
          </div>

          <div className="space-y-4">
            <Checkbox
              checked={isWeddingAccount}
              onChange={(e) => {
                setIsWeddingAccount(e.target.checked);
                // Clear spouse and wedding fields if unchecking
                if (!e.target.checked) {
                  profileForm.setFieldsValue({
                    spouseFirstName: '',
                    spouseLastName: '',
                    weddingLocation: '',
                    weddingVenue: '',
                  });
                }
              }}
              className="text-base">
              <span className="text-foreground font-medium">Cuenta para boda</span>
            </Checkbox>

            <Collapsible isOpen={isWeddingAccount}>
              <Form form={profileForm} layout="vertical" onValuesChange={() => setHasProfileChanges(true)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Item name="spouseFirstName" label={<span className="text-sm text-muted-foreground">Nombre de la pareja</span>}>
                    <Input className="h-12 px-4 !bg-[#f5f5f7]" placeholder="Ej: María" />
                  </Form.Item>

                  <Form.Item name="spouseLastName" label={<span className="text-sm text-muted-foreground">Apellido de la pareja</span>}>
                    <Input className="h-12 px-4 !bg-[#f5f5f7]" placeholder="Ej: García" />
                  </Form.Item>
                </div>
              </Form>
            </Collapsible>
          </div>
        </section>

        {/* Couple Slug */}
        <section className="space-y-6">
          <div className="!mb-2">
            <h2 className="text-3xl tracking-tight text-foreground mb-2">Información de la mesa de regalos</h2>
            <p className="text-muted-foreground font-light">Esta será la dirección web de tu mesa de regalos</p>
          </div>

          <Form form={profileForm} layout="vertical" onValuesChange={() => setHasProfileChanges(true)}>
            <Form.Item
              name="coupleSlug"
              className="!mb-0"
              label={<span className="text-sm text-muted-foreground">Slug de la pareja</span>}
              rules={[{ required: true, message: 'El slug es requerido' }]}
              validateStatus={
                slugError ? 'error' : coupleSlug && slugCheck?.available && coupleSlug !== userData?.coupleSlug ? 'success' : undefined
              }
              help={null}>
              <Input
                addonBefore="mesalista.com.mx/"
                value={coupleSlug}
                className="[&_input]:!bg-[#f5f5f7] [&_input]:h-12 [&_.ant-input-group-addon]:!bg-white [&_.ant-input-group-addon]:!border-border"
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  setCoupleSlug(value);
                  profileForm.setFieldValue('coupleSlug', value);
                  setHasProfileChanges(true);
                }}
              />
            </Form.Item>
            <div className="space-y-1 mt-1">
              <p className="text-sm text-muted-foreground font-light">Solo letras minúsculas, números y guiones</p>
              {isCheckingSlug && coupleSlug && coupleSlug !== userData?.coupleSlug && (
                <p className="text-sm text-muted-foreground">Verificando disponibilidad...</p>
              )}
              {!isCheckingSlug && slugCheck && slugCheck.available && coupleSlug && coupleSlug !== userData?.coupleSlug && (
                <p className="text-sm text-green-600">✓ Este enlace está disponible</p>
              )}
              {slugError && <p className="text-sm text-red-500">{slugError}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Form.Item name="weddingVenue" label={<span className="text-sm text-muted-foreground !mb-0">Lugar del evento</span>}>
                <Input className="h-12 px-4 !bg-[#f5f5f7]" placeholder="Ej: Hacienda San José" />
              </Form.Item>

              <Form.Item name="weddingLocation" label={<span className="text-sm text-muted-foreground !mb-0">Ciudad, Estado</span>}>
                <Input className="h-12 px-4 !bg-[#f5f5f7]" placeholder="Ej: Guadalajara, Jalisco" />
              </Form.Item>

              <Form.Item name="weddingDate" label={<span className="text-sm text-muted-foreground">Fecha del evento</span>}>
                <DatePicker className="w-full h-12 !bg-[#f5f5f7] !border-none" format="MMM DD, YYYY" placeholder="Selecciona la fecha" />
              </Form.Item>
            </div>

            <Form.Item
              name="weddingListDescription"
              label={<span className="text-sm text-muted-foreground mt-10">Tu mensaje para los invitados en la mesa de regalos</span>}
              className="mt-6">
              <Input.TextArea
                rows={4}
                placeholder="Describe tu mesa de regalos, comparte tu historia o deja un mensaje para tus invitados..."
                className="!bg-[#f5f5f7] resize-none"
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Form>
        </section>

        {/* Save Profile Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleSaveProfile}
            disabled={isUpdatingProfile || !hasProfileChanges}
            className="px-8 py-3 bg-[#d4704a] hover:bg-[#c25f3a] text-white rounded-full transition-all duration-200 flex items-center gap-2 border-0 disabled:opacity-50 disabled:cursor-not-allowed">
            <Save className="h-5 w-5" />
            {isUpdatingProfile ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>

        {/* Divider */}
        <div className="border-t border-border/30" />

        {/* Password Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-3xl tracking-tight text-foreground mb-2">Cambiar contraseña</h2>
            <p className="text-muted-foreground font-light">Actualiza tu contraseña para mantener tu cuenta segura</p>
          </div>

          <Form form={passwordForm} layout="vertical" onValuesChange={() => setHasPasswordChanges(true)}>
            <div className="space-y-4">
              <Form.Item
                name="currentPassword"
                label={<span className="text-sm text-muted-foreground">Contraseña actual</span>}
                rules={[{ required: true, message: 'La contraseña actual es requerida' }]}>
                <Input.Password className="h-12 px-4 !bg-[#f5f5f7]" />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label={<span className="text-sm text-muted-foreground">Nueva contraseña</span>}
                rules={[
                  { required: true, message: 'La nueva contraseña es requerida' },
                  { min: 8, message: 'La contraseña debe tener al menos 8 caracteres' },
                ]}>
                <Input.Password className="h-12 px-4 !bg-[#f5f5f7]" />
              </Form.Item>

              {password && <PasswordStrengthIndicator password={password} />}

              <Form.Item
                name="confirmPassword"
                label={<span className="text-sm text-muted-foreground">Confirmar nueva contraseña</span>}
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Confirma tu nueva contraseña' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Las contraseñas no coinciden'));
                    },
                  }),
                ]}>
                <Input.Password className="h-12 px-4 !bg-[#f5f5f7]" />
              </Form.Item>
            </div>
          </Form>

          <div className="flex justify-center pt-4">
            <Button
              onClick={handleSavePassword}
              disabled={isUpdatingPassword || !hasPasswordChanges}
              className="px-8 py-3 bg-[#d4704a] hover:bg-[#c25f3a] text-white rounded-full transition-all duration-200 flex items-center gap-2 border-0 disabled:opacity-50 disabled:cursor-not-allowed">
              <Save className="h-5 w-5" />
              {isUpdatingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
            </Button>
          </div>
        </section>
      </div>

      {/* Footer spacing */}
      <div className="h-24" />
    </div>
  );
}
