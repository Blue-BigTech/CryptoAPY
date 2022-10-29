import Web3 from 'web3';
import { iNotification } from 'react-notifications-component/dist/src/typings';
import { IDeployedChain, IDeployedChainId } from './state';
const web3 = new Web3(window.ethereum);

const notificationConfig: iNotification = {
    message: "",
    type: "default",
    insert: "top",
    container: "top-center",
    animationIn: ["animate__animated", "animate__fadeIn"],
    animationOut: ["animate__animated", "animate__fadeOut"],
    dismiss: {
        duration: 5000,
        onScreen: true
    }
};

const deployedChainId: IDeployedChainId = {
    mainnet: 56,
    testnet: 97
};

const deployedChain: IDeployedChain = {
    mainnet: {
        chainName: 'BSC Mainnet',
        chainId: web3.utils.toHex(deployedChainId.mainnet),
        nativeCurrency: { name: 'BNB', decimals: 18, symbol: 'BNB' },
        rpcUrls: ['https://bsc-dataseed.binance.org']
    },
    testnet: {
        chainName: 'BSC testnet',
        chainId: web3.utils.toHex(deployedChainId.testnet),
        nativeCurrency: { name: 'BNB', decimals: 18, symbol: 'BNB' },
        rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545']
    }
};

export {
    notificationConfig,
    deployedChain,
    deployedChainId
};