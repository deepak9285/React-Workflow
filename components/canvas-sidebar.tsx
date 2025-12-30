'use strict';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Sparkle,Image } from 'lucide-react';

interface CanvasSidebarProps {
  onAddNode: (type: 'textNode' | 'imageNode' | 'llmNode') => void;
}

export default function CanvasSidebar({ onAddNode }: CanvasSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const quickAccessItems = [
    { id: 'text', label: 'Text Node', type: 'textNode', icon: 'T' },
    { id: 'image', label: 'Image Node', type: 'imageNode', icon: <Image /> },
    { id: 'llm', label: 'Run any LLM Node', type: 'llmNode', icon: <Sparkle size={16} /> },
  ];

  const filteredItems = quickAccessItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/reactflow', nodeType);
  };

  return (
    <div
      className={`bg-[#212126] border-r border-gray-800 transition-all duration-300 flex flex-col h-full ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {!isCollapsed && <h2 className="text-white font-semibold text-lg">Nodes</h2>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-400 hover:text-white transition-colors p-2 rounded hover:bg-gray-800"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#212126] border border-gray-700 rounded px-4 py-2 pl-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4">
        {!isCollapsed && (
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">
            Quick Access
          </h3>
        )}

        <div className={`space-y-2 ${isCollapsed ? 'space-y-3' : ''}`}>
          {filteredItems.map((item) => (
            <button
              key={item.id}
              draggable
              onDragStart={(e) => onDragStart(e, item.type)}
              onClick={() => onAddNode(item.type as 'textNode' | 'imageNode' | 'llmNode')}
              className={`w-full group relative flex items-center gap-3 px-4 py-3 rounded-lg bg-[#212126] hover:bg-gray-700 transition-colors border border-gray-700 hover:border-purple-500 cursor-move ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title={isCollapsed ? item.label : 'Drag to canvas or click to add'}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {!isCollapsed && (
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  {item.label}
                </span>
              )}

              {isCollapsed && (
                <div className="absolute left-full ml-2 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </div>

        {filteredItems.length === 0 && !isCollapsed && (
          <p className="text-gray-500 text-sm text-center py-8">No nodes found</p>
        )}
      </div>

      {!isCollapsed && (
        <div className="p-4 border-t border-gray-800 text-gray-500 text-xs">
          <p className="mb-2">Drag nodes to canvas or click to add</p>
        </div>
      )}
    </div>
  );
}
