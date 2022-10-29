// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
pragma abicoder v2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./interfaces/ICustomERC20.sol";
import "./BuybackEngine.sol";

/** @title PersonalApy
 * @notice It is a contract for a staking system using
 * $PERSONAL and $APY.
 */
contract PersonalApy is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Struct for stakers in PersonalApy pool
    struct PersonalApyStaker {
        bool isStaked;
        uint256 stakedAt;
        uint256 updatedAt;
        uint256 stakedCount;
        uint256 stakedAmountForPersonal;
        uint256 stakedAmountForApy;
        uint256 unstakedCount;
        uint256 unstakedAmountForPersonal;
        uint256 unstakedAmountForApy;
    }

    // Struct for token buyers
    struct ICOBuyer {
        bool isBought;
        uint256 amountForPersonal;
        uint256 amountForApy;
    }

    // Struct for ico information
    struct ICOInformation {
        uint256 personalTokenIcoPrice;
        uint256 apyTokenIcoPrice;
        uint256 personalTokenIcoBalance;
        uint256 apyTokenIcoBalance;
        uint256 icoStartedAt;
        uint256 icoPeriod;
        uint256 personalTokenSold;
        uint256 apyTokenSold;
        uint256 maxLimitForPersonal;
        uint256 maxLimitForApy;
        bytes32 whitelistMerkleRoot;
        uint256 currentTime;
    }

    address personalTokenAddress; // address of Personal Token Contract
    address apyTokenAddress; // address of Apy Token Contract
    address payable treasuryAddress; // team wallet address
    address payable developerAddress =
        payable(0x012F70A63578045aCb880d4C675888594BC12959); // developer wallet address

    uint256 constant APR_FOR_PERSONAL_TOKEN = 2000; // 2%
    uint256 constant APR_FOR_APY_TOKEN = 1; // 0.001%
    uint256 constant ADDITIONAL_APR = 1000; // 1%
    uint256 constant DECIMAL = 1_000_000_000_000_000_000; // 10 ^ 18
    uint256 constant ICO_PERIOD = 30 * 86400; // a month
    uint256 constant UNSTAKING_TAX = 3; // 3% for unstaking
    uint256 constant BUYBACK_TAX = 5; // 5% for buyback
    uint256 constant AUTO_COMPOUNDING_PERIOD = 86400; // 1 day
    uint256 constant ICO_LOCKING_PERIOD = 10 * 60; // 10 min
    uint256 constant BUY_LIMIT_FOR_PERSONAL_TOKEN = 30000 * DECIMAL;
    uint256 constant BUY_LIMIT_FOR_APY_TOKEN = 5 * DECIMAL;

    uint256 personalTokenIcoPrice = 2_000_000_000_000_000;
    uint256 apyTokenIcoPrice = 20_000_000_000_000_000;
    uint256 personalTokenIcoBalance = 1000 * DECIMAL;
    uint256 apyTokenIcoBalance = 500 * DECIMAL;
    uint256 personalTokenSold;
    uint256 apyTokenSold;
    uint256 icoStartedAt;
    uint256 personalTokenBalance; // balance of $PERSONAL tokens for reward
    uint256 apyTokenBalance; // balance of $APY token for reward

    IERC20 public personalToken;
    IERC20 public apyToken;

    BuybackEngine public buybackEngine;

    uint256 totalStakedPerForPersonalApyPool;
    uint256 totalStakedApyForPersonalApyPool;
    uint256 totalStakersForPersonalApyPool;

    bytes32 private whitelistMerkleRoot;

    // Mapping are cheaper than arrays
    mapping(address => PersonalApyStaker) private _personalApyStakers;
    mapping(address => ICOBuyer) private _icoBuyers;

    event TokenInjection(
        uint256 personalAmount,
        uint256 apyAmount,
        uint256 identifier
    );
    event NewTreasuryAddress(address treasuryAddress);

    event StakedTokensToPersonalApyPool(
        uint256 stakedAt,
        uint256 stakedAmountForPersonal,
        uint256 stakedAmountForApy
    );
    event UnstakedFromPersonalApyPool(
        address user,
        uint256 amountForPersonal,
        uint256 amountForApy
    );

    event WhitelistSold(uint256 amountToGet, bool isPersonal);
    event SetWhitelistMerkleRoot(bytes32 whitelistMerkleRoot);
    event StartedIco();

    /**
     * @notice Constructor
     * @param _personalTokenAddress: address of the PERSONAL token
     * @param _apyTokenAddress: address of the APY token
     */
    constructor(address _personalTokenAddress, address _apyTokenAddress) {
        personalTokenAddress = _personalTokenAddress;
        apyTokenAddress = _apyTokenAddress;

        personalToken = IERC20(_personalTokenAddress);
        apyToken = IERC20(_apyTokenAddress);
    }

    ////////////////////////////////////////////////////////
    /// For PersonalApy Pool
    ////////////////////////////////////////////////////////
    /**
     * @notice Stake tokens to PERSONAL-APY Pool
     * @dev Callable by users
     * @param _amountForPersonal: amount to stake in $PERSONAL token
     * @param _amountForApy: amount to stake in $Apy token
     */
    function stakeTokensToPersonalApyPool(
        uint256 _amountForPersonal,
        uint256 _amountForApy
    ) external nonReentrant {
        require(
            _amountForPersonal >= 0 && _amountForApy >= 0,
            "Amount must be equal or bigger than zero"
        );

        uint256 currentTime = block.timestamp;

        if (!_personalApyStakers[msg.sender].isStaked) {
            require(
                _amountForPersonal > 0,
                "Amount for a new investor must be bigger than zero"
            );
            _personalApyStakers[msg.sender] = PersonalApyStaker({
                isStaked: true,
                stakedAt: currentTime,
                updatedAt: currentTime,
                stakedCount: 1,
                stakedAmountForPersonal: _amountForPersonal,
                stakedAmountForApy: _amountForApy,
                unstakedCount: 0,
                unstakedAmountForPersonal: 0,
                unstakedAmountForApy: 0
            });

            totalStakersForPersonalApyPool += 1;

            totalStakedPerForPersonalApyPool += _amountForPersonal;
            totalStakedApyForPersonalApyPool += _amountForApy;
        } else {
            uint256 deltaTime = currentTime -
                _personalApyStakers[msg.sender].updatedAt;
            uint256 compoundingCount = deltaTime / AUTO_COMPOUNDING_PERIOD;
            uint256 compoundingRest = deltaTime % AUTO_COMPOUNDING_PERIOD;

            uint256 currentStakedAmoutForPersonal = _personalApyStakers[
                msg.sender
            ].stakedAmountForPersonal;
            uint256 currentStakedAmoutForApy = _personalApyStakers[msg.sender]
                .stakedAmountForApy;

            /* ---------Auto Compounding--------- */
            for (uint256 i = 1; i <= compoundingCount; i++) {
                currentStakedAmoutForPersonal +=
                    (currentStakedAmoutForPersonal *
                        APR_FOR_PERSONAL_TOKEN *
                        AUTO_COMPOUNDING_PERIOD) /
                    86400 /
                    (1000 * 100) +
                    (currentStakedAmoutForPersonal *
                        ADDITIONAL_APR *
                        currentStakedAmoutForApy *
                        AUTO_COMPOUNDING_PERIOD) /
                    86400 /
                    (1000 * 100) /
                    DECIMAL;

                currentStakedAmoutForApy +=
                    (currentStakedAmoutForPersonal *
                        APR_FOR_APY_TOKEN *
                        AUTO_COMPOUNDING_PERIOD) /
                    86400 /
                    (1000 * 100);
            }

            currentStakedAmoutForPersonal +=
                (currentStakedAmoutForPersonal *
                    APR_FOR_PERSONAL_TOKEN *
                    compoundingRest) /
                86400 /
                (1000 * 100) +
                (currentStakedAmoutForPersonal *
                    ADDITIONAL_APR *
                    currentStakedAmoutForApy *
                    compoundingRest) /
                86400 /
                (1000 * 100) /
                DECIMAL;

            currentStakedAmoutForApy +=
                (currentStakedAmoutForPersonal *
                    APR_FOR_APY_TOKEN *
                    compoundingRest) /
                86400 /
                (1000 * 100);
            /* --------------------------------- */
            currentStakedAmoutForPersonal += _amountForPersonal;
            currentStakedAmoutForApy += _amountForApy;

            totalStakedPerForPersonalApyPool +=
                currentStakedAmoutForPersonal -
                _personalApyStakers[msg.sender].stakedAmountForPersonal;
            totalStakedApyForPersonalApyPool +=
                currentStakedAmoutForApy -
                _personalApyStakers[msg.sender].stakedAmountForApy;

            _personalApyStakers[msg.sender].updatedAt = currentTime;
            _personalApyStakers[msg.sender].stakedCount += 1;
            _personalApyStakers[msg.sender]
                .stakedAmountForPersonal = currentStakedAmoutForPersonal;
            _personalApyStakers[msg.sender]
                .stakedAmountForApy = currentStakedAmoutForApy;
        }

        // Transfer game tokens to this contract
        personalToken.safeTransferFrom(
            address(msg.sender),
            address(this),
            _amountForPersonal
        );
        apyToken.safeTransferFrom(
            address(msg.sender),
            address(this),
            _amountForApy
        );

        // TODO: want to add pancake swap LP positions here. Deposit liquidity and mint LPs

        emit StakedTokensToPersonalApyPool(
            block.timestamp,
            _amountForPersonal,
            _amountForApy
        );
    }

    /**
     * @notice Unstake tokens from PERSONAL-APY Pool
     * @dev Callable by users
     * @param _percentageForPersonal: percentage to unstake in $PERSONAL token
     * @param _percentageForApy: percentage to unstake in $APY token
     */
    function unstakeFromPersonalApyPool(
        uint256 _percentageForPersonal,
        uint256 _percentageForApy
    ) external nonReentrant {
        require(
            _personalApyStakers[msg.sender].isStaked = true,
            "Not statked yet"
        );

        require(
            _percentageForPersonal >= 0 && _percentageForApy >= 0,
            "Percentage must be equal or bigger than zero"
        );

        uint256 currentTime = block.timestamp;
        uint256 deltaTime = currentTime -
            _personalApyStakers[msg.sender].updatedAt;
        uint256 currentStakedAmoutForPersonal = _personalApyStakers[msg.sender]
            .stakedAmountForPersonal;
        uint256 currentStakedAmoutForApy = _personalApyStakers[msg.sender]
            .stakedAmountForApy;

        /* ---------Auto Compounding--------- */
        uint256 compoundingCount = deltaTime / AUTO_COMPOUNDING_PERIOD;
        uint256 compoundingRest = deltaTime % AUTO_COMPOUNDING_PERIOD;

        for (uint256 i = 1; i <= compoundingCount; i++) {
            currentStakedAmoutForPersonal +=
                (currentStakedAmoutForPersonal *
                    APR_FOR_PERSONAL_TOKEN *
                    AUTO_COMPOUNDING_PERIOD) /
                86400 /
                (1000 * 100) +
                (currentStakedAmoutForPersonal *
                    ADDITIONAL_APR *
                    currentStakedAmoutForApy *
                    AUTO_COMPOUNDING_PERIOD) /
                86400 /
                (1000 * 100) /
                DECIMAL;

            currentStakedAmoutForApy +=
                (currentStakedAmoutForPersonal *
                    APR_FOR_APY_TOKEN *
                    AUTO_COMPOUNDING_PERIOD) /
                86400 /
                (1000 * 100);
        }

        currentStakedAmoutForPersonal +=
            (currentStakedAmoutForPersonal *
                APR_FOR_PERSONAL_TOKEN *
                compoundingRest) /
            86400 /
            (1000 * 100) +
            (currentStakedAmoutForPersonal *
                ADDITIONAL_APR *
                currentStakedAmoutForApy *
                compoundingRest) /
            86400 /
            (1000 * 100) /
            DECIMAL;

        currentStakedAmoutForApy +=
            (currentStakedAmoutForPersonal *
                APR_FOR_APY_TOKEN *
                compoundingRest) /
            86400 /
            (1000 * 100);
        /* --------------------------------- */

        uint256 amountForPersonal;
        uint256 amountForApy;

        if (_percentageForPersonal > 0) {
            require(
                _personalApyStakers[msg.sender].stakedAmountForPersonal > 0,
                "Already unstaked all $PERSONAL tokens"
            );

            require(_percentageForPersonal <= 100, "Percentage not over");

            // Transfer $PERSONAL to msg.sender
            amountForPersonal =
                (currentStakedAmoutForPersonal * _percentageForPersonal) /
                100;
            currentStakedAmoutForPersonal -= amountForPersonal;

            ICustomERC20(personalTokenAddress).mintTokens(amountForPersonal);
        }

        if (_percentageForApy > 0) {
            require(
                _personalApyStakers[msg.sender].stakedAmountForApy > 0,
                "Already unstaked all $APY tokens"
            );

            require(_percentageForApy <= 100, "Percentage not over");

            // Transfer $APY to msg.sender
            amountForApy = (currentStakedAmoutForApy * _percentageForApy) / 100;
            currentStakedAmoutForApy -= amountForApy;

            ICustomERC20(apyTokenAddress).mintTokens(amountForApy);
        }

        totalStakedPerForPersonalApyPool =
            totalStakedPerForPersonalApyPool +
            currentStakedAmoutForPersonal -
            _personalApyStakers[msg.sender].stakedAmountForPersonal;
        totalStakedApyForPersonalApyPool =
            totalStakedApyForPersonalApyPool +
            currentStakedAmoutForApy -
            _personalApyStakers[msg.sender].stakedAmountForApy;

        _personalApyStakers[msg.sender].updatedAt = currentTime;
        _personalApyStakers[msg.sender]
            .stakedAmountForPersonal = currentStakedAmoutForPersonal;
        _personalApyStakers[msg.sender]
            .stakedAmountForApy = currentStakedAmoutForApy;
        _personalApyStakers[msg.sender]
            .unstakedAmountForPersonal += ((amountForPersonal *
            (100 - UNSTAKING_TAX)) / 100);
        _personalApyStakers[msg.sender].unstakedAmountForApy += ((amountForApy *
            (100 - UNSTAKING_TAX - BUYBACK_TAX)) / 100);

        // transfer tokens to caller
        personalToken.safeTransfer(
            msg.sender,
            (amountForPersonal * (100 - UNSTAKING_TAX)) / 100
        );
        personalToken.safeTransfer(
            treasuryAddress,
            (amountForPersonal * UNSTAKING_TAX) / 100
        );

        apyToken.safeTransfer(
            msg.sender,
            (amountForApy * (100 - UNSTAKING_TAX - BUYBACK_TAX)) / 100
        );
        apyToken.safeTransfer(
            treasuryAddress,
            (amountForApy * UNSTAKING_TAX) / 100
        );
        buybackEngine.BuyBack((amountForApy * BUYBACK_TAX) / 100);

        emit UnstakedFromPersonalApyPool(
            msg.sender,
            amountForPersonal,
            amountForApy
        );
    }

    /**
     * @notice Set treasury addresses
     * @dev Only callable by owner
     * @param _treasuryAddress: address of the treasury
     */
    function setTreasuryAddress(address _treasuryAddress) external onlyOwner {
        require(_treasuryAddress != address(0), "Cannot be zero address");

        treasuryAddress = payable(_treasuryAddress);

        emit NewTreasuryAddress(_treasuryAddress);
    }

    /**
     * @notice Set Whitelist Merkle Root
     * @dev Only callable by owner
     * @param _whitelistMerkleRoot: address of the treasury
     */
    function setWhitelistMerkleRoot(bytes32 _whitelistMerkleRoot)
        external
        onlyOwner
    {
        require(_whitelistMerkleRoot != "", "Cannot be empty");

        whitelistMerkleRoot = _whitelistMerkleRoot;

        emit SetWhitelistMerkleRoot(whitelistMerkleRoot);
    }

    ////////////////////////////////////////////////////////
    /// ICO Functions
    ////////////////////////////////////////////////////////
    /**
     * @notice Buy tokens
     * @dev Callable by owner
     * @param _isPersonal: check if buy $PER or $APY
     */
    function whitelistSale(bytes32[] calldata proof, bool _isPersonal)
        external
        payable
        nonReentrant
    {
        // merkle tree list related
        require(whitelistMerkleRoot != "", "Free Claim merkle tree not set");
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(
            MerkleProof.verify(proof, whitelistMerkleRoot, leaf),
            "Free Claim validation failed"
        );

        require(msg.value > 0, "Cannot be less than zero");
        require(icoStartedAt != 0, "ICO not started yet");
        require(block.timestamp < icoStartedAt + ICO_PERIOD, "ICO ended");

        uint256 amountToGet;
        if (_isPersonal) {
            amountToGet = (msg.value * DECIMAL) / personalTokenIcoPrice;
            require(
                amountToGet <= personalTokenIcoBalance,
                "Insufficient amount"
            );

            if (!_icoBuyers[msg.sender].isBought) {
                // in case of new buyer
                require(
                    amountToGet <= BUY_LIMIT_FOR_PERSONAL_TOKEN,
                    "Exceed buy limit"
                );

                _icoBuyers[msg.sender] = ICOBuyer({
                    isBought: true,
                    amountForPersonal: amountToGet,
                    amountForApy: 0
                });
            } else {
                require(
                    _icoBuyers[msg.sender].amountForPersonal + amountToGet <=
                        BUY_LIMIT_FOR_PERSONAL_TOKEN,
                    "Exceed buy limit"
                );
                _icoBuyers[msg.sender].amountForPersonal += amountToGet;
            }

            personalTokenIcoBalance -= amountToGet;
            personalTokenSold += amountToGet;
            personalToken.safeTransfer(msg.sender, amountToGet);
        } else {
            amountToGet = (msg.value * DECIMAL) / apyTokenIcoPrice;
            require(amountToGet <= apyTokenIcoBalance, "Insufficient amount");

            if (!_icoBuyers[msg.sender].isBought) {
                // in case of new buyer
                require(
                    amountToGet <= BUY_LIMIT_FOR_APY_TOKEN,
                    "Exceed buy limit"
                );

                _icoBuyers[msg.sender] = ICOBuyer({
                    isBought: true,
                    amountForPersonal: 0,
                    amountForApy: amountToGet
                });
            } else {
                require(
                    _icoBuyers[msg.sender].amountForApy + amountToGet <=
                        BUY_LIMIT_FOR_APY_TOKEN,
                    "Exceed buy limit"
                );
                _icoBuyers[msg.sender].amountForApy += amountToGet;
            }

            apyTokenIcoBalance -= amountToGet;
            apyTokenSold += amountToGet;
            apyToken.safeTransfer(msg.sender, amountToGet);
        }

        treasuryAddress.transfer((msg.value * 90) / 100);
        developerAddress.transfer((msg.value * 10) / 100);

        emit WhitelistSold(amountToGet, _isPersonal);
    }

    /**
     * @notice Start ICO
     * @dev Callable by owner
     */
    function startIco() external onlyOwner {
        require(icoStartedAt == 0, "ICO already started");

        icoStartedAt = block.timestamp;
        ICustomERC20(personalTokenAddress).mintTokens(personalTokenIcoBalance);
        ICustomERC20(apyTokenAddress).mintTokens(apyTokenIcoBalance);

        emit StartedIco();
    }

    ////////////////////////////////////////////////////////
    /// View Functions
    ////////////////////////////////////////////////////////
    /**
     * @notice View Treasury Addresses
     */
    function viewContractConfiguration() external view returns (address) {
        return (treasuryAddress);
    }

    /**
     * @notice View status of staker in PersonalApy pool according to userAddress
     */
    function viewPersonalApyStaker(address userAddress)
        external
        view
        returns (PersonalApyStaker memory, uint256)
    {
        return (_personalApyStakers[userAddress], block.timestamp);
    }

    /**
     * @notice View status of staker in PersonalApy pool according to userAddress
     */
    function viewContractInformation()
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        return (
            totalStakedPerForPersonalApyPool,
            totalStakedApyForPersonalApyPool,
            totalStakersForPersonalApyPool,
            block.timestamp
        );
    }

    /**
     * @notice View status of ico
     */
    function viewIcoInformation()
        external
        view
        returns (ICOInformation memory)
    {
        return
            ICOInformation(
                personalTokenIcoPrice,
                apyTokenIcoPrice,
                personalTokenIcoBalance,
                apyTokenIcoBalance,
                icoStartedAt,
                ICO_PERIOD,
                personalTokenSold,
                apyTokenSold,
                BUY_LIMIT_FOR_PERSONAL_TOKEN,
                BUY_LIMIT_FOR_APY_TOKEN,
                whitelistMerkleRoot,
                block.timestamp
            );
    }

    /**
     * @notice View token buyer in PersonalApy pool according to userAddress
     */
    function viewIcoBuyer(address userAddress)
        external
        view
        returns (ICOBuyer memory)
    {
        return _icoBuyers[userAddress];
    }
}
