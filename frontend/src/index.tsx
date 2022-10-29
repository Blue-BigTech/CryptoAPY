import './index.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import { ChakraProvider } from "@chakra-ui/react";
import { Web3ReactProvider } from "@web3-react/core";
import { ethers } from "ethers";

import App from './App';

const getLibrary = (provider) => {
    const library = new ethers.providers.Web3Provider(provider);
    library.pollingInterval = 8000; // frequency provider is polling
    return library;
};

import './assets/sass/theme.scss';

declare global {
    // tslint:disable-next-line
    interface Window {
        web3: any;
        ethereum: any;
        Web3Modal: any;
        Box: any;
        box: any;
        space: any;
        chrome: any;
    }
}

ReactDOM.render(
    <ChakraProvider>
        <Web3ReactProvider getLibrary={getLibrary}>
            <App />
        </Web3ReactProvider>
    </ChakraProvider>,
    document.getElementById('root')
);
