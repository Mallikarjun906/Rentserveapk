import { Navigate, useLocation } from 'react-router-dom';
import { readUser } from '../services/api';

const roleHome = {
  admin: '/admin',
  provider: '/provider/dashboard',
  driver: '/driver/dashboard',
  student: '/student/dashboard',
  customer: '/dashboard',
  owner: '/owner/dashboard'
};

const roleLogin = {
  admin: '/admin/login',
  provider: '/provider/login',
  driver: '/driver/login',
  student: '/student/login',
  customer: '/login',
  owner: '/login'
};

export function PublicPage({ children, allowedRoles }) {
  const user = readUser();
  if (!user) return children;

  // If a provider/driver/student visits a public browsing page, allow browsing unless restricted
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleHome[user.role] || '/dashboard'} replace />;
  }
  return children;
}

export default function RequireAuth({ children, roles }) {
  const user = readUser();
  const location = useLocation();

  if (!user) {
    // If the path was for admin, provider, driver or student, send to their dedicated login
    const path = location.pathname;
    let targetLogin = '/login';
    if (path.startsWith('/admin')) targetLogin = '/admin/login';
    else if (path.startsWith('/provider')) targetLogin = '/provider/login';
    else if (path.startsWith('/driver')) targetLogin = '/driver/login';
    else if (path.startsWith('/student')) targetLogin = '/student/login';

    return <Navigate to={targetLogin} replace state={{ from: location.pathname + location.search }} />;
  }

  // Check role authorization
  if (roles && !roles.includes(user.role)) {
    // Special admin override or redirect to their respective dashboard
    const home = roleHome[user.role] || '/dashboard';
    return (
      <section className="wrap section" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <div className="notice error" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ margin: '0 0 8px' }}>Access Restricted (Role: {user.role?.toUpperCase()})</h3>
          <p style={{ margin: '0 0 16px' }}>
            Your account ({user.email}) does not have permission to view this section.
          </p>
          <a href={home} className="btn btn-small">
            Go to Your {user.role?.toUpperCase()} Dashboard →
          </a>
        </div>
      </section>
    );
  }

  return children;
}
