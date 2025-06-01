import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

// Import the ABI
import WillTransferABI from '../abi/WillTransfer.json';

// Contract address from environment variable or hardcoded for demo
const WILL_TRANSFER_CONTRACT_ADDRESS = import.meta.env.VITE_WILL_TRANSFER_CONTRACT_ADDRESS || '0xDC42B46C06bBE6FcAD2678cAEe7B8fF97e649d2A';

// tCORE Testnet chain details
const TCORE_TESTNET_CHAIN_ID = '0x45a'; // 1114 in decimal
const TCORE_TESTNET_PARAMS = {
  chainId: TCORE_TESTNET_CHAIN_ID,
  chainName: 'Core Blockchain TestNet',
  nativeCurrency: {
    name: 'tCORE2',
    symbol: 'tCORE2',
    decimals: 18
  },
  rpcUrls: ['https://rpc.test2.btcs.network'],
  blockExplorerUrls: ['https://scan.test2.btcs.network']
};

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

// Contract address is already defined above as WILL_TRANSFER_CONTRACT_ADDRESS

export const Web3Provider = ({ children }) => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState(null);
    const [balance, setBalance] = useState(null);
    const [creationFee, setCreationFee] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

    // tCORE Testnet Chain ID
    const TCORE_TESTNET_CHAIN_ID = 1114;

    const connectWallet = useCallback(async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const web3Provider = new ethers.BrowserProvider(window.ethereum);
                setProvider(web3Provider);

                const network = await web3Provider.getNetwork();
                const currentChainId = network.chainId;
                setChainId(Number(currentChainId));
                setIsCorrectNetwork(Number(currentChainId) === TCORE_TESTNET_CHAIN_ID);

                if (Number(currentChainId) !== TCORE_TESTNET_CHAIN_ID) {
                    toast.warning("Please switch to tCORE Testnet (Chain ID: 1114)");
                    try {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: '0x45a' }], // 0x45a is hex for 1114
                        });
                    } catch (switchError) {
                        // This error code indicates that the chain has not been added to MetaMask
                        if (switchError.code === 4902) {
                            try {
                                await window.ethereum.request({
                                    method: 'wallet_addEthereumChain',
                                    params: [{
                                        chainId: '0x45a',
                                        chainName: 'Core Blockchain TestNet',
                                        nativeCurrency: {
                                            name: 'tCORE2',
                                            symbol: 'tCORE2',
                                            decimals: 18
                                        },
                                        rpcUrls: ['https://rpc.test2.btcs.network'],
                                        blockExplorerUrls: ['https://scan.test2.btcs.network']
                                    }],
                                });
                            } catch (addError) {
                                console.error("Error adding tCORE Testnet:", addError);
                            }
                        }
                        console.error("Failed to switch to tCORE Testnet:", switchError);
                    }
                    return;
                }

                const web3Signer = await web3Provider.getSigner();
                setSigner(web3Signer);

                const userAccount = await web3Signer.getAddress();
                setAccount(userAccount);

                const userBalance = await web3Provider.getBalance(userAccount);
                setBalance(ethers.formatEther(userBalance));

                const willTransferContract = new ethers.Contract(WILL_TRANSFER_CONTRACT_ADDRESS, WillTransferABI, web3Signer);
                setContract(willTransferContract);

                try {
                    const fee = await willTransferContract.creationFee();
                    setCreationFee(ethers.formatEther(fee));
                    console.log("Creation Fee:", ethers.formatEther(fee), "tCORE");
                } catch (error) {
                    console.error("Error fetching creation fee:", error);
                }

                toast.success("Wallet connected successfully!");
                console.log("Connected account:", userAccount);

            } catch (error) {
                console.error("User rejected connection or error occurred:", error);
                toast.error("Failed to connect wallet: " + (error.message || ''));
            }
        } else {
            toast.error("MetaMask is not installed. Please install it to use this dApp.");
        }
    }, []);

    const disconnectWallet = useCallback(() => {
        setProvider(null);
        setSigner(null);
        setContract(null);
        setAccount(null);
        setBalance(null);
        setCreationFee(null);
        toast.info("Wallet disconnected");
    }, []);

    const handleAccountsChanged = useCallback((accounts) => {
        if (accounts.length === 0) {
            disconnectWallet();
        } else if (accounts[0] !== account) {
            connectWallet(); // Re-connect with the new account
        }
    }, [account, connectWallet, disconnectWallet]);

    const handleChainChanged = useCallback(() => {
        window.location.reload();
    }, []);

    // Setup event listeners for MetaMask
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, [handleAccountsChanged, handleChainChanged]);

    // Contract event listeners
    useEffect(() => {
        if (contract) {
            const handleWillCreated = (willId, testator, description) => {
                if (testator.toLowerCase() === account?.toLowerCase()) {
                    toast.success(`Will #${willId.toString()} created successfully!`);
                }
            };

            const handleWillDeposit = (willId, depositor, amount) => {
                if (depositor.toLowerCase() === account?.toLowerCase()) {
                    toast.success(`Deposited ${ethers.formatEther(amount)} tCORE to Will #${willId.toString()}`);
                }
            };

            const handleWillExecuted = (willId, executor) => {
                toast.success(`Will #${willId.toString()} executed successfully!`);
            };
            
            const handleWillDeactivated = (willId, testator) => {
                if (testator.toLowerCase() === account?.toLowerCase()) {
                    toast.info(`Will #${willId.toString()} has been deactivated`);
                }
            };
            
            const handleWillExecutionConfirmed = (willId, executor) => {
                toast.info(`Execution condition confirmed for Will #${willId.toString()}`);
            };

            contract.on("WillCreated", handleWillCreated);
            contract.on("WillDeposit", handleWillDeposit);
            contract.on("WillExecuted", handleWillExecuted);
            contract.on("WillDeactivated", handleWillDeactivated);
            contract.on("WillExecutionConfirmed", handleWillExecutionConfirmed);

            return () => {
                contract.off("WillCreated", handleWillCreated);
                contract.off("WillDeposit", handleWillDeposit);
                contract.off("WillExecuted", handleWillExecuted);
                contract.off("WillDeactivated", handleWillDeactivated);
                contract.off("WillExecutionConfirmed", handleWillExecutionConfirmed);
            };
        }
    }, [contract, account]);

    return (
        <Web3Context.Provider value={{
            provider,
            signer,
            contract,
            account,
            balance,
            creationFee,
            chainId,
            isCorrectNetwork,
            connectWallet,
            disconnectWallet
        }}>
            {children}
        </Web3Context.Provider>
    );
};
