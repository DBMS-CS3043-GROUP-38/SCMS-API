import pool from '../database/db.mjs';

async function createStatus(data) {
    const {status} = data;
    try {
        const query = `INSERT INTO Order_status (Status) VALUES (?)`;
        await pool.query(query, [status]);
        console.log(`Status ${status} created successfully`);
    } catch (error) {
        console.log(error);
    }
}

async function statusCreation(statuses) {
    for (const status of statuses) {
        await createStatus({status});
    }

}

export default statusCreation;