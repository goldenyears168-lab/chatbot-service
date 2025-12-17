'use client'

import { useState } from 'react'
import { AssetOverview } from './AssetOverview'
import { AssetList } from './AssetList'
import { AssetDetail } from './AssetDetail'
import { BreadcrumbNav } from './BreadcrumbNav'
import { SystemArchitecture } from './SystemArchitecture'
import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'
import { ConsolePage, ConsoleHeader, ConsoleShell, ConsoleGrid, ConsoleSidebar, ConsoleMain, ConsoleCard } from '@/components/console/layout'
import { ConsoleH1, ConsoleBody } from '@/components/console/typography'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ClientConsoleProps {
  company: string
  companyName?: string
  companyNameEn?: string
  knowledgeData: {
    totalFiles: number
    totalSize: number
    files: Array<{
      filename: string
      name: string
      key: string
      size: number
      lastModified: string
      data: any
      stats: Record<string, unknown>
    }>
  }
}

export function ClientConsole({ company, companyName, companyNameEn, knowledgeData }: ClientConsoleProps) {
  const [selectedAssetKey, setSelectedAssetKey] = useState<string | null>(
    knowledgeData.files?.[0]?.key || null
  )
  const [activeView, setActiveView] = useState<'assets' | 'architecture'>('assets')
  const { toasts, removeToast } = useToast()
  
  const selectedFile = knowledgeData.files?.find(f => f.key === selectedAssetKey)
  
  return (
    <ConsolePage>
      <Toaster toasts={toasts} onClose={removeToast} />
      <ConsoleHeader>
        <ConsoleShell>
          <BreadcrumbNav 
            company={company} 
            companyName={companyName}
            assetKey={selectedAssetKey || undefined}
            assetName={selectedFile ? selectedFile.name : undefined}
          />
          <div className="flex items-center justify-between mt-4">
            <div>
              <ConsoleH1>
                {companyName || company} - 知識資產控制台
              </ConsoleH1>
              <ConsoleBody className="mt-1">{companyNameEn || company}</ConsoleBody>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {import.meta.env.PROD ? 'Production' : 'Development'}
              </Badge>
            </div>
          </div>
        </ConsoleShell>
      </ConsoleHeader>
      
      <ConsoleShell>
        {/* Main Tabs */}
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'assets' | 'architecture')} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="assets">知識資產</TabsTrigger>
            <TabsTrigger value="architecture">系統架構</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeView === 'assets' && (
          <>
            {/* Overview Section */}
            <div className="mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4">總覽</h2>
              <AssetOverview 
                totalFiles={knowledgeData.totalFiles}
                totalSize={knowledgeData.totalSize}
                files={knowledgeData.files}
              />
            </div>
            
            {/* Two Column Layout */}
            <ConsoleGrid variant="three-col">
              {/* Left: Asset List */}
              <div className="lg:col-span-3">
                <ConsoleSidebar sticky>
                  <ConsoleCard>
                    <div className="p-4 border-b border-[var(--border-subtle)]">
                      <h3 className="text-sm font-semibold text-foreground">知識資產</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {knowledgeData.files?.length || 0} 個檔案
                      </p>
                    </div>
                    <div className="p-4">
                      <AssetList
                        files={knowledgeData.files || []}
                        selectedKey={selectedAssetKey}
                        onSelect={setSelectedAssetKey}
                      />
                    </div>
                  </ConsoleCard>
                </ConsoleSidebar>
              </div>
              
              {/* Right: Asset Detail */}
              <div className="lg:col-span-9">
                {selectedFile ? (
                  <ConsoleMain>
                    <AssetDetail file={selectedFile} />
                  </ConsoleMain>
                ) : (
                  <ConsoleCard>
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">請從左側選擇一項資產查看詳情</p>
                    </div>
                  </ConsoleCard>
                )}
              </div>
            </ConsoleGrid>
          </>
        )}

        {activeView === 'architecture' && (
          <div className="w-full">
            <SystemArchitecture />
          </div>
        )}
      </ConsoleShell>
    </ConsolePage>
  )
}

