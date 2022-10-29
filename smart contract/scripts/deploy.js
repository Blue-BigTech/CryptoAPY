const { ethers, network } = require("hardhat");
const { parseEther } = require("ethers/lib/utils");

const main = async () => {
  // deploy mock PER token
  const MockPERFactory = await ethers.getContractFactory("MockPER");
  const initSupplyOfPER = parseEther("10000000000");
  const MockPERToken = await MockPERFactory.deploy("MockPersonalToken", "MPER", initSupplyOfPER);
  await MockPERToken.deployed()
  console.log("MockPERToken deployed to:", MockPERToken.address);

  // deploy mock APY token
  const MockAPYFactory = await ethers.getContractFactory("MockAPY");
  const initSupplyOfAPY = parseEther("10000000000");
  const MockAPYToken = await MockAPYFactory.deploy("MockApyToken", "MAPY", initSupplyOfAPY);
  await MockAPYToken.deployed()
  console.log("MockAPYToken deployed to:", MockAPYToken.address);

  // deploy mock staking contract
  const PersonalApyFactory = await ethers.getContractFactory("PersonalApy");
  const PersonalApy = await PersonalApyFactory.deploy(
    MockPERToken.address,
    MockAPYToken.address
  );
  await PersonalApy.deployed();
  console.log("PersonalApy deployed to:", PersonalApy.address);
};

main(true)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
