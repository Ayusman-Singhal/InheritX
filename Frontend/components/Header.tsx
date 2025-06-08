"use client"

import { useWeb3 } from "./Web3Context"
import ConnectWalletButton from "./ConnectWalletButton"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, Network, DollarSign, FileText } from "lucide-react"

export default function Header() {
  const { account, balance, creationFee, isCorrectNetwork } = useWeb3()

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">Will Transfer DAO</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {account && (
              <div className="flex items-center space-x-3">
                <Card className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardContent className="px-3 py-2">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Network className="w-4 h-4 text-slate-500" />
                        <Badge variant={isCorrectNetwork ? "default" : "destructive"} className="text-xs">
                          {isCorrectNetwork ? "tCORE Testnet" : "Wrong Network"}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Wallet className="w-4 h-4 text-slate-500" />
                        <span className="font-mono text-slate-700 dark:text-slate-300">{formatAddress(account)}</span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4 text-slate-500" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {Number.parseFloat(balance).toFixed(4)} tCORE2
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {creationFee !== "0" && (
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="px-3 py-2">
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        <span className="font-medium">Creation Fee: {creationFee} tCORE2</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <ConnectWalletButton />
          </div>
        </div>
      </div>
    </header>
  )
}
