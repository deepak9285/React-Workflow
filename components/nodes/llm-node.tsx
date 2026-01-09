'use client';

import React, { useState, useCallback,} from 'react';
import Menu from '../Menu';
import { Handle, Position, useNodes, useEdges } from '@xyflow/react';
import { useCanvasStore } from '@/store/store';
import { Loader } from 'lucide-react';

interface LLMNodeData {
  label: string;
  output?: string;
}

export default function LLMNode({ data, id }: { data: LLMNodeData; id: string }) {

  const [output, setOutput] = useState(data.output || '');
  const [showMenu, setShowMenu] = useState(false);
  const [inputCount, setInputCount] = useState(2);
  const [isNodeHovered, setIsNodeHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const [temperature, setTemperature] = useState(0.7);
  const nodes = useNodes();
  const edges = useEdges();
  const { handleNodeDataChange } = useCanvasStore();
  const inputLabels = ['Prompt', 'Image'];
  
  const geminiModels = [
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro-exp-0827',
    'gemini-pro',
  ];
  const handleAddInput = () => {
    setInputCount(inputCount + 1);
  };

  const getConnectedTextInput = useCallback(() => {
    console.log("edges",edges);
    const connectedEdges = edges.filter((edge) => edge.target === id);

    
    console.log('Connected edges to LLM node:', connectedEdges);
    console.log('All nodes:', nodes);
    
    if (connectedEdges.length === 0) {
      console.log('No connected edges found');
      return '';
    }

    for (const edge of connectedEdges) {
      const sourceNode = nodes.find((node) => node.id === edge.source);
      console.log('Checking source node:', sourceNode);

      // Check for text node input
      if (sourceNode && sourceNode.type === 'textNode' && sourceNode.data) {
        const text = sourceNode.data.text || '';
        console.log('Found text from node:', text);
        if (text) return text;
      }

      // Check for LLM node output
      if (sourceNode && sourceNode.type === 'llmNode' && sourceNode.data) {
        const llmOutput = sourceNode.data.output || '';
        console.log('Found output from LLM node:', llmOutput);
        if (llmOutput) return llmOutput;
      }
    }

    return '';
  }, [nodes, edges, id]);

  const getConnectedImages = useCallback(() => {
    console.log("edges",edges);
    const connectedEdges = edges.filter((edge) => edge.target === id);

    console.log('Connected edges to LLM node:', connectedEdges);
    console.log('All nodes:', nodes);
    
    const images = [];

    for (const edge of connectedEdges) {
      const sourceNode = nodes.find((node) => node.id === edge.source);
      console.log('Checking source node:', sourceNode);

      if (sourceNode && sourceNode.type === 'imageNode' && sourceNode.data) {
        const imageUrl = sourceNode.data.imageUrl;
        if (imageUrl) {
          images.push({
            nodeId: sourceNode.id,
            imageUrl: imageUrl
          });
        }
      }
    }

    return images;
  }, [nodes, edges, id]);

  const checkImageNodeConnected = useCallback(() => {
    const connectedEdges = edges.filter((edge) => edge.target === id);
    
    for (const edge of connectedEdges) {
      const sourceNode = nodes.find((node) => node.id === edge.source);
      if (sourceNode && sourceNode.type === 'imageNode') {
        return true;
      }
    }
    
    return false;
  }, [nodes, edges, id]);

  const checkTextNodeConnected = useCallback(() => {
    const connectedEdges = edges.filter((edge) => edge.target === id);
    
    for (const edge of connectedEdges) {
      const sourceNode = nodes.find((node) => node.id === edge.source);
      if (sourceNode && sourceNode.type === 'textNode') {
        return true;
      }
    }
    
    return false;
  }, [nodes, edges, id]);

  const handleRunModel = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const prompt = getConnectedTextInput();
      const images = getConnectedImages();
      const hasImageNode = checkImageNodeConnected();
      const hasTextNode = checkTextNodeConnected();
      if (hasImageNode && !hasTextNode) {
        setError('When using an image node, you must also connect a text node to provide a prompt.');
        setIsLoading(false);
        return;
      }

      if (!prompt) {  
        setError('No input text found. Please connect a text node to the Prompt input.');
        setIsLoading(false);
        return;
      }

      setOutput('Processing...');

      const payload: any = {
        prompt,
        temperature: temperature,
        maxTokens: 1000,
     //   model: selectedModel,
      };

      if (images && images.length > 0) {
        payload.images = images;
      }

      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("dfS", result);

      if (!response.ok) {
        setError(result.error || 'Failed to generate response');
        setOutput('');
      } else if (result.success) {
        setOutput(result.response);
        // Update node data in store so connected nodes can read the output
        handleNodeDataChange(id, { output: result.response });
      } else {
        setError('Unknown error occurred');
        setOutput('');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to call LLM API';
      setError(errorMsg);
      setOutput('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunWithSettings = () => {
    setShowConfigPanel(false);
   
  };

  return (
    <div
      className="w-96 bg-[#2B2B2F] border border-gray-700 rounded-lg overflow-hidden shadow-xl"
      onMouseEnter={() => setIsNodeHovered(true)}
      onMouseLeave={() => setIsNodeHovered(false)}
    >
      <div className="bg-[#2B2B2F] px-6 py-4 flex items-center justify-between border-b border-gray-700">
        <h3 className="text-white font-semibold text-lg">{data.label}</h3>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <span className="text-xl">⋯</span>
          </button>

           {showMenu && <Menu id={id} />}
        </div>
      </div>

      <div className="absolute left-0 top-20 space-y-16">
        {Array.from({ length: inputCount }).map((_, i) => (
          <div key={`input-${i}`} className="relative flex items-center">
            {isNodeHovered && (
              <div className="absolute -left-32 top-1/2 -translate-y-1/2 bg-gray-800 border border-purple-500 rounded px-3 py-1 text-purple-300 text-xs font-medium whitespace-nowrap z-50">
                {inputLabels[i] || `Input ${i + 1}`}
              </div>
            )}

            <Handle
              type="target"
              position={Position.Left}
              id={`input-${i}`}
              className="w-4 h-4 bg-purple-500 border-2 border-purple-400 rounded-full hover:scale-125 transition-transform"
                style={{
                background: '#a855f7',
                width: '12px',
                height: '12px',
                border: '3px solid #831bf5',
                boxShadow: '0 0 10px rgba(168, 85, 247, 0.6)'}}
            />
          </div>
        ))}
      </div>

      <div className="px-6 py-6">
        <div className="bg-[#212126] border border-gray-700 rounded p-4 min-h-56 max-h-56 overflow-y-auto">
          <p className="text-gray-400 text-sm leading-relaxed font-mono whitespace-pre-wrap">
            {output || 'The generated text will appear here'}
          </p>
          {error && (
            <div className="mt-3 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-xs">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 justify-end bg-[#2B2B2F] border-t border-gray-700 flex items-center justify-between gap-3">
        <button
          onClick={() =>  handleRunModel()}
          disabled={isLoading}
          className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-medium text-sm transition-colors flex items-center gap-2"
        >
          <span>{isLoading ? <Loader />: 'Run Model'}</span>
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-4 h-4 bg-purple-500 border-2 border-purple-400 rounded-full hover:scale-125 transition-transform"
       style={{
          background: '#ded8e3ff',
          width: '12px',
          height: '12px',
          border: '3px solid #831bf5',
          boxShadow: '0 0 10px rgba(168, 85, 247, 0.6)'}}
      />
      <style>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #2d2e2fff;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #333435ff;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #353536ff;
        }
      `}</style>
      {showConfigPanel && (
        <div className="fixed inset-0 z-50 pointer-events-auto">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowConfigPanel(false)}
          />
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute top-20 left-0 w-full flex items-start"
              style={{ height: 'calc(100% - 6rem)' }}
            >
              <div
                className="mx-auto transform will-change-transform bg-transparent"
                style={{ width: '100%' }}
              >
                <div
                  className="mx-auto w-96 bg-gray-900 border border-gray-700 rounded shadow-2xl p-6"
                  style={{
                    animation: 'slide-right-to-left 900ms ease forwards',
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-semibold text-lg">LLM Options</h2>
                    <button
                      onClick={() => setShowConfigPanel(false)}
                      className="text-gray-400 hover:text-white p-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-3 max-h-56 overflow-y-auto mb-4">
                    {geminiModels.map((m) => (
                      <button
                        key={m}
                        onClick={() => setSelectedModel(m)}
                        className={`w-full text-left px-3 py-2 rounded transition-colors text-sm font-medium ${
                          selectedModel === m ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm text-white font-semibold mb-2">Temperature</label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="mt-2 flex items-center justify-between text-sm text-gray-300">
                      <span>Value</span>
                      <span className="font-semibold text-white">{temperature.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleRunWithSettings}
                      disabled={isLoading}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium"
                    >
                      {isLoading ? 'Running...' : 'Run Model'}
                    </button>
                    <button
                      onClick={() => setShowConfigPanel(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes slide-right-to-left {
              0% { transform: translateX(100vw); }
              50% { transform: translateX(0vw); }
              100% { transform: translateX(-72vw); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
