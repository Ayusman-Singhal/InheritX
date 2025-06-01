// scripts/testDeployedContract.js
const hre = require("hardhat");
const { ethers } = require("hardhat");

// The deployed contract address on tCORE Testnet
const DEPLOYED_CONTRACT_ADDRESS = "0xDC42B46C06bBE6FcAD2678cAEe7B8fF97e649d2A";

async function main() {
  console.log("Testing deployed WillTransfer contract on tCORE Testnet...");
  
  // Get signers (accounts)
  const [testator, executor, beneficiary1, beneficiary2] = await ethers.getSigners();
  
  console.log("Using testator account:", testator.address);
  console.log("Using executor account:", executor.address);
  console.log("Using beneficiary1 account:", beneficiary1.address);
  console.log("Using beneficiary2 account:", beneficiary2.address);
  
  // Get the deployed contract instance
  const WillTransfer = await ethers.getContractFactory("WillTransfer");
  const willTransfer = WillTransfer.attach(DEPLOYED_CONTRACT_ADDRESS);
  
  console.log("Contract attached at address:", await willTransfer.getAddress());
  
  // Check initial state
  const creationFee = await willTransfer.creationFee();
  console.log("Creation fee:", ethers.formatEther(creationFee), "tCORE");
  
  try {
    // 1. Create a will
    console.log("\n1. Creating a new will...");
    const description = "My Test Will";
    const beneficiaries = [beneficiary1.address, beneficiary2.address];
    const shares = [60, 40]; // 60% and 40%
    
    const tx1 = await willTransfer.createWill(
      description,
      beneficiaries,
      shares,
      executor.address,
      { value: creationFee }
    );
    
    const receipt1 = await tx1.wait();
    console.log("Will created! Transaction hash:", tx1.hash);
    
    // Find the WillCreated event to get the will ID
    const willCreatedEvent = receipt1.logs
      .filter(log => log.fragment && log.fragment.name === 'WillCreated')
      .map(log => willTransfer.interface.parseLog(log))[0];
    
    const willId = willCreatedEvent.args[0];
    console.log("Created Will ID:", willId.toString());
    
    // 2. Get will details
    console.log("\n2. Getting will details...");
    const willDetails = await willTransfer.getWillDetails(willId);
    console.log("Will testator:", willDetails[0]);
    console.log("Will creation timestamp:", new Date(Number(willDetails[1]) * 1000).toLocaleString());
    console.log("Will description:", willDetails[2]);
    console.log("Will is active:", willDetails[3]);
    console.log("Will is executed:", willDetails[4]);
    console.log("Will executor:", willDetails[5]);
    console.log("Will execution confirmed:", willDetails[6]);
    console.log("Will total balance:", ethers.formatEther(willDetails[7]), "tCORE");
    
    // 3. Deposit funds to the will
    console.log("\n3. Depositing funds to the will...");
    const depositAmount = ethers.parseEther("0.05"); // 0.05 tCORE
    const tx2 = await willTransfer.depositToWill(willId, { value: depositAmount });
    await tx2.wait();
    console.log("Funds deposited! Transaction hash:", tx2.hash);
    
    // Check updated balance
    const updatedWillDetails = await willTransfer.getWillDetails(willId);
    console.log("Updated will balance:", ethers.formatEther(updatedWillDetails[7]), "tCORE");
    
    // 4. Confirm execution condition (as executor)
    console.log("\n4. Confirming execution condition as executor...");
    const tx3 = await willTransfer.connect(executor).confirmExecutionCondition(willId);
    await tx3.wait();
    console.log("Execution condition confirmed! Transaction hash:", tx3.hash);
    
    // Check if execution is confirmed
    const confirmationDetails = await willTransfer.getWillDetails(willId);
    console.log("Will execution confirmed:", confirmationDetails[6]);
    
    // 5. Execute the will
    console.log("\n5. Executing the will...");
    const tx4 = await willTransfer.executeWill(willId);
    await tx4.wait();
    console.log("Will executed! Transaction hash:", tx4.hash);
    
    // Check if will is executed and inactive
    const executedWillDetails = await willTransfer.getWillDetails(willId);
    console.log("Will is executed:", executedWillDetails[4]);
    console.log("Will is active:", executedWillDetails[3]);
    console.log("Will balance after execution:", ethers.formatEther(executedWillDetails[7]), "tCORE");
    
    console.log("\nAll tests completed successfully!");
    
  } catch (error) {
    console.error("Error during testing:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
