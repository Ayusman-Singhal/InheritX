import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

const WillCard = ({ will, type, onSelect, onRefresh }) => {
  const { contract, account } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [newExecutor, setNewExecutor] = useState('');
  const [showExecutorForm, setShowExecutorForm] = useState(false);

  // Status badge color based on will status
  const getStatusBadgeClass = () => {
    if (will.isExecuted) return "bg-purple-600";
    if (!will.isActive) return "bg-red-600";
    if (will.isExecutionConfirmed) return "bg-yellow-600";
    return "bg-green-600";
  };

  // Status text based on will status
  const getStatusText = () => {
    if (will.isExecuted) return "Executed";
    if (!will.isActive) return "Inactive";
    if (will.isExecutionConfirmed) return "Execution Confirmed";
    return "Active";
  };

  // Handle deposit funds to will
  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!contract || !account) return;
    
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error("Please enter a valid amount to deposit");
      return;
    }
    
    setIsLoading(true);
    try {
      const amountInWei = ethers.parseEther(depositAmount);
      const tx = await contract.depositToWill(will.id, { value: amountInWei });
      
      toast.info("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      
      toast.success(`Successfully deposited ${depositAmount} tCORE to Will #${will.id}`);
      setDepositAmount('');
      setShowDepositForm(false);
      onRefresh();
    } catch (error) {
      console.error("Error depositing funds:", error);
      toast.error(error.reason || error.message || "Failed to deposit funds");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle withdraw funds by testator
  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!contract || !account) return;
    
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error("Please enter a valid amount to withdraw");
      return;
    }
    
    if (parseFloat(withdrawAmount) > parseFloat(will.totalBalance)) {
      toast.error("Cannot withdraw more than the available balance");
      return;
    }
    
    setIsLoading(true);
    try {
      const amountInWei = ethers.parseEther(withdrawAmount);
      const tx = await contract.withdrawFundsByTestator(will.id, amountInWei);
      
      toast.info("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      
      toast.success(`Successfully withdrew ${withdrawAmount} tCORE from Will #${will.id}`);
      setWithdrawAmount('');
      setShowWithdrawForm(false);
      onRefresh();
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      toast.error(error.reason || error.message || "Failed to withdraw funds");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle set executor
  const handleSetExecutor = async (e) => {
    e.preventDefault();
    if (!contract || !account) return;
    
    if (!ethers.isAddress(newExecutor)) {
      toast.error("Please enter a valid address for the executor");
      return;
    }
    
    setIsLoading(true);
    try {
      const tx = await contract.setExecutor(will.id, newExecutor);
      
      toast.info("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      
      toast.success(`Successfully set new executor for Will #${will.id}`);
      setNewExecutor('');
      setShowExecutorForm(false);
      onRefresh();
    } catch (error) {
      console.error("Error setting executor:", error);
      toast.error(error.reason || error.message || "Failed to set executor");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle confirm execution condition
  const handleConfirmExecution = async () => {
    if (!contract || !account) return;
    
    setIsLoading(true);
    try {
      const tx = await contract.confirmExecutionCondition(will.id);
      
      toast.info("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      
      toast.success(`Execution condition confirmed for Will #${will.id}`);
      onRefresh();
    } catch (error) {
      console.error("Error confirming execution:", error);
      toast.error(error.reason || error.message || "Failed to confirm execution condition");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle execute will
  const handleExecuteWill = async () => {
    if (!contract || !account) return;
    
    setIsLoading(true);
    try {
      const tx = await contract.executeWill(will.id);
      
      toast.info("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      
      toast.success(`Will #${will.id} executed successfully`);
      onRefresh();
    } catch (error) {
      console.error("Error executing will:", error);
      toast.error(error.reason || error.message || "Failed to execute will");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deactivate will
  const handleDeactivateWill = async () => {
    if (!contract || !account) return;
    
    if (!window.confirm(`Are you sure you want to deactivate Will #${will.id}? This action cannot be undone.`)) {
      return;
    }
    
    setIsLoading(true);
    try {
      const tx = await contract.deactivateWill(will.id);
      
      toast.info("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      
      toast.success(`Will #${will.id} deactivated successfully`);
      onRefresh();
    } catch (error) {
      console.error("Error deactivating will:", error);
      toast.error(error.reason || error.message || "Failed to deactivate will");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if the current user is the testator of this will
  const isTestator = account && will.testator.toLowerCase() === account.toLowerCase();
  
  // Check if the current user is the executor of this will
  const isExecutor = account && will.executor.toLowerCase() === account.toLowerCase();
  
  // Check if the will can be executed (is active, confirmed, not executed)
  const canExecute = will.isActive && will.isExecutionConfirmed && !will.isExecuted;
  
  // Check if the will can be confirmed (is active, not confirmed, not executed)
  const canConfirm = will.isActive && !will.isExecutionConfirmed && !will.isExecuted && isExecutor;
  
  // Check if the testator can withdraw funds (is active, not executed)
  const canWithdraw = will.isActive && !will.isExecuted && isTestator && parseFloat(will.totalBalance) > 0;
  
  // Check if the testator can deactivate the will (is active, not executed)
  const canDeactivate = will.isActive && !will.isExecuted && isTestator;
  
  // Check if the testator can set a new executor (is active, not executed)
  const canSetExecutor = will.isActive && !will.isExecuted && isTestator;

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 hover:border-blue-500 transition-all">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold truncate" title={will.description}>
            {will.description}
          </h3>
          <span className={`${getStatusBadgeClass()} text-white text-xs px-2 py-1 rounded-full`}>
            {getStatusText()}
          </span>
        </div>
        
        <div className="space-y-2 mb-4">
          <p className="text-sm">
            <span className="text-gray-400">Will ID:</span> {will.id}
          </p>
          <p className="text-sm">
            <span className="text-gray-400">Created:</span> {will.creationTimestamp}
          </p>
          <p className="text-sm">
            <span className="text-gray-400">Balance:</span> {will.totalBalance} tCORE
          </p>
          <p className="text-sm">
            <span className="text-gray-400">Beneficiaries:</span> {will.beneficiaries.length}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={onSelect}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
          >
            View Details
          </button>
          
          {/* Deposit button - available to anyone if will is active and not executed */}
          {will.isActive && !will.isExecuted && (
            <button
              onClick={() => setShowDepositForm(!showDepositForm)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
              disabled={isLoading}
            >
              Deposit
            </button>
          )}
          
          {/* Withdraw button - only for testator if will is active and not executed */}
          {canWithdraw && (
            <button
              onClick={() => setShowWithdrawForm(!showWithdrawForm)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md text-sm"
              disabled={isLoading}
            >
              Withdraw
            </button>
          )}
          
          {/* Set Executor button - only for testator if will is active and not executed */}
          {canSetExecutor && (
            <button
              onClick={() => setShowExecutorForm(!showExecutorForm)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm"
              disabled={isLoading}
            >
              Set Executor
            </button>
          )}
          
          {/* Confirm Execution button - only for executor if will is active, not confirmed, not executed */}
          {canConfirm && (
            <button
              onClick={handleConfirmExecution}
              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-md text-sm"
              disabled={isLoading}
            >
              Confirm Execution
            </button>
          )}
          
          {/* Execute Will button - available if will is active, confirmed, not executed */}
          {canExecute && (
            <button
              onClick={handleExecuteWill}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
              disabled={isLoading}
            >
              Execute Will
            </button>
          )}
          
          {/* Deactivate Will button - only for testator if will is active and not executed */}
          {canDeactivate && (
            <button
              onClick={handleDeactivateWill}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm"
              disabled={isLoading}
            >
              Deactivate
            </button>
          )}
        </div>
        
        {/* Deposit Form */}
        {showDepositForm && (
          <div className="mt-4 p-3 bg-gray-700 rounded-md">
            <h4 className="font-medium mb-2">Deposit Funds</h4>
            <form onSubmit={handleDeposit}>
              <div className="flex">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="input flex-grow"
                  placeholder="Amount in tCORE"
                  step="0.001"
                  min="0.001"
                  required
                />
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 ml-2 rounded-md"
                  disabled={isLoading}
                >
                  {isLoading ? "..." : "Deposit"}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Withdraw Form */}
        {showWithdrawForm && (
          <div className="mt-4 p-3 bg-gray-700 rounded-md">
            <h4 className="font-medium mb-2">Withdraw Funds</h4>
            <form onSubmit={handleWithdraw}>
              <div className="flex">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="input flex-grow"
                  placeholder="Amount in tCORE"
                  step="0.001"
                  min="0.001"
                  max={will.totalBalance}
                  required
                />
                <button
                  type="submit"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 ml-2 rounded-md"
                  disabled={isLoading}
                >
                  {isLoading ? "..." : "Withdraw"}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Set Executor Form */}
        {showExecutorForm && (
          <div className="mt-4 p-3 bg-gray-700 rounded-md">
            <h4 className="font-medium mb-2">Set New Executor</h4>
            <form onSubmit={handleSetExecutor}>
              <div className="flex">
                <input
                  type="text"
                  value={newExecutor}
                  onChange={(e) => setNewExecutor(e.target.value)}
                  className="input flex-grow"
                  placeholder="Executor Address (0x...)"
                  required
                />
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 ml-2 rounded-md"
                  disabled={isLoading}
                >
                  {isLoading ? "..." : "Set"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default WillCard;
