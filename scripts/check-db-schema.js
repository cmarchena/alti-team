// Quick script to check database schema
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'alti_team',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'alti_team',
})

async function checkSchema() {
  try {
    // Check tasks table schema
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position
    `)
    
    console.log('=== TASKS TABLE SCHEMA ===')
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`)
    })
    
    // Check a sample task
    const sampleTask = await pool.query('SELECT * FROM tasks LIMIT 1')
    console.log('\n=== SAMPLE TASK ===')
    if (sampleTask.rows.length > 0) {
      console.log(sampleTask.rows[0])
    } else {
      console.log('No tasks found')
    }
    
    await pool.end()
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

checkSchema()
