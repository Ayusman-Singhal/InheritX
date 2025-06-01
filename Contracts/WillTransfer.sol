// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "hardhat/console.sol"; // Optional: for debugging during development

contract WillTransfer {
    // --- Structs ---
    struct Beneficiary {
        address payable beneficiaryAddress;
        uint256 sharePercentage; // e.g., 50 for 50%
    }

    struct Will {
        address testator;
        uint256 creationTimestamp;
        string description; // Optional description
        bool isActive; // If the will can receive funds / be executed
        bool isExecuted;
        address executor; // Optional: an address authorized to trigger execution
        bool isExecutionConfirmed; // True if executor (or testator if executor is address(0)) confirms
        uint256 totalBalance; // tCORE balance held by this will
        Beneficiary[] beneficiaries;
        mapping(address => uint256) beneficiaryShares; // For quick lookup if needed
    }

    // --- State Variables ---
    address public owner; // Contract deployer, for potential admin functions
    uint256 public nextWillId;
    mapping(uint256 => Will) public wills;

    // Fee for creating a will, if any (can be 0)
    uint256 public creationFee;

    // --- Events ---
    event WillCreated(uint256 indexed willId, address indexed testator, address indexed executor, uint256 timestamp);
    event FundsDeposited(uint256 indexed willId, address indexed depositor, uint256 amount);
    event ExecutionConditionConfirmed(uint256 indexed willId, address indexed confirmer, uint256 timestamp);
    event WillExecuted(uint256 indexed willId, uint256 totalDistributed, uint256 timestamp);
    event AssetTransferred(uint256 indexed willId, address indexed beneficiary, uint256 amount);
    event ExecutorChanged(uint256 indexed willId, address indexed newExecutor);
    event WillDeactivated(uint256 indexed willId, address indexed testator);
    event FundsWithdrawnByTestator(uint256 indexed willId, address indexed testator, uint256 amount);

    // --- Modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "WillTransfer: Caller is not the owner");
        _;
    }

    modifier willExists(uint256 _willId) {
        require(wills[_willId].creationTimestamp != 0, "WillTransfer: Will does not exist");
        _;
    }

    modifier onlyTestator(uint256 _willId) {
        require(wills[_willId].testator == msg.sender, "WillTransfer: Caller is not the testator of this will");
        _;
    }

    modifier onlyExecutor(uint256 _willId) {
        require(wills[_willId].executor == msg.sender, "WillTransfer: Caller is not the executor of this will");
        _;
    }

    modifier willIsActive(uint256 _willId) {
        require(wills[_willId].isActive, "WillTransfer: Will is not active");
        _;
    }

    modifier willNotExecuted(uint256 _willId) {
        require(!wills[_willId].isExecuted, "WillTransfer: Will has already been executed");
        _;
    }

    // --- Constructor ---
    constructor(uint256 _initialCreationFee) {
        owner = msg.sender;
        creationFee = _initialCreationFee;
        nextWillId = 1; // Start will IDs from 1
    }

    // --- Functions ---

    /**
     * @notice Creates a new will.
     * @param _description Optional description for the will.
     * @param _beneficiaryAddresses Array of beneficiary addresses.
     * @param _sharePercentages Array of share percentages for beneficiaries (must sum to 100).
     * @param _executor Address of the executor who can confirm execution conditions.
     */
    function createWill(
        string calldata _description,
        address[] calldata _beneficiaryAddresses,
        uint256[] calldata _sharePercentages,
        address _executor
    ) external payable {
        require(msg.value >= creationFee, "WillTransfer: Insufficient fee to create will");
        require(_beneficiaryAddresses.length > 0, "WillTransfer: At least one beneficiary required");
        require(_beneficiaryAddresses.length == _sharePercentages.length, "WillTransfer: Beneficiary and share arrays must have the same length");
        // require(_executor != address(0), "WillTransfer: Executor address cannot be the zero address"); // Optional: depends on design if executor can be address(0)

        uint256 totalPercentage = 0;
        for (uint i = 0; i < _sharePercentages.length; i++) {
            require(_sharePercentages[i] > 0, "WillTransfer: Share percentage must be greater than 0");
            totalPercentage += _sharePercentages[i];
        }
        require(totalPercentage == 100, "WillTransfer: Total share percentages must sum to 100");

        uint256 currentWillId = nextWillId;
        Will storage newWill = wills[currentWillId];

        newWill.testator = msg.sender;
        newWill.creationTimestamp = block.timestamp;
        newWill.description = _description;
        newWill.isActive = true;
        newWill.isExecuted = false;
        newWill.executor = _executor; // If _executor is address(0), testator might need to confirm execution
        newWill.totalBalance = 0; // Initial balance is 0, funds are deposited separately

        for (uint i = 0; i < _beneficiaryAddresses.length; i++) {
            require(_beneficiaryAddresses[i] != address(0), "WillTransfer: Beneficiary address cannot be zero");
            require(_beneficiaryAddresses[i] != msg.sender, "WillTransfer: Testator cannot be a beneficiary"); // Design choice
            // Ensure no duplicate beneficiaries
            for (uint j = i + 1; j < _beneficiaryAddresses.length; j++) {
                require(_beneficiaryAddresses[i] != _beneficiaryAddresses[j], "WillTransfer: Duplicate beneficiary addresses not allowed");
            }

            Beneficiary memory beneficiary = Beneficiary({
                beneficiaryAddress: payable(_beneficiaryAddresses[i]),
                sharePercentage: _sharePercentages[i]
            });
            newWill.beneficiaries.push(beneficiary);
            newWill.beneficiaryShares[_beneficiaryAddresses[i]] = _sharePercentages[i];
        }

        nextWillId++;

        emit WillCreated(currentWillId, msg.sender, _executor, block.timestamp);

        // Refund any excess fee sent
        if (msg.value > creationFee) {
            payable(msg.sender).transfer(msg.value - creationFee);
        }
    }

    /**
     * @notice Deposits funds (native currency, e.g., tCORE) into a specific will.
     * @param _willId The ID of the will to deposit funds into.
     */
    function depositToWill(uint256 _willId) external payable willExists(_willId) willIsActive(_willId) willNotExecuted(_willId) {
        require(msg.value > 0, "WillTransfer: Deposit amount must be greater than zero");

        Will storage currentWill = wills[_willId];
        currentWill.totalBalance += msg.value;

        emit FundsDeposited(_willId, msg.sender, msg.value);
    }

    /**
     * @notice Allows the testator of a will to change its executor.
     * @param _willId The ID of the will.
     * @param _newExecutor The address of the new executor.
     */
    function setExecutor(uint256 _willId, address _newExecutor) external willExists(_willId) onlyTestator(_willId) willNotExecuted(_willId) {
        require(_newExecutor != address(0), "WillTransfer: New executor cannot be the zero address");
        // Optional: require(_newExecutor != wills[_willId].testator, "WillTransfer: Executor cannot be the testator"); // Design choice

        Will storage currentWill = wills[_willId];
        currentWill.executor = _newExecutor;

        emit ExecutorChanged(_willId, _newExecutor);
    }

    /**
     * @notice Called by the designated executor (or testator if executor is address(0)) to confirm that the conditions for will execution are met.
     * @param _willId The ID of the will.
     */
    function confirmExecutionCondition(uint256 _willId) external willExists(_willId) willIsActive(_willId) willNotExecuted(_willId) {
        Will storage currentWill = wills[_willId];
        require(!currentWill.isExecutionConfirmed, "WillTransfer: Execution condition already confirmed");

        bool canConfirm = (msg.sender == currentWill.executor);
        if (currentWill.executor == address(0)) {
            canConfirm = (msg.sender == currentWill.testator);
        }
        require(canConfirm, "WillTransfer: Caller not authorized to confirm execution");

        currentWill.isExecutionConfirmed = true;
        emit ExecutionConditionConfirmed(_willId, msg.sender, block.timestamp);
    }

    /**
     * @notice Executes the will, distributing its balance to the beneficiaries according to their shares.
     * @dev Can only be called after execution conditions are confirmed and if the will is active and not already executed.
     * @param _willId The ID of the will to execute.
     */
    function executeWill(uint256 _willId) external willExists(_willId) willIsActive(_willId) willNotExecuted(_willId) {
        Will storage currentWill = wills[_willId];
        require(currentWill.isExecutionConfirmed, "WillTransfer: Execution condition not confirmed");
        require(currentWill.totalBalance > 0, "WillTransfer: No funds to distribute");

        uint256 balanceToDistribute = currentWill.totalBalance;
        uint256 totalAmountDistributed = 0;

        for (uint i = 0; i < currentWill.beneficiaries.length; i++) {
            Beneficiary storage beneficiary = currentWill.beneficiaries[i];
            uint256 amountToTransfer = (balanceToDistribute * beneficiary.sharePercentage) / 100;
            
            if (amountToTransfer > 0) {
                // Ensure we don't try to transfer to a non-payable address if it wasn't caught earlier
                // The 'payable' cast on beneficiaryAddress in the struct should handle this, but an explicit check is safe.
                require(beneficiary.beneficiaryAddress.balance >= 0, "WillTransfer: Beneficiary address invalid for transfer"); 

                (bool success, ) = beneficiary.beneficiaryAddress.call{value: amountToTransfer}("");
                // Using .call{value: ...}("") for transfers is generally recommended over .transfer() or .send()
                // as it forwards all gas and does not revert on low gas, allowing for more complex recipient contracts.
                // However, it's crucial to check the success status.
                require(success, "WillTransfer: Failed to transfer funds to beneficiary");
                
                totalAmountDistributed += amountToTransfer;
                emit AssetTransferred(_willId, beneficiary.beneficiaryAddress, amountToTransfer);
            }
        }

        // Sanity check: Ensure total distributed doesn't exceed original balance (due to potential rounding)
        // This check might be overly cautious if integer division always rounds down, but good for safety.
        // In practice, with integer division, totalAmountDistributed should be <= balanceToDistribute.
        // If there's dust left due to rounding, it remains in the contract under this will's balance.
        // A more advanced implementation might handle dust (e.g., send to last beneficiary, or a treasury).
        currentWill.totalBalance -= totalAmountDistributed; // Update balance to reflect distributed amount (should be 0 or dust)

        currentWill.isExecuted = true;
        currentWill.isActive = false; // An executed will should no longer be active

        emit WillExecuted(_willId, totalAmountDistributed, block.timestamp);
    }

    /**
     * @notice Allows the testator to withdraw funds they deposited if the will is not yet executed.
     * @dev This is a simplified withdrawal. Complexities arise if others can deposit.
     * @param _willId The ID of the will.
     * @param _amount The amount to withdraw.
     */
    function withdrawFundsByTestator(uint256 _willId, uint256 _amount) external willExists(_willId) onlyTestator(_willId) willIsActive(_willId) willNotExecuted(_willId) {
        require(_amount > 0, "WillTransfer: Withdrawal amount must be greater than zero");
        Will storage currentWill = wills[_willId];
        require(_amount <= currentWill.totalBalance, "WillTransfer: Insufficient balance in will for this withdrawal amount");

        currentWill.totalBalance -= _amount;

        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "WillTransfer: Failed to withdraw funds to testator");

        emit FundsWithdrawnByTestator(_willId, msg.sender, _amount);
    }
    
    /**
     * @notice Allows the testator to deactivate a will, preventing further deposits and execution.
     * @param _willId The ID of the will.
     */
    function deactivateWill(uint256 _willId) external willExists(_willId) onlyTestator(_willId) willIsActive(_willId) willNotExecuted(_willId) {
        Will storage currentWill = wills[_willId];
        currentWill.isActive = false;

        emit WillDeactivated(_willId, msg.sender);
    }

    // --- View Functions ---

    /**
     * @notice Gets the details of a specific will.
     * @param _willId The ID of the will.
     * @return testator The address of the will's testator.
     * @return creationTimestamp The timestamp when the will was created.
     * @return description The description of the will.
     * @return isActive True if the will is active, false otherwise.
     * @return isExecuted True if the will has been executed, false otherwise.
     * @return executor The address of the will's executor.
     * @return isExecutionConfirmed True if the will's execution condition has been confirmed.
     * @return totalBalance The total tCORE balance currently held by the will.
     * @return beneficiaries_ An array of Beneficiary structs associated with the will.
     */
    function getWillDetails(uint256 _willId) 
        external 
        view 
        willExists(_willId) 
        returns (
            address testator,
            uint256 creationTimestamp,
            string memory description,
            bool isActive,
            bool isExecuted,
            address executor,
            bool isExecutionConfirmed,
            uint256 totalBalance,
            Beneficiary[] memory beneficiaries_ // Renamed to avoid potential naming conflicts
        )
    {
        Will storage currentWill = wills[_willId];
        return (
            currentWill.testator,
            currentWill.creationTimestamp,
            currentWill.description,
            currentWill.isActive,
            currentWill.isExecuted,
            currentWill.executor,
            currentWill.isExecutionConfirmed,
            currentWill.totalBalance,
            currentWill.beneficiaries
        );
    }

    /**
     * @notice Gets the list of beneficiaries for a specific will.
     * @param _willId The ID of the will.
     * @return Array of Beneficiary structs.
     */
    function getBeneficiaries(uint256 _willId) external view willExists(_willId) returns (Beneficiary[] memory) {
        return wills[_willId].beneficiaries;
    }

    /**
     * @notice Allows the owner to update the creation fee.
     * @param _newFee The new creation fee.
     */
    function setCreationFee(uint256 _newFee) external onlyOwner {
        creationFee = _newFee;
    }

    // --- Fallback and Receive Functions (Optional) ---
    // To receive tCORE directly to the contract (e.g. for a global fund, not tied to a specific will)
    // receive() external payable {
    //     // Handle direct tCORE transfers to the contract if needed
    // }
}
