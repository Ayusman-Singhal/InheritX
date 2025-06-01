import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import WillCard from './WillCard';

const WillList = ({ type = 'testator', onViewDetails }) => {
  const { contract, account } = useWeb3();
  const [wills, setWills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWill, setSelectedWill] = useState(null);

  // Function to fetch wills based on type (testator or executor)
  const fetchWills = async () => {
    if (!contract || !account) return;
    
    setLoading(true);
    try {
      // In a production app, you'd use an indexer or backend service
      // For this demo, we'll iterate through will IDs (up to a reasonable limit)
      const willsArray = [];
      const maxWillsToCheck = 100; // Limit to prevent excessive calls
      
      for (let i = 1; i <= maxWillsToCheck; i++) {
        try {
          const willDetails = await contract.getWillDetails(i);
          
          // Check if this will belongs to the user based on the requested type
          const isRelevant = 
            (type === 'testator' && willDetails[0].toLowerCase() === account.toLowerCase()) || 
            (type === 'executor' && willDetails[5].toLowerCase() === account.toLowerCase());
          
          if (isRelevant) {
            // Format the will data for display
            const formattedWill = {
              id: i,
              testator: willDetails[0],
              creationTimestamp: new Date(Number(willDetails[1]) * 1000).toLocaleString(),
              description: willDetails[2],
              isActive: willDetails[3],
              isExecuted: willDetails[4],
              executor: willDetails[5],
              isExecutionConfirmed: willDetails[6],
              totalBalance: ethers.formatEther(willDetails[7]),
              beneficiaries: willDetails[8].map((b, index) => ({
                address: b.beneficiaryAddress,
                sharePercentage: b.sharePercentage
              }))
            };
            
            willsArray.push(formattedWill);
          }
        } catch (error) {
          // If we get an error for this will ID, it likely doesn't exist
          // We can break the loop if we encounter several consecutive errors
          console.log(`Will #${i} not found or error:`, error);
          break;
        }
      }
      
      setWills(willsArray);
    } catch (error) {
      console.error("Error fetching wills:", error);
      toast.error("Failed to load wills");
    } finally {
      setLoading(false);
    }
  };

  // Fetch wills when component mounts or when account/contract/type changes
  useEffect(() => {
    fetchWills();
  }, [contract, account, type]);

  // Handle will selection for detailed view
  const handleSelectWill = (will) => {
    setSelectedWill(will);
    if (onViewDetails) {
      onViewDetails(will);
    }
  };

  // Handle closing the detailed view
  const handleCloseDetails = () => {
    setSelectedWill(null);
  };

  // Handle refreshing the will list
  const handleRefresh = () => {
    fetchWills();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {type === 'testator' ? 'My Wills' : 'Executor Duties'}
        </h2>
        <button 
          onClick={handleRefresh}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading wills...</p>
        </div>
      ) : wills.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-xl mb-4">
            {type === 'testator' 
              ? "You haven't created any wills yet." 
              : "You are not assigned as an executor for any wills."}
          </p>
          {type === 'testator' && (
            <p className="text-gray-400">
              Click on "Create Will" to get started.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wills.map(will => (
            <WillCard 
              key={will.id} 
              will={will} 
              type={type}
              onSelect={() => handleSelectWill(will)}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      )}

      {/* Will Details Modal - This would be implemented in a real app */}
      {selectedWill && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Will #{selectedWill.id} Details</h3>
              <button 
                onClick={handleCloseDetails}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {/* Will details would be displayed here */}
            <div className="mt-4">
              <button 
                onClick={handleCloseDetails}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WillList;
