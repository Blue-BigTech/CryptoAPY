// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/ICustomERC20.sol";
import "./interfaces/IPancakeRouter02.sol";
import "./utils/SlidingWindowOracle.sol";

/**
 * @title BuybackEngine
 * @notice this contract handles a buyback mechanism
 * by selling $APY and buying $PER to burn
 */
contract BuybackEngine is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    address personalTokenAddress; // address of Personal Token Contract
    address apyTokenAddress; // address of Apy Token Contract

    // balances of APY, BNB, and PER tokens held in this contract
    uint256 private apyTokenPool;
    uint256 private bnbTokenPool;
    uint256 private perTokenPool;

    IERC20 public personalToken;
    IERC20 public apyToken;
    IERC20 public bnbToken;

    IPancakeRouter02 public immutable router;

    uint256 constant DECIMAL = 1_000_000_000_000_000_000; // 10 ^ 18

    SlidingWindowOracle oracle;

    /**
     * @notice Constructor
     * @param _personalTokenAddress: address of the PERSONAL token
     * @param _apyTokenAddress: address of the APY token
     */
    constructor(
        IPancakeRouter02 _router,
        address _personalTokenAddress,
        address _apyTokenAddress
    ) {
        router = _router;
        personalTokenAddress = _personalTokenAddress;
        apyTokenAddress = _apyTokenAddress;

        personalToken = IERC20(_personalTokenAddress);
        apyToken = IERC20(_apyTokenAddress);
        bnbToken = IERC20(router.WETH());
    }

    /**
     * @dev the Buyback function takes a 5% tax of APY when withdrawn and uses it
     * to sell for BNB, then buy PER and burn. This is an anti-inflationary measure to
     * limit sell side pressure on PER
     * @param buybackTax - uint256 amount of APY tokens sent to this contract to swap for PER
     */
    function BuyBack(uint256 buybackTax) public payable onlyOwner nonReentrant {
        /// @dev deposit the buyback tax into this contract
        apyToken.safeTransferFrom(msg.sender, address(this), buybackTax);

        // balances of APY, BNB, and PER tokens held in this contract
        apyTokenPool = apyToken.balanceOf(address(this));
        bnbTokenPool = bnbToken.balanceOf(address(this));
        perTokenPool = personalToken.balanceOf(address(this));

        /// @dev Ensure this contract first has APY tokens transferred to it
        require(
            apyToken.balanceOf(address(this)) > 0,
            "Contract owns no APY tokens"
        );

        /// @dev 10 APY tokens was chosen as the minimum pool to start the buyback
        /// to minimize transaction frequency
        if (apyTokenPool > 10 * DECIMAL) {
            require(
                apyToken.approve(address(router), apyTokenPool),
                "approve failed"
            );

            /// @notice swapping APY for BNB in PancakeSwap router
            address[] memory path1 = new address[](2);
            path1[0] = apyTokenAddress;
            path1[1] = router.WETH();
            /// @dev this calls an on-chain Uniswap V2 sliding window Oracle
            /// to determine minimum output price for swap
            uint256 amountOutMin1 = oracle.consult(
                apyTokenAddress,
                apyTokenPool,
                router.WETH()
            );
            (apyTokenPool, bnbTokenPool) = router.swapExactTokensForETH(
                apyTokenPool,
                amountOutMin1,
                path1,
                address(this),
                block.timestamp
            );

            require(
                bnbToken.approve(address(router), bnbTokenPool),
                "approve failed"
            );

            /// @notice swapping BNB for PER in PancakeSwap router
            address[] memory path2 = new address[](2);
            path2[0] = router.WETH();
            path2[1] = personalTokenAddress;
            /// @dev this calls an on-chain Uniswap V2 sliding window Oracle
            /// to determine minimum output price for swap
            uint256 amountOutMin2 = oracle.consult(
                router.WETH(),
                bnbTokenPool,
                personalTokenAddress
            );
            (bnbTokenPool, perTokenPool) = router.swapETHForExactTokens(
                bnbTokenPool,
                amountOutMin2,
                path2,
                address(this),
                block.timestamp
            );

            /// @dev burns the swapped PER tokens by design of buyback functionality
            ICustomERC20(personalToken).burnTokens(perTokenPool);
        }
    }

    /**
     * @dev simple getter function to retrieve all token balances of contract (APY, BNB, and PER)
     * @return - uint256 array of token pools of the above tokens
     */
    function getTokenPools()
        public
        view
        onlyOwner
        returns (uint256[] memory poolAmounts)
    {
        // balances of APY, BNB, and PER tokens held in this contract
        apyTokenPool = apyToken.balanceOf(address(this));
        bnbTokenPool = bnbToken.balanceOf(address(this));
        perTokenPool = personalToken.balanceOf(address(this));

        poolAmounts = [apyTokenPool, bnbTokenPool, perTokenPool];
        return poolAmounts;
    }
}
