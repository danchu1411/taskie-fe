import { useState } from 'react';

/**
 * Demo component để showcase các transition effects
 */
export default function TransitionDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [showItems, setShowItems] = useState(false);

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold text-slate-900">Transition Effects Demo</h2>
      
      {/* Dropdown Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-700">Dropdown Transition</h3>
        <div className="relative inline-block">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isOpen 
                ? 'bg-indigo-700 text-white scale-105 shadow-lg' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105'
            }`}
          >
            Toggle Dropdown
          </button>
          
          <div className={`absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg z-50 ${
            isOpen 
              ? 'animate-dropdown-in opacity-100 scale-100 translate-y-0 pointer-events-auto' 
              : 'animate-dropdown-out opacity-0 scale-95 -translate-y-2 pointer-events-none'
          }`}>
            <div className="py-1">
              <div className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                Menu Item 1
              </div>
              <div className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                Menu Item 2
              </div>
              <div className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                Menu Item 3
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fade In Items Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-700">Cascade Animation</h3>
        <button
          onClick={() => setShowItems(!showItems)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          {showItems ? 'Hide' : 'Show'} Items
        </button>
        
        <div className="space-y-2">
          {showItems && (
            <>
              <div 
                className="p-4 bg-blue-50 rounded-lg animate-fade-in"
                style={{ animationDelay: '0.1s' }}
              >
                Item 1 - Fade in with delay
              </div>
              <div 
                className="p-4 bg-green-50 rounded-lg animate-fade-in"
                style={{ animationDelay: '0.2s' }}
              >
                Item 2 - Fade in with delay
              </div>
              <div 
                className="p-4 bg-purple-50 rounded-lg animate-fade-in"
                style={{ animationDelay: '0.3s' }}
              >
                Item 3 - Fade in with delay
              </div>
            </>
          )}
        </div>
      </div>

      {/* Scale Animation Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-700">Scale Animation</h3>
        <div className="flex gap-4">
          <div className="p-4 bg-slate-100 rounded-lg hover:scale-105 transition-transform duration-200 cursor-pointer">
            Hover to scale
          </div>
          <div className="p-4 bg-slate-100 rounded-lg hover:scale-110 transition-transform duration-300 cursor-pointer">
            Hover to scale more
          </div>
          <div className="p-4 bg-slate-100 rounded-lg hover:scale-95 transition-transform duration-150 cursor-pointer">
            Hover to shrink
          </div>
        </div>
      </div>

      {/* Slide Animation Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-700">Slide Animation</h3>
        <div className="p-4 bg-slate-100 rounded-lg animate-slide-up">
          This element slides up when it appears
        </div>
      </div>
    </div>
  );
}
