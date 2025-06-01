import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import ConnectWalletButton from './ConnectWalletButton';

const Header = () => {
  const { account, balance, creationFee, isCorrectNetwork } = useWeb3();

  return (
    <header className="bg-gray-800 py-4 shadow-md">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-blue-400">Will Transfer DAO</h1>
          {creationFee && (
            <div className="ml-6 bg-gray-700 px-3 py-1 rounded-md text-sm">
              Creation Fee: {creationFee} tCORE
            </div>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row items-center">
          {!isCorrectNetwork && account && (
            <div className="bg-red-800 text-white px-3 py-1 rounded-md text-sm mr-4 mb-2 md:mb-0">
              Wrong Network! Please switch to tCORE Testnet
            </div>
          )}
          
          {account && (
            <div className="bg-gray-700 px-3 py-1 rounded-md text-sm mr-4 mb-2 md:mb-0">
              Balance: {parseFloat(balance).toFixed(4)} tCORE
            </div>
          )}
          
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
