import pool from './db.mjs';
import fs from 'fs/promises';

// Function to drop all tables
async function dropAllTables() {
    try {
        // Disable foreign key checks
        await pool.query(`SET FOREIGN_KEY_CHECKS = 0`);

        const [rows] = await pool.query(`
            SELECT TABLE_NAME
            FROM information_schema.tables
            WHERE table_schema = ?
        `, [process.env.MYSQL_DATABASE]);

        if (rows.length === 0) {
            console.log('No tables to drop.');
            return;
        }

        for (const row of rows) {
            const tableName = row['TABLE_NAME'];
            await pool.query(`DROP TABLE IF EXISTS \`${tableName}\``);
            console.log(`Dropped table: ${tableName}`);
        }

        console.log('All tables dropped.');
    } catch (error) {
        console.error('Error dropping tables:', error);
    } finally {
        // Re-enable foreign key checks
        await pool.query(`SET FOREIGN_KEY_CHECKS = 1`);
    }
}

//Drop all views
async function dropAllViews() {
    try {
        const [rows] = await pool.query(`
            SELECT TABLE_NAME
            FROM information_schema.tables
            WHERE table_schema = ?
              AND table_type = 'VIEW'
        `, [process.env.MYSQL_DATABASE]);

        if (rows.length === 0) {
            console.log('No views to drop.');
            return;
        }

        for (const row of rows) {
            const viewName = row['TABLE_NAME'];
            await pool.query(`DROP VIEW IF EXISTS \`${viewName}\``);
            console.log(`Dropped view: ${viewName}`);
        }

        console.log('All views dropped.');
    } catch (error) {
        console.error('Error dropping views:', error);
    }
}

// Updated function to run the DDL SQL
async function executeDDL() {
    // Read the SQL file
    const ddlContent = await fs.readFile('utilities/database/ddl.sql', 'utf8');

    console.log('Executing DDL statements...');

    // Execute the DDL
    await pool.query(ddlContent);

    console.log('DDL executed successfully');
}

//Drop functions
async function dropAllFunctions() {
    try {
        const [rows] = await pool.query(`
            SELECT ROUTINE_NAME
            FROM information_schema.ROUTINES
            WHERE ROUTINE_SCHEMA = ?
              AND ROUTINE_TYPE = 'FUNCTION'
        `, [process.env.MYSQL_DATABASE]);

        if (rows.length === 0) {
            console.log('No functions to drop.');
            return;
        }

        for (const row of rows) {
            const functionName = row['ROUTINE_NAME'];
            await pool.query(`DROP FUNCTION IF EXISTS \`${functionName}\``);
            console.log(`Dropped function: ${functionName}`);
        }

        console.log('All functions dropped.');
    } catch (error) {
        console.error('Error dropping functions:', error);
    }
}

// Main function to drop tables and run DDL
(async function () {
    try {
        await executeDDL();
    } catch (error) {
        console.error('An error occurred during database setup:', error);
    } finally {
        await pool.end(); // Close the connection pool when done
    }
})();