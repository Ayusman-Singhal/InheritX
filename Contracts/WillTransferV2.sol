// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title WillTransferV2
 * @dev A smart contract for creating and managing digital wills on the blockchain.
 * This is an improved version with better parameter ordering, events, and security features.
 */
contract WillTransferV2 is ReentrancyGuard {
    // --- Structs ---
    struct Beneficiary {
        address payable beneficiaryAddress;
        uint256 sharePercentage;
    }

    struct Will {
        address testator;
        uint256 creationTimestamp;
        string description;
        bool isActive;
        bool isExecuted;
        address executor;
        bool isExecutionConfirmed;
        uint256 totalBalance;
        Beneficiary[] beneficiaries;
        mapping(address => uint256) beneficiaryShares;
    }

    // --- State Variables ---
    address public owner;
    uint256 public nextWillId;
    mapping(uint256 => Will) public wills;
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
    event WillUpdated(uint256 indexed willId, address indexed testator, uint256 timestamp);

    // --- Errors ---
    error Unauthorized();
    error InvalidInput(string message);
    error InsufficientBalance();
    error TransferFailed();
    error WillNotActive();
    error WillAlreadyExecuted();
    error WillNotExist();

    // --- Modifiers ---
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }


    // --- Constructor ---
    constructor(uint256 _initialCreationFee) {
        owner = msg.sender;
        creationFee = _initialCreationFee;
        nextWillId = 1;
    }

    // --- External Functions ---

    /**
     * @notice Creates a new will with the provided details
     * @param _description Description of the will
     * @param _executor Address of the executor (can be address(0) for self-execution)
     * @param _beneficiaryAddresses Array of beneficiary addresses
     * @param _sharePercentages Array of share percentages for each beneficiary
     */
    function createWill(
        string calldata _description,
        address _executor,
        address[] calldata _beneficiaryAddresses,
        uint256[] calldata _sharePercentages
    ) external payable nonReentrant {
        if (msg.value < creationFee) revert InsufficientBalance();
        if (_beneficiaryAddresses.length == 0) revert InvalidInput("At least one beneficiary required");
        if (_beneficiaryAddresses.length != _sharePercentages.length) {
            revert InvalidInput("Beneficiary and share arrays must have the same length");
        }

        uint256 totalPercentage = 0;
        for (uint i = 0; i < _sharePercentages.length; i++) {
            if (_sharePercentages[i] == 0) revert InvalidInput("Share percentage must be greater than 0");
            if (_beneficiaryAddresses[i] == address(0)) revert InvalidInput("Beneficiary address cannot be zero");
            if (_beneficiaryAddresses[i] == msg.sender) {
                revert InvalidInput("Testator cannot be a beneficiary");
            }
            totalPercentage += _sharePercentages[i];
        }
        if (totalPercentage != 100) revert InvalidInput("Total share percentages must sum to 100");

        uint256 currentWillId = nextWillId++;
        Will storage newWill = wills[currentWillId];

        newWill.testator = msg.sender;
        newWill.creationTimestamp = block.timestamp;
        newWill.description = _description;
        newWill.isActive = true;
        newWill.executor = _executor;
        newWill.totalBalance = 0;

        for (uint i = 0; i < _beneficiaryAddresses.length; i++) {
            for (uint j = i + 1; j < _beneficiaryAddresses.length; j++) {
                if (_beneficiaryAddresses[i] == _beneficiaryAddresses[j]) {
                    revert InvalidInput("Duplicate beneficiary addresses not allowed");
                }
            }

            Beneficiary memory beneficiary = Beneficiary({
                beneficiaryAddress: payable(_beneficiaryAddresses[i]),
                sharePercentage: _sharePercentages[i]
            });
            newWill.beneficiaries.push(beneficiary);
            newWill.beneficiaryShares[_beneficiaryAddresses[i]] = _sharePercentages[i];
        }

        emit WillCreated(currentWillId, msg.sender, _executor, block.timestamp);

        // Refund any excess fee
        if (msg.value > creationFee) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - creationFee}("");
            if (!success) revert TransferFailed();
        }
    }

    // ... (rest of the contract functions remain similar but with the improved error handling)
    // Note: You'll need to implement the rest of the functions from the original contract
    // with the same improved patterns shown above.


    /**
     * @notice Deposits funds into a will
     * @param _willId ID of the will to deposit to
     */
    function depositToWill(uint256 _willId) external payable nonReentrant {
        if (msg.value == 0) revert InvalidInput("Deposit amount must be greater than zero");
        
        Will storage currentWill = wills[_willId];
        if (currentWill.creationTimestamp == 0) revert WillNotExist();
        if (!currentWill.isActive) revert WillNotActive();
        if (currentWill.isExecuted) revert WillAlreadyExecuted();

        currentWill.totalBalance += msg.value;
        emit FundsDeposited(_willId, msg.sender, msg.value);
    }

    // ... (other functions should be implemented similarly with the improved patterns)


    // --- View Functions ---

    /**
     * @notice Gets the details of a specific will
     * @param _willId ID of the will
     * @return testator Address of the testator
     * @return creationTimestamp When the will was created
     * @return description Description of the will
     * @return isActive If the will is active
     * @return isExecuted If the will has been executed
     * @return executor Address of the executor
     * @return isExecutionConfirmed If execution has been confirmed
     * @return totalBalance Current balance of the will
     * @return beneficiaries_ Array of beneficiaries
     */
    function getWillDetails(uint256 _willId) 
        external 
        view 
        returns (
            address testator,
            uint256 creationTimestamp,
            string memory description,
            bool isActive,
            bool isExecuted,
            address executor,
            bool isExecutionConfirmed,
            uint256 totalBalance,
            Beneficiary[] memory beneficiaries_
        )
    {
        Will storage currentWill = wills[_willId];
        if (currentWill.creationTimestamp == 0) revert WillNotExist();
        
        beneficiaries_ = new Beneficiary[](currentWill.beneficiaries.length);
        for (uint i = 0; i < currentWill.beneficiaries.length; i++) {
            beneficiaries_[i] = currentWill.beneficiaries[i];
        }
        
        return (
            currentWill.testator,
            currentWill.creationTimestamp,
            currentWill.description,
            currentWill.isActive,
            currentWill.isExecuted,
            currentWill.executor,
            currentWill.isExecutionConfirmed,
            currentWill.totalBalance,
            beneficiaries_
        );
    }

    /**
     * @notice Gets the beneficiaries of a specific will
     * @param _willId ID of the will
     * @return An array of beneficiaries
     */
    function getWillBeneficiaries(uint256 _willId) 
        external 
        view 
        returns (Beneficiary[] memory)
    {
        Will storage currentWill = wills[_willId];
        if (currentWill.creationTimestamp == 0) revert WillNotExist();
        
        return currentWill.beneficiaries;
    }

    /**
     * @notice Gets all will IDs for a given testator
     * @param _testator Address of the testator
     * @return An array of will IDs
     */
    function getWillsByTestator(address _testator) 
        public 
        view 
        returns (uint256[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 1; i < nextWillId; i++) {
            if (wills[i].testator == _testator) {
                count++;
            }
        }
        
        uint256[] memory testatorWillIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < nextWillId; i++) {
            if (wills[i].testator == _testator) {
                testatorWillIds[index] = i;
                index++;
            }
        }
        return testatorWillIds;
    }

    /**
     * @notice Gets all will IDs for a given executor
     * @param _executor Address of the executor
     * @return An array of will IDs
     */
    function getWillsByExecutor(address _executor) 
        public 
        view 
        returns (uint256[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 1; i < nextWillId; i++) {
            if (wills[i].executor == _executor) {
                count++;
            }
        }

        uint256[] memory executorWillIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < nextWillId; i++) {
            if (wills[i].executor == _executor) {
                executorWillIds[index] = i;
                index++;
            }
        }
        return executorWillIds;
    }

    // --- Owner Functions ---
    
    /**
     * @notice Updates the creation fee
     * @param _newFee New creation fee amount
     */
    function setCreationFee(uint256 _newFee) external onlyOwner {
        creationFee = _newFee;
    }

    /**
     * @notice Withdraws contract balance to owner
     */
    function withdrawFees() external onlyOwner nonReentrant {
        (bool success, ) = owner.call{value: address(this).balance}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @notice Called by the designated executor to confirm that the conditions for will execution are met
     * @param _willId The ID of the will
     */
    function confirmExecutionCondition(uint256 _willId) external nonReentrant {
        Will storage currentWill = wills[_willId];
        if (currentWill.creationTimestamp == 0) revert WillNotExist();
        if (!currentWill.isActive) revert WillNotActive();
        if (currentWill.isExecuted) revert WillAlreadyExecuted();
        if (currentWill.isExecutionConfirmed) revert InvalidInput("Execution condition already confirmed");

        bool canConfirm = (msg.sender == currentWill.executor);
        if (currentWill.executor == address(0)) {
            canConfirm = (msg.sender == currentWill.testator);
        }
        if (!canConfirm) revert Unauthorized();

        currentWill.isExecutionConfirmed = true;
        emit ExecutionConditionConfirmed(_willId, msg.sender, block.timestamp);
    }

    /**
     * @notice Executes the will, distributing its balance to the beneficiaries according to their shares
     * @param _willId The ID of the will to execute
     */
    function executeWill(uint256 _willId) external nonReentrant {
        Will storage currentWill = wills[_willId];
        if (currentWill.creationTimestamp == 0) revert WillNotExist();
        if (!currentWill.isActive) revert WillNotActive();
        if (currentWill.isExecuted) revert WillAlreadyExecuted();
        if (!currentWill.isExecutionConfirmed) revert InvalidInput("Execution condition not confirmed");
        if (currentWill.totalBalance == 0) revert InvalidInput("No funds to distribute");

        uint256 balanceToDistribute = currentWill.totalBalance;
        uint256 totalAmountDistributed = 0;

        for (uint i = 0; i < currentWill.beneficiaries.length; i++) {
            Beneficiary storage beneficiary = currentWill.beneficiaries[i];
            uint256 amountToTransfer = (balanceToDistribute * beneficiary.sharePercentage) / 100;
            
            if (amountToTransfer > 0) {
                (bool success, ) = beneficiary.beneficiaryAddress.call{value: amountToTransfer}("");
                if (!success) revert TransferFailed();
                
                totalAmountDistributed += amountToTransfer;
                emit AssetTransferred(_willId, beneficiary.beneficiaryAddress, amountToTransfer);
            }
        }

        currentWill.totalBalance -= totalAmountDistributed;
        currentWill.isExecuted = true;
        currentWill.isActive = false;

        emit WillExecuted(_willId, totalAmountDistributed, block.timestamp);
    }

    // --- Fallback ---
    receive() external payable {}
}
