import { useCanvasStore } from '@/store/store';

export default function Menu({ id }: { id: string }) {
const { duplicateNode, renameNode, unlockNode, lockNode, deleteNode } = useCanvasStore();
return (
     <div className="absolute right-0 mt-20 ml-30 w-40 bg-[#212126] border border-gray-700 rounded-lg shadow-lg z-50">
              <button
                onClick={() => duplicateNode(id)}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors border-b border-gray-700"
              >Duplicate
              </button>
              <button
                onClick={() => renameNode(id)}
                className="w-full text-left px-4 py-2 text-sm  hover:bg-gray-700 transition-colors"
              >
              Rename
              </button>
              <button
                onClick={() => lockNode(id)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
              >
              Lock
              </button>
              <button
                onClick={() => deleteNode(id)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
              >
              Delete
              </button>
            </div>
)
}