import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';

// Pages
import Login from 'routes/Login';
import Signup from 'routes/Signup';
import SignupSuccess from 'routes/SignupSuccess';
import Dashboard from 'routes/Dashboard';
import { ForgotPassword } from 'routes/ForgotPassword';
import { ResetPassword } from 'routes/ResetPassword';

// Components
import PublicRegistry from 'src/app/routes/guest/PublicRegistry';

// Components
import ProtectedRoute from 'components/ProtectedRoute';
import AdminRoute from 'components/AdminRoute';

import antdThemeConfig from 'styles/config/antdThemeConfig';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HomePage } from 'routes/HomePage';
import { TopNav } from 'src/app/modules/navigation/topnav/TopNav';
import { TopNavWrapper } from 'src/app/modules/navigation/topnav/TopNavWrapper';
import { BuyGifts } from 'src/app/routes/guest/BuyGifts';
import { Checkout } from 'routes/checkout/Checkout';
import { OrderConfirmation } from 'routes/checkout/OrderConfirmation';
import { ManageRegistry } from 'src/app/routes/couple/ManageRegistry';
import { SearchPage } from 'src/app/routes/SearchPage';
import { Contact } from 'routes/Contact';
import { Settings } from './app/routes/couple/Settings';
import { PricingPage } from './app/routes/PricingPage';
import { Analytics } from './app/routes/admin/Analytics';
import { AdminControl } from './app/routes/admin/AdminControl';
import { PageViewTracker } from './components/analytics/PageViewTracker';
import { PredesignedListsPage } from './app/routes/PredesignedLists.page';
import { Footer } from './app/modules/navigation/Footer';
import { AdminPreDesignedLists } from './app/routes/admin/ManagePredesignedLists.page';
import { ManageDiscountCodes } from './app/routes/admin/ManageDiscountCodes';
import { GuestConfirmation } from './app/routes/GuestConfirmation';
import { ManageRSVP } from './app/routes/couple/ManageRsvp';
import { Invitations } from './app/routes/couple/Invitations';
import MyGiftLists from './app/routes/couple/MyGiftLists';
import { CreateNewList } from './app/routes/couple/CreateNewList';
import { PublicInvitationView } from './features/invitations/components/PublicInvitation/PublicInvitationView';
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  const isLocalhost = window.location.hostname === 'localhost';

  return (
    <ConfigProvider theme={antdThemeConfig}>
      <NotificationProvider>
        <BrowserRouter>
          <PageViewTracker />
          <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={
                <>
                  <TopNav />
                  <TopNavWrapper>
                    <HomePage />
                  </TopNavWrapper>
                </>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/olvide-contrasena" element={<ForgotPassword />} />
            <Route path="/restablecer-contrasena" element={<ResetPassword />} />
            <Route
              path="/buscar"
              element={
                <>
                  <TopNav />
                  <TopNavWrapper>
                    <SearchPage />
                  </TopNavWrapper>
                </>
              }
            />
            <Route
              path="/contacto"
              element={
                <>
                  <TopNav />
                  <TopNavWrapper>
                    <Contact />
                  </TopNavWrapper>
                </>
              }
            />
            <Route path="/registro" element={<Signup />} />
            <Route path="/registro-exitoso" element={<SignupSuccess />} />
            <Route
              path="/precios"
              element={
                <>
                  <TopNav />
                  <TopNavWrapper>
                    <PricingPage />
                  </TopNavWrapper>
                </>
              }
            />
            <Route
              path="/colecciones"
              element={
                <>
                  <TopNav />
                  <TopNavWrapper>
                    <PredesignedListsPage />
                    <Footer />
                  </TopNavWrapper>
                </>
              }
            />

            {/* Admin routes */}
            <Route element={<AdminRoute />}>
              <Route
                path="/admin/analytics"
                element={
                  <>
                    <TopNav />
                    <TopNavWrapper>
                      <Analytics />
                    </TopNavWrapper>
                  </>
                }
              />
              <Route
                path="/admin/control"
                element={
                  <>
                    <TopNav />
                    <TopNavWrapper>
                      <AdminControl />
                    </TopNavWrapper>
                  </>
                }
              />
              <Route
                path="/admin/colecciones"
                element={
                  <>
                    <TopNav />
                    <TopNavWrapper>
                      <AdminPreDesignedLists />
                    </TopNavWrapper>
                  </>
                }
              />
              <Route
                path="/admin/codigos-descuento"
                element={
                  <>
                    <TopNav />
                    <TopNavWrapper>
                      <ManageDiscountCodes />
                    </TopNavWrapper>
                  </>
                }
              />
            </Route>

            {/* Public invitation view - standalone without header */}
            <Route path="/:slug/:giftListId/invitacion" element={<PublicInvitationView />} />

            {/* Public registry view for guests */}
            <Route path="/:slug" element={<PublicRegistry />}>
              <Route index element={<HomePage />} />
              <Route path="rsvp" element={<GuestConfirmation />} />
              <Route path="regalos" element={<BuyGifts />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="listas" element={<MyGiftLists />} />
              <Route path="crear-lista" element={<CreateNewList />} />
              <Route path="pago-confirmado" element={<OrderConfirmation />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Dashboard />}>
                  <Route path="gestionar" element={<ManageRegistry />} />
                  <Route path="invitacion" element={<Invitations />} />
                  <Route path="gestionar-rsvp" element={<ManageRSVP />} />
                  <Route path="configuracion" element={<Settings />} />
                </Route>
              </Route>
            </Route>

            {/* Redirect to login or dashboard based on auth status */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
      {isLocalhost && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />}
    </ConfigProvider>
  );
}

export default App;
