import React from 'react';
import { ethers } from 'ethers';

const WillDetails = ({ will, onClose }) => {
  if (!will) return null;

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address || address === ethers.ZeroAddress) return 'Not Set';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl font-bold">Will #{will.id} Details</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <div>
              <h4 className="text-gray-400 text-sm">Description</h4>
              <p className="font-medium">{will.description}</p>
            </div>
            
            <div>
              <h4 className="text-gray-400 text-sm">Status</h4>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  will.isExecuted ? 'bg-purple-600' : 
                  !will.isActive ? 'bg-red-600' : 
                  will.isExecutionConfirmed ? 'bg-yellow-600' : 
                  'bg-green-600'
                }`}>
                  {will.isExecuted ? 'Executed' : 
                   !will.isActive ? 'Inactive' : 
                   will.isExecutionConfirmed ? 'Execution Confirmed' : 
                   'Active'}
                </span>
              </div>
            </div>
            
            <div>
              <h4 className="text-gray-400 text-sm">Creation Date</h4>
              <p>{will.creationTimestamp}</p>
            </div>
            
            <div>
              <h4 className="text-gray-400 text-sm">Testator</h4>
              <p className="font-mono">{will.testator}</p>
            </div>
            
            <div>
              <h4 className="text-gray-400 text-sm">Executor</h4>
              <p className="font-mono">{will.executor === ethers.ZeroAddress ? 'Not Set' : will.executor}</p>
            </div>
            
            <div>
              <h4 className="text-gray-400 text-sm">Total Balance</h4>
              <p className="text-xl font-bold">{will.totalBalance} tCORE</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-gray-400 text-sm mb-3">Beneficiaries</h4>
            <div className="space-y-3">
              {will.beneficiaries.map((beneficiary, index) => (
                <div key={index} className="bg-gray-700 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Beneficiary #{index + 1}</span>
                    <span className="bg-blue-600 px-2 py-1 rounded-full text-xs">
                      {beneficiary.sharePercentage}%
                    </span>
                  </div>
                  <p className="font-mono text-sm mt-1 break-all">{beneficiary.address}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-gray-400 text-sm mb-3">Execution Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm">
                <span className="text-gray-400">Execution Confirmed:</span> {will.isExecutionConfirmed ? 'Yes' : 'No'}
              </p>
            </div>
            {will.isExecuted && (
              <div>
                <p className="text-sm">
                  <span className="text-gray-400">Execution Date:</span> {/* Would need to be fetched from events */}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WillDetails;
