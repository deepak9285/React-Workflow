'use client'

import { useState, useCallback } from 'react'
import { Handle, Position, useNodes, useEdges, useReactFlow } from '@xyflow/react'
import Menu from '../Menu'
import { useCanvasStore } from '@/store/store'

interface ImageNodeData {
  label?: string
  image?: string
  onUpload?: (file: File) => void
}

export default function ImageNode({ data, id }: { data: ImageNodeData; id: string }) {
  const [showMenu, setShowMenu] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [isEditing, setIsEditing] = useState(false);
const [tempLink, setTempLink] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const { setNodes } = useReactFlow()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement
      if (target.files && target.files[0]) {
        handleFile(target.files[0])
      }
    }
    input.click()
  }

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImageUrl(result)
        setNodes((nodes) =>
          nodes.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, imageUrl: result } } : node
          )
        )
        data.onUpload?.(file)
      }
      reader.readAsDataURL(file)
    }
  }
  const handlePasteLink = () => {
  setIsEditing(true);
};


const saveLink = () => {
  if (!tempLink) return;

  setImageUrl(tempLink);

  setNodes(nodes =>
    nodes.map(node =>
      node.id === id
        ? { ...node, data: { ...node.data, imageUrl: tempLink } }
        : node
    )
  );

  setIsEditing(false);
};

  const handleClearImage = () => {
    setImageUrl(null)
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, imageUrl: null } } : node
      )
    )
  }

  const getConnectedImageData = useCallback(() => {
    return {
      imageUrl: imageUrl,
      hasImage: !!imageUrl
    }
  }, [imageUrl])

  return (
    <div className="bg-[#2B2B2F] rounded-2xl border border-gray-800 shadow-2xl w-80 overflow-hidden">
     
      <div className="flex items-center justify-between px-6 py-4 bg-gray-800/50 border-b border-gray-700">
        <h3 className="text-xl font-semibold text-white">Image</h3>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 hover:bg-gray-700 rounded-md transition-colors text-gray-400 hover:text-white"
        >
          <span className="text-xl">⋯</span>
        </button>
           {showMenu && <Menu id={id} />}
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`relative h-64 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          dragActive ? 'bg-gray-800' : 'bg-gray-950'
        }`}
        style={{
          backgroundImage: `
              linear-gradient(45deg, #2B2B2F 25%, transparent 25%, transparent 75%, #2B2B2F 75%, #2B2B2F),
              linear-gradient(45deg, #2B2B2F 25%, transparent 25%, transparent 75%, #2B2B2F 75%, #2B2B2F)
              `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px',
          backgroundColor: '#212126'
        }}
      >
        {imageUrl ? (
          <div className="w-full h-full flex items-center justify-center relative">
            <img
              src={imageUrl}
              alt="Uploaded"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleClearImage()
              }}
              className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-sm text-gray-300 font-medium">Drag & drop or click to upload</p>
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700">
          {!isEditing ? (
        <button
          onClick={handlePasteLink}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors font-medium"
        >
      {imageUrl || "Paste a file link"}
    </button>
  ) : (
    <input
      autoFocus
      type="text"
      value={tempLink}
      placeholder="Paste your link here..."
      onChange={e => setTempLink(e.target.value)}
      onBlur={saveLink}
      onKeyDown={e => e.key === "Enter" && saveLink()}
      className="w-full text-xs bg-transparent border border-gray-600 rounded px-2 py-1 text-gray-200 focus:outline-none focus:ring-1 focus:ring-white-400"
    />
       )}

      </div>
    
      <Handle type="source" position={Position.Right}  style={{
          color: '#24cb35ff',
          background: '#24cb35ff',
          width: '12px',
          height: '12px',
          border: '3px solid #127d12ff',
          boxShadow: '0 0 10px rgba(168, 85, 247, 0.6)',
        }} />
    </div>
  )
}
