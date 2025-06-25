"use client"

import { useState } from "react"
import { useWeb3 } from "./Web3Context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DollarSign,
  Users,
  Calendar,
  User,
  FileText,
  Plus,
  Minus,
  UserCheck,
  Play,
  XCircle,
  Settings,
} from "lucide-react"
import { ethers } from "ethers"
import { toast } from "sonner"

interface Will {
  id: number
  testator: string
  executor: string
  description: string
  isActive: boolean
  isExecuted: boolean
  balance: string
  beneficiaries: string[]
  shares: number[]
  createdAt: number
  executionConfirmed: boolean
}

interface WillDetailsProps {
  will: Will
  type: "testator" | "executor"
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export default function WillDetails({ will, type, isOpen, onClose, onUpdate }: WillDetailsProps) {
  const { contract, account } = useWeb3()
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [newExecutor, setNewExecutor] = useState("")
  const [loading, setLoading] = useState("")

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const getStatusBadge = () => {
    if (will.isExecuted) {
      return (
        <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
          Executed
        </Badge>
      )
    }
    if (!will.isActive) {
      return (
        <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300">
          Inactive
        </Badge>
      )
    }
    if (will.executionConfirmed) {
      return (
        <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
          Execution Confirmed
        </Badge>
      )
    }
    return <Badge variant="default">Active</Badge>
  }

  const handleDeposit = async () => {
    if (!contract || !depositAmount) return

    setLoading("deposit")
    try {
      const tx = await contract.depositToWill(will.id, {
        value: ethers.parseEther(depositAmount),
      })

      toast.loading("Depositing funds...", { id: "deposit" })
      await tx.wait()

      toast.success("Funds deposited successfully!", { id: "deposit" })
      setDepositAmount("")
      onUpdate()
    } catch (error: any) {
      console.error("Error depositing:", error)
      toast.error(error.reason || "Failed to deposit funds", { id: "deposit" })
    } finally {
      setLoading("")
    }
  }

  const handleWithdraw = async () => {
    if (!contract || !withdrawAmount) return

    setLoading("withdraw")
    try {
      const tx = await contract.withdrawFromWill(will.id, ethers.parseEther(withdrawAmount))

      toast.loading("Withdrawing funds...", { id: "withdraw" })
      await tx.wait()

      toast.success("Funds withdrawn successfully!", { id: "withdraw" })
      setWithdrawAmount("")
      onUpdate()
    } catch (error: any) {
      console.error("Error withdrawing:", error)
      toast.error(error.reason || "Failed to withdraw funds", { id: "withdraw" })
    } finally {
      setLoading("")
    }
  }

  const handleSetExecutor = async () => {
    if (!contract || !newExecutor || !ethers.isAddress(newExecutor)) return

    setLoading("setExecutor")
    try {
      const tx = await contract.setExecutor(will.id, newExecutor)

      toast.loading("Setting new executor...", { id: "setExecutor" })
      await tx.wait()

      toast.success("Executor updated successfully!", { id: "setExecutor" })
      setNewExecutor("")
      onUpdate()
    } catch (error: any) {
      console.error("Error setting executor:", error)
      toast.error(error.reason || "Failed to set executor", { id: "setExecutor" })
    } finally {
      setLoading("")
    }
  }

  const handleConfirmExecution = async () => {
    if (!contract) return

    setLoading("confirm")
    try {
      const tx = await contract.confirmExecutionCondition(will.id)

      toast.loading("Confirming execution condition...", { id: "confirm" })
      await tx.wait()

      toast.success("Execution condition confirmed!", { id: "confirm" })
      onUpdate()
    } catch (error: any) {
      console.error("Error confirming execution:", error)
      toast.error(error.reason || "Failed to confirm execution", { id: "confirm" })
    } finally {
      setLoading("")
    }
  }

  const handleExecuteWill = async () => {
    if (!contract) return

    setLoading("execute")
    try {
      const tx = await contract.executeWill(will.id)

      toast.loading("Executing will...", { id: "execute" })
      await tx.wait()

      toast.success("Will executed successfully!", { id: "execute" })
      onUpdate()
    } catch (error: any) {
      console.error("Error executing will:", error)
      toast.error(error.reason || "Failed to execute will", { id: "execute" })
    } finally {
      setLoading("")
    }
  }

  const handleDeactivate = async () => {
    if (!contract) return

    setLoading("deactivate")
    try {
      const tx = await contract.deactivateWill(will.id)

      toast.loading("Deactivating will...", { id: "deactivate" })
      await tx.wait()

      toast.success("Will deactivated successfully!", { id: "deactivate" })
      onUpdate()
    } catch (error: any) {
      console.error("Error deactivating will:", error)
      toast.error(error.reason || "Failed to deactivate will", { id: "deactivate" })
    } finally {
      setLoading("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Will #{will.id} Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Status & Information</CardTitle>
                {getStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Current Balance
                  </Label>
                  <div className="text-2xl font-bold text-green-600">
                    {Number.parseFloat(ethers.formatEther(will.balance)).toFixed(4)} tCORE2
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Created
                  </Label>
                  <div className="text-sm text-slate-600">{formatDate(will.createdAt)}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Description</Label>
                <p className="text-sm text-slate-600 bg-slate-50 dark:bg-gray-900 p-3 rounded-lg">
                  {will.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Testator
                  </Label>
                  <div className="font-mono text-sm bg-slate-50 dark:bg-gray-900 p-2 rounded">{will.testator}</div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Executor
                  </Label>
                  <div className="font-mono text-sm bg-slate-50 dark:bg-gray-900 p-2 rounded">{will.executor}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Beneficiaries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Beneficiaries ({will.beneficiaries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {will.beneficiaries.map((beneficiary, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div className="font-mono text-sm">{beneficiary}</div>
                    <Badge variant="outline">{will.shares[index]}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {type === "testator" && account?.toLowerCase() === will.testator.toLowerCase() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Testator Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {will.isActive && !will.isExecuted && (
                  <>
                    {/* Deposit */}
                    <div className="space-y-2">
                      <Label>Deposit Funds</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="Amount in tCORE2"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                        <Button onClick={handleDeposit} disabled={!depositAmount || loading === "deposit"}>
                          <Plus className="w-4 h-4 mr-2" />
                          {loading === "deposit" ? "Depositing..." : "Deposit"}
                        </Button>
                      </div>
                    </div>

                    {/* Withdraw */}
                    <div className="space-y-2">
                      <Label>Withdraw Funds</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="Amount in tCORE2"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                        <Button
                          onClick={handleWithdraw}
                          disabled={!withdrawAmount || loading === "withdraw"}
                          variant="outline"
                        >
                          <Minus className="w-4 h-4 mr-2" />
                          {loading === "withdraw" ? "Withdrawing..." : "Withdraw"}
                        </Button>
                      </div>
                    </div>

                    {/* Set Executor */}
                    <div className="space-y-2">
                      <Label>Change Executor</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="New executor address"
                          value={newExecutor}
                          onChange={(e) => setNewExecutor(e.target.value)}
                          className="font-mono"
                        />
                        <Button
                          onClick={handleSetExecutor}
                          disabled={!newExecutor || loading === "setExecutor"}
                          variant="outline"
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          {loading === "setExecutor" ? "Setting..." : "Set"}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Deactivate */}
                    <Button
                      onClick={handleDeactivate}
                      disabled={loading === "deactivate"}
                      variant="destructive"
                      className="w-full"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {loading === "deactivate" ? "Deactivating..." : "Deactivate Will"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Executor Actions */}
          {type === "executor" && account?.toLowerCase() === will.executor.toLowerCase() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Executor Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {will.isActive && !will.isExecuted && (
                  <>
                    {!will.executionConfirmed ? (
                      <Button onClick={handleConfirmExecution} disabled={loading === "confirm"} className="w-full">
                        <UserCheck className="w-4 h-4 mr-2" />
                        {loading === "confirm" ? "Confirming..." : "Confirm Execution Condition"}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleExecuteWill}
                        disabled={loading === "execute"}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {loading === "execute" ? "Executing..." : "Execute Will"}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
