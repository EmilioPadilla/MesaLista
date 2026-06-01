import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import Login from 'src/app/routes/Login';
import Signup from 'src/app/routes/Signup';
import SignupSuccess from 'src/app/routes/SignupSuccess';
import Dashboard from 'src/app/routes/Dashboard';
import { ForgotPassword } from 'src/app/routes/ForgotPassword';
import { ResetPassword } from 'src/app/routes/ResetPassword';
import { HomePage } from 'src/app/routes/HomePage';
import { Checkout } from 'src/app/routes/checkout/Checkout';
import { OrderConfirmation } from 'src/app/routes/checkout/OrderConfirmation';
import { Contact } from 'src/app/routes/Contact';

import PublicRegistry from 'src/app/routes/guest/PublicRegistry';
import { BuyGiftsPage } from 'src/features/buyRegistry';
import { ManageRegistryPage } from 'src/features/manageRegistry';
import { SearchPage } from 'src/app/routes/SearchPage';
import { Settings } from 'src/app/routes/couple/Settings';
import { PricingPage } from 'src/app/routes/PricingPage';
import { Analytics } from 'src/app/routes/admin/Analytics';
import { Marketing } from 'src/app/routes/admin/Marketing';
import { AdminControl } from 'src/app/routes/admin/AdminControl';
import { PredesignedListsPage } from 'src/features/predesignedLists';
import { AdminPreDesignedLists } from 'src/app/routes/admin/ManagePredesignedLists.page';
import { ManageDiscountCodes } from 'src/app/routes/admin/ManageDiscountCodes';
import { InvitationsPage, PublicInvitationView } from 'src/features/invitations';
import { MyGiftListsPage } from 'src/features/giftLists';
import { CreateNewList } from 'src/app/routes/couple/CreateNewList';
import { PublicLayout } from 'src/app/routes/layouts/PublicLayout';

import ProtectedRoute from 'src/components/ProtectedRoute';
import AdminRoute from 'src/components/AdminRoute';
import { PageViewTracker } from 'src/components/analytics/PageViewTracker';
import { Footer } from 'src/app/modules/navigation/Footer';

import { GuestConfirmationPage, ManageRsvpPage } from 'src/features/rsvp';

import { NotificationProvider } from 'src/contexts/NotificationContext';
import antdThemeConfig from 'src/styles/config/antdThemeConfig';

function App() {
  const isLocalhost = window.location.hostname === 'localhost';

  return (
    <ConfigProvider theme={antdThemeConfig}>
      <NotificationProvider>
        <BrowserRouter>
          <PageViewTracker />
          <Routes>
            {/* Standalone routes (no TopNav) */}
            <Route path="/login" element={<Login />} />
            <Route path="/olvide-contrasena" element={<ForgotPassword />} />
            <Route path="/restablecer-contrasena" element={<ResetPassword />} />
            <Route path="/registro" element={<Signup />} />
            <Route path="/registro-exitoso" element={<SignupSuccess />} />
            <Route path="/:slug/:giftListId/invitacion" element={<PublicInvitationView />} />

            {/* Public routes wrapped in TopNav layout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/buscar" element={<SearchPage />} />
              <Route path="/contacto" element={<Contact />} />
              <Route path="/precios" element={<PricingPage />} />
              <Route
                path="/colecciones"
                element={
                  <>
                    <PredesignedListsPage />
                    <Footer />
                  </>
                }
              />
            </Route>

            {/* Admin routes — auth gate then layout */}
            <Route element={<AdminRoute />}>
              <Route element={<PublicLayout />}>
                <Route path="/admin/analytics" element={<Analytics />} />
                <Route path="/admin/marketing" element={<Marketing />} />
                <Route path="/admin/control" element={<AdminControl />} />
                <Route path="/admin/colecciones" element={<AdminPreDesignedLists />} />
                <Route path="/admin/codigos-descuento" element={<ManageDiscountCodes />} />
              </Route>
            </Route>

            {/* Public registry view for guests (its own layout via PublicRegistry) */}
            <Route path="/:slug" element={<PublicRegistry />}>
              <Route index element={<HomePage />} />
              <Route path="rsvp" element={<GuestConfirmationPage />} />
              <Route path="regalos" element={<BuyGiftsPage />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="listas" element={<MyGiftListsPage />} />
              <Route path="crear-lista" element={<CreateNewList />} />
              <Route path="pago-confirmado" element={<OrderConfirmation />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Dashboard />}>
                  <Route path="gestionar" element={<ManageRegistryPage />} />
                  <Route path="invitacion" element={<InvitationsPage />} />
                  <Route path="gestionar-rsvp" element={<ManageRsvpPage />} />
                  <Route path="configuracion" element={<Settings />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
      {isLocalhost && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />}
    </ConfigProvider>
  );
}

export default App;
