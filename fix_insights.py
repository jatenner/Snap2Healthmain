#!/usr/bin/env python3

import re

# Read the file
with open('app/components/PersonalizedNutritionAnalysis.tsx', 'r') as f:
    content = f.read()

# Find the problematic section and replace it
old_pattern = r'personalizedInsights \? \(\s*<div className="space-y-6">.*?\.filter\(Boolean\)\}'
new_content = '''personalizedInsights ? (
                    <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-xl p-8 border border-gray-700/30">
                      {/* Clean, readable display of AI insights */}
                      <div className="prose prose-invert prose-lg max-w-none">
                        <div 
                          className="text-gray-200 leading-relaxed space-y-4"
                          dangerouslySetInnerHTML={{
                            __html: personalizedInsights
                              // Convert markdown headers to clean HTML
                              .replace(/### \\*\\*(.*?)\\*\\*/g, '<h3 class="text-2xl font-bold text-white mt-8 mb-4 pb-2 border-b border-purple-500/30 flex items-center"><span class="mr-3 text-purple-400">📊</span>$1</h3>')
                              .replace(/### (.*?)$/gm, '<h3 class="text-2xl font-bold text-white mt-8 mb-4 pb-2 border-b border-purple-500/30 flex items-center"><span class="mr-3 text-purple-400">📊</span>$1</h3>')
                              .replace(/## \\*\\*(.*?)\\*\\*/g, '<h2 class="text-3xl font-bold text-white mt-10 mb-6 pb-3 border-b-2 border-purple-500/50 flex items-center"><span class="mr-3 text-purple-400">🎯</span>$1</h2>')
                              .replace(/## (.*?)$/gm, '<h2 class="text-3xl font-bold text-white mt-10 mb-6 pb-3 border-b-2 border-purple-500/50 flex items-center"><span class="mr-3 text-purple-400">🎯</span>$1</h2>')
                              // Convert bold text
                              .replace(/\\*\\*(.*?)\\*\\*/g, '<strong class="text-white font-semibold bg-purple-500/20 px-1 rounded">$1</strong>')
                              // Style emoji sections nicely
                              .replace(/📊 (.*?):/g, '<div class="flex items-center mb-3 mt-6 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20"><span class="text-2xl mr-3">📊</span><span class="text-lg font-semibold text-blue-300">$1:</span></div>')
                              .replace(/🔥 (.*?):/g, '<div class="flex items-center mb-3 mt-6 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20"><span class="text-2xl mr-3">🔥</span><span class="text-lg font-semibold text-orange-300">$1:</span></div>')
                              .replace(/💪 (.*?):/g, '<div class="flex items-center mb-3 mt-6 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20"><span class="text-2xl mr-3">💪</span><span class="text-lg font-semibold text-blue-300">$1:</span></div>')
                              .replace(/🥗 (.*?):/g, '<div class="flex items-center mb-3 mt-6 p-3 bg-green-500/10 rounded-lg border border-green-500/20"><span class="text-2xl mr-3">🥗</span><span class="text-lg font-semibold text-green-300">$1:</span></div>')
                              .replace(/⚡ (.*?):/g, '<div class="flex items-center mb-3 mt-6 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20"><span class="text-2xl mr-3">⚡</span><span class="text-lg font-semibold text-yellow-300">$1:</span></div>')
                              .replace(/🎯 (.*?):/g, '<div class="flex items-center mb-3 mt-6 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20"><span class="text-2xl mr-3">🎯</span><span class="text-lg font-semibold text-purple-300">$1:</span></div>')
                              .replace(/🧬 (.*?):/g, '<div class="flex items-center mb-3 mt-6 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20"><span class="text-2xl mr-3">🧬</span><span class="text-lg font-semibold text-indigo-300">$1:</span></div>')
                              .replace(/🍽️ (.*?):/g, '<div class="flex items-center mb-3 mt-6 p-3 bg-gray-500/10 rounded-lg border border-gray-500/20"><span class="text-2xl mr-3">🍽️</span><span class="text-lg font-semibold text-gray-300">$1:</span></div>')
                              .replace(/🌟 (.*?):/g, '<div class="flex items-center mb-3 mt-6 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20"><span class="text-2xl mr-3">🌟</span><span class="text-lg font-semibold text-yellow-300">$1:</span></div>')
                              // Convert progress bars to visual elements
                              .replace(/(████+░*)/g, '<div class="inline-flex items-center ml-2"><div class="bg-gray-700 rounded-full h-3 w-32 overflow-hidden"><div class="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full" style="width: 65%"></div></div></div>')
                              // Convert line breaks properly
                              .replace(/\\n\\n/g, '<br/><br/>')
                              .replace(/\\n/g, '<br/>')
                          }}
                        />
                      </div>
                    </div>'''

# Use a simpler approach - just replace the complex parsing section
# Find the start and end of the problematic section
start_marker = "personalizedInsights.split"
end_marker = "}).filter(Boolean)}"

start_pos = content.find(start_marker)
if start_pos != -1:
    # Find the end position
    end_pos = content.find(end_marker, start_pos)
    if end_pos != -1:
        end_pos += len(end_marker)
        
        # Replace the section
        before = content[:start_pos]
        after = content[end_pos:]
        
        # Simple replacement
        new_section = '''personalizedInsights
                            .replace(/### \\*\\*(.*?)\\*\\*/g, '<h3 class="text-2xl font-bold text-white mt-8 mb-4 pb-2 border-b border-purple-500/30 flex items-center"><span class="mr-3 text-purple-400">📊</span>$1</h3>')
                            .replace(/### (.*?)$/gm, '<h3 class="text-2xl font-bold text-white mt-8 mb-4 pb-2 border-b border-purple-500/30 flex items-center"><span class="mr-3 text-purple-400">📊</span>$1</h3>')
                            .replace(/\\*\\*(.*?)\\*\\*/g, '<strong class="text-white font-semibold">$1</strong>')
                            .replace(/\\n\\n/g, '<br/><br/>')
                            .replace(/\\n/g, '<br/>')'''
        
        new_content = before + new_section + after
        
        # Write the file back
        with open('app/components/PersonalizedNutritionAnalysis.tsx', 'w') as f:
            f.write(new_content)
        
        print("Successfully replaced complex parsing with simple markdown renderer!")
    else:
        print("Could not find end marker")
else:
    print("Could not find start marker") 