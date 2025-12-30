import { create } from 'zustand'
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react'

interface CanvasState {
  nodes: Node[]
  edges: Edge[]
  history: Node[][]
  historyStep: number
  redoStack: Node[][]
  activeTool: 'draw' | 'pan'
  zoomLevel: number
  workflowName: string
  isSaving: boolean
  workflows: any[]
  showLoadModal: boolean
  settingsOpen: boolean
  saveNodeLabel: (nodeId: string, label: string) => void
  settingsPos: { x: number; y: number }
  settingsTarget: string | null
  settingsActions: any
  viewBackup: { nodes: Node[]; edges: Edge[] } | null
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void
  setHistory: (history: Node[][]) => void
  setHistoryStep: (step: number) => void
  setRedoStack: (stack: Node[][] | ((prev: Node[][]) => Node[][])) => void
  setActiveTool: (tool: 'draw' | 'pan') => void
  setZoomLevel: (level: number) => void
  setWorkflowName: (name: string) => void
  setIsSaving: (saving: boolean) => void
  setWorkflows: (workflows: any[]) => void
  setShowLoadModal: (show: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setSettingsPos: (pos: { x: number; y: number }) => void
  setSettingsTarget: (target: string | null) => void
  setSettingsActions: (actions: any) => void
  setViewBackup: (backup: { nodes: Node[]; edges: Edge[] } | null) => void
  handleNodesChange: (changes: NodeChange[]) => void
  handleEdgesChange: (changes: EdgeChange[]) => void
  handleConnect: (connection: Connection) => void
  handleNodeDataChange: (nodeId: string, newData: any) => void
  addNode: (type: 'textNode' | 'imageNode' | 'llmNode', position?: { x: number; y: number }) => void
  duplicateNode: (nodeId: string) => void
  renameNode: (nodeId: string) => void
  lockNode: (nodeId: string) => void
  deleteNode: (nodeId: string) => void
  getNode: (nodeId: string) => Node | undefined
  undo: () => void
  redo: () => void
  openSettings: (nodeId: string, x?: number, y?: number, actions?: any) => void
  closeSettings: () => void
  viewSingleNode: (nodeId: string) => void
  viewAllNodes: () => void
  saveWorkflow: () => Promise<void>
  loadWorkflows: () => Promise<void>
  loadWorkflow: (workflow: any) => void
  exportJSON: () => void
  importJSON: () => void
  addToHistory: (nodes: Node[]) => void
  getEdgeColor: (sourceNodeId: string) => string
}

export const useCanvasStore = create<CanvasState>((set, get) => ({

  nodes: [],
  edges: [],
  history: [[]],
  historyStep: 0,
  redoStack: [],
  activeTool: 'pan',
  zoomLevel: 100,
  workflowName: '',
  isSaving: false,
  workflows: [],
  showLoadModal: false,
  settingsOpen: false,
  settingsPos: { x: 0, y: 0 },
  settingsTarget: null,
  settingsActions: {},
  viewBackup: null,

  setNodes: (nodes) => {
    set((state) => ({
      nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes,
    }))
  },

  setEdges: (edges) => {
    set((state) => ({
      edges: typeof edges === 'function' ? edges(state.edges) : edges,
    }))
  },

  setHistory: (history) => set({ history }),
  
  setHistoryStep: (step) => set({ historyStep: step }),
  
  setRedoStack: (stack) => {
    set((state) => ({
      redoStack: typeof stack === 'function' ? stack(state.redoStack) : stack,
    }))
  },

  setActiveTool: (tool) => set({ activeTool: tool }),
  
  setZoomLevel: (level) => set({ zoomLevel: level }),
  
  setWorkflowName: (name) => set({ workflowName: name }),
  
  setIsSaving: (saving) => set({ isSaving: saving }),
  
  setWorkflows: (workflows) => set({ workflows }),
  
  setShowLoadModal: (show) => set({ showLoadModal: show }),
  
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  
  setSettingsPos: (pos) => set({ settingsPos: pos }),
  
  setSettingsTarget: (target) => set({ settingsTarget: target }),
  
  setSettingsActions: (actions) => set({ settingsActions: actions }),
  
  setViewBackup: (backup) => set({ viewBackup: backup }),

  handleNodesChange: (changes) => {
    set((state) => {
      const updatedNodes = applyNodeChanges(changes, state.nodes)
      const newHistory = state.history.slice(0, state.historyStep + 1)
      newHistory.push(updatedNodes)
      return {
        nodes: updatedNodes,
        history: newHistory,
        historyStep: newHistory.length - 1,
        redoStack: [],
      }
    })
  },
  handleEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }))
  },

  handleConnect: (connection) => {
    const newEdge = {
      ...connection,
      style: {
        stroke: 'purple',
        strokeWidth: 3,
      },
    }
    set((state) => ({
      edges: addEdge(newEdge, state.edges),
    }))
  },

  handleNodeDataChange: (nodeId, newData) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      ),
    }))
  },

  addNode: (type, position) => {
    const nodeId = `${type}-${Date.now()}`
    const newNode: Node = {
      id: nodeId,
      position: position || { 
        x: Math.random() * 400 + 200, 
        y: Math.random() * 400 + 100 
      },
      data: {
        label:
          type === 'imageNode'
            ? 'Upload Image'
            : type === 'llmNode'
            ? 'Any LLM'
            : 'Text',
        text: type === 'textNode' ? '' : undefined,
      },
      type,
    }

    set((state) => {
      const updatedNodes = [...state.nodes, newNode]
      const newHistory = state.history.slice(0, state.historyStep + 1)
      newHistory.push(updatedNodes)
      return {
        nodes: updatedNodes,
        history: newHistory,
        historyStep: newHistory.length - 1,
        redoStack: [],
      }
    })
  },

  duplicateNode: (nodeId) => {
  
    set((state) => {
      const node = state.nodes.find((n) => n.id === nodeId)
      if (!node) return state
      const newId = `${node.type}-${Date.now()}`
      const cloned: Node = {
        ...JSON.parse(JSON.stringify(node)),
        id: newId,
        position: { x: node.position.x + 24, y: node.position.y + 24 },
      }
      const updatedNodes = [...state.nodes, cloned]
      const newHistory = state.history.slice(0, state.historyStep + 1)
      newHistory.push(updatedNodes)
      
      return {
        nodes: updatedNodes,
        history: newHistory,
        historyStep: newHistory.length - 1,
        redoStack: [],
      }
    })
  },
