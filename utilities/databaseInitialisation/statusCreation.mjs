import connection from '../database/db.mjs';

async function createStatus(data) {
    const {status} = data;
    try {
        const query = `INSERT INTO Order_status (Status) VALUES (?)`;
        await connection.promise().query(query, [status]);
        console.log(`Status ${status} created successfully`);
    } catch (error) {
        console.log(error);
    }
}

async function statusCreation(statuses) {
    // Drop all data in Order_status table
    await connection.promise().query('DELETE FROM Order_status');

    for (const status of statuses) {
        await createStatus({status});
    }
}

export default statusCreation;