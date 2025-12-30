'use client'

import { useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useCanvasStore } from '@/store/store'
import { LockKeyhole } from 'lucide-react'
import Menu from '../Menu'

interface TextNodeData {
  label?: string
  text?: string
  onChange?: (text: string) => void
  isEditing?: boolean
}

export default function TextNode({
  data,
  id,
}: {
  data: TextNodeData
  id: string
}) {
  const { setNodes, saveNodeLabel, getNode } = useCanvasStore()

  const [label, setLabel] = useState(data.label || 'Text')
  const [text, setText] = useState(data.text || '')
  const [showMenu, setShowMenu] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setText(newText)

    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, text: newText } }
          : node
      )
    )

    data.onChange?.(newText)
  }

  return (
    <div
      className="
        w-96 overflow-hidden rounded-2xl
        bg-gradient-to-b from-[#2e2e33] to-[#26262a]
        border border-white/5
        shadow-[0_20px_60px_rgba(0,0,0,0.6)]
      "
    >
      <div
        className="
          flex items-center justify-between
          px-6 py-4
          bg-[#2b2b30]
          border-b border-white/5
        "
      >
        {data.isEditing ? (
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => saveNodeLabel(id, label)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveNodeLabel(id, label)
              if (e.key === 'Escape')
                saveNodeLabel(id, data.label || 'Text')
            }}
            className="
              bg-transparent
              text-white text-sm font-semibold
              outline-none w-full
              border-b border-purple-500/40
            "
          />
        ) : (
          <h3 className="text-sm font-semibold text-white cursor-text">
            {data.label}
          </h3>
        )}

        <div className="relative flex items-center gap-2">
          {getNode(id)?.draggable === false && (
            <LockKeyhole size={16} className="text-gray-400" />
          )}

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="
              p-1 rounded-md
              text-gray-400 hover:text-white
              hover:bg-white/10
              transition-colors
            "
          >
            <span className="text-xl leading-none">⋯</span>
          </button>

          {showMenu && <Menu id={id} />}
        </div>
      </div>

      <div className="p-4 bg-[#2B2B2F]">
        <textarea
          value={text}
          onChange={handleChange}
          placeholder="Text here..."
          className="
            w-full h-56 p-6
            rounded-xl
            bg-[#212126]
            text-gray-300 placeholder-gray-600
            border border-white/5
            resize-none
            focus:outline-none focus:ring-2 focus:ring-purple-500/40
            text-sm leading-relaxed font-mono
            shadow-inner
          "
          spellCheck="false"
        />
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#ffffffff',
          width: '16px',
          height: '16px',
          border: '3px solid #232223ff',
          boxShadow: '0 0 10px rgba(168, 85, 247, 0.6)',
        }}
      />
    </div>
  )
}
