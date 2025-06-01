// scripts/deployWillTransfer.js
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const creationFee = hre.ethers.parseEther("0.01"); // Setting a small fee of 0.01 tCORE for will creation

  const WillTransfer = await hre.ethers.getContractFactory("WillTransfer");
  console.log("Deploying WillTransfer...");
  const willTransfer = await WillTransfer.deploy(creationFee);

  await willTransfer.waitForDeployment();
  const contractAddress = await willTransfer.getAddress();

  console.log("WillTransfer contract deployed to:", contractAddress);
  console.log("Transaction hash:", willTransfer.deploymentTransaction().hash);
  
  // Verify the initial state
  console.log("Initial creation fee:", await willTransfer.creationFee());
  console.log("Contract owner:", await willTransfer.owner());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
