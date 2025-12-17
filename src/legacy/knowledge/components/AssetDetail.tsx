'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AssetHeader } from './AssetHeader'
import { AssetSummary } from './AssetSummary'
import { AssetSchema } from './AssetSchema'
import { AssetExamples } from './AssetExamples'
import { AssetRawJSON } from './AssetRawJSON'

interface AssetDetailProps {
  file: {
    filename: string
    name: string
    key: string
    size: number
    lastModified: string
    data: any
    stats: Record<string, unknown>
  }
}

export function AssetDetail({ file }: AssetDetailProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [highlightPath] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {/* Asset Header */}
      <AssetHeader file={file} />
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概覽</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="examples">範例</TabsTrigger>
          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <AssetSummary assetKey={file.key} assetData={file.data} />
        </TabsContent>
        
        <TabsContent value="schema" className="mt-4">
          <AssetSchema assetKey={file.key} assetData={file.data} />
        </TabsContent>
        
        <TabsContent value="examples" className="mt-4">
          <AssetExamples 
            assetKey={file.key} 
            assetData={file.data}
          />
        </TabsContent>
        
        <TabsContent value="raw" className="mt-4">
          <AssetRawJSON 
            assetData={file.data} 
            filename={file.filename}
            highlightPath={highlightPath}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

