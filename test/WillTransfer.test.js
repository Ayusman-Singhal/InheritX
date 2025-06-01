const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WillTransfer Contract", function () {
    let WillTransfer;
    let willTransfer;
    let owner;
    let addr1;
    let addr2;
    let beneficiaries;
    let shares;
    let executor;
    const initialCreationFee = ethers.parseEther("0.01"); // Example fee: 0.01 tCORE

    beforeEach(async function () {
        // Get signers
        [owner, addr1, addr2, executor, ...beneficiaries] = await ethers.getSigners(); // Note: beneficiaries will be an array of signers

        // Deploy the WillTransfer contract
        const WillTransferFactory = await ethers.getContractFactory("WillTransfer");
        willTransfer = await WillTransferFactory.deploy(initialCreationFee);
        await willTransfer.waitForDeployment();
    });

    describe("Deployment and Constructor", function () {
        it("Should set the right owner", async function () {
            expect(await willTransfer.owner()).to.equal(owner.address);
        });

        it("Should set the initial creation fee correctly", async function () {
            expect(await willTransfer.creationFee()).to.equal(initialCreationFee);
        });

        it("Should initialize nextWillId to 1", async function () {
            expect(await willTransfer.nextWillId()).to.equal(1);
        });
    });

    describe("createWill Function", function () {
        let validBeneficiaries;
        let validShares;
        let validExecutor;
        let willDescription;

        beforeEach(async function () {
            // Setup default valid parameters for createWill tests
            // Ensure we have enough distinct signers for beneficiaries
            const signers = await ethers.getSigners();
            validBeneficiaries = [signers[2].address, signers[3].address]; // Using addr2 and another signer
            validShares = [60, 40];
            validExecutor = signers[4].address; // Using another signer as executor
            willDescription = "Test Will for addr1";
        });

        it("Should create a will successfully with correct parameters and fee", async function () {
            const willId = 1;
            const tx = await willTransfer.connect(addr1).createWill(
                willDescription,
                validBeneficiaries,
                validShares,
                validExecutor,
                { value: initialCreationFee }
            );

            await expect(tx)
                .to.emit(willTransfer, "WillCreated")
                .withArgs(willId, addr1.address, validExecutor, (await ethers.provider.getBlock(tx.blockNumber)).timestamp);

            const returnedWill = await willTransfer.getWillDetails(willId);
            expect(returnedWill.testator).to.equal(addr1.address);
            expect(returnedWill.description).to.equal(willDescription);
            expect(returnedWill.executor).to.equal(validExecutor);
            expect(returnedWill.isActive).to.be.true;
            expect(returnedWill.isExecuted).to.be.false;
            expect(returnedWill.isExecutionConfirmed).to.be.false;
            expect(returnedWill.totalBalance).to.equal(0);
            expect(await willTransfer.nextWillId()).to.equal(willId + 1);

            const beneficiariesFromContract = await willTransfer.getBeneficiaries(willId);
            expect(beneficiariesFromContract.length).to.equal(validBeneficiaries.length);
            for (let i = 0; i < validBeneficiaries.length; i++) {
                expect(beneficiariesFromContract[i].beneficiaryAddress).to.equal(validBeneficiaries[i]);
                expect(beneficiariesFromContract[i].sharePercentage).to.equal(validShares[i]);
            }
        });

        it("Should refund excess fee when creating a will", async function () {
            const excessAmount = ethers.parseEther("0.005");
            const totalSent = initialCreationFee + excessAmount;
            
            const initialBalanceAddr1 = await ethers.provider.getBalance(addr1.address);

            const tx = await willTransfer.connect(addr1).createWill(
                willDescription,
                validBeneficiaries,
                validShares,
                validExecutor,
                { value: totalSent }
            );
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            const finalBalanceAddr1 = await ethers.provider.getBalance(addr1.address);
            
            // Expected balance = initialBalance - initialCreationFee - gasUsed
            // So, initialBalance - finalBalance = initialCreationFee + gasUsed
            expect(initialBalanceAddr1 - finalBalanceAddr1).to.equal(initialCreationFee + gasUsed);
        });

        it("Should revert if creation fee is insufficient", async function () {
            await expect(willTransfer.connect(addr1).createWill(
                willDescription,
                validBeneficiaries,
                validShares,
                validExecutor,
                { value: ethers.parseEther("0.001") } // Less than initialCreationFee
            )).to.be.revertedWith("WillTransfer: Insufficient fee to create will");
        });

        it("Should revert if no beneficiaries are provided", async function () {
            await expect(willTransfer.connect(addr1).createWill(
                willDescription,
                [], // No beneficiaries
                [],
                validExecutor,
                { value: initialCreationFee }
            )).to.be.revertedWith("WillTransfer: At least one beneficiary required");
        });

        it("Should revert if beneficiary and share arrays have different lengths", async function () {
            await expect(willTransfer.connect(addr1).createWill(
                willDescription,
                validBeneficiaries, // Length 2
                [100], // Length 1
                validExecutor,
                { value: initialCreationFee }
            )).to.be.revertedWith("WillTransfer: Beneficiary and share arrays must have the same length");
        });

        it("Should revert if share percentages do not sum to 100", async function () {
            await expect(willTransfer.connect(addr1).createWill(
                willDescription,
                validBeneficiaries,
                [50, 40], // Sums to 90
                validExecutor,
                { value: initialCreationFee }
            )).to.be.revertedWith("WillTransfer: Total share percentages must sum to 100");
        });

        it("Should revert if a share percentage is zero", async function () {
            await expect(willTransfer.connect(addr1).createWill(
                willDescription,
                validBeneficiaries,
                [0, 100],
                validExecutor,
                { value: initialCreationFee }
            )).to.be.revertedWith("WillTransfer: Share percentage must be greater than 0");
        });

        it("Should revert if a beneficiary address is the zero address", async function () {
            await expect(willTransfer.connect(addr1).createWill(
                willDescription,
                [ethers.ZeroAddress, validBeneficiaries[1]],
                validShares,
                validExecutor,
                { value: initialCreationFee }
            )).to.be.revertedWith("WillTransfer: Beneficiary address cannot be zero");
        });

        it("Should revert if testator tries to be a beneficiary", async function () {
            await expect(willTransfer.connect(addr1).createWill(
                willDescription,
                [addr1.address, validBeneficiaries[1]],
                validShares,
                validExecutor,
                { value: initialCreationFee }
            )).to.be.revertedWith("WillTransfer: Testator cannot be a beneficiary");
        });

        it("Should revert if there are duplicate beneficiary addresses", async function () {
            await expect(willTransfer.connect(addr1).createWill(
                willDescription,
                [validBeneficiaries[0], validBeneficiaries[0]], // Duplicate
                validShares,
                validExecutor,
                { value: initialCreationFee }
            )).to.be.revertedWith("WillTransfer: Duplicate beneficiary addresses not allowed");
        });
    });

    describe("depositToWill Function", function () {
        const willId = 1;
        const depositAmount = ethers.parseEther("1.0"); // 1 tCORE

        beforeEach(async function() {
            // Create a default will by addr1 for these tests
            const signers = await ethers.getSigners();
            const beneficiaries = [signers[2].address, signers[3].address];
            const shares = [60, 40];
            const executor = signers[4].address;
            await willTransfer.connect(addr1).createWill(
                "Default Will for Deposit Tests",
                beneficiaries,
                shares,
                executor,
                { value: initialCreationFee }
            );
        });

        it("Should allow successful deposit to an active will", async function () {
            const initialWillBalance = (await willTransfer.getWillDetails(willId)).totalBalance;
            
            const tx = await willTransfer.connect(addr2).depositToWill(willId, { value: depositAmount });
            
            await expect(tx)
                .to.emit(willTransfer, "FundsDeposited")
                .withArgs(willId, addr2.address, depositAmount);

            const finalWillBalance = (await willTransfer.getWillDetails(willId)).totalBalance;
            expect(finalWillBalance).to.equal(initialWillBalance + depositAmount);
        });

        it("Should revert if deposit amount is zero", async function () {
            await expect(willTransfer.connect(addr2).depositToWill(willId, { value: 0 }))
                .to.be.revertedWith("WillTransfer: Deposit amount must be greater than zero");
        });

        it("Should revert when depositing to a non-existent will", async function () {
            const nonExistentWillId = 99;
            await expect(willTransfer.connect(addr2).depositToWill(nonExistentWillId, { value: depositAmount }))
                .to.be.revertedWith("WillTransfer: Will does not exist");
        });

        it("Should revert when depositing to an inactive will", async function () {
            // Deactivate the will first (by testator: addr1)
            await willTransfer.connect(addr1).deactivateWill(willId);
            
            await expect(willTransfer.connect(addr2).depositToWill(willId, { value: depositAmount }))
                .to.be.revertedWith("WillTransfer: Will is not active");
        });

        it("Should revert when depositing to an executed will", async function () {
            // To test this, we need to execute the will.
            // 1. Deposit some funds (otherwise executeWill might revert if balance is 0)
            await willTransfer.connect(addr2).depositToWill(willId, { value: depositAmount });
            
            // 2. Confirm execution condition (by executor)
            const signers = await ethers.getSigners();
            const executorSigner = signers[4]; // executor was signers[4]
            await willTransfer.connect(executorSigner).confirmExecutionCondition(willId);

            // 3. Execute the will (can be called by anyone after confirmation)
            await willTransfer.connect(addr2).executeWill(willId);

            // 4. Attempt to deposit again
            await expect(willTransfer.connect(addr2).depositToWill(willId, { value: depositAmount }))
                .to.be.revertedWith("WillTransfer: Will has already been executed"); // Or Will is not active, as executeWill also deactivates
        });
    });

    describe("setExecutor Function", function () {
        const willId = 1;
        let originalExecutorSigner;
        let newExecutorSigner;

        beforeEach(async function() {
            const signers = await ethers.getSigners();
            originalExecutorSigner = signers[4];
            newExecutorSigner = signers[5]; // A different address for the new executor

            // Create a default will by addr1 for these tests
            const beneficiaries = [signers[2].address, signers[3].address];
            const shares = [60, 40];
            await willTransfer.connect(addr1).createWill(
                "Default Will for SetExecutor Tests",
                beneficiaries,
                shares,
                originalExecutorSigner.address,
                { value: initialCreationFee }
            );
        });

        it("Should allow testator to set a new executor successfully", async function () {
            const tx = await willTransfer.connect(addr1).setExecutor(willId, newExecutorSigner.address);
            
            await expect(tx)
                .to.emit(willTransfer, "ExecutorChanged")
                .withArgs(willId, newExecutorSigner.address);

            const will = await willTransfer.getWillDetails(willId);
            expect(will.executor).to.equal(newExecutorSigner.address);
        });

        it("Should revert if a non-testator tries to set the executor", async function () {
            await expect(willTransfer.connect(addr2).setExecutor(willId, newExecutorSigner.address))
                .to.be.revertedWith("WillTransfer: Caller is not the testator of this will");
        });

        it("Should revert if the new executor is the zero address", async function () {
            await expect(willTransfer.connect(addr1).setExecutor(willId, ethers.ZeroAddress))
                .to.be.revertedWith("WillTransfer: New executor cannot be the zero address");
        });

        it("Should revert when setting executor for a non-existent will", async function () {
            const nonExistentWillId = 99;
            await expect(willTransfer.connect(addr1).setExecutor(nonExistentWillId, newExecutorSigner.address))
                .to.be.revertedWith("WillTransfer: Will does not exist");
        });

        it("Should revert when setting executor for an already executed will", async function () {
            // 1. Deposit funds
            await willTransfer.connect(addr2).depositToWill(willId, { value: ethers.parseEther("1.0") });
            // 2. Confirm execution by original executor
            await willTransfer.connect(originalExecutorSigner).confirmExecutionCondition(willId);
            // 3. Execute will
            await willTransfer.connect(addr2).executeWill(willId);

            // 4. Attempt to set executor
            await expect(willTransfer.connect(addr1).setExecutor(willId, newExecutorSigner.address))
                .to.be.revertedWith("WillTransfer: Will has already been executed");
        });
    });

    describe("confirmExecutionCondition Function", function () {
        const willIdWithExecutor = 1;
        const willIdWithoutExecutor = 2;
        let designatedExecutorSigner;
        let testatorSigner; // This will be addr1 for willIdWithExecutor, and addr2 for willIdWithoutExecutor
        let otherSigner;

        beforeEach(async function() {
            const signers = await ethers.getSigners();
            testatorSigner = addr1; // Testator for the first will
            designatedExecutorSigner = signers[4];
            otherSigner = signers[5];

            // Will 1: Created by addr1 (testatorSigner) with designatedExecutorSigner
            await willTransfer.connect(testatorSigner).createWill(
                "Will with Executor",
                [signers[2].address], [100],
                designatedExecutorSigner.address,
                { value: initialCreationFee }
            );

            // Will 2: Created by addr2 (our second testator) with no executor (address(0))
            // We need to use a different signer for this testator to avoid willId collision if addr1 creates two wills
            const testatorForWill2 = addr2;
            await willTransfer.connect(testatorForWill2).createWill(
                "Will without Executor",
                [signers[3].address], [100],
                ethers.ZeroAddress, // No executor
                { value: initialCreationFee }
            );
        });

        it("Should allow designated executor to confirm execution condition", async function () {
            const tx = await willTransfer.connect(designatedExecutorSigner).confirmExecutionCondition(willIdWithExecutor);
            await expect(tx)
                .to.emit(willTransfer, "ExecutionConditionConfirmed")
                .withArgs(willIdWithExecutor, designatedExecutorSigner.address, (await ethers.provider.getBlock(tx.blockNumber)).timestamp);
            
            const will = await willTransfer.getWillDetails(willIdWithExecutor);
            expect(will.isExecutionConfirmed).to.be.true;
        });

        it("Should allow testator to confirm if executor is address(0)", async function () {
            const testatorForWill2 = addr2; // The one who created willIdWithoutExecutor
            const tx = await willTransfer.connect(testatorForWill2).confirmExecutionCondition(willIdWithoutExecutor);
            await expect(tx)
                .to.emit(willTransfer, "ExecutionConditionConfirmed")
                .withArgs(willIdWithoutExecutor, testatorForWill2.address, (await ethers.provider.getBlock(tx.blockNumber)).timestamp);

            const will = await willTransfer.wills(willIdWithoutExecutor);
            expect(will.isExecutionConfirmed).to.be.true;
        });

        it("Should revert if an unauthorized address tries to confirm (will with executor)", async function () {
            await expect(willTransfer.connect(otherSigner).confirmExecutionCondition(willIdWithExecutor))
                .to.be.revertedWith("WillTransfer: Caller not authorized to confirm execution");
        });

        it("Should revert if an unauthorized address tries to confirm (will without executor, not testator)", async function () {
            await expect(willTransfer.connect(otherSigner).confirmExecutionCondition(willIdWithoutExecutor))
                .to.be.revertedWith("WillTransfer: Caller not authorized to confirm execution");
        });

        it("Should revert if testator tries to confirm when a specific executor is set", async function () {
            await expect(willTransfer.connect(testatorSigner).confirmExecutionCondition(willIdWithExecutor))
                .to.be.revertedWith("WillTransfer: Caller not authorized to confirm execution");
        });

        it("Should revert if condition is already confirmed", async function () {
            await willTransfer.connect(designatedExecutorSigner).confirmExecutionCondition(willIdWithExecutor);
            await expect(willTransfer.connect(designatedExecutorSigner).confirmExecutionCondition(willIdWithExecutor))
                .to.be.revertedWith("WillTransfer: Execution condition already confirmed");
        });

        it("Should revert if will is not active", async function () {
            await willTransfer.connect(testatorSigner).deactivateWill(willIdWithExecutor);
            await expect(willTransfer.connect(designatedExecutorSigner).confirmExecutionCondition(willIdWithExecutor))
                .to.be.revertedWith("WillTransfer: Will is not active");
        });

        it("Should revert if will is already executed", async function () {
            // 1. Deposit
            await willTransfer.connect(otherSigner).depositToWill(willIdWithExecutor, { value: ethers.parseEther("1") });
            // 2. Confirm
            await willTransfer.connect(designatedExecutorSigner).confirmExecutionCondition(willIdWithExecutor);
            // 3. Execute
            await willTransfer.connect(otherSigner).executeWill(willIdWithExecutor);

            await expect(willTransfer.connect(designatedExecutorSigner).confirmExecutionCondition(willIdWithExecutor))
                .to.be.revertedWith("WillTransfer: Will has already been executed");
        });

        it("Should revert for a non-existent will", async function () {
            const nonExistentWillId = 99;
            await expect(willTransfer.connect(designatedExecutorSigner).confirmExecutionCondition(nonExistentWillId))
                .to.be.revertedWith("WillTransfer: Will does not exist");
        });
    });

    describe("executeWill Function", function () {
        const willId = 1;
        let testatorSigner, executorSigner, beneficiary1Signer, beneficiary2Signer, otherSigner;
        const depositAmount = ethers.parseEther("10"); // 10 tCORE
        const shares = [60, 40]; // 60% for beneficiary1, 40% for beneficiary2

        beforeEach(async function() {
            const signers = await ethers.getSigners();
            testatorSigner = addr1; // addr1 is usually signers[1]
            beneficiary1Signer = signers[2]; 
            beneficiary2Signer = signers[3];
            executorSigner = signers[4];
            otherSigner = signers[5];

            // Create a will
            await willTransfer.connect(testatorSigner).createWill(
                "Will for Execution Tests",
                [beneficiary1Signer.address, beneficiary2Signer.address],
                shares,
                executorSigner.address,
                { value: initialCreationFee }
            );

            // Deposit funds into the will (by otherSigner for variety)
            await willTransfer.connect(otherSigner).depositToWill(willId, { value: depositAmount });
            
            // Confirm execution condition by the executor
            await willTransfer.connect(executorSigner).confirmExecutionCondition(willId);
        });

        it("Should execute the will successfully, distribute funds, and emit events", async function () {
            const initialBalanceBeneficiary1 = await ethers.provider.getBalance(beneficiary1Signer.address);
            const initialBalanceBeneficiary2 = await ethers.provider.getBalance(beneficiary2Signer.address);
            const willDetailsBefore = await willTransfer.getWillDetails(willId);
            const balanceToDistribute = willDetailsBefore.totalBalance;

            const tx = await willTransfer.connect(otherSigner).executeWill(willId); // Can be called by anyone post-confirmation

            // Check WillExecuted event
            await expect(tx)
                .to.emit(willTransfer, "WillExecuted")
                .withArgs(willId, balanceToDistribute, (await ethers.provider.getBlock(tx.blockNumber)).timestamp);

            // Check AssetTransferred events
            const expectedAmountB1 = (balanceToDistribute * BigInt(shares[0])) / 100n;
            const expectedAmountB2 = (balanceToDistribute * BigInt(shares[1])) / 100n;

            await expect(tx)
                .to.emit(willTransfer, "AssetTransferred")
                .withArgs(willId, beneficiary1Signer.address, expectedAmountB1);
            await expect(tx)
                .to.emit(willTransfer, "AssetTransferred")
                .withArgs(willId, beneficiary2Signer.address, expectedAmountB2);

            // Check beneficiary balances
            const finalBalanceBeneficiary1 = await ethers.provider.getBalance(beneficiary1Signer.address);
            const finalBalanceBeneficiary2 = await ethers.provider.getBalance(beneficiary2Signer.address);
            expect(finalBalanceBeneficiary1).to.equal(initialBalanceBeneficiary1 + expectedAmountB1);
            expect(finalBalanceBeneficiary2).to.equal(initialBalanceBeneficiary2 + expectedAmountB2);

            // Check will state after execution
            const willDetailsAfter = await willTransfer.getWillDetails(willId);
            expect(willDetailsAfter.isExecuted).to.be.true;
            expect(willDetailsAfter.isActive).to.be.false;
            expect(willDetailsAfter.totalBalance).to.equal(0); // Assuming all funds distributed (no dust for these shares)
        });

        it("Should revert if execution condition is not confirmed", async function () {
            // Create a new will that isn't confirmed
            const newWillId = 2;
            await willTransfer.connect(testatorSigner).createWill(
                "Unconfirmed Will", [beneficiary1Signer.address], [100], executorSigner.address, {value: initialCreationFee}
            );
            await willTransfer.connect(otherSigner).depositToWill(newWillId, { value: depositAmount });

            await expect(willTransfer.connect(otherSigner).executeWill(newWillId))
                .to.be.revertedWith("WillTransfer: Execution condition not confirmed");
        });

        it("Should revert if will has no funds to distribute", async function () {
             // Create a new will, confirm, but don't deposit
            const newWillId = 2;
            await willTransfer.connect(testatorSigner).createWill(
                "No Funds Will", [beneficiary1Signer.address], [100], executorSigner.address, {value: initialCreationFee}
            );
            await willTransfer.connect(executorSigner).confirmExecutionCondition(newWillId);

            await expect(willTransfer.connect(otherSigner).executeWill(newWillId))
                .to.be.revertedWith("WillTransfer: No funds to distribute");
        });

        it("Should revert if will is not active", async function () {
            await willTransfer.connect(testatorSigner).deactivateWill(willId); // Deactivate the prepared will
            await expect(willTransfer.connect(otherSigner).executeWill(willId))
                .to.be.revertedWith("WillTransfer: Will is not active");
        });

        it("Should revert if will is already executed", async function () {
            await willTransfer.connect(otherSigner).executeWill(willId); // Execute it once
            await expect(willTransfer.connect(otherSigner).executeWill(willId)) // Try to execute again
                .to.be.revertedWith("WillTransfer: Will has already been executed");
        });

        it("Should revert for a non-existent will", async function () {
            const nonExistentWillId = 99;
            await expect(willTransfer.connect(otherSigner).executeWill(nonExistentWillId))
                .to.be.revertedWith("WillTransfer: Will does not exist");
        });
    });

    describe("withdrawFundsByTestator Function", function () {
        const willId = 1;
        let testatorSigner, executorSigner, otherSigner, beneficiarySigner;
        const initialDeposit = ethers.parseEther("5"); // 5 tCORE

        beforeEach(async function() {
            const signers = await ethers.getSigners();
            testatorSigner = addr1;
            beneficiarySigner = signers[2];
            executorSigner = signers[4];
            otherSigner = signers[5];

            // Create a will by testatorSigner (addr1)
            await willTransfer.connect(testatorSigner).createWill(
                "Will for Withdrawal Tests",
                [beneficiarySigner.address],
                [100],
                executorSigner.address,
                { value: initialCreationFee }
            );

            // Deposit funds into the will (by otherSigner)
            await willTransfer.connect(otherSigner).depositToWill(willId, { value: initialDeposit });
        });

        it("Should allow testator to withdraw a portion of funds successfully", async function () {
            const withdrawAmount = ethers.parseEther("2");
            const initialWillBalance = (await willTransfer.getWillDetails(willId)).totalBalance;
            const initialTestatorEthBalance = await ethers.provider.getBalance(testatorSigner.address);

            const tx = await willTransfer.connect(testatorSigner).withdrawFundsByTestator(willId, withdrawAmount);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            await expect(tx)
                .to.emit(willTransfer, "FundsWithdrawnByTestator")
                .withArgs(willId, testatorSigner.address, withdrawAmount);

            const finalWillBalance = (await willTransfer.getWillDetails(willId)).totalBalance;
            expect(finalWillBalance).to.equal(initialWillBalance - withdrawAmount);

            const finalTestatorEthBalance = await ethers.provider.getBalance(testatorSigner.address);
            expect(finalTestatorEthBalance).to.equal(initialTestatorEthBalance - gasUsed + withdrawAmount);
        });

        it("Should allow testator to withdraw all funds successfully", async function () {
            const withdrawAmount = initialDeposit; // Withdraw all deposited funds
            const initialWillBalance = (await willTransfer.getWillDetails(willId)).totalBalance;
            const initialTestatorEthBalance = await ethers.provider.getBalance(testatorSigner.address);

            const tx = await willTransfer.connect(testatorSigner).withdrawFundsByTestator(willId, withdrawAmount);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            await expect(tx)
                .to.emit(willTransfer, "FundsWithdrawnByTestator")
                .withArgs(willId, testatorSigner.address, withdrawAmount);

            const finalWillBalance = (await willTransfer.getWillDetails(willId)).totalBalance;
            expect(finalWillBalance).to.equal(0);
            expect(initialWillBalance).to.equal(withdrawAmount);

            const finalTestatorEthBalance = await ethers.provider.getBalance(testatorSigner.address);
            expect(finalTestatorEthBalance).to.equal(initialTestatorEthBalance - gasUsed + withdrawAmount);
        });

        it("Should revert if withdrawal amount is zero", async function () {
            await expect(willTransfer.connect(testatorSigner).withdrawFundsByTestator(willId, 0))
                .to.be.revertedWith("WillTransfer: Withdrawal amount must be greater than zero");
        });

        it("Should revert if withdrawal amount exceeds will balance", async function () {
            const excessiveAmount = initialDeposit + ethers.parseEther("1");
            await expect(willTransfer.connect(testatorSigner).withdrawFundsByTestator(willId, excessiveAmount))
                .to.be.revertedWith("WillTransfer: Insufficient balance in will for this withdrawal amount");
        });

        it("Should revert if caller is not the testator", async function () {
            await expect(willTransfer.connect(otherSigner).withdrawFundsByTestator(willId, ethers.parseEther("1")))
                .to.be.revertedWith("WillTransfer: Caller is not the testator of this will");
        });

        it("Should revert if will is not active", async function () {
            await willTransfer.connect(testatorSigner).deactivateWill(willId);
            await expect(willTransfer.connect(testatorSigner).withdrawFundsByTestator(willId, ethers.parseEther("1")))
                .to.be.revertedWith("WillTransfer: Will is not active");
        });

        it("Should revert if will is already executed", async function () {
            await willTransfer.connect(executorSigner).confirmExecutionCondition(willId);
            await willTransfer.connect(otherSigner).executeWill(willId);
            await expect(willTransfer.connect(testatorSigner).withdrawFundsByTestator(willId, ethers.parseEther("1")))
                .to.be.revertedWith("WillTransfer: Will has already been executed");
        });

        it("Should revert for a non-existent will", async function () {
            const nonExistentWillId = 99;
            await expect(willTransfer.connect(testatorSigner).withdrawFundsByTestator(nonExistentWillId, ethers.parseEther("1")))
                .to.be.revertedWith("WillTransfer: Will does not exist");
        });
    });

    describe("deactivateWill Function", function () {
        const willId = 1;
        let testatorSigner, executorSigner, otherSigner, beneficiarySigner;

        beforeEach(async function() {
            const signers = await ethers.getSigners();
            testatorSigner = addr1;
            beneficiarySigner = signers[2];
            executorSigner = signers[4];
            otherSigner = signers[5];

            // Create a will by testatorSigner (addr1)
            await willTransfer.connect(testatorSigner).createWill(
                "Will for Deactivation Tests",
                [beneficiarySigner.address],
                [100],
                executorSigner.address,
                { value: initialCreationFee }
            );
        });

        it("Should allow testator to deactivate an active will successfully", async function () {
            const tx = await willTransfer.connect(testatorSigner).deactivateWill(willId);
            
            await expect(tx)
                .to.emit(willTransfer, "WillDeactivated")
                .withArgs(willId, testatorSigner.address);

            const will = await willTransfer.getWillDetails(willId);
            expect(will.isActive).to.be.false;
        });

        it("Should revert if a non-testator tries to deactivate the will", async function () {
            await expect(willTransfer.connect(otherSigner).deactivateWill(willId))
                .to.be.revertedWith("WillTransfer: Caller is not the testator of this will");
        });

        it("Should revert if trying to deactivate an already inactive will", async function () {
            await willTransfer.connect(testatorSigner).deactivateWill(willId); // Deactivate once
            await expect(willTransfer.connect(testatorSigner).deactivateWill(willId)) // Try again
                .to.be.revertedWith("WillTransfer: Will is not active"); // Caught by willIsActive modifier
        });

        it("Should revert if will is already executed", async function () {
            // Deposit, confirm, execute
            await willTransfer.connect(otherSigner).depositToWill(willId, { value: ethers.parseEther("1") });
            await willTransfer.connect(executorSigner).confirmExecutionCondition(willId);
            await willTransfer.connect(otherSigner).executeWill(willId);

            await expect(willTransfer.connect(testatorSigner).deactivateWill(willId))
                .to.be.revertedWith("WillTransfer: Will has already been executed"); // or Will is not active
        });

        it("Should revert for a non-existent will", async function () {
            const nonExistentWillId = 99;
            await expect(willTransfer.connect(testatorSigner).deactivateWill(nonExistentWillId))
                .to.be.revertedWith("WillTransfer: Will does not exist");
        });
    });

});
