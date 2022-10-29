// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface ICustomERC20 {
    function mintTokens(uint256) external;

    function burnTokens(uint256) external;
}
