const hre = require("hardhat");

async function main() {
  const WillTransferV2 = await hre.ethers.getContractFactory("WillTransferV2");
  const contract = await WillTransferV2.deploy();
  await contract.deployed();
  console.log("Contract deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});