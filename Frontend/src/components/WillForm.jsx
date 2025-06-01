import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

const WillForm = () => {
  const { contract, account, creationFee } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    executorAddress: '',
    beneficiaries: [{ address: '', sharePercentage: '' }]
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBeneficiaryChange = (index, field, value) => {
    const updatedBeneficiaries = [...formData.beneficiaries];
    updatedBeneficiaries[index] = {
      ...updatedBeneficiaries[index],
      [field]: value
    };
    setFormData(prev => ({ ...prev, beneficiaries: updatedBeneficiaries }));
  };

  const addBeneficiary = () => {
    setFormData(prev => ({
      ...prev,
      beneficiaries: [...prev.beneficiaries, { address: '', sharePercentage: '' }]
    }));
  };

  const removeBeneficiary = (index) => {
    if (formData.beneficiaries.length <= 1) return;
    const updatedBeneficiaries = [...formData.beneficiaries];
    updatedBeneficiaries.splice(index, 1);
    setFormData(prev => ({ ...prev, beneficiaries: updatedBeneficiaries }));
  };

  const validateForm = () => {
    // Check if description is provided
    if (!formData.description.trim()) {
      toast.error("Please provide a description for the will");
      return false;
    }

    // Check if executor address is valid
    if (formData.executorAddress && !ethers.isAddress(formData.executorAddress)) {
      toast.error("Invalid executor address");
      return false;
    }

    // Check if all beneficiary addresses are valid
    for (let i = 0; i < formData.beneficiaries.length; i++) {
      const { address, sharePercentage } = formData.beneficiaries[i];
      
      if (!ethers.isAddress(address)) {
        toast.error(`Invalid address for beneficiary #${i + 1}`);
        return false;
      }
      
      const share = parseInt(sharePercentage);
      if (isNaN(share) || share <= 0 || share > 100) {
        toast.error(`Invalid share percentage for beneficiary #${i + 1}. Must be between 1 and 100.`);
        return false;
      }
    }

    // Check if share percentages sum to 100
    const totalShares = formData.beneficiaries.reduce(
      (sum, beneficiary) => sum + parseInt(beneficiary.sharePercentage || 0), 
      0
    );
    
    if (totalShares !== 100) {
      toast.error(`Total share percentages must equal 100%. Current total: ${totalShares}%`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!contract || !account) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const beneficiaryAddresses = formData.beneficiaries.map(b => b.address);
      const sharePercentages = formData.beneficiaries.map(b => parseInt(b.sharePercentage));
      const executorAddress = formData.executorAddress || ethers.ZeroAddress;
      
      // Convert creation fee from ETH to Wei
      const feeInWei = creationFee ? ethers.parseEther(creationFee) : ethers.parseEther("0.01");
      
      const tx = await contract.createWill(
        formData.description,
        beneficiaryAddresses,
        sharePercentages,
        executorAddress,
        { value: feeInWei }
      );
      
      toast.info("Transaction submitted. Waiting for confirmation...");
      
      await tx.wait();
      
      // Reset form after successful submission
      setFormData({
        description: '',
        executorAddress: '',
        beneficiaries: [{ address: '', sharePercentage: '' }]
      });
      
      toast.success("Will created successfully!");
    } catch (error) {
      console.error("Error creating will:", error);
      let errorMessage = "Failed to create will.";
      
      if (error.reason) {
        errorMessage += ` Reason: ${error.reason}`;
      } else if (error.message) {
        errorMessage += ` ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Create New Will</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="description" className="label">Will Description</label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="input"
            placeholder="E.g., My Digital Assets Will"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="executorAddress" className="label">Executor Address (Optional)</label>
          <input
            type="text"
            id="executorAddress"
            name="executorAddress"
            value={formData.executorAddress}
            onChange={handleChange}
            className="input"
            placeholder="0x... (Leave empty to set yourself as executor)"
          />
          <p className="text-sm text-gray-400 mt-1">
            The executor will be responsible for confirming and executing the will.
          </p>
        </div>
        
        <div className="mt-8 mb-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Beneficiaries</h3>
            <button
              type="button"
              onClick={addBeneficiary}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
            >
              + Add Beneficiary
            </button>
          </div>
          <p className="text-sm text-gray-400">
            Add beneficiaries and their share percentages. Total shares must equal 100%.
          </p>
        </div>
        
        {formData.beneficiaries.map((beneficiary, index) => (
          <div key={index} className="bg-gray-700 p-4 rounded-md mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Beneficiary #{index + 1}</h4>
              {formData.beneficiaries.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBeneficiary(index)}
                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-md text-xs"
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Address</label>
                <input
                  type="text"
                  value={beneficiary.address}
                  onChange={(e) => handleBeneficiaryChange(index, 'address', e.target.value)}
                  className="input"
                  placeholder="0x..."
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="label">Share Percentage</label>
                <div className="relative">
                  <input
                    type="number"
                    value={beneficiary.sharePercentage}
                    onChange={(e) => handleBeneficiaryChange(index, 'sharePercentage', e.target.value)}
                    className="input pr-8"
                    placeholder="0"
                    min="1"
                    max="100"
                    required
                  />
                  <span className="absolute right-3 top-2">%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="mt-8">
          <div className="bg-blue-900/30 p-4 rounded-md mb-6">
            <p className="flex items-center">
              <span className="mr-2">Creation Fee:</span>
              <span className="font-bold">{creationFee || "0.01"} tCORE</span>
            </p>
            <p className="text-sm text-gray-400 mt-1">
              This fee is required to create a new will and is non-refundable.
            </p>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            disabled={isLoading || !account}
          >
            {isLoading ? "Creating Will..." : "Create Will"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WillForm;
