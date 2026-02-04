/**
 * Diagnostic script to check PrismaClient instantiation issues
 * Run with: node scripts/diagnose-prisma.js
 */

const { PrismaClient } = require('../src/generated');

console.log('=== PrismaClient Diagnostic Test ===\n');

// Test 1: Check if multiple instances are created
console.log('Test 1: Creating multiple PrismaClient instances...');
const client1 = new PrismaClient();
const client2 = new PrismaClient();
const client3 = new PrismaClient();

console.log('✓ Created 3 PrismaClient instances');
console.log('⚠️  WARNING: Each instance creates its own connection pool!');
console.log('   In production, this can exhaust database connections.\n');

// Test 2: Check connection pool
console.log('Test 2: Checking connection behavior...');
async function testConnections() {
  try {
    // Simulate what happens in API routes
    const results = await Promise.all([
      client1.$queryRaw`SELECT 1 as test`,
      client2.$queryRaw`SELECT 1 as test`,
      client3.$queryRaw`SELECT 1 as test`,
    ]);
    
    console.log('✓ All 3 clients can query simultaneously');
    console.log('⚠️  Each maintains separate connection pools\n');
    
    // Check active connections
    const metrics1 = await client1.$metrics.json();
    const metrics2 = await client2.$metrics.json();
    const metrics3 = await client3.$metrics.json();
    
    console.log('Connection metrics:');
    console.log('  Client 1:', metrics1?.counters?.length || 'N/A');
    console.log('  Client 2:', metrics2?.counters?.length || 'N/A');
    console.log('  Client 3:', metrics3?.counters?.length || 'N/A');
    
  } catch (error) {
    console.log('✗ Error during connection test:', error.message);
  } finally {
    await client1.$disconnect();
    await client2.$disconnect();
    await client3.$disconnect();
    console.log('\n✓ Disconnected all clients');
  }
}

testConnections().then(() => {
  console.log('\n=== Diagnosis Complete ===');
  console.log('\nRECOMMENDATION:');
  console.log('Create a singleton PrismaClient instance in src/lib/prisma.ts');
  console.log('and import it across all API routes instead of creating new instances.');
});
