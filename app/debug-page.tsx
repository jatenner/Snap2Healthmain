export default function DebugPage() {
  return (
    <div style={{ 
      background: 'white', 
      color: 'black', 
      padding: '20px',
      minHeight: '100vh'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Debug Page - Snap2Health</h1>
      <p>If you can see this text clearly, the issue is with CSS styling, not React rendering.</p>
      <div style={{ 
        background: 'blue', 
        color: 'white', 
        padding: '10px', 
        margin: '10px 0',
        borderRadius: '5px'
      }}>
        This is a blue box with white text
      </div>
      <div style={{ 
        background: 'green', 
        color: 'white', 
        padding: '10px', 
        margin: '10px 0',
        borderRadius: '5px'
      }}>
        This is a green box with white text
      </div>
      <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
        Back to Home
      </a>
    </div>
  );
} 