import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const ConnectWalletButton = () => {
  const { account, connectWallet, disconnectWallet } = useWeb3();

  // Format address for display (e.g., 0x1234...5678)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div>
      {!account ? (
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          onClick={connectWallet}
        >
          Connect Wallet
        </button>
      ) : (
        <div className="flex items-center">
          <span className="bg-blue-900 text-white px-3 py-2 rounded-l-lg">
            {formatAddress(account)}
          </span>
          <button 
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-r-lg transition-colors"
            onClick={disconnectWallet}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectWalletButton;
