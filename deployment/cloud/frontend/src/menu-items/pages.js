// assets
import { IconHeartbeat } from '@tabler/icons-react';

// constant
const icons = {
  IconHeartbeat
};

// ==============================|| EXTRA PAGES MENU ITEMS ||============================== //

const pages = {
  id: 'apps',
  title: 'Apps',
  type: 'group',
  children: [
    {
      id: 'default',
      title: 'ECGTwinMentor',
      type: 'item',
      url: '/apps/ecgtwinmentor',
      icon: icons.IconHeartbeat,
      breadcrumbs: false
    }
  ]
};

/*
const pages = {
  id: 'pages',
  title: 'Apps',
  icon: icons.IconKey,
  type: 'group',
  children: [
    {
      id: 'authentication',
      title: 'Authentication',
      type: 'collapse',
      icon: icons.IconKey,
      children: [
        {
          id: 'login',
          title: 'login',
          type: 'item',
          url: '/pages/login',
          target: true
        },
        {
          id: 'register',
          title: 'register',
          type: 'item',
          url: '/pages/register',
          target: true
        }
      ]
    }
  ]
};
*/

export default pages;
