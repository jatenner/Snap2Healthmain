#!/usr/bin/env python3

import re

# Read the file
with open('app/components/PersonalizedNutritionAnalysis.tsx', 'r') as f:
    content = f.read()

# Find the complex parsing section and replace it with simple markdown renderer
start_marker = 'personalizedInsights.split("\\n\\n").map((section, index) => {'
end_marker = '}).filter(Boolean)}'

start_pos = content.find(start_marker)
if start_pos != -1:
    # Find the end of this complex section
    brace_count = 0
    pos = start_pos + len(start_marker)
    while pos < len(content):
        if content[pos] == '{':
            brace_count += 1
        elif content[pos] == '}':
            brace_count -= 1
            if brace_count == -1:  # Found the closing brace
                end_pos = pos + 1
                break
        pos += 1
    
    # Replace with simple markdown renderer
    simple_renderer = '''<div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600/30">
                      <div className="prose prose-invert prose-lg max-w-none">
                        <div 
                          dangerouslySetInnerHTML={{
                            __html: personalizedInsights
                              .replace(/\\*\\*(.*?)\\*\\*/g, '<strong class="text-white font-semibold">$1</strong>')
                              .replace(/### (.*?)$/gm, '<h3 class="text-xl font-bold text-white mt-6 mb-3">$1</h3>')
                              .replace(/## (.*?)$/gm, '<h2 class="text-2xl font-bold text-white mt-8 mb-4">$1</h2>')
                              .replace(/\\n/g, '<br/>')
                          }} 
                        />
                      </div>
                    </div>'''
    
    new_content = content[:start_pos] + simple_renderer + content[end_pos:]
    
    # Write back
    with open('app/components/PersonalizedNutritionAnalysis.tsx', 'w') as f:
        f.write(new_content)
    
    print('Successfully replaced complex parsing with simple markdown renderer')
else:
    print('Could not find the target section') 