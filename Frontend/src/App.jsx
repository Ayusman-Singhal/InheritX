import React, { useState } from 'react';
import { useWeb3 } from './contexts/Web3Context';
import Header from './components/Header';
import WillForm from './components/WillForm';
import WillList from './components/WillList';
import WillDetails from './components/WillDetails';
import ConnectWalletButton from './components/ConnectWalletButton';

function App() {
  const { account, isCorrectNetwork, connectWallet, switchNetwork } = useWeb3();
  const [activeTab, setActiveTab] = useState('my-wills');
  const [selectedWill, setSelectedWill] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleViewWillDetails = (will) => {
    setSelectedWill(will);
  };

  const handleCloseWillDetails = () => {
    setSelectedWill(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-8 flex-grow">
        {!account ? (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold mb-6">Welcome to Will Transfer DAO</h2>
            <p className="text-xl mb-8">Connect your wallet to get started</p>
            <ConnectWalletButton />
          </div>
        ) : !isCorrectNetwork ? (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold mb-6">Wrong Network</h2>
            <p className="text-xl mb-8">Please switch to the tCORE Testnet to use this application</p>
            <button 
              className="btn-primary"
              onClick={switchNetwork}
            >
              Switch Network
            </button>
          </div>
        ) : (
          <div>
            <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'my-wills' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
                onClick={() => handleTabChange('my-wills')}
              >
                My Wills
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'create-will' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
                onClick={() => handleTabChange('create-will')}
              >
                Create Will
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'executor-duties' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
                onClick={() => handleTabChange('executor-duties')}
              >
                Executor Duties
              </button>
            </div>

            <div className="mt-6">
              {activeTab === 'my-wills' && (
                <WillList type="testator" onViewDetails={handleViewWillDetails} />
              )}

              {activeTab === 'create-will' && (
                <WillForm />
              )}

              {activeTab === 'executor-duties' && (
                <WillList type="executor" onViewDetails={handleViewWillDetails} />
              )}
            </div>
          </div>
        )}
      </main>

      {selectedWill && (
        <WillDetails will={selectedWill} onClose={handleCloseWillDetails} />
      )}

      <footer className="bg-gray-800 py-4">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Will Transfer DAO. All rights reserved.</p>
          <p className="text-sm mt-2">Running on tCORE Testnet</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
