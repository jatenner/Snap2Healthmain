// This script prevents a flash of white background before the dark theme is applied
// It executes immediately before any other code
(function() {
  // Force dark theme to be applied instantly
  document.documentElement.style.backgroundColor = '#020e2c';
  document.documentElement.style.color = '#ffffff';
  
  // Create and add a style element to ensure the dark theme persists
  var style = document.createElement('style');
  style.textContent = `
    html, body {
      background-color: #020e2c !important;
      color: #ffffff !important;
      transition: none !important;
    }
    
    body {
      background-image: 
        radial-gradient(circle at 20% 35%, #0a2053 0%, transparent 25%),
        radial-gradient(circle at 75% 65%, #1e3a7b 0%, transparent 25%) !important;
    }
    
    /* Override any light-mode classes that might be applied */
    .bg-slate-50, .bg-white, .bg-gray-50, .bg-gray-100 {
      background-color: #020e2c !important;
    }
    
    .text-slate-950, .text-black, .text-gray-900 {
      color: #ffffff !important;
    }
    
    /* Apply Snap2Health styling */
    .ai-chip {
      background-color: #5cd2ff;
      color: #020e2c;
      font-weight: bold;
    }
  `;
  
  // Add the style to the head immediately
  document.head.appendChild(style);
  
  console.log('Dark theme applied by noflash script');
})(); 