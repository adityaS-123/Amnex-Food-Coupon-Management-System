import { query } from '../utils/aws-config';

export async function getEmployeeEmail(employeeId: string): Promise<string | null> {
  try {
    const result = await query(
      'SELECT email FROM employees WHERE employee_id = $1 AND is_active = TRUE',
      [employeeId]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0].email;
    }
    
    // Fallback to pattern-based email if no record found
    return `${employeeId.toLowerCase()}@amnex.com`;
    
  } catch (error) {
    console.error('Error getting employee email:', error);
    // Fallback to pattern-based email
    return `${employeeId.toLowerCase()}@amnex.com`;
  }
}

export async function getEmployeeDetails(employeeId: string) {
  try {
    const result = await query(
      'SELECT employee_id, email, full_name, department FROM employees WHERE employee_id = $1 AND is_active = TRUE',
      [employeeId]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error getting employee details:', error);
    return null;
  }
}

export async function createEmployee(employeeId: string, email: string, fullName?: string, department?: string) {
  try {
    const result = await query(`
      INSERT INTO employees (employee_id, email, full_name, department)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (employee_id) 
      DO UPDATE SET email = $2, full_name = COALESCE($3, employees.full_name), department = COALESCE($4, employees.department)
      RETURNING *
    `, [employeeId, email, fullName, department]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating/updating employee:', error);
    return null;
  }
}
