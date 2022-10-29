
import React, { useEffect, useState } from 'react';

import axios from 'axios';
import Modal from 'react-modal';
import { Store } from 'react-notifications-component';
import { Spin, Tooltip } from 'antd';

import Web3 from 'web3';
import { ethers } from 'ethers';
import { useWeb3React } from "@web3-react/core";

import { deployedChainId, notificationConfig } from 'utils/constants';
import { ContractInformation, IPersonalApyStaker } from 'utils';
import { networkParams } from "utils/networks";
import mainContractAbi from 'abi/maincontract-abi.json';
import perTokenAbi from 'abi/pertoken-abi.json';
import apyTokenAbi from 'abi/apytoken-abi.json';

import arrow from 'assets/img/arrow.png';
import coin from 'assets/img/coin.png';
// import PAXLogo from 'assets/img/logo.png';
import AlertModal from 'components/AlertModal';

import {
  APR_FOR_APY_TOKEN,
  APR_FOR_PERSONAL_TOKEN,
  APY_TOKEN_TICKER,
  PERSONAL_TOKEN_TICKER,
  TAX_FOR_UNSTAKING,
} from 'config';

const PerApy2PerApy = () => {

  const [showModal, setShowModal] = useState(false);
  const [isStakeModal, setIsStakeModal] = useState(true);
  const [personalInputAmount, setPersonalInputAmount] = useState<any>('');
  const [apyInputAmount, setApyInputAmount] = useState<any>('');

  const [personalModalInfoMesssage, setPersonalModalInfoMesssage] = React.useState<string>('');
  const [apyModalInfoMesssage, setApyModalInfoMesssage] = React.useState<string>('');
  const [personalModalButtonDisabled, setPersonalModalButtonDisabled] = React.useState<boolean>(true);
  const [apyModalButtonDisabled, setApyModalButtonDisabled] = React.useState<boolean>(true);
  const [alertModalShow, setAlertModalShow] = React.useState<boolean>(false);
  const [alertModalText, setAlertModalText] = React.useState<string>('');

  const [contractInfo, setContractInfo] = useState<any>();
  const [personalApyStaker, setPersonalApyStaker] = useState<IPersonalApyStaker>();
  const [perTokenBalance, setPerTokenBalance] = useState<number>();
  const [apyTokenBalance, setApyTokenBalance] = useState<number>();
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

  const onShowModal = async (status: boolean) => {
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

    setPersonalInputAmount('');
    setApyInputAmount('');
    setPersonalModalInfoMesssage('');
    setApyModalInfoMesssage('');
    setPersonalModalButtonDisabled(true);
    setApyModalButtonDisabled(true);
    setIsStakeModal(status);
    setShowModal(true);
  };

  const onPersonalInputAmountChange = (v: any) => {
    const value = v == '' ? -100 : Number(v);

    let _modalInfoMesssage = '';
    let _modalButtonDisabled = true;

    if (isStakeModal) { // stake
      if (value < 0) {
        _modalInfoMesssage = 'Invalid amount.';
      } else if (value == 0) {
        if (personalApyStaker.isStaked)
          _modalButtonDisabled = false;
        else
          _modalInfoMesssage = 'Invalid amount.';
      } else if (value > perTokenBalance) {
        _modalInfoMesssage = 'Not enough tokens in your wallet.';
      } else {
        _modalButtonDisabled = false;
      }
    } else {  // unstake
      if (value < 0 || value > 100) {
        _modalInfoMesssage = 'Invalid amount.';
      } else {
        _modalButtonDisabled = false;
      }
    }

    setPersonalModalInfoMesssage(_modalInfoMesssage);
    setPersonalModalButtonDisabled(_modalButtonDisabled);
    setPersonalInputAmount(v);
  };

  const onApyInputAmountChange = (v: any) => {

    const value = v == '' ? -100 : Number(v);
    let _modalInfoMesssage = '';
    let _modalButtonDisabled = true;

    if (isStakeModal) { // stake
      if (value < 0) {
        _modalInfoMesssage = 'Invalid amount.';
      } else if (value > apyTokenBalance) {
        _modalInfoMesssage = 'Not enough tokens in your wallet.';
      } else {
        _modalButtonDisabled = false;
      }
    } else {  // unstake
      if (value < 0 || value > 100) {
        _modalInfoMesssage = 'Invalid amount.';
      } else {
        _modalButtonDisabled = false;
      }
    }

    setApyModalInfoMesssage(_modalInfoMesssage);
    setApyModalButtonDisabled(_modalButtonDisabled);
    setApyInputAmount(v);
  };

  const onPersonalTokenMaximize = () => {
    const value = isStakeModal ? perTokenBalance : 100;
    onPersonalInputAmountChange(value);
  };

  const onApyTokenMaximize = () => {
    const value = isStakeModal ? apyTokenBalance : 100;
    onApyInputAmountChange(value);
  };

  const onShowAlertModal = (text: string) => {
    setAlertModalText(text);
    setAlertModalShow(true);
  };

  function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const stake = async () => {
    try {
      setShowModal(false);
      setIsProcessing(true);

      const transactionParameters1 = {
        to: REACT_APP_PERSONAL_TOKEN_ADDRESS,
        from: account,
        data: perTokenContract.methods
          .approve(
            REACT_APP_CONTRACT_ADDRESS,
            ethers.utils.parseUnits(personalInputAmount.toString(), "ether")
          )
          .encodeABI(),
      };

      const transactionParameters2 = {
        to: REACT_APP_APY_TOKEN_ADDRESS,
        from: account,
        data: apyTokenContract.methods
          .approve(
            REACT_APP_CONTRACT_ADDRESS,
            ethers.utils.parseUnits(apyInputAmount.toString(), "ether")
          )
          .encodeABI(),
      };

      const transactionParameters3 = {
        to: REACT_APP_CONTRACT_ADDRESS,
        from: account,
        data: mainContract.methods
          .stakeTokensToPersonalApyPool(
            ethers.utils.parseUnits(personalInputAmount.toString(), "ether"),
            ethers.utils.parseUnits(apyInputAmount.toString(), "ether")
          )
          .encodeABI(),
      };

      if (personalInputAmount * 1 > 0) {
        Store.addNotification({
          ...notificationConfig,
          type: "info",
          message: "Approving $PER..."
        });

        const txHash1 = await library.provider.request({
          method: "eth_sendTransaction",
          params: [transactionParameters1],
        });

        console.log("Staking tokens => txHash:", txHash1);
      }

      if (apyInputAmount * 1 > 0) {
        Store.addNotification({
          ...notificationConfig,
          type: "info",
          message: "Approving $APY..."
        });

        const txHash2 = await library.provider.request({
          method: "eth_sendTransaction",
          params: [transactionParameters2],
        });

        console.log("Staking tokens => txHash:", txHash2);
      }

      Store.addNotification({
        ...notificationConfig,
        type: "info",
        message: "Staking tokens..."
      });

      await delay(5000);

      const txHash3 = await library.provider.request({
        method: "eth_sendTransaction",
        params: [transactionParameters3],
      });

      console.log("Staking tokens => txHash:", txHash3);

      Store.addNotification({
        ...notificationConfig,
        type: "success",
        message: "Successed to stake tokens"
      });

      setIsProcessing(false);
    } catch (err) {
      console.log("Staking tokens => err:", err);

      Store.addNotification({
        ...notificationConfig,
        type: "danger",
        message: "Failed to stake tokens"
      });
      setIsProcessing(false);
    }
  };

  const unstake = async () => {
    try {
      setShowModal(false);
      setIsProcessing(true);

      const transactionParameters = {
        to: REACT_APP_CONTRACT_ADDRESS,
        from: account,
        data: mainContract.methods
          .unstakeFromPersonalApyPool(
            personalInputAmount,
            apyInputAmount
          )
          .encodeABI(),
      };

      const txHash = await library.provider.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      });

      console.log("Unstaking tokens => txHash:", txHash);

      Store.addNotification({
        ...notificationConfig,
        type: "success",
        message: "Successed to unstake tokens"
      });

      setIsProcessing(false);
    } catch (err) {
      console.log("Unstaking tokens => err:", err);

      Store.addNotification({
        ...notificationConfig,
        type: "danger",
        message: "Failed to unstake tokens"
      });
      setIsProcessing(false);
    }
  };

  function addSmartContractListener() {
    mainContract.events.StakedTokensToPersonalApyPool({}, (error: any, data: any) => {
      if (!error) {
        (async () => {
          console.log("event occured");
          await initialize(false);
        })();
      }
    });

    mainContract.events.UnstakedFromPersonalApyPool({}, (error: any, data: any) => {
      if (!error) {
        (async () => {
          console.log("event occured");
          await initialize(false);
        })();
      }
    });

    mainContract.events.WhitelistSold({}, (error: any, data: any) => {
      if (!error) {
        (async () => {
          console.log("event occured");
          await initialize(false);
        })();
      }
    });
  }

  const initialize = async (isInit: boolean) => {
    try {
      if (isInit)
        setLoading(true);

      try {
        const contractInformation = await mainContract.methods.viewContractInformation().call();
        console.log("contractInformation", contractInformation);

        const perTokenBalance = await perTokenContract.methods.balanceOf(account).call();
        const apyTokenBalance = await apyTokenContract.methods.balanceOf(account).call();

        const personalApyStakerInfo = await mainContract.methods.viewPersonalApyStaker(account).call();
        const personalApyStaker = personalApyStakerInfo[0];
        console.log("personalApyStaker", personalApyStaker);

        const currentTime = Number(personalApyStakerInfo[1]); //////////////
        console.log("currentTime", currentTime);
        const AUTO_COMPOUNDING_PERIOD = 86400; //////////////////
        const ADDITIONAL_APR = 1000;

        const deltaTime = currentTime - personalApyStaker.updatedAt;
        let currentStakedAmoutForPersonal = Number(ethers.utils.formatUnits(personalApyStaker.stakedAmountForPersonal.toString(), "ether")) * 1;
        let currentStakedAmoutForApy = Number(ethers.utils.formatUnits(personalApyStaker.stakedAmountForApy.toString(), "ether")) * 1;

        /* ---------Auto Compounding--------- */
        const compoudingCount = deltaTime / AUTO_COMPOUNDING_PERIOD;
        const compoundingRest = deltaTime % AUTO_COMPOUNDING_PERIOD;

        for (let i = 1; i <= compoudingCount; i++) {
          currentStakedAmoutForPersonal +=
            currentStakedAmoutForPersonal * (APR_FOR_PERSONAL_TOKEN / 365 * 1000) * AUTO_COMPOUNDING_PERIOD / 86400 / (1000 * 100) +
            currentStakedAmoutForPersonal * ADDITIONAL_APR * currentStakedAmoutForApy * AUTO_COMPOUNDING_PERIOD / 86400 / (1000 * 100);

          currentStakedAmoutForApy += currentStakedAmoutForPersonal * APR_FOR_APY_TOKEN * AUTO_COMPOUNDING_PERIOD / 86400 / (1000 * 100);
        }

        currentStakedAmoutForPersonal +=
          currentStakedAmoutForPersonal * (APR_FOR_PERSONAL_TOKEN / 365 * 1000) * compoundingRest / 86400 / (1000 * 100) +
          currentStakedAmoutForPersonal * ADDITIONAL_APR * currentStakedAmoutForApy * compoundingRest / 86400 / (1000 * 100);

        currentStakedAmoutForApy += currentStakedAmoutForPersonal * APR_FOR_APY_TOKEN * compoundingRest / 86400 / (1000 * 100);
        /* --------------------------------- */

        const _personalApyStaker = {
          ...personalApyStaker,
          stakedAmountForPersonal: currentStakedAmoutForPersonal,
          stakedAmountForApy: currentStakedAmoutForApy,
          unstakedAmountForPersonal: Number(ethers.utils.formatUnits(personalApyStaker.unstakedAmountForPersonal.toString(), "ether")) * 1,
          unstakedAmountForApy: Number(ethers.utils.formatUnits(personalApyStaker.unstakedAmountForApy.toString(), "ether")) * 1,
        };

        setPerTokenBalance(Number(ethers.utils.formatUnits(perTokenBalance.toString(), "ether")) * 1);
        setApyTokenBalance(Number(ethers.utils.formatUnits(apyTokenBalance.toString(), "ether")) * 1);
        setPersonalApyStaker(_personalApyStaker);

        const totalStakedPersonalToken =
          Number(ethers.utils.formatUnits(contractInformation[ContractInformation.TotalStakedPerForPersonalApyPool].toString(), "ether")) * 1
          +
          currentStakedAmoutForPersonal
          - Number(ethers.utils.formatUnits(personalApyStaker.stakedAmountForPersonal.toString(), "ether")) * 1;

        const totalStakedApyToken =
          Number(ethers.utils.formatUnits(contractInformation[ContractInformation.TotalStakedApyForPersonalApyPool].toString(), "ether")) * 1
          + currentStakedAmoutForApy
          - Number(ethers.utils.formatUnits(personalApyStaker.stakedAmountForApy.toString(), "ether")) * 1;

        const _contractInfo = [
          totalStakedPersonalToken,
          totalStakedApyToken,
          contractInformation[ContractInformation.TotalStakersForPersonalApyPool]
        ];

        setContractInfo(_contractInfo);
      } catch (err) {
        console.log("err", err);
      }

      setLoading(false);
    } catch (err) {
      console.log("err", err);
      setLoading(false);
    }
  };


  useEffect(() => {
    (async () => {
      await initialize(true);
      addSmartContractListener();
    })();

    setInterval(() => {
      (async () => {
        await initialize(false);
      })();
    }, 86400000);
  }, [account]);

  return (
    <div style={{ margin: "auto" }}>
      <Spin spinning={isLoading || isProcessing}>
        <div className='card'>
          <div className='stake_earn'>
            <div className='stake-log-card'>
              {/* <img src={} /> */}
              <p>Stake $PER + $APY</p>
            </div>
            <img src={arrow} />
            <div className='stake-log-card stake-log-card-mex'>
              {/* <img src={} /> */}
              <p>Earn $PER + $APY</p>
            </div>
          </div>

          <div className='info' style={{ marginTop: "8px" }}>
            <div>
              <p className='heading'>APY($PER)</p>
              <p className='data'>{APR_FOR_PERSONAL_TOKEN ? "(" + APR_FOR_PERSONAL_TOKEN + " + 365 * $APY)" : '-'} %</p>
            </div>
            <div>
              <p className='heading'>APY($APY)</p>
              <p className='data'>{APR_FOR_APY_TOKEN ? APR_FOR_APY_TOKEN : '-'} %</p>
            </div>
            <div>
              <p className='heading'>Total Staked {PERSONAL_TOKEN_TICKER}</p>
              <p className='data'>
                {
                  contractInfo
                    ?

                    contractInfo[ContractInformation.TotalStakedPerForPersonalApyPool].toFixed(5) * 1
                    :
                    '-'
                } {PERSONAL_TOKEN_TICKER}
              </p>
            </div>
            <div>
              <p className='heading'>Total Staked {APY_TOKEN_TICKER}</p>
              <p className='data'>
                {
                  contractInfo
                    ?

                    contractInfo[ContractInformation.TotalStakedApyForPersonalApyPool].toFixed(5) * 1
                    :
                    '-'
                } {APY_TOKEN_TICKER}
              </p>
            </div>
            <div>
              <p className='heading'>Total Stakers</p>
              <p className='data'>{contractInfo ? contractInfo[ContractInformation.TotalStakersForPersonalApyPool] : '-'}</p>
            </div>
          </div>

          <div className="staking-info">
            <div className='info'>
              <div>
                <p className='heading'>Tax For Unstaking</p>
                <p className='data'>{` ${TAX_FOR_UNSTAKING}%`}</p>
              </div>
            </div>
          </div>

          <div className='buttonDiv'>
            <button className='stake_button' onClick={() => onShowModal(true)}>
              <p>Stake</p>
              {/* <img src={down}/> */}
            </button>
            <button className='unstake_button' onClick={() => onShowModal(false)}>
              <p>Unstake</p>
              {/* <img src={up}/> */}
            </button>
          </div>



          <div className='info'>
            {/* <img src={stake_reward_bg}/> */}
            <div>
              <p className='heading'>My Staked $PER</p>
              <p className='data'>
                {personalApyStaker ? personalApyStaker.stakedAmountForPersonal.toFixed(5) * 1 : '-'} $PER
              </p>
            </div>
            <div>
              <p className='heading'>My Staked $APY</p>
              <p className='data'>
                {personalApyStaker ? personalApyStaker.stakedAmountForApy.toFixed(5) * 1 : '-'} $APY
              </p>
            </div>
            <div>
              <p className='heading'>My Unstaked $PER</p>
              <p className='data'>
                {personalApyStaker ? personalApyStaker.unstakedAmountForPersonal.toFixed(5) * 1 : '-'} $PER
              </p>
            </div>
            <div>
              <p className='heading'>My Unstaked $APY</p>
              <p className='data'>
                {personalApyStaker ? personalApyStaker.unstakedAmountForApy.toFixed(5) * 1 : '-'} $APY
              </p>
            </div>
            {/* <div>
              <p className='heading'>My Unstaked</p>
              <p className='data'>
                {stakeAccount ? stakeAccount.reward_amount : '-'} $PER &nbsp;
                {stakeAccount ? stakeAccount.reward_amount : '-'} $APY
              </p>
            </div> */}
            {/* <div>
              <p className='heading'>My Reward</p>
              <p className='data'>
                {personalApyStaker ? (personalApyStaker.claimedAmountForPersonal as any).toFixed(5) * 1 : '-'} $PER &nbsp;
                {personalApyStaker ? (personalApyStaker.claimedAmountForApy as any).toFixed(5) * 1 : '-'} $APY
              </p>
            </div> */}
          </div>

          {/* <div className='stake_reward'>
                <img src={stake_reward_bg}/>
                
            </div> */}
          {/* <img className="ftm" src={PAXLogo} /> */}

          <Modal
            isOpen={showModal}
            onRequestClose={() => {
              setShowModal(false);
            }}
            ariaHideApp={false}
            className='modalcard box-shadow'
          >
            <img className={"coin"} src={coin} />
            <div className='modaldiv'>
              <h3 className='modalHeader'>
                {isStakeModal ? 'Stake' : 'Unstake'}
              </h3>
            </div>
            <p className='modal-description'>
              {
                showModal && (isStakeModal ?
                  `Your tokens will be locked for days after deposit (even the tokens that are already staked)`
                  : `Your tokens will be undelegated for days after unstake (even the tokens that are already unstaked)`)
              }
            </p>
            <div className='modal-divider'></div>
            <div
              style={{
                marginTop: '12px'
              }}
              className='pinkpara font-24'
            >
              <span>{isStakeModal ? 'Balance' : 'Staked'}:&nbsp;&nbsp;</span>
              <span style={{ color: '#FEE277', fontWeight: 600, fontSize: '1rem' }}>
                {
                  showModal && (
                    isStakeModal
                      ?
                      (perTokenBalance as any).toFixed(5) * 1
                      :
                      personalApyStaker.stakedAmountForPersonal.toFixed(5) * 1
                  )
                }
              </span>
              <span>&nbsp;{PERSONAL_TOKEN_TICKER}&nbsp;&nbsp;</span>
              <span style={{ color: '#FEE277', fontWeight: 600, fontSize: '1rem' }}>
                {
                  showModal && (
                    isStakeModal
                      ?
                      (apyTokenBalance as any).toFixed(5) * 1
                      :
                      personalApyStaker.stakedAmountForApy.toFixed(5) * 1
                  )
                }
              </span>
              <span>&nbsp;{APY_TOKEN_TICKER}</span>
            </div>
            <h6 className='modal-info-1'>
              {isStakeModal ? 'Amount to Stake' : 'Percentage to Unstake'}
            </h6>
            <div className='modal-div-1 mb-2'>
              <span className='align-self-center mr-1'>$PER: </span>
              <input className='modal-input-1'
                placeholder={isStakeModal ? 'Amount' : 'Percentage'}
                type='number'
                step={0.01}
                value={personalInputAmount}
                onChange={(e) => onPersonalInputAmountChange(e.target.value)}
              />
              {
                !isStakeModal && (<span className='stake-modal-input-percentage'>%</span>)
              }
              <button className='maximize-button'
                onClick={onPersonalTokenMaximize}
              >
                MAX
              </button>
            </div>
            <div className='modal-div-1'>
              <span className='align-self-center mr-1'>$APY: </span>
              <input className='modal-input-1'
                placeholder={isStakeModal ? 'Amount' : 'Percentage'}
                type='number'
                step={0.01}
                value={apyInputAmount}
                onChange={(e) => onApyInputAmountChange(e.target.value)}
              />
              {
                !isStakeModal && (<span className='stake-modal-input-percentage'>%</span>)
              }
              <button className='maximize-button'
                onClick={onApyTokenMaximize}
              >
                MAX
              </button>
            </div>
            <div className='modal-divider' style={{ paddingTop: "20px" }}></div>
            {
              personalModalInfoMesssage && (
                <div className='modal-info-message'>
                  {personalModalInfoMesssage}
                </div>
              )
            }

            {
              apyModalInfoMesssage && (
                <div className='modal-info-message'>
                  {apyModalInfoMesssage}
                </div>
              )
            }

            {
              isStakeModal ? (
                <button
                  className='modal-submit-button'
                  onClick={stake}
                  disabled={personalModalButtonDisabled || apyModalButtonDisabled}
                >
                  Stake
                </button>
              ) : (
                <button
                  className='modal-submit-button'
                  onClick={unstake}
                  disabled={personalModalButtonDisabled || apyModalButtonDisabled}
                >
                  Unstake
                </button>
              )
            }
          </Modal>
          <AlertModal
            show={alertModalShow}
            onHide={() => setAlertModalShow(false)}
            alertmodaltext={alertModalText}
          />
        </div>
      </Spin>
    </div>
  );
};

export default PerApy2PerApy;