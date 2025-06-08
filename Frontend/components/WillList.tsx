"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "./Web3Context"
import WillCard from "./WillCard"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, FileX } from "lucide-react"

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

interface WillListProps {
  type: "testator" | "executor"
}

export default function WillList({ type }: WillListProps) {
  const { contract, account, isCorrectNetwork } = useWeb3()
  const [wills, setWills] = useState<Will[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWills = async () => {
    if (!contract || !account || !isCorrectNetwork) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      let willIds: bigint[] = []

      if (type === "testator") {
        willIds = await contract.getWillsByTestator(account)
      } else {
        willIds = await contract.getWillsByExecutor(account)
      }

      const willsData = await Promise.all(
        willIds.map(async (id) => {
          const will = await contract.wills(id)
          const balance = await contract.getWillBalance(id)

          return {
            id: Number(id),
            testator: will.testator,
            executor: will.executor,
            description: will.description,
            isActive: will.isActive,
            isExecuted: will.isExecuted,
            balance: balance.toString(),
            beneficiaries: will.beneficiaries,
            shares: will.shares.map((s: bigint) => Number(s)),
            createdAt: Number(will.createdAt),
            executionConfirmed: will.executionConfirmed,
          }
        }),
      )

      setWills(willsData)
    } catch (error) {
      console.error("Error fetching wills:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWills()
  }, [contract, account, isCorrectNetwork, type])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading wills...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!account || !isCorrectNetwork) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <FileX className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              Please connect your wallet and switch to tCORE Testnet to view wills.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (wills.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <FileX className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              {type === "testator"
                ? "You haven't created any wills yet."
                : "You are not assigned as an executor for any wills."}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {wills.map((will) => (
        <WillCard key={will.id} will={will} type={type} onUpdate={fetchWills} />
      ))}
    </div>
  )
}
