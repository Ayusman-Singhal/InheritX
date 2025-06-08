"use client"

import { useState } from "react"
import { Web3Provider } from "@/components/Web3Context"
import Header from "@/components/Header"
import WillForm from "@/components/WillForm"
import WillList from "@/components/WillList"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Plus, Gavel } from "lucide-react"
import { Toaster } from "react-hot-toast"

export default function App() {
  const [activeTab, setActiveTab] = useState("my-wills")

  return (
    <Web3Provider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Header />

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Will Transfer DAO</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Create and manage digital wills on the blockchain. Secure, transparent, and decentralized estate planning.
            </p>
          </div>

          <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                  <TabsTrigger value="my-wills" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    My Wills
                  </TabsTrigger>
                  <TabsTrigger value="create-will" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Will
                  </TabsTrigger>
                  <TabsTrigger value="executor-duties" className="flex items-center gap-2">
                    <Gavel className="w-4 h-4" />
                    Executor Duties
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="my-wills" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Your Wills</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Manage wills you've created as a testator.
                    </p>
                    <WillList type="testator" />
                  </div>
                </TabsContent>

                <TabsContent value="create-will" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Create New Will</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Create a new digital will with beneficiaries and an executor.
                    </p>
                    <WillForm />
                  </div>
                </TabsContent>

                <TabsContent value="executor-duties" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Executor Duties</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Manage wills where you are assigned as the executor.
                    </p>
                    <WillList type="executor" />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>

        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
          }}
        />
      </div>
    </Web3Provider>
  )
}
