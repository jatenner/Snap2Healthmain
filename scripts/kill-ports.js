#!/usr/bin/env node

/**
 * kill-ports.js
 * 
 * Script to forcefully kill processes using ports 3000-3010
 * to prevent port conflicts during development
 */

const { execSync } = require('child_process');

console.log('🔍 Checking for processes using ports 3000-3010...');

let killedCount = 0;

try {
  // Different commands for different platforms
  if (process.platform === 'win32') {
    // Windows
    try {
      // Check for all relevant ports
      const portsToCheck = [3000, 3001, 3002, 3003];
      let foundProcesses = new Map();

      for (const port of portsToCheck) {
        try {
          const output = execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' }).toString();
          const lines = output.split('\n').filter(line => line.trim() !== '');
          
          if (lines.length > 0) {
            lines.forEach(line => {
              const parts = line.trim().split(/\s+/);
              if (parts.length > 4) {
                const pid = parts[4];
                if (!foundProcesses.has(pid)) {
                  foundProcesses.set(pid, port);
                }
              }
            });
          }
        } catch (err) {
          // Specific port might not be in use
        }
      }

      if (foundProcesses.size > 0) {
        // Kill all found processes
        for (const [pid, port] of foundProcesses.entries()) {
          try {
            console.log(`Found process ${pid} using port ${port}, killing...`);
            execSync(`taskkill /F /PID ${pid}`);
            console.log(`✅ Process ${pid} on port ${port} killed`);
            killedCount++;
          } catch (err) {
            console.error(`Failed to kill process ${pid}: ${err.message}`);
          }
        }
      } else {
        console.log('No processes found using ports 3000-3010');
      }
    } catch (err) {
      // Ignore errors from the command itself
      console.log('No processes found using ports 3000-3010');
    }
  } else {
    // macOS or Linux
    let foundProcesses = new Map();
    let checkFailed = false;
    
    // Function to find processes using lsof with multiple ports
    function findWithLsof() {
      const portsToCheck = [3000, 3001, 3002, 3003, 3004, 3005];
      
      for (const port of portsToCheck) {
        try {
          const output = execSync(`lsof -i :${port} -t`, { stdio: 'pipe' }).toString();
          const pids = output.trim().split('\n').filter(pid => pid !== '');
          
          if (pids.length > 0) {
            pids.forEach(pid => foundProcesses.set(pid, port));
          }
        } catch (err) {
          // Individual port might not be in use or command failed
        }
      }
      
      return foundProcesses.size > 0;
    }
    
    // Try lsof first - most reliable on macOS/Linux
    try {
      if (findWithLsof()) {
        console.log(`Found ${foundProcesses.size} processes to kill`);
      } else {
        console.log('No processes found with lsof, trying alternative approaches...');
        checkFailed = true;
      }
    } catch (err) {
      console.log('lsof command failed, trying alternative approaches...');
      checkFailed = true;
    }
    
    // If lsof failed or found no processes, try netstat
    if (checkFailed || foundProcesses.size === 0) {
      try {
        // Try netstat as an alternative
        let netstatCmd = 'netstat -tuln | grep LISTEN';
        if (process.platform === 'darwin') {
          // Different command for macOS
          netstatCmd = 'netstat -anv | grep LISTEN';
        }
        
        const output = execSync(netstatCmd, { stdio: 'pipe' }).toString();
        const lines = output.split('\n');
        
        // Look for ports in the 3000-3010 range
        const portRegex = /:([3][0][0][0-9])\s/;
        
        for (const line of lines) {
          const match = line.match(portRegex);
          if (match && match[1]) {
            const port = parseInt(match[1], 10);
            if (port >= 3000 && port <= 3010) {
              // Try to extract PID if possible
              try {
                // On Linux, use ss to get PID
                if (process.platform === 'linux') {
                  const pidOutput = execSync(`ss -lptn sport = :${port}`, { stdio: 'pipe' }).toString();
                  const pidMatch = pidOutput.match(/pid=(\d+)/);
                  if (pidMatch && pidMatch[1]) {
                    foundProcesses.set(pidMatch[1], port);
                  }
                }
                // On macOS, try lsof specifically for this port
                else if (process.platform === 'darwin') {
                  const pidOutput = execSync(`lsof -i :${port} -t`, { stdio: 'pipe' }).toString();
                  const pid = pidOutput.trim();
                  if (pid) {
                    foundProcesses.set(pid, port);
                  }
                }
              } catch (err) {
                // Couldn't get PID, will try alternative methods later
              }
            }
          }
        }
      } catch (err) {
        console.log('Netstat check failed, trying process-based approach...');
      }
    }
    
    // If we found processes, try to kill them
    if (foundProcesses.size > 0) {
      for (const [pid, port] of foundProcesses.entries()) {
        try {
          console.log(`Found process ${pid} using port ${port}, killing...`);
          execSync(`kill -9 ${pid}`);
          console.log(`✅ Process ${pid} on port ${port} killed`);
          killedCount++;
        } catch (err) {
          console.error(`Failed to kill process ${pid}: ${err.message}`);
        }
      }
    }
    // If no processes found with specific methods, try more aggressive approaches
    else {
      console.log('No specific processes identified. Trying to find Node.js processes...');
      
      try {
        // Find node processes that might be related to Next.js
        const result = execSync('ps aux | grep -E "node|next|react|3000" | grep -v grep', { stdio: 'pipe' }).toString();
        const lines = result.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length > 0) {
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length > 1) {
              const pid = parts[1];
              try {
                console.log(`Found potential Next.js process ${pid}, killing...`);
                execSync(`kill -9 ${pid}`);
                console.log(`✅ Process ${pid} killed`);
                killedCount++;
              } catch (err) {
                console.error(`Failed to kill process ${pid}: ${err.message}`);
              }
            }
          }
        } else {
          // Last resort: try to kill all node processes
          try {
            console.log('Attempting to kill all Node.js processes as last resort...');
            execSync('killall -9 node', { stdio: 'pipe' });
            console.log('✅ Killed all node processes');
            killedCount++;
          } catch (e) {
            console.log('No node processes found or unable to kill node processes');
          }
        }
      } catch (err) {
        // Last resort: try to kill all node processes
        try {
          console.log('Attempting to kill all Node.js processes as last resort...');
          execSync('killall -9 node', { stdio: 'pipe' });
          console.log('✅ Killed all node processes');
          killedCount++;
        } catch (e) {
          console.log('No node processes found or unable to kill node processes');
        }
      }
    }
  }
  
  // Final verification check - see if ports are now available
  const portsToVerify = [3000, 3001];
  let stillInUse = [];
  
  for (const port of portsToVerify) {
    try {
      // Quick check to see if port is still in use
      execSync(`lsof -i :${port} -t`, { stdio: 'pipe' });
      stillInUse.push(port);
    } catch (err) {
      // Port is free if lsof returns empty/error
    }
  }
  
  if (stillInUse.length > 0) {
    console.log(`⚠️ Warning: Ports ${stillInUse.join(', ')} may still be in use despite cleanup efforts`);
  }
  
  if (killedCount > 0) {
    console.log(`✅ Successfully killed ${killedCount} process(es)`);
  } else {
    console.log('No processes found using ports 3000-3010');
  }
  
  console.log('🎉 Ports cleanup completed!');
} catch (err) {
  console.error(`❌ Error during port cleanup: ${err.message}`);
  process.exit(1);
} 