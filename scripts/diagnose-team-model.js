/**
 * Diagnostic script to check Team vs TeamMember model confusion
 * Run with: node scripts/diagnose-team-model.js
 */

const fs = require('fs');
const path = require('path');

console.log('=== Team vs TeamMember Model Diagnostic ===\n');

// Test 1: Check PRD for team-related features
console.log('Test 1: Analyzing PRD for team features...');
const prdPath = path.join(__dirname, '..', 'plans', 'prd.json');
const prd = JSON.parse(fs.readFileSync(prdPath, 'utf8'));

const teamFeatures = Object.values(prd.features.core).filter(feature =>
  feature.id.includes('team-') || feature.title.toLowerCase().includes('team')
);

console.log('Team-related features in PRD:');
teamFeatures.forEach(feature => {
  console.log(`  ${feature.id}: ${feature.title} (${feature.status})`);
  console.log(`    Implementation: ${feature.implementation}`);
});
console.log();

// Test 2: Check database schema for Team models
console.log('Test 2: Checking database schema for Team models...');
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf8');

const hasTeamModel = schema.includes('model Team {');
const hasTeamMemberModel = schema.includes('model TeamMember {');

console.log('Database models found:');
console.log(`  Team model: ${hasTeamModel ? '✓ EXISTS' : '✗ MISSING'}`);
console.log(`  TeamMember model: ${hasTeamMemberModel ? '✓ EXISTS' : '✗ MISSING'}`);
console.log();

// Test 3: Check API endpoints
console.log('Test 3: Checking API endpoints...');
const teamsApiPath = path.join(__dirname, '..', 'src', 'app', 'api', 'teams', 'route.ts');
const teamsApiExists = fs.existsSync(teamsApiPath);

console.log('API endpoints:');
console.log(`  /api/teams: ${teamsApiExists ? '✓ EXISTS' : '✗ MISSING'}`);

if (teamsApiExists) {
  const teamsApi = fs.readFileSync(teamsApiPath, 'utf8');
  const usesTeamMember = teamsApi.includes('teamMember');
  const usesTeam = teamsApi.includes('team') && !teamsApi.includes('teamMember');

  console.log(`    Uses TeamMember model: ${usesTeamMember ? '✓ YES' : '✗ NO'}`);
  console.log(`    Uses Team model: ${usesTeam ? '✓ YES' : '✗ NO'}`);
}
console.log();

// Test 4: Check UI pages
console.log('Test 4: Checking UI pages...');
const teamsPagePath = path.join(__dirname, '..', 'src', 'app', 'teams', 'page.tsx');
const teamsPageExists = fs.existsSync(teamsPagePath);

console.log('UI pages:');
console.log(`  /teams page: ${teamsPageExists ? '✓ EXISTS' : '✗ MISSING'}`);

if (teamsPageExists) {
  const teamsPage = fs.readFileSync(teamsPagePath, 'utf8');
  const mentionsTeams = teamsPage.toLowerCase().includes('team');
  const mentionsMembers = teamsPage.toLowerCase().includes('member');

  console.log(`    Mentions "team": ${mentionsTeams ? '✓ YES' : '✗ NO'}`);
  console.log(`    Mentions "member": ${mentionsMembers ? '✓ YES' : '✗ NO'}`);
}
console.log();

console.log('=== Diagnosis Summary ===');
console.log('\nISSUES IDENTIFIED:');

if (teamFeatures.length > 0 && !hasTeamModel) {
  console.log('⚠️  PRD mentions "Team Management" but database only has TeamMember model');
  console.log('   This suggests either:');
  console.log('   1. Missing Team model for actual team entities');
  console.log('   2. Feature misnamed - should be "Team Member Management"');
  console.log('   3. Teams are implicitly represented by departments');
}

if (teamsApiExists && hasTeamMemberModel && !hasTeamModel) {
  console.log('⚠️  /api/teams manages TeamMembers, not Teams');
  console.log('   API should probably be /api/team-members for clarity');
}

console.log('\nRECOMMENDATION:');
if (!hasTeamModel && teamFeatures.some(f => f.title.toLowerCase().includes('team'))) {
  console.log('Add Team model to schema.prisma if teams are separate from departments');
  console.log('Or rename PRD feature to "Team Member Management" if current implementation is correct');
}