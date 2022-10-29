import { DAPP_NAME } from 'config';
import withPageTitle from './components/PageTitle';
import Home from './pages';
import PreSale from './pages/Presale';
import Staking from './pages/Staking';

export const routeNames = {
  home: '/',
  staking: '/staking',
  presale: '/presale',
  roadmap: '/roadmap',
  whitepaper: '/whitepaper'
};

const routes: Array<any> = [
  {
    path: routeNames.home,
    title: 'PAX Finance',
    component: Home
  },
  
  {
    path: routeNames.presale,
    title: 'PreSale',
    component: PreSale
  },

  {
    path: routeNames.staking,
    title: 'Staking Pool',
    component: Staking
  },
];

const mappedRoutes = routes.map((route) => {
  const title = route.title
    ? `${route.title} • ${DAPP_NAME}`
    : `${DAPP_NAME}`;

  const requiresAuth = Boolean(route.authenticatedRoute);
  const wrappedComponent = withPageTitle(title, route.component);

  return {
    path: route.path,
    component: wrappedComponent,
    authenticatedRoute: requiresAuth
  };
});

export default mappedRoutes;
