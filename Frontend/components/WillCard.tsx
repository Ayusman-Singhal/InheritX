"use client"

import { useState } from "react"
import WillDetails from "./WillDetails"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Eye, DollarSign, Users, Calendar, CheckCircle, XCircle, Clock } from "lucide-react"
import { ethers } from "ethers"

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

interface WillCardProps {
  will: Will
  type: "testator" | "executor"
  onUpdate: () => void
}

export default function WillCard({ will, type, onUpdate }: WillCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getStatusBadge = () => {
    if (will.isExecuted) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Executed
        </Badge>
      )
    }
    if (!will.isActive) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          Inactive
        </Badge>
      )
    }
    if (will.executionConfirmed) {
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          Execution Confirmed
        </Badge>
      )
    }
    return <Badge variant="default">Active</Badge>
  }

  const getStatusIcon = () => {
    if (will.isExecuted) {
      return <CheckCircle className="w-4 h-4 text-green-600" />
    }
    if (!will.isActive) {
      return <XCircle className="w-4 h-4 text-gray-600" />
    }
    if (will.executionConfirmed) {
      return <Clock className="w-4 h-4 text-orange-600" />
    }
    return <CheckCircle className="w-4 h-4 text-blue-600" />
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Will #{will.id}
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              {getStatusBadge()}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{will.description}</p>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Balance:</span>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium">
                  {Number.parseFloat(ethers.formatEther(will.balance)).toFixed(4)} tCORE2
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Beneficiaries:</span>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{will.beneficiaries.length}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Created:</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(will.createdAt)}</span>
              </div>
            </div>

            {type === "testator" ? (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Executor:</span>
                <span className="font-mono text-xs">{formatAddress(will.executor)}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Testator:</span>
                <span className="font-mono text-xs">{formatAddress(will.testator)}</span>
              </div>
            )}
          </div>

          <Button variant="outline" className="w-full" onClick={() => setShowDetails(true)}>
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </CardContent>
      </Card>

      <WillDetails
        will={will}
        type={type}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        onUpdate={onUpdate}
      />
    </>
  )
}
