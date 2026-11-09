import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RequireAuth, { PublicPage } from './components/RequireAuth.jsx';
import Home from './pages/Home.jsx';
import {
  Login,
  ProviderLogin,
  DriverLogin,
  StudentLogin,
  AdminLogin,
  ForgotPassword
} from './pages/Auth.jsx';
import {
  RegisterHub,
  CustomerRegister,
  ProviderRegister,
  DriverRegister,
  StudentRegister,
  OwnerRegister
} from './pages/Registration.jsx';
import { Directory, Detail } from './pages/Directory.jsx';
import Transport from './pages/Transport.jsx';
import { Dashboard, Enquiries } from './pages/Account.jsx';
import Contact from './pages/Contact.jsx';
import ProviderDashboard from './pages/ProviderDashboard.jsx';
import ProviderContactSupport from './pages/ProviderContactSupport.jsx';
import DriverDashboard from './pages/DriverDashboard.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import OwnerDashboard from './pages/OwnerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import { readUser } from './services/api';

function RoleDashboard() {
  const user = readUser();
  if (user?.role === 'provider') return <Navigate to="/provider/dashboard" replace />;
  if (user?.role === 'driver') return <Navigate to="/driver/dashboard" replace />;
  if (user?.role === 'student') return <Navigate to="/student/dashboard" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'owner') return <Navigate to="/owner/dashboard" replace />;
  return <Dashboard />;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        {/* Public Browsing Routes */}
        <Route path="/" element={<PublicPage><Home /></PublicPage>} />
        <Route path="/contact" element={<PublicPage><Contact /></PublicPage>} />
        <Route path="/rentals" element={<PublicPage><Directory kind="property" /></PublicPage>} />
        <Route path="/rentals/:id" element={<PublicPage><Detail kind="property" /></PublicPage>} />
        <Route path="/services" element={<PublicPage><Directory kind="service" /></PublicPage>} />
        <Route path="/services/:id" element={<PublicPage><Detail kind="service" /></PublicPage>} />
        <Route path="/transport" element={<PublicPage><Transport /></PublicPage>} />
        <Route path="/transport/:id" element={<PublicPage><Detail kind="transport" /></PublicPage>} />

        {/* 1. Distinct Role Registration Routes */}
        <Route path="/register" element={<PublicPage><RegisterHub /></PublicPage>} />
        <Route path="/register/customer" element={<PublicPage><CustomerRegister /></PublicPage>} />
        <Route path="/register/provider" element={<PublicPage><ProviderRegister /></PublicPage>} />
        <Route path="/provider/register" element={<PublicPage><ProviderRegister /></PublicPage>} />
        <Route path="/register/driver" element={<PublicPage><DriverRegister /></PublicPage>} />
        <Route path="/register/student" element={<PublicPage><StudentRegister /></PublicPage>} />
        <Route path="/register/owner" element={<PublicPage><OwnerRegister /></PublicPage>} />

        {/* 2. Distinct Role Login Routes */}
        <Route path="/login" element={<PublicPage><Login /></PublicPage>} />
        <Route path="/provider/login" element={<PublicPage><ProviderLogin /></PublicPage>} />
        <Route path="/driver/login" element={<PublicPage><DriverLogin /></PublicPage>} />
        <Route path="/student/login" element={<PublicPage><StudentLogin /></PublicPage>} />
        <Route path="/admin/login" element={<PublicPage><AdminLogin /></PublicPage>} />
        <Route path="/forgot-password" element={<PublicPage><ForgotPassword /></PublicPage>} />

        {/* 3. Role-Protected Dashboards */}
        <Route path="/dashboard" element={<RequireAuth><RoleDashboard /></RequireAuth>} />
        <Route
          path="/provider/dashboard"
          element={<RequireAuth roles={['provider', 'admin']}><ProviderDashboard /></RequireAuth>}
        />
        <Route
          path="/provider/contact-support"
          element={<RequireAuth roles={['provider', 'admin']}><ProviderContactSupport /></RequireAuth>}
        />
        <Route
          path="/driver/dashboard"
          element={<RequireAuth roles={['driver', 'admin']}><DriverDashboard /></RequireAuth>}
        />
        <Route
          path="/student/dashboard"
          element={<RequireAuth roles={['student', 'admin']}><StudentDashboard /></RequireAuth>}
        />
        <Route
          path="/owner/dashboard"
          element={<RequireAuth roles={['owner', 'admin']}><OwnerDashboard /></RequireAuth>}
        />
        <Route
          path="/enquiries"
          element={<RequireAuth roles={['customer', 'owner', 'admin']}><Enquiries /></RequireAuth>}
        />
        <Route
          path="/admin"
          element={<RequireAuth roles={['admin']}><AdminDashboard /></RequireAuth>}
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
