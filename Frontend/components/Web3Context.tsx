"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"
import toast from "react-hot-toast"
import WillTransferABI from "@/abi/WillTransferV2.json"

const CONTRACT_ADDRESS = "0xedcc4ddbedb4905834a09d50bb820c5f68fbb260"
const TCORE_TESTNET = {
  chainId: "0x45a", // 1114 in hex
  chainName: "Core Blockchain TestNet",
  rpcUrls: ["https://rpc.test2.btcs.network"],
  nativeCurrency: {
    name: "tCORE2",
    symbol: "tCORE2",
    decimals: 18,
  },
  blockExplorerUrls: ["https://scan.test2.btcs.network"],
}

interface Web3ContextType {
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  contract: ethers.Contract | null
  account: string | null
  balance: string
  creationFee: string
  isCorrectNetwork: boolean
  isConnecting: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchToTCoreTestnet: () => Promise<void>
  refreshBalance: () => Promise<void>
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider")
  }
  return context
}

interface Web3ProviderProps {
  children: ReactNode
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<string>("0")
  const [creationFee, setCreationFee] = useState<string>("0")
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)

  const checkNetwork = async (provider: ethers.BrowserProvider) => {
    try {
      const network = await provider.getNetwork()
      const isCorrect = network.chainId === 1114n
      setIsCorrectNetwork(isCorrect)
      return isCorrect
    } catch (error) {
      console.error("Error checking network:", error)
      setIsCorrectNetwork(false)
      return false
    }
  }

  const switchToTCoreTestnet = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask is not installed")
      return
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: TCORE_TESTNET.chainId }],
      })
      toast.success("Switched to tCORE Testnet")
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [TCORE_TESTNET],
          })
          toast.success("Added and switched to tCORE Testnet")
        } catch (addError) {
          console.error("Error adding network:", addError)
          toast.error("Failed to add tCORE Testnet")
        }
      } else {
        console.error("Error switching network:", switchError)
        toast.error("Failed to switch network")
      }
    }
  }

  const refreshBalance = async () => {
    if (provider && account) {
      try {
        const balance = await provider.getBalance(account)
        setBalance(ethers.formatEther(balance))
      } catch (error) {
        console.error("Error fetching balance:", error)
      }
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask is not installed")
      return
    }

    setIsConnecting(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])

      const signer = await provider.getSigner()
      const account = await signer.getAddress()

      setProvider(provider)
      setSigner(signer)
      setAccount(account)

      const isCorrect = await checkNetwork(provider)

      if (isCorrect) {
        const contract = new ethers.Contract(CONTRACT_ADDRESS, WillTransferABI, signer)
        setContract(contract)

        // Fetch creation fee
        try {
          const fee = await contract.creationFee()
          setCreationFee(ethers.formatEther(fee))
        } catch (error) {
          console.error("Error fetching creation fee:", error)
        }

        // Fetch balance
        const balance = await provider.getBalance(account)
        setBalance(ethers.formatEther(balance))

        toast.success("Wallet connected successfully")
      } else {
        toast.error("Please switch to tCORE Testnet")
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      toast.error("Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setProvider(null)
    setSigner(null)
    setContract(null)
    setAccount(null)
    setBalance("0")
    setCreationFee("0")
    setIsCorrectNetwork(false)
    toast.success("Wallet disconnected")
  }

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          connectWallet()
        }
      })

      window.ethereum.on("chainChanged", () => {
        window.location.reload()
      })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged")
        window.ethereum.removeAllListeners("chainChanged")
      }
    }
  }, [])

  const value: Web3ContextType = {
    provider,
    signer,
    contract,
    account,
    balance,
    creationFee,
    isCorrectNetwork,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchToTCoreTestnet,
    refreshBalance,
  }

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}
