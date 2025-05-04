import { lazy } from 'react';

// project imports
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';
import { Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import RoleProtectedRoute from './RoleProtectedRoute';

// dashboard routing
const DashboardDefault = Loadable(lazy(() => import('views/dashboard/Default')));

// utilities routing
const AppsECGTwinMentor = Loadable(lazy(() => import('views/apps/ecgtwinmentor/ECGPrediction')));
const UtilsSettings = Loadable(lazy(() => import('views/utilities/Settings')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: (
    <PrivateRoute>
      <MainLayout />
    </PrivateRoute>
  ),
  children: [
    {
      path: '',
      element: <Navigate to="/login" />
    },
    {
      path: 'dashboard',
      element: <DashboardDefault />
    },
    {
      path: 'apps/ecgtwinmentor',
      element: <AppsECGTwinMentor />
    },
    {
      path: 'utils/settings',
      element: (
        <RoleProtectedRoute allowedRoles={['admin']}>
          <UtilsSettings />
        </RoleProtectedRoute>
      )
    }
  ]
};

export default MainRoutes;
