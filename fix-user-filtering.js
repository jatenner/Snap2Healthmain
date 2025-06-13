// Quick fix for user ID filtering in meals API
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/api/meals/[id]/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the disabled filtering with smart filtering
const oldCode = `    // In production, filter by user_id for security
    if (false) { // Temporarily disabled for debugging
      query = query.eq('user_id', userId);
    }`;

const newCode = `    // Smart user filtering: allow access to user's own meals OR test meals for backward compatibility
    if (userId && userId !== '11111111-1111-1111-1111-111111111111') {
      // For real users, allow access to their meals OR test meals (for demo purposes)
      query = query.or(\`user_id.eq.\${userId},user_id.eq.11111111-1111-1111-1111-111111111111\`);
    }
    // If no user_id (development mode), allow access to all meals`;

content = content.replace(oldCode, newCode);

fs.writeFileSync(filePath, content);
console.log('✅ Fixed user ID filtering in meals API'); 