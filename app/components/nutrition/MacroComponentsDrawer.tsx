'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { MacroComponent } from '../../lib/nutrition-buckets';

interface MacroComponentsDrawerProps {
  components: {
    sugar: MacroComponent;
    fiber: MacroComponent;
    starch?: MacroComponent;
    saturatedFat: MacroComponent;
    unsatFat?: MacroComponent;
    transFat?: MacroComponent;
    cholesterol?: MacroComponent;
    sodium?: MacroComponent;
  };
}

const ComponentCard: React.FC<{
  component: MacroComponent;
  name: string;
  parentColor: string;
  description: string;
}> = ({ component, name, parentColor, description }) => {
  const lightColor = parentColor.replace('400', '300');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 rounded-lg p-3 border border-slate-700"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className={`font-medium ${lightColor}`}>{name}</h4>
        <div className="text-right">
          <div className="text-white font-semibold">{component.grams}g</div>
          <div className="text-xs text-slate-400">{component.dv}% DV</div>
        </div>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
    </motion.div>
  );
};

const MacroComponentsDrawer: React.FC<MacroComponentsDrawerProps> = ({ components }) => {
  const [isOpen, setIsOpen] = useState(false);

  const carbComponents = [
    { component: components.sugar, name: 'Sugar (of carbs)', description: 'Quick energy that can cause blood sugar spikes' },
    { component: components.fiber, name: 'Fiber (of carbs)', description: 'Feeds gut bacteria and slows sugar absorption' },
    ...(components.starch ? [{ component: components.starch, name: 'Starch (of carbs)', description: 'Complex carbs that provide sustained energy' }] : [])
  ];

  const fatComponents = [
    { component: components.saturatedFat, name: 'Saturated Fat (of fat)', description: 'Stable fats that raise HDL cholesterol' },
    ...(components.unsatFat ? [{ component: components.unsatFat, name: 'Unsaturated Fat (of fat)', description: 'Heart-healthy fats that reduce inflammation' }] : []),
    ...(components.transFat ? [{ component: components.transFat, name: 'Trans Fat (of fat)', description: 'Artificial fats to avoid - increase disease risk' }] : [])
  ];

  const otherComponents = [
    ...(components.cholesterol ? [{ component: components.cholesterol, name: 'Cholesterol', description: 'Less impact on blood levels than once thought' }] : []),
    ...(components.sodium ? [{ component: components.sodium, name: 'Sodium', description: 'Essential for fluid balance but watch intake' }] : [])
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-white hover:bg-slate-800 transition-colors"
      >
        <span className="font-medium">Macro Components</span>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {carbComponents.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-macro-400 mb-2">Carbohydrate Breakdown</h3>
                  <div className="grid gap-2">
                    {carbComponents.map((item, index) => (
                      <ComponentCard
                        key={index}
                        component={item.component}
                        name={item.name}
                        parentColor="text-macro-400"
                        description={item.description}
                      />
                    ))}
                  </div>
                </div>
              )}

              {fatComponents.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-macro-400 mb-2">Fat Breakdown</h3>
                  <div className="grid gap-2">
                    {fatComponents.map((item, index) => (
                      <ComponentCard
                        key={index}
                        component={item.component}
                        name={item.name}
                        parentColor="text-macro-400"
                        description={item.description}
                      />
                    ))}
                  </div>
                </div>
              )}

              {otherComponents.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Other Components</h3>
                  <div className="grid gap-2">
                    {otherComponents.map((item, index) => (
                      <ComponentCard
                        key={index}
                        component={item.component}
                        name={item.name}
                        parentColor="text-slate-400"
                        description={item.description}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MacroComponentsDrawer; 