// Test the exact query being generated
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'alti_team',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'alti_team',
})

async function testQuery() {
  try {
    // Test the exact query from the debug output
    const sqlQuery = `UPDATE tasks SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, assigned_to_id = $6, updated_at = NOW() WHERE id = $7 RETURNING *`
    const values = [
      'Add navigation menu',           // $1
      'Implement navigation with dropdowns', // $2
      'IN_PROGRESS',                    // $3
      'MEDIUM',                         // $4
      null,                             // $5 (due_date)
      null,                             // $6 (assigned_to_id)
      'a577c93c-4445-4536-a8e5-57a9d0f06f2d'  // $7 (id)
    ]
    
    console.log('=== TESTING QUERY ===')
    console.log('SQL:', sqlQuery)
    console.log('Values:', values)
    
    const result = await pool.query(sqlQuery, values)
    console.log('SUCCESS! Updated task:', result.rows[0])
    
    await pool.end()
  } catch (error) {
    console.error('ERROR:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  }
}

testQuery()
