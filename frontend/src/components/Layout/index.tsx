import React from 'react';
import { ReactNotifications } from 'react-notifications-component';
import 'react-notifications-component/dist/theme.css';

import Footer from './Footer';
import Navbar from './Navbar';
import './layout.scss';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='bg-light d-flex flex-column flex-fill wrapper main_container'>
      <ReactNotifications />
      <Navbar />
      <main className='d-flex flex-column flex-grow-1' style={{ background: "#18191A" }}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
