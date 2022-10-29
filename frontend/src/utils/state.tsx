/** presale */
export enum Status {
    NotStarted,
    Started,
    Ended
}

export enum ContractInformation {
    TotalStakedPerForPersonalApyPool,
    TotalStakedApyForPersonalApyPool,
    TotalStakersForPersonalApyPool,
    CurrentTime
}

export const convertToStatus = (s: string) => {
    if (s == 'NotStarted') {
        return Status.NotStarted;
    }
    if (s == 'Started') {
        return Status.Started;
    }
    return Status.Ended;
};

export interface ISaleStatusProvider {
    status: Status;
    leftTimestamp: number;
    goal: number;
    totalBoughtAmountOf: number;
}

export interface IAccountStateProvider {
    accountState: number;
}

export interface INotificationConfig {
    message: string;
    type: string;
    insert: string;
    container: string;
    animationIn: string[];
    animationOut: string[];
    dismiss: {
        duration: number;
        onScreen: boolean;
    }
}

export interface IDeployedChainId {
    mainnet: number;
    testnet: number;
}

export interface IDeployedChain {
    mainnet: {
        chainName: string;
        chainId: string | number;
        nativeCurrency: {
            name: string;
            decimals: number;
            symbol: string;
        };
        rpcUrls: string[];
    },
    testnet: {
        chainName: string;
        chainId: string | number;
        nativeCurrency: {
            name: string;
            decimals: number;
            symbol: string;
        };
        rpcUrls: string[];
    }
}

export interface IPersonalStaker {
    isStaked: boolean;
    stakedAt: number;
    updatedAt: number;
    stakedCount: number;
    stakedAmount: any;
    claimedAt: number;
    claimedCount: number;
    claimedAmountForPersonal: number;
    claimedAmountForApy: number;
    pendingAmountForPersonal: number;
    pendingAmountForApy: number;
}

export interface IPersonalApyStaker {
    isStaked: boolean;
    stakedAt: number;
    updatedAt: number;
    stakedCount: number;
    stakedAmountForPersonal: any;
    stakedAmountForApy: any;
    unstakedCount: number;
    unstakedAmountForPersonal: any;
    unstakedAmountForApy: any;
}

export interface IIcoInterface {
    personalTokenIcoPrice: number;
    apyTokenIcoPrice: number;
    personalTokenIcoBalance: number;
    apyTokenIcoBalance: number;
    icoStartedAt: number;
    icoPeriod: number;
    personalTokenSold: number;
    apyTokenSold: number;
    maxLimitForPersonal: number;
    maxLimitForApy: number;
    whitelistMerkleRoot: any;
    currentTime: number;
}

export interface IIcoBuyer {
    isBought: boolean;
    amountForPersonal: number;
    amountForApy: number;
}