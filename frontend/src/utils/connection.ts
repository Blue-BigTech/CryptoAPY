import Web3 from 'web3';
import { deployedChain } from './constants';

declare let window: any;

// create a web3 instance using a browser wallet
const web3 = new Web3(window.ethereum);

const getNetworkId = async () => {
    const currentChainId = await web3.eth.net.getId();
    return currentChainId;
};

const connectWallet = async (chainId: number) => {
    if (window.ethereum) {
        const currentChainId = await getNetworkId();

        if (currentChainId !== chainId) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: Web3.utils.toHex(chainId) }],
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            deployedChain.testnet
                        ]
                    });
                }
            }
        } else {
            if (!window.ethereum.selectedAddress) {
                await window.ethereum.request({
                    method: "eth_requestAccounts",
                });
            }
        }
    } else {

    }
};

const getCurrentWalletConnected = async () => {
    if (window.ethereum) {
        try {
            const addressArray = await window.ethereum.request({
                method: "eth_accounts",
            });
            if (addressArray.length > 0) {
                return {
                    address: addressArray[0],
                    status: true,
                };
            } else {
                return {
                    address: "",
                    status: false,
                };
            }
        } catch (err) {
            return {
                address: "",
                status: false,
            };
        }
    } else {
        return {
            address: "",
            status: false
        };
    }
};

export {
    connectWallet,
    getCurrentWalletConnected,
    getNetworkId
};