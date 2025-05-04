import dashboard from './dashboard';
import pages from './pages';
import utilities from './utilities';

import { useAuth } from 'contexts/AuthContext';

// ==============================|| MENU ITEMS ||============================== //
const getMenuItems = () => {
  const { user } = useAuth();

  return {
    items: [dashboard, pages, ...(user?.role === 'admin' ? [utilities] : [])]
  };
};

export default getMenuItems;
