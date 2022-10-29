import React from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import Layout from 'components/Layout';
import PageNotFound from 'pages/PageNotFound';
import { routeNames } from 'routes';
import routes from 'routes';

const App = () => {
  return (
    <Router>
        <Layout>
          <Routes>
            {routes.map((route: any, index: number) => (
              <Route
                path={route.path}
                key={'route-key-' + index}
                element={<route.component />}
              />
            ))}
            <Route path="/" element={<Navigate replace to={routeNames.home} />} />
            <Route path='*' element={<PageNotFound />} />
          </Routes>
        </Layout>
    </Router>
  );
};

export default App;
