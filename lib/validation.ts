import { Node, Edge, Connection } from '@xyflow/react'
type NodeType = 'textNode' | 'imageNode' | 'llmNode'
type OutputType = 'text' | 'image' | 'llm-output'
type InputType = 'prompt' | 'system-prompt' | 'image' | 'generic'

interface NodeTypeInfo {
  outputs: OutputType[]
  inputs: InputType[]
}

const NODE_TYPE_INFO: Record<NodeType, NodeTypeInfo> = {
  textNode: {
    outputs: ['text'],
    inputs: [],
  },
  imageNode: {
    outputs: ['image'],
    inputs: [],
  },
  llmNode: {
    outputs: ['llm-output'],
    inputs: ['prompt', 'system-prompt', 'image'],
  },
}
export function isTypeSafeConnection(
  sourceNode: Node,
  targetNode: Node,
  targetHandle?: string | null
): { valid: boolean; error?: string } {
  const sourceType = sourceNode.type as NodeType
  const targetType = targetNode.type as NodeType

  if (!sourceType || !Object.keys(NODE_TYPE_INFO).includes(sourceType)) {
    return { valid: false, error: `Invalid source node type: ${sourceType}` }
  }

  if (!targetType || !Object.keys(NODE_TYPE_INFO).includes(targetType)) {
    return { valid: false, error: `Invalid target node type: ${targetType}` }
  }

  if (targetType === 'textNode') {
    return {
      valid: false,
      error: 'Text nodes cannot receive connections',
    }
  }
  if (targetType === 'imageNode') {
    return {
      valid: false,
      error: 'Image nodes cannot receive connections',
    }
  }

  if (targetType === 'llmNode') {
    if (sourceType === 'imageNode') {
      const inputIndex = targetHandle
        ? parseInt(targetHandle.split('-')[1])
        : 0

      if (inputIndex < 2) {
        return {
          valid: false,
          error:
            'Image nodes cannot connect to prompt or system prompt inputs',
        }
      }
      return { valid: true }
    }

    if (sourceType === 'textNode') {
      const inputIndex = targetHandle
        ? parseInt(targetHandle.split('-')[1])
        : 0

      if (inputIndex >= 2) {
        return {
          valid: false,
          error: 'Text nodes cannot connect to image inputs',
        }
      }
      return { valid: true }
    }
    if (sourceType === 'llmNode') {
      const inputIndex = targetHandle
        ? parseInt(targetHandle.split('-')[1])
        : 0

      console.log('[Validation] LLM to LLM connection:', {
        targetHandle,
        inputIndex,
        isImageInput: inputIndex >= 2
      })

      if (inputIndex >= 2) {
        return {
          valid: false,
          error: 'LLM output cannot connect to image inputs',
        }
      }
      return { valid: true }
    }
  }

  return {
    valid: false,
    error: 'Invalid connection between these node types',
  }
}
export function wouldCreateCycle(
  nodes: Node[],
  edges: Edge[],
  connection: Connection
): boolean {
  const sourceId = connection.source
  const targetId = connection.target

  if (!sourceId || !targetId) {
    return false
  }

  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId)
    recursionStack.add(nodeId)
    const outgoingEdges = edges.filter((e) => e.source === nodeId)
    for (const edge of outgoingEdges) {
      if (!edge.target) continue

      if (edge.target === sourceId) {
        return true
      }

      if (!visited.has(edge.target)) {
        if (hasCycle(edge.target)) {
          return true
        }
      }
    }

    recursionStack.delete(nodeId)
    return false
  }

  return hasCycle(targetId)
}

export function validateConnection(
  nodes: Node[],
  edges: Edge[],
  connection: Connection
): { valid: boolean; error?: string } {
  const sourceNode = nodes.find((n) => n.id === connection.source)
  const targetNode = nodes.find((n) => n.id === connection.target)

  console.log('[validateConnection] Connection attempt:', {
    source: connection.source,
    sourceType: sourceNode?.type,
    target: connection.target,
    targetType: targetNode?.type,
    targetHandle: connection.targetHandle
  })

  if (!sourceNode) {
    return { valid: false, error: 'Source node not found' }
  }

  if (!targetNode) {
    return { valid: false, error: 'Target node not found' }
  }

  if (sourceNode.id === targetNode.id) {
    return { valid: false, error: 'Cannot connect a node to itself' }
  }

  const typeSafeResult = isTypeSafeConnection(
    sourceNode,
    targetNode,
    connection.targetHandle
  )
  if (!typeSafeResult.valid) {
    console.log('[validateConnection] Validation failed:', typeSafeResult)
    return typeSafeResult
  }
  if (wouldCreateCycle(nodes, edges, connection)) {
    return {
      valid: false,
      error:
        'This connection would create a circular loop. Workflows must be DAGs (Directed Acyclic Graphs)',
    }
  }

  console.log('[validateConnection] Validation passed')
  return { valid: true }
}

export function validateWorkflow(
  nodes: Node[],
  edges: Edge[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const edge of edges) {
    const sourceNode = nodes.find((n) => n.id === edge.source)
    const targetNode = nodes.find((n) => n.id === edge.target)

    if (!sourceNode) {
      errors.push(`Edge references unknown source node: ${edge.source}`)
      continue
    }

    if (!targetNode) {
      errors.push(`Edge references unknown target node: ${edge.target}`)
      continue
    }

    if (sourceNode.id === targetNode.id) {
      errors.push(`Self-loop detected on node: ${sourceNode.id}`)
      continue
    }

    const typeSafeResult = isTypeSafeConnection(
      sourceNode,
      targetNode,
      edge.targetHandle ?? undefined
    )
    if (!typeSafeResult.valid) {
      errors.push(
        `Invalid connection between ${sourceNode.id} and ${targetNode.id}: ${typeSafeResult.error}`
      )
    }
  }
  if (errors.length === 0) {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    function hasCycleDFS(nodeId: string): boolean {
      visited.add(nodeId)
      recursionStack.add(nodeId)

      const outgoingEdges = edges.filter((e) => e.source === nodeId)

      for (const edge of outgoingEdges) {
        if (!edge.target) continue

        if (recursionStack.has(edge.target)) {
          return true
        }

        if (!visited.has(edge.target)) {
          if (hasCycleDFS(edge.target)) {
            return true
          }
        }
      }

      recursionStack.delete(nodeId)
      return false
    }

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (hasCycleDFS(node.id)) {
          errors.push(
            'Circular loop detected in workflow. Workflows must be DAGs (Directed Acyclic Graphs)'
          )
          break
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
