const Web3 = require('web3')
const web3 = new Web3(window.ethereum)

const notificationConfig = {
    message: "",
    type: "",
    insert: "top",
    container: "top-center",
    animationIn: ["animate__animated", "animate__fadeIn"],
    animationOut: ["animate__animated", "animate__fadeOut"],
    dismiss: {
        duration: 5000,
        onScreen: true
    }
};

const deployedChain = {
    mainnet: {
        chainName: 'Fantom Opera Mainnet',
        chainId: web3.utils.toHex(250),
        nativeCurrency: { name: 'FTM', decimals: 18, symbol: 'FTM' },
        rpcUrls: ['https://rpc.ftm.tools']
    },
    testnet: {
        chainName: 'Fantom Testnet',
        chainId: web3.utils.toHex(97),
        nativeCurrency: { name: 'BNB', decimals: 18, symbol: 'BNB' },
        rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545']
    }
}

const deployedChainId = {
    mainnet: 250,
    testnet: 97
}

export {
    notificationConfig,
    deployedChain,
    deployedChainId
}