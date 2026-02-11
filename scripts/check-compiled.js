const fs = require('fs');
const content = fs.readFileSync('.next/server/app/api/tasks/[id]/route.js', 'utf-8');

// Find the PostgresTaskRepository update method in the compiled code
// Look for the pattern of the update method
const patterns = [
  /PostgresTaskRepository[\s\S]*?async update[\s\S]*?RETURNING \*[\s\S]*?\}\s*\}/,
  /UPDATE tasks SET[\s\S]*?WHERE id/,
];

// The code is likely in base64 eval format
const evalMatch = content.match(/atob\("([^"]+)"\)/);
if (evalMatch) {
  try {
    const decoded = Buffer.from(evalMatch[1], 'base64').toString('utf-8');
    console.log('=== DECODED CONTENT (first 5000 chars) ===');
    console.log(decoded.substring(0, 5000));
  } catch (e) {
    console.log('Error decoding:', e.message);
  }
} else {
  // Try to find the TaskRepository directly
  const taskMatch = content.match(/class PostgresTaskRepository[\s\S]{0,5000}async update[\s\S]{0,2000}RETURNING \*/);
  if (taskMatch) {
    console.log('=== FOUND TASK REPOSITORY ===');
    console.log(taskMatch[0]);
  } else {
    console.log('Could not find PostgresTaskRepository in compiled code');
    console.log('File size:', content.length);
  }
}
