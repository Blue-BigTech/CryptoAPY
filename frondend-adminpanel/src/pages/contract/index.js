import { useEffect, useState } from 'react';
import { Row, Col } from "react-bootstrap"
import { Store } from 'react-notifications-component';
import { Skeleton, Spin, Statistic } from 'antd';
import Web3 from 'web3';
import { ethers } from 'ethers';

import PageTitle from "../../components/PageTitle";
import SetManagingAddress from "../../components/SetManagingAddress";
import SetWhitelistMerkleRoot from '../../components/SetWhitelistMerkleRoot';

import mainContractAbi from "../../abi/maincontract-abi.json";
import perTokenAbi from "../../abi/pertoken-abi.json";
import apyTokenAbi from "../../abi/apytoken-abi.json";

import { notificationConfig, deployedChainId } from '../../constants';
import { connectWallet, getNetworkId } from "../../utils";

import "./index.scss";

const PersonalApy = () => {
    const [contractInfo, setContractInfo] = useState();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setLoading] = useState(false);

    const {
        REACT_APP_RPC_URL,
        REACT_APP_OWNER_ADDRESS,

        REACT_APP_PERSONAL_TOKEN_ADDRESS,
        REACT_APP_APY_TOKEN_ADDRESS,
        REACT_APP_CONTRACT_ADDRESS
    } = process.env;

    const options = {
        reconnect: {
            auto: true,
            delay: 5000, // ms
            maxAttempts: 5,
            onTimeout: false
        }
    };
    const provider = new Web3(new Web3.providers.WebsocketProvider(REACT_APP_RPC_URL, options));

    const mainContract = new provider.eth.Contract(mainContractAbi, REACT_APP_CONTRACT_ADDRESS);
    const perTokenContract = new provider.eth.Contract(perTokenAbi, REACT_APP_PERSONAL_TOKEN_ADDRESS);
    const apyTokenContract = new provider.eth.Contract(apyTokenAbi, REACT_APP_APY_TOKEN_ADDRESS);

    const { Countdown } = Statistic;

    const initialize = async (isInitial) => {
        if (isInitial)
            setLoading(true);
        try {
            try {
                const contractInformation = await mainContract.methods.viewContractInformation().call();
                const managementAddresses = await mainContract.methods.viewContractConfiguration().call();
                const icoInformation = await mainContract.methods.viewIcoInformation().call();

                const _contractInfo = {
                    totalStakedPerForPersonalApyPool: ethers.utils.formatUnits(contractInformation[0].toString(), "ether") * 1,
                    totalStakedApyForPersonalApyPool: ethers.utils.formatUnits(contractInformation[1].toString(), "ether") * 1,
                    totalStakersForPersonalApyPool: contractInformation[2],

                    treasuryAddress: managementAddresses,

                    personalTokenIcoPrice: ethers.utils.formatUnits(icoInformation[0].toString(), "ether") * 1,
                    apyTokenIcoPrice: ethers.utils.formatUnits(icoInformation[1].toString(), "ether") * 1,
                    personalTokenIcoBalance: ethers.utils.formatUnits(icoInformation[2].toString(), "ether") * 1,
                    apyTokenIcoBalance: ethers.utils.formatUnits(icoInformation[3].toString(), "ether") * 1,
                    icoStartedAt: `${icoInformation[4] > 0 ? new Date(icoInformation[4] * 1000).toLocaleString() : '-'}`,
                    icoPeriod: icoInformation[5] / 86400
                };

                setContractInfo(_contractInfo);
            } catch (_) {
            }

            setLoading(false)
        } catch (_) {
            setLoading(false)
        }
    }

    const isSetManagementAddress = async () => {
        const {
            treasuryAddress,
        } = contractInfo;

        if (
            treasuryAddress == "0x0000000000000000000000000000000000000000"
        ) {
            return false;
        }

        return true;
    }

    const checkWalletStatus = async () => {
        if (window.ethereum) {
            const networkId = await getNetworkId()
            if (networkId != deployedChainId.testnet || !window.ethereum.selectedAddress) {
                await connectWallet(deployedChainId.testnet);
            }
        } else {
            Store.addNotification({
                ...notificationConfig,
                type: "info",
                message: "Please install metamask"
            })

            return;
        }
    }

    const handleSetManagementAddress = async (_treasuryAddr) => {
        try {
            await checkWalletStatus()
            setIsProcessing(true);

            const transactionParameters = {
                to: REACT_APP_CONTRACT_ADDRESS,
                from: window.ethereum.selectedAddress,
                data: mainContract.methods
                    .setTreasuryAddress(
                        _treasuryAddr
                    )
                    .encodeABI(),
            };

            const txHash = await window.ethereum.request({
                method: "eth_sendTransaction",
                params: [transactionParameters],
            });
            console.log("handleSetManagementAddress => txHash:", txHash)

            Store.addNotification({
                ...notificationConfig,
                type: "success",
                message: "Successed to set management addresses"
            });

            setIsProcessing(false)
        } catch (err) {
            console.log("handleSetManagementAddress => err:", err)

            Store.addNotification({
                ...notificationConfig,
                type: "danger",
                message: "Failed to set management addresses"
            });
            setIsProcessing(false)
        }
    }

    const handleSetWhitelistMerkleRoot = async (_merkleRoot) => {
        try {
            await checkWalletStatus()
            setIsProcessing(true);

            const transactionParameters = {
                to: REACT_APP_CONTRACT_ADDRESS,
                from: window.ethereum.selectedAddress,
                data: mainContract.methods
                    .setWhitelistMerkleRoot(
                        _merkleRoot
                    )
                    .encodeABI(),
            };

            const txHash = await window.ethereum.request({
                method: "eth_sendTransaction",
                params: [transactionParameters],
            });
            console.log("handleSetWhitelistMerkleRoot => txHash:", txHash)

            Store.addNotification({
                ...notificationConfig,
                type: "success",
                message: "Successed to set merkle root"
            });

            setIsProcessing(false)
        } catch (err) {
            console.log("handleSetWhitelistMerkleRoot => err:", err)

            Store.addNotification({
                ...notificationConfig,
                type: "danger",
                message: "Failed to set merkle root"
            });
            setIsProcessing(false)
        }
    }

    const handleStartIco = async () => {
        try {
            await checkWalletStatus()

            const isSetManagementAddressStatus = await isSetManagementAddress();
            if (!isSetManagementAddressStatus) {
                Store.addNotification({
                    ...notificationConfig,
                    type: "warning",
                    message: "Please set management address"
                });

                return;
            }
            setIsProcessing(true);

            const transactionParameters = {
                to: REACT_APP_CONTRACT_ADDRESS,
                from: window.ethereum.selectedAddress,
                data: mainContract.methods
                    .startIco()
                    .encodeABI(),
            };

            await window.ethereum.request({
                method: "eth_sendTransaction",
                params: [transactionParameters],
            });

            Store.addNotification({
                ...notificationConfig,
                type: "success",
                message: "Successed to start ico"
            });
            setIsProcessing(false)
        } catch (err) {
            console.log("startIco => err:", err)

            Store.addNotification({
                ...notificationConfig,
                type: "danger",
                message: "Failed to start ico"
            });
            setIsProcessing(false)
        }
    }

    function addSmartContractListener() {
        mainContract.events.NewTreasuryAddress({}, (error, data) => {
            if (!error) {
                (async () => {
                    console.log("event occured");
                    await initialize(false);
                })();
            }
        });

        mainContract.events.TokenInjection({}, (error, data) => {
            if (!error) {
                (async () => {
                    console.log("event occured");
                    await initialize(false);
                })();
            }
        });

        mainContract.events.StartedIco({}, (error, data) => {
            if (!error) {
                (async () => {
                    console.log("event occured");
                    await initialize(false);
                })();
            }
        });

        mainContract.events.StakedTokensToPersonalApyPool({}, (error, data) => {
            if (!error) {
                (async () => {
                    console.log("event occured");
                    await initialize(false);
                })();
            }
        });

        mainContract.events.UnstakedFromPersonalApyPool({}, (error, data) => {
            if (!error) {
                (async () => {
                    console.log("event occured");
                    await initialize(false);
                })();
            }
        });
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    useEffect(() => {
        (async () => {
            await initialize(true)
            addSmartContractListener();
        })()
    }, []);

    return (
        <>
            <Spin spinning={isProcessing}>
                <PageTitle title="PersonalApy" />
                <hr />
                <Row className="mb-5">
                    <Col sm={12} md={12} lg={12}>
                        <div className="personal-apy-card">
                            <Row>
                                <Col sm={12} md={6} lg={6}>
                                    <h5><strong>Contract Information</strong></h5>
                                    <Skeleton loading={isLoading} active>
                                        {
                                            !isLoading && contractInfo && (
                                                <>
                                                    <div>Total Staked $PER in PersonalApy Pool: <strong>{contractInfo?.totalStakedPerForPersonalApyPool}</strong></div>
                                                    <div>Total Staked $APY in PersonalApy Pool: <strong>{contractInfo?.totalStakedApyForPersonalApyPool}</strong></div>
                                                    <div>Total Stakers PersonalApy Pool: <strong>{contractInfo?.totalStakersForPersonalApyPool}</strong></div>
                                                </>
                                            )
                                        }
                                    </Skeleton>
                                </Col>

                                <Col sm={12} md={6} lg={6}>
                                    <h5><strong>Contract Management Address</strong></h5>
                                    <Skeleton loading={isLoading} active>
                                        {
                                            !isLoading && contractInfo && (
                                                <>
                                                    <div>Owner Address: <strong>{REACT_APP_OWNER_ADDRESS}</strong></div>
                                                    <div>Treasury Address: <strong>{contractInfo?.treasuryAddress}</strong></div>
                                                </>
                                            )
                                        }
                                    </Skeleton>
                                </Col>
                            </Row>
                        </div>

                        <div className="personal-apy-card">
                            <h5><strong>ICO Information</strong></h5>
                            <Skeleton loading={isLoading} active>
                                {
                                    !isLoading && contractInfo && (
                                        <Row>
                                            <Col sm={12} md={6} lg={6}>
                                                <div>Price of $PER: <strong>{contractInfo?.personalTokenIcoPrice}</strong></div>
                                                <div>Price of $APY: <strong>{contractInfo?.apyTokenIcoPrice}</strong></div>
                                                <div>Balance of $PER: <strong>{contractInfo?.personalTokenIcoBalance}</strong></div>
                                                <div>Balance of $APY: <strong>{contractInfo?.apyTokenIcoBalance}</strong></div>
                                                <div>ICO StartedAt: <strong>{contractInfo?.icoStartedAt}</strong></div>
                                                <div>ICO Period: <strong>{contractInfo?.icoPeriod}(days)</strong></div>
                                            </Col>
                                        </Row>
                                    )

                                }
                            </Skeleton>
                        </div>
                    </Col>
                </Row>

                <Row className="mb-5">
                    <Col sm={12} md={12} lg={12}>
                        <div className="personal-apy-card">
                            <Row>
                                <Col sm={12} md={6} lg={6}>
                                    <SetManagingAddress
                                        handleSetManagementAddress={handleSetManagementAddress}
                                    />
                                </Col>

                                <Col sm={12} md={6} lg={6}>
                                    <SetWhitelistMerkleRoot
                                        handleSetWhitelistMerkleRoot={handleSetWhitelistMerkleRoot}
                                        handleStartIco={handleStartIco}
                                    />
                                </Col>
                            </Row>
                        </div>
                    </Col>
                </Row>
            </Spin>
        </>
    )
}

export default PersonalApy