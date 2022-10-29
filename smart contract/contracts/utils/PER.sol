// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../PersonalApy.sol";

/**
 * @title PER ERC20 contract
 * @notice Contract for the PER ERC20 token
 */
contract PER is ERC20, Ownable {
    address payable treasuryAddress; // team wallet address
    uint256 premint = 270_000_000 * 10**18;
    PersonalApy public icoContract;

    event NewTreasuryAddress(address treasuryAddress);

    /**
     * @notice constructor
     * @dev hardcoded preminting of tokens. Distributed 10% to team (devs/marketing), 45% to ICO, and 45% to fund LPs.
     * @inheritdoc {ERC20}
     */
    constructor() ERC20("Personal", "PER") {
        treasuryAddress = payable(0xB17481aAb0826c67D801435d6c567F6b9e518eFA);

        /// @notice premint for APY tokens: 3% to team, 7% to marketing, 45% to ICO, 45% to fund LPs
        _mint(treasuryAddress, (premint * 10) / 100);
        _mint(icoContract, (premint * 45) / 100);
        _mint(msg.sender, (premint * 45) / 100); // msg.sender is deployer wallet that will create LPs
    }

    /**
     * @notice external function to mint tokens
     * @dev only callable by owner. Meant to be called by staking contract
     * @param _amount - amount of tokens to be minted
     */
    function mintTokens(uint256 _amount) external onlyOwner {
        _mint(msg.sender, _amount);
    }

    /**
     * @notice external function to burn tokens
     * @dev only callable by owner. Meant to be called by buyback engine contract
     * NOTE: only the PER token was designed to have a burn functionality as part of buyback engine
     * @param _amount - amount of tokens to be minted
     */
    function burnTokens(uint256 _amount) external {
        _burn(msg.sender, _amount);
    }

    /**
     * @notice Set treasury addresses
     * @dev Only callable by owner
     * @param _treasuryAddress - address of the treasury
     */
    function setTreasuryAddress(address _treasuryAddress) external onlyOwner {
        require(_treasuryAddress != address(0), "Cannot be zero address");

        treasuryAddress = payable(_treasuryAddress);

        emit NewTreasuryAddress(_treasuryAddress);
    }

    /**
     * @notice View Treasury Addresses
     */
    function viewContractConfiguration() external view returns (address) {
        return (treasuryAddress);
    }
}
