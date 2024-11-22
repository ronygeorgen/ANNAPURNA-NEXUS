import React, { useEffect } from 'react';
import { Routes, Route,useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SignupPage from './pages/Signup';
import LoginPage from './pages/Login';
import HomePage from './pages/Home';
import ProtectedRoute from './components/protectedRoute/ProtectedRoute';
import GuestRoute from './components/guestRoute/GuestRoute';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from './app/store';
import AdminLoginPage from './pages/AdminLogin';
import AdminDashboardPage from './pages/AdminDashboard';
import AdminProtectedRoute from './components/protectedRoute/AdminProtectedRoute';
import SubAdminManagementPage from './pages/SubAdminManagement';
import SubAdminLoginPage from './pages/SubAdminLogin';
import SubAdminDashboardPage from './pages/SubAdminDashboard';
import SubAdminProtectedRoute from './components/protectedRoute/SubAdminProtectedRoute';
import CreateRationShopPage from './pages/CreateRationShops';
import SubAdminProfilePage from './pages/SubAdminProfile';
import SelectedShopPage from './pages/SelectedShop';
import RationCardRegistrationFormPage from './pages/RationCardRegistrationForm';
import SubAdminCardListPage from './pages/SubAdminCardList';
import ChooseSubsidiesPage from './pages/ChooseSubsidies';
import ProductManagementPage from './pages/ProductManagement';
import CheckoutPage from './pages/Checkout';
import AdminShopcardDisplayPage from './pages/AdminShopcardDisplay';

const App = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const isFullyAuthenticated = isAuthenticated && user;

  const isAdmin = isFullyAuthenticated && user.is_superadmin;
  
  const isRegularUser = isFullyAuthenticated && !user.is_superadmin && !user.is_subadmin;

  function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    // useEffect(() => {
    //   window.scrollTo(0, 0)
    // }, []);

    return null;
  }

  return (
    <PersistGate loading={null} persistor={persistor}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={ 
          isAdmin ? <Navigate to="/admin-dashboard" replace /> : 
          user?.is_subadmin ? <Navigate to="/sub-admin-dashboard" replace /> :
          isRegularUser ? <Navigate to="/home" replace /> : 
          <Navigate to="/login" replace />} />

          {/* user routes*/}
        <Route path="/signup"  element={<GuestRoute> <SignupPage /> </GuestRoute>} />
        <Route path="/login" element={<GuestRoute> <LoginPage /> </GuestRoute>} />
        <Route path="/home" element={<ProtectedRoute allowAdmin={false} allowSubAdmin={false}> <HomePage /> </ProtectedRoute>} />
        <Route path="/home/selected-shop/" element={<ProtectedRoute allowAdmin={false} allowSubAdmin={false}> <SelectedShopPage /> </ProtectedRoute>} />
        <Route path="/home/ration-card-registration-form/" element={<ProtectedRoute allowAdmin={false} allowSubAdmin={false}> <RationCardRegistrationFormPage /> </ProtectedRoute>} />
        <Route path="/home/selected-shop/choose-subsidies/" element={<ProtectedRoute allowAdmin={false} allowSubAdmin={false}> <ChooseSubsidiesPage /> </ProtectedRoute>} />
        <Route path="/home/selected-shop/choose-subsidies/checkout-page/" element={<ProtectedRoute allowAdmin={false} allowSubAdmin={false}> <CheckoutPage /> </ProtectedRoute>} />
          
          {/* sub-admin routes */}
        <Route path="/sub-admin-login" element={<GuestRoute> <SubAdminLoginPage /> </GuestRoute>} />
        <Route path="/sub-admin-dashboard" element={<SubAdminProtectedRoute><SubAdminDashboardPage /></SubAdminProtectedRoute>} />
        <Route path="/sub-admin-profile" element={<SubAdminProtectedRoute><SubAdminProfilePage /></SubAdminProtectedRoute>} />
        <Route path="/sub-admin-card-list" element={<SubAdminProtectedRoute><SubAdminCardListPage /></SubAdminProtectedRoute>} />
        
          {/* Admin routes */}
        <Route path="/admin-login" element={<GuestRoute> <AdminLoginPage /> </GuestRoute>} />
        <Route path="/admin-dashboard" element={<AdminProtectedRoute> <AdminDashboardPage /> </AdminProtectedRoute>} />
        <Route path="/sub-admin-management" element={<AdminProtectedRoute> <SubAdminManagementPage /> </AdminProtectedRoute>} />
        <Route path="/create-ration-shop" element={<AdminProtectedRoute> <CreateRationShopPage /> </AdminProtectedRoute>} />
        <Route path="/create-product" element={<AdminProtectedRoute> <ProductManagementPage /> </AdminProtectedRoute>} />
        <Route path="/shop-display" element={<AdminProtectedRoute> <AdminShopcardDisplayPage /> </AdminProtectedRoute>} />

        {/* catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
       {/* Toast container to display toast notifications */}
       <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </PersistGate>
  );
};

export default App;