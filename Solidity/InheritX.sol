// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SmartWill {
    address public owner;
    address public oracle; // Trusted entity to confirm death
    bool public isDeceased;

    struct Beneficiary {
        address wallet;
        uint256 percentage;
    }

    Beneficiary[] public beneficiaries;
    mapping(address => bool) public hasClaimed;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner.");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == oracle, "Not the oracle.");
        _;
    }

    event WillCreated(address indexed owner);
    event BeneficiaryAdded(address indexed wallet, uint256 percentage);
    event OwnerDeceased(address indexed oracle);
    event AssetsDistributed();

    constructor(address _oracle) {
        owner = msg.sender;
        oracle = _oracle;
        emit WillCreated(owner);
    }

    // Add beneficiaries (must total 100%)
    function addBeneficiary(address _wallet, uint256 _percentage) external onlyOwner {
        require(_wallet != address(0), "Invalid address");
        require(_percentage > 0, "Percentage must be > 0");
        require(getTotalPercentage() + _percentage <= 100, "Total > 100%");

        beneficiaries.push(Beneficiary(_wallet, _percentage));
        emit BeneficiaryAdded(_wallet, _percentage);
    }

    // Returns total percentage assigned
    function getTotalPercentage() public view returns (uint256 total) {
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            total += beneficiaries[i].percentage;
        }
    }

    // Oracle calls this to confirm death
    function markAsDeceased() external onlyOracle {
        require(!isDeceased, "Already marked as deceased.");
        isDeceased = true;
        emit OwnerDeceased(msg.sender);
        distributeAssets();
    }

    // Distribute ETH to beneficiaries
    function distributeAssets() internal {
        require(isDeceased, "Owner is still alive.");
        uint256 balance = address(this).balance;

        for (uint256 i = 0; i < beneficiaries.length; i++) {
            Beneficiary memory b = beneficiaries[i];
            uint256 amount = (balance * b.percentage) / 100;
            if (!hasClaimed[b.wallet]) {
                hasClaimed[b.wallet] = true;
                payable(b.wallet).transfer(amount);
            }
        }

        emit AssetsDistributed();
    }

    // Fallback to accept ETH
    receive() external payable {}

    fallback() external payable {}
}
