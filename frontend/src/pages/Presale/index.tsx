import React, { useState, useEffect } from 'react';

import {
  Col,
  Dropdown,
  ProgressBar,
  Row
} from 'react-bootstrap';
import { Store } from 'react-notifications-component';
import { Skeleton, Spin, Tooltip, Statistic } from 'antd';

import Web3 from 'web3';
import { ethers } from 'ethers';
import { useWeb3React } from "@web3-react/core";

import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';


import {
  PRESALE_WHITELIST_URL, WHITELIST,
} from 'config';
import {
  IIcoBuyer,
  IIcoInterface
} from 'utils';
import Time from './Time';
import { networkParams } from "utils/networks";

import mainContractAbi from 'abi/maincontract-abi.json';
import perTokenAbi from 'abi/pertoken-abi.json';
import apyTokenAbi from 'abi/apytoken-abi.json';

// import Logo from 'assets/img/logo back.png';
// import PAXLogo from 'assets/img/logo.png';
import whiteListLogo from 'assets/img/whitelist.svg';

import './index.scss';
import { deployedChainId, notificationConfig } from 'utils/constants';
const { Countdown } = Statistic;

const Presale = () => {

  const [buyButtonDisabled, setBuyButtonDisabled] = useState<boolean>(true);
  const [isPersonal, setIsPersonal] = useState<boolean>(true);

  const [icoInfo, setIcoInfo] = useState<IIcoInterface>();
  const [icoBuyerInfo, setIcoBuyerInfo] = useState<IIcoBuyer>();
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [walletAddress, setWallet] = useState<string>("");
  const [walletStatus, setWalletStatus] = useState<boolean>(false);
  const [amountToPay, setAmountToPay] = useState<number>(0);
  const [amountToGet, setAmountToGet] = useState<number>(0);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const {
    REACT_APP_RPC_URL,
    REACT_APP_CONTRACT_ADDRESS,
    REACT_APP_PERSONAL_TOKEN_ADDRESS,
    REACT_APP_APY_TOKEN_ADDRESS
  } = process.env;

  const {
    library,
    chainId,
    account,
    active
  } = useWeb3React();

  const options = {
    reconnect: {
      auto: true,
      delay: 5000, // ms
      maxAttempts: 5,
      onTimeout: false
    }
  };

  const mainContractAbis: any = mainContractAbi;
  const perTokenAbis: any = perTokenAbi;
  const apyTokenAbis: any = apyTokenAbi;

  const provider = new Web3(new Web3.providers.WebsocketProvider(REACT_APP_RPC_URL, options));
  const mainContract = new provider.eth.Contract(mainContractAbis, REACT_APP_CONTRACT_ADDRESS);
  const perTokenContract = new provider.eth.Contract(perTokenAbis, REACT_APP_PERSONAL_TOKEN_ADDRESS);
  const apyTokenContract = new provider.eth.Contract(apyTokenAbis, REACT_APP_APY_TOKEN_ADDRESS);

  const initialize = async (isInit: boolean) => {
    try {
      if (isInit)
        setLoading(true);

      try {
        const icoInformation: IIcoInterface = await mainContract.methods.viewIcoInformation().call();
        const _icoInfo = {
          personalTokenIcoPrice: Number(ethers.utils.formatEther(icoInformation.personalTokenIcoPrice.toString())) * 1,
          apyTokenIcoPrice: Number(ethers.utils.formatEther(icoInformation.apyTokenIcoPrice.toString())) * 1,
          personalTokenIcoBalance: Number(ethers.utils.formatEther(icoInformation.personalTokenIcoBalance.toString())) * 1,
          apyTokenIcoBalance: Number(ethers.utils.formatEther(icoInformation.apyTokenIcoBalance.toString())) * 1,
          icoStartedAt: Number(icoInformation.icoStartedAt),
          icoPeriod: Number(icoInformation.icoPeriod),
          personalTokenSold: Number(ethers.utils.formatEther(icoInformation.personalTokenSold.toString())) * 1,
          apyTokenSold: Number(ethers.utils.formatEther(icoInformation.apyTokenSold.toString())) * 1,
          maxLimitForPersonal: Number(ethers.utils.formatEther(icoInformation.maxLimitForPersonal.toString())) * 1,
          maxLimitForApy: Number(ethers.utils.formatEther(icoInformation.maxLimitForApy.toString())) * 1,
          whitelistMerkleRoot: icoInformation.whitelistMerkleRoot,
          currentTime: Number(icoInformation.currentTime)
        };

        setCurrentTime(Number(icoInformation.currentTime));

        setIcoInfo(_icoInfo);
      } catch (err) {
        console.log("err", err);
      }

      try {
        const icoBuyerInformation: IIcoBuyer = await mainContract.methods.viewIcoBuyer(account).call();
        const icoBuyerInfo = {
          isBought: icoBuyerInformation.isBought,
          amountForPersonal: Number(ethers.utils.formatEther(icoBuyerInformation.amountForPersonal.toString())) * 1,
          amountForApy: Number(ethers.utils.formatEther(icoBuyerInformation.amountForApy.toString())) * 1
        };
        console.log("icoBuyerInformation", icoBuyerInfo);
        setIcoBuyerInfo(icoBuyerInfo);
      } catch (_) {
      }

      setLoading(false);
    } catch (err) {
      console.log("err", err);
      setLoading(false);
    }
  };

  const handleSetAmountToPay = (v: any) => {
    const amount = Number(v);
    console.log(">>>>>>>>>>", amount, ">>>>>>>>>>");
    setAmountToPay(amount);
    handleSetAmountToGet(isPersonal, amount);
  };

  const handleSetAmountToGet = (_isPersonal: boolean, _amountToPay?: number) => {
    let amountToGet: number;
    let tokenBalance: number;
    let amoutnToPayment = _amountToPay ? _amountToPay : amountToPay;
    if (_amountToPay == 0)
      amoutnToPayment = 0;
    if (_isPersonal) {
      amountToGet = amoutnToPayment / icoInfo.personalTokenIcoPrice;
      tokenBalance = icoInfo.personalTokenIcoBalance;
    } else {
      amountToGet = amoutnToPayment / icoInfo.apyTokenIcoPrice;
      tokenBalance = icoInfo.apyTokenIcoBalance;
    }

    if (amountToGet > 0 && amountToGet < tokenBalance) {
      setBuyButtonDisabled(false);
    } else {
      setBuyButtonDisabled(true);
    }
    setIsPersonal(_isPersonal);
    setAmountToGet(amountToGet);
  };

  const switchNetwork = async () => {
    try {
      await library.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: Web3.utils.toHex(deployedChainId.testnet) }]
      });
    } catch (switchError) {
      console.log("switchError", switchError);
      if (switchError.code === 4902) {
        try {
          await library.provider.request({
            method: "wallet_addEthereumChain",
            params: [networkParams[Web3.utils.toHex(deployedChainId.testnet)]]
          });
        } catch (error) {
          console.log("catchError", error);
        }
      }
    }
  };

  async function buyToken(e: any) {
    if (!active) {
      Store.addNotification({
        ...notificationConfig,
        type: "warning",
        message: "Please check wallet connection"
      });

      return;
    }

    if (chainId !== deployedChainId.testnet) {
      await switchNetwork();
    }

    if (icoInfo.icoStartedAt == 0) {
      Store.addNotification({
        ...notificationConfig,
        type: "warning",
        message: "Not started yet"
      });

      return;
    }

    const leafNodes = WHITELIST.map(addr => keccak256(addr));

    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const rootHash = merkleTree.getHexRoot();
    const claimingAddress = leafNodes[0];
    const hexProof = merkleTree.getHexProof(claimingAddress);
    const verifyStatus = merkleTree.verify(hexProof, claimingAddress, rootHash);

    if (!verifyStatus) {
      Store.addNotification({
        ...notificationConfig,
        type: "warning",
        message: "You aren't listed on whiltelist. So you can't buy tokens"
      });

      return;
    }

    if (isPersonal) {
      if (amountToGet > icoInfo.personalTokenIcoBalance) {
        Store.addNotification({
          ...notificationConfig,
          type: "warning",
          message: "Insufficient Personal token balance"
        });

        return;
      }

      if ((icoBuyerInfo.amountForPersonal + amountToGet) > icoInfo.maxLimitForPersonal) {
        Store.addNotification({
          ...notificationConfig,
          type: "warning",
          message: "Exceed buy limit of Personal token!"
        });

        return;
      }
    } else {
      if (amountToGet > icoInfo.apyTokenIcoBalance) {
        Store.addNotification({
          ...notificationConfig,
          type: "warning",
          message: "Insufficient Apy token balance"
        });

        return;
      }

      if ((icoBuyerInfo.amountForApy + amountToGet) > icoInfo.maxLimitForApy) {
        Store.addNotification({
          ...notificationConfig,
          type: "warning",
          message: "Exceed buy limit of Apy token!"
        });

        return;
      }
    }

    try {
      setIsProcessing(true);

      const icoInformation: IIcoInterface = await mainContract.methods.viewIcoInformation().call();

      if (Number(icoInformation.currentTime) > (Number(icoInformation.icoStartedAt) + Number(icoInformation.icoPeriod))) {
        Store.addNotification({
          ...notificationConfig,
          type: "warning",
          message: "Already ended"
        });

        setIsProcessing(false);
        return;
      }

      const transactionParameters = {
        to: REACT_APP_CONTRACT_ADDRESS,
        from: account,
        data: mainContract.methods
          .whitelistSale(
            hexProof,
            isPersonal
          )
          .encodeABI(),
        value: ethers.utils.parseUnits(amountToPay.toString(), "ether").toHexString()
      };

      const txHash = await library.provider.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      });

      console.log("buy => txHash:", txHash);

      Store.addNotification({
        ...notificationConfig,
        type: "success",
        message: "Successed to buy tokens"
      });

      setIsProcessing(false);
    } catch (err) {
      console.log("buy tokens => err:", err);

      Store.addNotification({
        ...notificationConfig,
        type: "danger",
        message: "Failed to buy tokens"
      });
      setIsProcessing(false);
    }
  }

  function addSmartContractListener() {
    mainContract.events.WhitelistSold({}, (error: any, data: any) => {
      if (!error) {
        (async () => {
          console.log("event occured");
          await initialize(false);
        })();
      }
    });

    mainContract.events.StartedIco({}, (error: any, data: any) => {
      if (!error) {
        (async () => {
          console.log("event occured");
          await initialize(false);
        })();
      }
    });
  }

  useEffect(() => {
    (async () => {
      await initialize(true);
      addSmartContractListener();
    })();
  }, [account]);

  return (
    <>
      <Spin spinning={isProcessing}>
        <div className='bitxwrapper background-1'>
          <div className='row container'>
            <Col md={12} lg={6} className='custom-presale-col'>
              <div className='custom-presale-left'>
                {
                  isLoading ? (
                    <div className='text-center'>
                      <Skeleton.Input className='mb-2' active />
                    </div>
                  ) : (
                    <h1 className='custom-presale-header color-white'>Token Sale Is {icoInfo?.icoStartedAt == 0 ? 'Coming' : (icoInfo?.currentTime < icoInfo?.icoStartedAt + icoInfo?.icoPeriod ? 'Live' : 'Ended')}!</h1>
                  )
                }

                <div className='custom-presale-body'>
                  <Time icoInfo={icoInfo} />

                  <div className='custom-progress-container text-center'>
                    <ProgressBar now={icoInfo && (icoInfo?.personalTokenSold / (icoInfo?.personalTokenIcoBalance + icoInfo?.personalTokenSold) * 100)} />
                    {
                      isLoading ? (
                        <Skeleton.Input className='mt-2' active size='small' />
                      ) : (
                        <div className='custome-progress-number color-white'>{icoInfo?.personalTokenSold} / {icoInfo?.personalTokenIcoBalance + icoInfo?.personalTokenSold} PER</div>
                      )
                    }
                  </div>

                  <div className='custom-progress-container text-center'>
                    <ProgressBar now={icoInfo && (icoInfo?.apyTokenSold / (icoInfo?.apyTokenIcoBalance + icoInfo?.apyTokenSold) * 100)} />
                    {
                      isLoading ? (
                        <Skeleton.Input className='mt-2' active size='small' />
                      ) : (
                        <div className='custome-progress-number color-white'>{icoInfo?.apyTokenSold} / {icoInfo?.apyTokenIcoBalance + icoInfo?.apyTokenSold} APY</div>
                      )
                    }
                  </div>

                  <div className='custom-presale-price mt-5'>1 $PER = {icoInfo?.personalTokenIcoPrice} BNB</div>
                  <div className='custom-presale-price'>1 $APY = {icoInfo?.apyTokenIcoPrice} BNB</div>

                  <div className="text-center" style={{ display: 'flex', justifyContent: 'center' }}>
                    <a
                      className="whitelist-but"
                      style={{ marginTop: "30px", alignItems: "center", justifyContent: "center", display: "flex" }}
                      href={PRESALE_WHITELIST_URL}
                      target="_blank" rel="noreferrer"
                    >
                      <img src={whiteListLogo} alt="whitelist" style={{ width: "20%" }}></img>
                      <span style={{ paddingLeft: "12px" }}>WhiteList</span>
                    </a>
                  </div>
                </div>

              </div>
            </Col>
            <Col md={12} lg={6} className='custom-presale-col'>
              <div className='custom-buy-card'>
                <div className='custom-buy-card-body'>
                  <h3 className='custom-buy-card-header color-white'>Buy Tokens</h3>
                  <div className='custom-buy-card-amount'>
                    <div className='custom-buy-card-amount-header'>Amount To Pay</div>
                    <div className='custom-buy-card-amount-container'>
                      <input className='custom-buy-card-amount-input' type='number' disabled={isProcessing} min={0} onChange={(e) => handleSetAmountToPay(e.target.value)} defaultValue={amountToPay} />
                      <span className='custom-buy-card-amount-unit color-white'>BNB</span>
                    </div>
                  </div>
                  <div className='custom-buy-card-amount'>
                    <div className='custom-buy-card-amount-header'>Amount To Get</div>
                    <div className='custom-buy-card-amount-container'>
                      <input className='custom-buy-card-amount-input' type='number' disabled={true} value={amountToGet} />
                      {/* <span className='custom-buy-card-amount-unit color-white'>PER</span> */}
                      <Dropdown>
                        <Dropdown.Toggle className='custom-buy-card-amount-unit box-shadow-always-none border-0' id="dropdown-basic">
                          {isPersonal ? "PER" : "APY"}
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleSetAmountToGet(true)}>PER</Dropdown.Item>
                          <Dropdown.Item onClick={() => handleSetAmountToGet(false)}>APY</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </div>

                  {/* <img className="logo-back-ftm" src={PAXLogo} /> */}
                  {/* <img className="logo-back-bitx" src={} /> */}

                  <div className='custom-presale-price text-center'>
                    Buy limit for $PER: {icoInfo?.maxLimitForPersonal}
                  </div>
                  <div className='custom-presale-price text-center'>
                    Buy limit for $APY: {icoInfo?.maxLimitForApy}
                  </div>

                  <div style={{ paddingTop: '50px' }}>
                    <button className="custom-buy-card-buy-button" onClick={buyToken} disabled={buyButtonDisabled || isProcessing}>Buy {isPersonal ? "PER" : "APY"}</button>
                  </div>
                </div>
              </div>
            </Col>
          </div>
        </div >
      </Spin>
    </>
  );
};

export default Presale;
