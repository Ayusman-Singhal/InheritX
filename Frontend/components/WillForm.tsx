"use client"

import type React from "react"

import { useState } from "react"
import { useWeb3 } from "./Web3Context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Users, FileText, User } from "lucide-react"
import { ethers } from "ethers"
import { toast } from "sonner"

interface Beneficiary {
  address: string
  share: number
}

export default function WillForm() {
  const { contract, account, isCorrectNetwork, creationFee } = useWeb3()
  const [description, setDescription] = useState("")
  const [executor, setExecutor] = useState("")
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([{ address: "", share: 0 }])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addBeneficiary = () => {
    setBeneficiaries([...beneficiaries, { address: "", share: 0 }])
  }

  const removeBeneficiary = (index: number) => {
    if (beneficiaries.length > 1) {
      setBeneficiaries(beneficiaries.filter((_, i) => i !== index))
    }
  }

  const updateBeneficiary = (index: number, field: keyof Beneficiary, value: string | number) => {
    const updated = [...beneficiaries]
    updated[index] = { ...updated[index], [field]: value }
    setBeneficiaries(updated)
  }

  const validateForm = () => {
    if (!description.trim()) {
      toast.error("Please enter a will description")
      return false
    }

    if (!ethers.isAddress(executor)) {
      toast.error("Please enter a valid executor address")
      return false
    }

    if (executor.toLowerCase() === account?.toLowerCase()) {
      toast.error("Executor cannot be the same as the testator")
      return false
    }

    for (let i = 0; i < beneficiaries.length; i++) {
      const beneficiary = beneficiaries[i]
      if (!ethers.isAddress(beneficiary.address)) {
        toast.error(`Please enter a valid address for beneficiary ${i + 1}`)
        return false
      }
      if (beneficiary.share <= 0 || beneficiary.share > 100) {
        toast.error(`Beneficiary ${i + 1} share must be between 1 and 100`)
        return false
      }
    }

    const totalShares = beneficiaries.reduce((sum, b) => sum + b.share, 0)
    if (totalShares !== 100) {
      toast.error(`Total shares must equal 100% (currently ${totalShares}%)`)
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!contract || !account || !isCorrectNetwork) {
      toast.error("Please connect your wallet and switch to tCORE Testnet")
      return
    }

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const addresses = beneficiaries.map((b) => b.address)
      const shares = beneficiaries.map((b) => b.share)

      const tx = await contract.createWill(description, executor, addresses, shares, {
        value: ethers.parseEther(creationFee),
      })

      toast.loading("Creating will...", { id: "create-will" })
      await tx.wait()

      toast.success("Will created successfully!", { id: "create-will" })

      // Reset form
      setDescription("")
      setExecutor("")
      setBeneficiaries([{ address: "", share: 0 }])
    } catch (error: any) {
      console.error("Error creating will:", error)
      toast.error(error.reason || "Failed to create will", { id: "create-will" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalShares = beneficiaries.reduce((sum, b) => sum + b.share, 0)

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Create New Will
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Will Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose and details of this will..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="executor" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Executor Address
            </Label>
            <Input
              id="executor"
              placeholder="0x..."
              value={executor}
              onChange={(e) => setExecutor(e.target.value)}
              className="font-mono"
            />
            <p className="text-sm text-slate-500">
              The executor will be responsible for confirming and executing this will.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Beneficiaries
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addBeneficiary}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Beneficiary
              </Button>
            </div>

            <div className="space-y-3">
              {beneficiaries.map((beneficiary, index) => (
                <Card key={index} className="p-4 bg-slate-50 dark:bg-gray-900">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Label className="text-sm">Address</Label>
                      <Input
                        placeholder="0x..."
                        value={beneficiary.address}
                        onChange={(e) => updateBeneficiary(index, "address", e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    <div className="w-24">
                      <Label className="text-sm">Share %</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="0"
                        value={beneficiary.share || ""}
                        onChange={(e) => updateBeneficiary(index, "share", Number.parseInt(e.target.value) || 0)}
                      />
                    </div>
                    {beneficiaries.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeBeneficiary(index)}
                        className="mt-6"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-gray-800 rounded-lg">
              <span className="font-medium">Total Shares:</span>
              <span className={`font-bold ${totalShares === 100 ? "text-green-600" : "text-red-600"}`}>
                {totalShares}%
              </span>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-slate-600 dark:text-gray-400">Creation Fee: {creationFee} tCORE2</span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !account || !isCorrectNetwork || totalShares !== 100}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isSubmitting ? "Creating Will..." : "Create Will"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
