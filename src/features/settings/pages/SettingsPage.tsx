import { useEffect, useMemo, useState } from 'react';
import { Form, message, Select } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser, useUpdateCurrentUserProfile, useUpdateCurrentUserPassword, useCheckSlugAvailability } from 'src/hooks/useUser';
import { useUploadFile } from 'src/hooks/useFiles';
import { useWatch } from 'antd/es/form/Form';
import { DeleteCurrentUserModal } from 'src/components/shared/DeleteCurrentUserModal';
import { useRsvpMessages, useUpdateRsvpMessages } from 'src/hooks/useRsvp';
import { useGiftListsByUser, useUpdateGiftList } from 'src/hooks/useGiftList';
import {
  RsvpMessagesSection,
  PrivacySection,
  FeePreferenceSection,
  ProfileSection,
  PasswordSection,
  CoverImageSection,
  GiftListDetailsSection,
  DangerZoneSection,
  SettingsSidebar,
  SectionHeader,
  SaveBar,
  GiftListSelector,
  GROUPS,
  SECTION_LOOKUP,
  GIFT_LIST_SECTIONS,
  type SectionId,
} from '../components';

export function SettingsPage() {
  const navigate = useNavigate();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [rsvpMessagesForm] = Form.useForm();
  const password = useWatch('newPassword', passwordForm);
  const [coverImage, setCoverImage] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isWeddingAccount, setIsWeddingAccount] = useState(false);
  const [slug, setCoupleSlug] = useState('');
  const [debouncedSlug, setDebouncedSlug] = useState('');
  const [slugError, setSlugError] = useState('');
  const [hasProfileChanges, setHasProfileChanges] = useState(false);
  const [hasPasswordChanges, setHasPasswordChanges] = useState(false);
  const [hasRsvpMessagesChanges, setHasRsvpMessagesChanges] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [feePreference, setFeePreference] = useState<'couple' | 'guest'>('couple');
  const [hasSettingsChanges, setHasSettingsChanges] = useState(false);
  const [activeGiftListId, setActiveGiftListId] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>(() => {
    if (typeof window === 'undefined') return 'profile';
    const hash = window.location.hash.replace('#', '') as SectionId;
    return SECTION_LOOKUP[hash] ? hash : 'profile';
  });

  const { data: userData, isLoading: isLoadingUser } = useCurrentUser();
  const { data: giftLists, isLoading: isLoadingWeddingList } = useGiftListsByUser(userData?.id);

  useEffect(() => {
    if (giftLists && giftLists.length > 0 && !activeGiftListId) {
      setActiveGiftListId(giftLists[0].id);
    }
  }, [giftLists, activeGiftListId]);

  const giftListData = giftLists?.find((list) => list.id === activeGiftListId) || giftLists?.[0];
  const { data: rsvpMessages } = useRsvpMessages(giftListData?.id || 0, !!giftListData?.id);

  const { mutateAsync: updateProfile, isPending: isUpdatingProfile } = useUpdateCurrentUserProfile();
  const { mutateAsync: updatePassword, isPending: isUpdatingPassword } = useUpdateCurrentUserPassword();
  const { mutateAsync: updateGiftList } = useUpdateGiftList();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutateAsync: updateRsvpMessages, isPending: isUpdatingRsvpMessages } = useUpdateRsvpMessages();

  const { data: slugCheck, isLoading: isCheckingSlug } = useCheckSlugAvailability(debouncedSlug, userData?.id);

  useEffect(() => {
    if (userData) {
      profileForm.setFieldsValue({
        firstName: userData.firstName,
        lastName: userData.lastName,
        spouseFirstName: userData.spouseFirstName || '',
        spouseLastName: userData.spouseLastName || '',
        phoneNumber: userData.phoneNumber || '',
        slug: userData.slug || '',
      });

      const hasSpouseInfo = !!(userData.spouseFirstName || userData.spouseLastName);
      setIsWeddingAccount(hasSpouseInfo);

      if (userData.slug) {
        setCoupleSlug(userData.slug);
      }
    }
  }, [userData, profileForm]);

  useEffect(() => {
    if (rsvpMessages) {
      rsvpMessagesForm.setFieldsValue({
        confirmationMessage: rsvpMessages.confirmationMessage,
        cancellationMessage: rsvpMessages.cancellationMessage,
      });
    }
  }, [rsvpMessages, rsvpMessagesForm]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSlug(slug), 500);
    return () => clearTimeout(timer);
  }, [slug]);

  useEffect(() => {
    if (slugCheck && slug && slug !== userData?.slug) {
      if (!slugCheck.available) {
        setSlugError('Este enlace ya está en uso. Por favor elige otro.');
      } else {
        setSlugError('');
      }
    } else if (slug === userData?.slug) {
      setSlugError('');
    }
  }, [slugCheck, slug, userData?.slug]);

  useEffect(() => {
    if (giftListData?.imageUrl) setCoverImage(giftListData.imageUrl);
    if (giftListData?.description) profileForm.setFieldValue('weddingListDescription', giftListData.description);
    if (giftListData?.eventLocation) profileForm.setFieldValue('weddingLocation', giftListData.eventLocation);
    if (giftListData?.eventVenue) profileForm.setFieldValue('weddingVenue', giftListData.eventVenue);
    if (giftListData?.eventDate) profileForm.setFieldValue('weddingDate', dayjs(giftListData.eventDate));
    if (giftListData?.isPublic !== undefined) setIsPublic(giftListData.isPublic);
    if (giftListData?.feePreference) setFeePreference(giftListData.feePreference as 'couple' | 'guest');
  }, [giftListData, profileForm]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const current = window.location.hash.replace('#', '');
    if (current !== activeSection) {
      window.history.replaceState(null, '', `#${activeSection}`);
    }
  }, [activeSection]);

  const handleSectionChange = (id: SectionId) => {
    setActiveSection(id);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleWeddingAccountChange = (checked: boolean) => {
    setIsWeddingAccount(checked);
    setHasProfileChanges(true);
    if (!checked) {
      profileForm.setFieldsValue({
        spouseFirstName: '',
        spouseLastName: '',
        weddingLocation: '',
        weddingVenue: '',
      });
    }
  };

  const handleSlugChange = (value: string) => {
    setCoupleSlug(value);
    setHasProfileChanges(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !giftListData) return;

    try {
      setIsUploadingImage(true);
      const uploadedFile = await uploadFile(file);
      const imageUrl = uploadedFile;

      await updateGiftList({ id: giftListData.id, data: { imageUrl } });

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
      const oldSlug = userData?.slug;
      const newSlug = values.slug;

      await updateProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        spouseFirstName: values.spouseFirstName,
        spouseLastName: values.spouseLastName,
        phoneNumber: values.phoneNumber,
        slug: values.slug,
      });

      if (giftListData) {
        const giftListUpdates: any = {};

        if (isWeddingAccount && values.spouseFirstName) {
          giftListUpdates.coupleName = `${values.firstName}${values.spouseFirstName ? ' y ' + values.spouseFirstName : ''}`.trim();
          giftListUpdates.title = `Lista de ${values.firstName}${values.spouseFirstName ? ' y ' + values.spouseFirstName : ''}`.trim();
        } else {
          giftListUpdates.coupleName = values.firstName;
          giftListUpdates.title = `Lista de ${values.firstName}`;
        }

        if (values.weddingListDescription !== undefined) giftListUpdates.description = values.weddingListDescription;
        if (values.weddingLocation !== undefined) giftListUpdates.eventLocation = values.weddingLocation;
        if (values.weddingVenue !== undefined) giftListUpdates.eventVenue = values.weddingVenue;
        if (values.weddingDate !== undefined) {
          giftListUpdates.eventDate = values.weddingDate ? values.weddingDate.toISOString() : null;
        }

        if (Object.keys(giftListUpdates).length > 0) {
          await updateGiftList({ id: giftListData.id, data: giftListUpdates });
        }
      }

      setHasProfileChanges(false);

      if (oldSlug && newSlug && oldSlug !== newSlug) {
        navigate(`/${newSlug}/configuracion`, { replace: true });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleSavePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      await updatePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      passwordForm.resetFields();
      setHasPasswordChanges(false);
    } catch (error) {
      console.error('Error updating password:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!giftListData) return;
    try {
      await updateGiftList({ id: giftListData.id, data: { isPublic, feePreference } });
      setHasSettingsChanges(false);
      message.success('Configuración actualizada');
    } catch (error) {
      console.error('Error updating settings:', error);
      message.error('Error al actualizar configuración');
    }
  };

  const handleSaveRsvpMessages = async () => {
    try {
      if (!giftListData?.id) {
        message.error('No se encontró la lista de regalos');
        return;
      }
      const values = await rsvpMessagesForm.validateFields();
      await updateRsvpMessages({
        giftListId: giftListData.id,
        confirmationMessage: values.confirmationMessage,
        cancellationMessage: values.cancellationMessage,
      });
      setHasRsvpMessagesChanges(false);
      message.success('Mensajes de confirmación actualizados');
    } catch (error) {
      console.error('Error updating RSVP messages:', error);
      message.error('Error al actualizar mensajes');
    }
  };

  const showGiftListSelector = useMemo(
    () => GIFT_LIST_SECTIONS.includes(activeSection) && !!giftLists && giftLists.length > 1,
    [activeSection, giftLists],
  );

  if (isLoadingUser || isLoadingWeddingList) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-foreground/65 tracking-wide">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero strip */}
      <header className="border-b border-border/40 bg-linear-to-b from-[#faf9f8] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
          <p className="text-[11px] tracking-[0.22em] uppercase text-[#d4704a] font-bold mb-3">Tu cuenta · MesaLista</p>
          <h1 className="text-4xl sm:text-5xl tracking-tight text-foreground">
            Hola, <span className="italic font-light">{userData?.firstName || 'pareja'}</span>
          </h1>
          <p className="text-base text-foreground/70 mt-2 max-w-2xl">
            Personaliza tu perfil, tu mesa de regalos y la experiencia de tus invitados.
          </p>
        </div>
      </header>

      {/* Mobile section selector */}
      <div className="lg:hidden border-b border-border/40 sticky top-0 z-20 bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <span className="text-[10px] tracking-[0.22em] uppercase text-[#d4704a] font-bold shrink-0">Navegar a</span>
          <Select
            value={activeSection}
            onChange={(v) => handleSectionChange(v as SectionId)}
            className="settings-nav-select flex-1"
            size="large"
            options={GROUPS.map((g) => ({
              label: <span className="text-[10px] tracking-[0.18em] uppercase text-foreground/55 font-bold">{g.label}</span>,
              options: g.items.map((i) => ({
                value: i.id,
                label: (
                  <span className="flex items-center gap-2 font-semibold text-[#a8542f]">
                    <i.icon className="h-4 w-4" />
                    {i.label}
                  </span>
                ),
              })),
            }))}
          />
        </div>
        <style>{`
          .settings-nav-select .ant-select-selector {
            background-color: rgba(212, 112, 74, 0.10) !important;
            border-color: rgba(212, 112, 74, 0.30) !important;
            border-radius: 9999px !important;
            transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
          }
          .settings-nav-select:hover .ant-select-selector,
          .settings-nav-select.ant-select-focused .ant-select-selector {
            background-color: rgba(212, 112, 74, 0.16) !important;
            border-color: rgba(212, 112, 74, 0.55) !important;
            box-shadow: 0 0 0 3px rgba(212, 112, 74, 0.10) !important;
          }
          .settings-nav-select .ant-select-selection-item {
            color: #a8542f !important;
            font-weight: 600;
          }
          .settings-nav-select .ant-select-arrow {
            color: #d4704a !important;
          }
        `}</style>
      </div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr] gap-10 lg:gap-16">
          <SettingsSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />

          <main className="min-w-0">
            <SectionHeader sectionId={activeSection} />

            {showGiftListSelector && (
              <GiftListSelector
                giftLists={giftLists}
                activeGiftListId={activeGiftListId}
                activeTitle={giftListData?.title || giftListData?.coupleName || ''}
                onChange={setActiveGiftListId}
              />
            )}

            <div hidden={activeSection !== 'profile'}>
              <ProfileSection
                form={profileForm}
                isWeddingAccount={isWeddingAccount}
                onWeddingAccountChange={handleWeddingAccountChange}
                onValuesChange={() => setHasProfileChanges(true)}
                isUpdating={isUpdatingProfile}
                hasChanges={hasProfileChanges}
                onSave={handleSaveProfile}
              />
            </div>

            <div hidden={activeSection !== 'password'}>
              <PasswordSection
                form={passwordForm}
                password={password}
                onValuesChange={() => setHasPasswordChanges(true)}
                isUpdating={isUpdatingPassword}
                hasChanges={hasPasswordChanges}
                onSave={handleSavePassword}
              />
            </div>

            <div hidden={activeSection !== 'cover'}>
              <CoverImageSection coverImage={coverImage} isUploadingImage={isUploadingImage} onImageUpload={handleImageUpload} />
            </div>

            <div hidden={activeSection !== 'details'}>
              <GiftListDetailsSection
                form={profileForm}
                slug={slug}
                slugError={slugError}
                slugCheck={slugCheck}
                isCheckingSlug={isCheckingSlug}
                userSlug={userData?.slug}
                onSlugChange={handleSlugChange}
                onValuesChange={() => setHasProfileChanges(true)}
                isUpdating={isUpdatingProfile}
                hasChanges={hasProfileChanges}
                onSave={handleSaveProfile}
              />
            </div>

            <div hidden={activeSection !== 'privacy'}>
              <PrivacySection
                isPublic={isPublic}
                userSlug={userData?.slug}
                onPublicChange={(value) => {
                  setIsPublic(value);
                  setHasSettingsChanges(true);
                }}
              />
              <SaveBar onSave={handleSaveSettings} disabled={!hasSettingsChanges} loading={false} label="Guardar privacidad" />
            </div>

            <div hidden={activeSection !== 'fees'}>
              <FeePreferenceSection
                feePreference={feePreference}
                onFeePreferenceChange={(value) => {
                  setFeePreference(value);
                  setHasSettingsChanges(true);
                }}
                onSave={handleSaveSettings}
                hasChanges={hasSettingsChanges}
                hasReceivedGifts={giftListData?.gifts?.some((gift) => gift.isPurchased) ?? false}
              />
            </div>

            <div hidden={activeSection !== 'rsvp'}>
              <RsvpMessagesSection
                form={rsvpMessagesForm}
                isUpdating={isUpdatingRsvpMessages}
                hasChanges={hasRsvpMessagesChanges}
                onSave={handleSaveRsvpMessages}
                onValuesChange={() => setHasRsvpMessagesChanges(true)}
              />
            </div>

            <div hidden={activeSection !== 'danger'}>
              <DangerZoneSection onDeleteClick={() => setIsDeleteModalOpen(true)} />
            </div>
          </main>
        </div>
      </div>

      <DeleteCurrentUserModal open={isDeleteModalOpen} onCancel={() => setIsDeleteModalOpen(false)} />

      <div className="h-24" />
    </div>
  );
}
