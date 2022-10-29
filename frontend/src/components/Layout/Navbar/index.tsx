import React, { useEffect } from 'react';
import { Navbar as BsNavbar, NavItem, Nav } from 'react-bootstrap';
import {
  useDisclosure,
} from "@chakra-ui/react";
import { Link } from 'react-router-dom';
import { routeNames } from 'routes';

import { useWeb3React } from "@web3-react/core";
import { connectors } from "utils/connectors";
import SelectWalletModal from "../../WalletConnectModal";
import logo from '../../../assets/img/logo.png';
import './index.scss';


const Navbar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    account,
    activate,
    deactivate,
    active
  } = useWeb3React();

  const refreshState = () => {
    window.localStorage.setItem("provider", undefined);
  };

  const disconnect = () => {
    refreshState();
    deactivate();
  };

  useEffect(() => {
    const provider = window.localStorage.getItem("provider");
    if (provider) activate(connectors[provider]);
  }, []);

  return (
    <BsNavbar className='px-4 py-3' expand='md' collapseOnSelect style={{ background: "#141414", borderBottom: "1px solid #707070" }}>
      <div className='container-fluid'>
        <Link
          className='d-flex align-items-center navbar-brand mr-0 c-logo-container'
          to={routeNames.home}
        >
          <img src={logo} />
          <span>{"Personal Apy"}</span>
        </Link>

        <BsNavbar.Toggle aria-controls='responsive-navbar-nav' style={{ background: "#D8D3D3" }} />
        <BsNavbar.Collapse id='responsive-navbar-nav' className='nav-menu-wrap'>
          <Nav className='ml-auto'>
            <Link to={routeNames.presale} className='custom-navbar-button custom-navbar-normal-button'>
              Buy tokens
            </Link>
            <Link to={routeNames.staking} className='custom-navbar-button custom-navbar-normal-button'>
              Staking
            </Link>
            <Link to={routeNames.roadmap} className='custom-navbar-button custom-navbar-normal-button'>
              Road map
            </Link>
            <Link to={routeNames.whitepaper} className='custom-navbar-button custom-navbar-normal-button'>
              Whitepaper
            </Link>

            {
              !active ? (
                <NavItem
                  className='custom-navbar-button auth-button'
                  onClick={onOpen}
                >
                  <span>Connect Wallet</span>
                </NavItem>
              ) : (
                <NavItem
                  className='custom-navbar-button auth-button'
                  onClick={disconnect}
                >
                  {
                    String(account).substring(0, 6) +
                    "..." +
                    String(account).substring(38)
                  }
                </NavItem>
              )
            }

          </Nav>
        </BsNavbar.Collapse>
      </div>

      <SelectWalletModal isOpen={isOpen} closeModal={onClose} />
    </BsNavbar>
  );
};

export default Navbar;
