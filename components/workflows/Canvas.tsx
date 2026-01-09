'use client'

import { useRef } from 'react'
import { ReactFlow, Background, Controls, Node, MiniMap } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Undo2, Redo2 } from 'lucide-react'
import ImageNode from '@/components/nodes/image-node'
import TextNode from '@/components/nodes/text-node'
import LLMNode from '@/components/nodes/llm-node'
import CanvasSidebar from '@/components/canvas-sidebar'
import { useCanvasStore } from '@/store/store'

export default function Canvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const {
    nodes,
    edges,
    workflowName,
    isSaving,
    historyStep,
    redoStack,
    connectionError,
    setWorkflowName,
    handleNodesChange,
    handleEdgesChange,
    handleConnect,
    addNode,
    undo,
    redo,
    saveWorkflow,
    exportJSON,
    importJSON,
  } = useCanvasStore()

  const nodeTypes = {
    imageNode: ImageNode,
    textNode: TextNode,
    llmNode: LLMNode,
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const nodeType = e.dataTransfer.getData('application/reactflow') as
      | 'textNode'
      | 'imageNode'
      | 'llmNode'

    if (!nodeType || !reactFlowWrapper.current) return

    const canvasBounds = reactFlowWrapper.current.getBoundingClientRect()
    const position = {
      x: e.clientX - canvasBounds.left,
      y: e.clientY - canvasBounds.top,
    }

    addNode(nodeType, position)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
    <CanvasSidebar onAddNode={(type) => addNode(type)} />
      
      <div
        ref={reactFlowWrapper}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="bg-[#212126] border-b border-gray-800 px-4 py-3 flex items-center gap-2">
          <button
            onClick={undo}
            disabled={historyStep <= 0}
            className="flex items-center gap-2 px-3 py-2 bg-[#2B2B2F] hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 disabled:cursor-not-allowed text-gray-300 hover:text-white rounded transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={18} />
            <span className="text-sm">Undo</span>
          </button>
          
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="flex items-center gap-2 px-3 py-2  bg-[#2B2B2F] hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 disabled:cursor-not-allowed text-gray-300 hover:text-white rounded transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={18} />
            <span className="text-sm">Redo</span>
          </button>

          <div className="border-l border-gray-700 h-6 mx-2"></div>

          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Workflow name..."
            className="px-3 py-2 bg-[#2B2B2F] text-gray-300 placeholder-gray-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <button
            onClick={saveWorkflow}
            disabled={isSaving || !workflowName.trim()}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-900 disabled:text-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            <span className="text-sm">{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
          
          <button
            onClick={exportJSON}
            className="flex items-center gap-2 px-3 py-2 bg-[#2B2B2F] hover:cursor-pointer  text-white rounded transition-colors"
          >
            <span className="text-sm">Export JSON</span>
          </button>
          
          <button
            onClick={importJSON}
            className="flex items-center gap-2 px-3 py-2 bg-[#2B2B2F] hover:cursor-pointer text-white rounded transition-colors"
          >
            <span className="text-sm">Import JSON</span>
          </button>
        </div>
        <ReactFlow
          nodes={nodes}
          onNodesChange={handleNodesChange}
          edges={edges}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          nodeTypes={nodeTypes}
        >
          {connectionError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900/95 border border-red-600 rounded-lg px-4 py-3 text-red-200 text-sm font-medium shadow-lg max-w-md">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{connectionError}</span>
              </div>
            </div>
          )}
          <Background />
          <Controls orientation="horizontal"  position="bottom-center" />

          <MiniMap
            style={{
              backgroundColor: '#2B2B2F',
              border: '1px solid #374151',
              borderRadius: '8px',
            }}
            pannable
            zoomable
            nodeColor={(node) => {
              if (node.type === 'imageNode') return '#10b981'
              if (node.type === 'textNode') return '#8b5cf6'
              if (node.type === 'llmNode') return '#ec4899'
              return '#6b7280'
            }}
            maskColor="rgba(0, 0, 0, 0.3)"
          />
        </ReactFlow>
      </div>
    </div>
  )
}