renameNode: (nodeId) => {
  set((state) => ({
    nodes: state.nodes.map((n) =>
      n.id === nodeId
        ? { ...n, data: { ...n.data, isEditing: true } }
        : n
    ),
  }))
},
saveNodeLabel: (nodeId:any, label:any) => {
  set((state) => {
    const updatedNodes = state.nodes.map((n) =>
      n.id === nodeId
        ? {
            ...n,
            data: {
              ...n.data,
              label: label.trim() || n.data.label,
              isEditing: false,
            },
          }
        : n
    )

    const newHistory = state.history.slice(0, state.historyStep + 1)
    newHistory.push(updatedNodes)

    return {
      nodes: updatedNodes,
      history: newHistory,
      historyStep: newHistory.length - 1,
      redoStack: [],
    }
  })
},
  lockNode: (nodeId) => {
    set((state) => {
      const updatedNodes = state.nodes.map((n) =>
        n.id === nodeId ? { ...n,draggable:false } : n
      )
      const newHistory = state.history.slice(0, state.historyStep + 1)
      newHistory.push(updatedNodes)
      return {
        nodes: updatedNodes,
        history: newHistory,
        historyStep: newHistory.length - 1,
      }
    })
  },
  getNode:(nodeId)=>{
    const {nodes}=get();
    return nodes.find((n) => n.id === nodeId);
  },

  deleteNode: (nodeId) => {
    set((state) => {
      const remainingNodes = state.nodes.filter((n) => n.id !== nodeId)
      const remainingEdges = state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      )
      const newHistory = state.history.slice(0, state.historyStep + 1)
      newHistory.push(remainingNodes)
      return {
        nodes: remainingNodes,
        edges: remainingEdges,
        history: newHistory,
        historyStep: newHistory.length - 1,
      }
    })
  },

  undo: () => {
    set((state) => {
      if (state.historyStep > 0) {
        const newStep = state.historyStep - 1
        return {
          nodes: state.history[newStep],
          historyStep: newStep,
          redoStack: [state.history[state.historyStep], ...state.redoStack],
        }
      }
      return state
    })
  },

  redo: () => {
    set((state) => {
      if (state.redoStack.length > 0) {
        const nextState = state.redoStack[0]
        const newHistory = [...state.history.slice(0, state.historyStep + 1), nextState]
        return {
          history: newHistory,
          historyStep: state.historyStep + 1,
          nodes: nextState,
          redoStack: state.redoStack.slice(1),
        }
      }
      return state
    })
  },

  openSettings: (nodeId, x = 16, y = 64, actions = {}) => {
    set({
      settingsOpen: true,
      settingsTarget: nodeId,
      settingsPos: { x, y },
      settingsActions: actions,
    })
  },

  closeSettings: () => {
    set({
      settingsOpen: false,
      settingsTarget: null,
      settingsActions: {},
    })
  },

  viewSingleNode: (nodeId) => {
    set((state) => {
      const focused = state.nodes.find((n) => n.id === nodeId)
      if (!focused) return state

      return {
        viewBackup: state.viewBackup || { nodes: [...state.nodes], edges: [...state.edges] },
        nodes: [focused],
        edges: [],
      }
    })
  },

  viewAllNodes: () => {
    set((state) => {
      if (state.viewBackup) {
        return {
          nodes: state.viewBackup.nodes,
          edges: state.viewBackup.edges,
          viewBackup: null,
        }
      }
      return state
    })
  },

  saveWorkflow: async () => {
    const { workflowName, nodes, edges, setIsSaving, setWorkflowName } = get()
    if (!workflowName.trim()) {
      alert('Please enter a workflow name')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowName, description: '', nodes, edges }),
      })

      const data = await response.json()
      if (data.success) {
        alert(`Workflow "${workflowName}" saved successfully!`)
        setWorkflowName('')
      } else {
        alert('Failed to save workflow')
      }
    } catch (error) {
      alert('Error saving workflow: ' + String(error))
    } finally {
      setIsSaving(false)
    }
  },

  loadWorkflows: async () => {
    try {
      const response = await fetch('/api/workflows')
      const data = await response.json()
      if (data.success) {
        set({ workflows: data.data, showLoadModal: true })
      }
    } catch (error) {
      alert('Error loading workflows: ' + String(error))
    }
  },

  loadWorkflow: (workflow) => {
    set({
      nodes: workflow.nodes,
      edges: workflow.edges,
      showLoadModal: false,
    })
  },
  
  exportJSON: () => {
    const { workflowName, nodes, edges } = get()
    const workflow = {
      name: workflowName || 'Workflow',
      nodes,
      edges,
      exportedAt: new Date().toISOString(),
    }
    const dataStr = JSON.stringify(workflow, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${workflow.name || 'workflow'}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },

  importJSON: () => {
    const { history, historyStep, setNodes, setEdges, setWorkflowName, setHistory, setHistoryStep, setRedoStack } = get()
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string)

          if (!jsonData.nodes || !Array.isArray(jsonData.nodes)) {
            alert('Invalid workflow file: missing or invalid nodes')
            return
          }

          if (!jsonData.edges || !Array.isArray(jsonData.edges)) {
            alert('Invalid workflow file: missing or invalid edges')
            return
          }

          const newHistory = history.slice(0, historyStep + 1)
          newHistory.push(jsonData.nodes)
          
          setNodes(jsonData.nodes)
          setEdges(jsonData.edges)
          setWorkflowName(jsonData.name || '')
          setHistory(newHistory)
          setHistoryStep(newHistory.length - 1)
          setRedoStack([])

          alert('Workflow imported successfully!')
        } catch (error) {
          alert('Error parsing JSON file: ' + String(error))
        }
      }
      reader.onerror = () => {
        alert('Error reading file')
      }
      reader.readAsText(file)
    }
    input.click()
  },

  addToHistory: (nodes) => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyStep + 1)
      newHistory.push(nodes)
      return {
        history: newHistory,
        historyStep: newHistory.length - 1,
        redoStack: [],
      }
    })
  },

  getEdgeColor: (sourceNodeId) => {
    const { nodes } = get()
    const sourceNode = nodes.find((node) => node.id === sourceNodeId)
    if (!sourceNode) return '#a855f7'
    switch (sourceNode.type) {
      case 'imageNode':
        return '#10b981'
      case 'textNode':
        return '#8b5cf6'
      case 'llmNode':
        return '#ec4899'
      default:
        return '#a855f7'
    }
  },
}))