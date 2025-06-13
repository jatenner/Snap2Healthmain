#!/usr/bin/env python3

import re

# Read the file
with open('app/components/PersonalizedNutritionAnalysis.tsx', 'r') as f:
    content = f.read()

# Find the start of the complex parsing section
start_pattern = r'personalizedInsights\.split\(\'\\n\\n\'\)\.map\(\(section, index\) => \{'
start_match = re.search(start_pattern, content)

if start_match:
    start_pos = start_match.start()
    
    # Find the matching closing brace for this map function
    pos = start_pos
    brace_count = 0
    in_map = False
    
    while pos < len(content):
        char = content[pos]
        
        if char == '{':
            brace_count += 1
            if not in_map:
                in_map = True
        elif char == '}':
            brace_count -= 1
            if brace_count == 0 and in_map:
                # Found the end of the map function
                # Look for the closing ).filter(Boolean)
                remaining = content[pos:]
                filter_match = re.match(r'\}\)\.filter\(Boolean\)', remaining)
                if filter_match:
                    end_pos = pos + filter_match.end()
                    break
        pos += 1
    else:
        print("Could not find the end of the map function")
        exit(1)
    
    # Replace with simple markdown renderer
    simple_renderer = '''<div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600/30">
                      <div className="prose prose-invert prose-lg max-w-none">
                        <div 
                          className="text-gray-300 leading-relaxed"
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
    
    # Replace the complex parsing with simple renderer
    new_content = content[:start_pos] + simple_renderer + content[end_pos:]
    
    # Write back to file
    with open('app/components/PersonalizedNutritionAnalysis.tsx', 'w') as f:
        f.write(new_content)
    
    print("✅ Successfully replaced complex parsing with simple markdown renderer")
    print(f"📊 Removed {end_pos - start_pos} characters of complex parsing logic")
    print(f"🔧 Added {len(simple_renderer)} characters of simple renderer")
    
else:
    print("❌ Could not find the complex parsing section to replace") 