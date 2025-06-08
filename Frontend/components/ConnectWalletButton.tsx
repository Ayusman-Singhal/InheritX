"use client"

import { useWeb3 } from "./Web3Context"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Wallet, ChevronDown, LogOut, RefreshCw, Network } from "lucide-react"

export default function ConnectWalletButton() {
  const {
    account,
    isConnecting,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchToTCoreTestnet,
    refreshBalance,
  } = useWeb3()

  if (!account) {
    return (
      <Button
        onClick={connectWallet}
        disabled={isConnecting}
        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
      >
        <Wallet className="w-4 h-4 mr-2" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Wallet className="w-4 h-4" />
          <span>Wallet</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {!isCorrectNetwork && (
          <DropdownMenuItem onClick={switchToTCoreTestnet}>
            <Network className="w-4 h-4 mr-2" />
            Switch to tCORE Testnet
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={refreshBalance}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Balance
        </DropdownMenuItem>
        <DropdownMenuItem onClick={disconnectWallet}>
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
