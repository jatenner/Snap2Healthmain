#!/usr/bin/env python3

import re

# Read the file
with open('app/components/PersonalizedNutritionAnalysis.tsx', 'r') as f:
    content = f.read()

# Find the complex parsing section and replace it with a simple approach
# Look for the pattern starting with "if (!section.trim()) return null;"
start_pattern = r"if \(!section\.trim\(\)\) return null;"
end_pattern = r"}\)\.filter\(Boolean\)}"

# Find the start position
start_match = re.search(start_pattern, content)
if start_match:
    start_pos = start_match.start()
    
    # Find the end position
    end_match = re.search(end_pattern, content[start_pos:])
    if end_match:
        end_pos = start_pos + end_match.end()
        
        # Create the simple replacement
        simple_replacement = '''return (
                          <div key={index} className="mb-6 p-6 bg-gray-800/50 rounded-xl border border-gray-600/30">
                            <div className="prose prose-invert prose-lg max-w-none">
                              <div 
                                dangerouslySetInnerHTML={{
                                  __html: section
                                    .replace(/\\*\\*(.*?)\\*\\*/g, "<strong class=\\"text-white font-semibold\\">$1</strong>")
                                    .replace(/### (.*?)$/gm, "<h3 class=\\"text-xl font-bold text-white mt-6 mb-3\\">$1</h3>")
                                    .replace(/## (.*?)$/gm, "<h2 class=\\"text-2xl font-bold text-white mt-8 mb-4\\">$1</h2>")
                                    .replace(/\\n/g, "<br/>")
                                }}
                              />
                            </div>
                          </div>
                        );
                      }).filter(Boolean)}'''
        
        # Replace the content
        new_content = content[:start_pos] + simple_replacement + content[end_pos:]
        
        # Write the file back
        with open('app/components/PersonalizedNutritionAnalysis.tsx', 'w') as f:
            f.write(new_content)
        
        print("Successfully replaced complex parsing with simple markdown renderer!")
    else:
        print("Could not find end pattern")
else:
    print("Could not find start pattern") 