import pool from '../database/db.mjs';
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import {faker} from "@faker-js/faker";

dotenv.config();

const hashCountEnv = process.env.HASH_COUNT;
const hashCount = hashCountEnv ? parseInt(hashCountEnv) : 10;

async function createEmployee(data) {
    const {name, username, address, password, StoreID, type, contact} = data;
    try {
        const hashedPassword = await bcrypt.hash(password, hashCount);
        const query = `INSERT INTO employee (Name, Username, Address, PasswordHash, Type, StoreID, Contact) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.query(query, [name, username, address, hashedPassword, type, StoreID, contact]);

        const id = result.insertId;

        if (type === 'Driver') {
            const driverQuery = `INSERT INTO Driver (EmployeeID, WorkingHours, CompletedHours, Status) VALUES (?, 40, 0, 'Available')`;
            await pool.query(driverQuery, [id]);
        } else if (type === 'Assistant') {
            const assistantQuery = `INSERT INTO Assistant (EmployeeID, WorkingHours, CompletedHours, Status) VALUES (?, 60, 0, 'Available')`;
            await pool.query(assistantQuery, [id]);
        }
        console.log(`Employee ${name} created successfully: username - ${username}, type - ${type}`);
    } catch (error) {
        console.log(error);
    }
}

async function createCustomer(data) {
    const {name, username, address, password, type, city, contact} = data;

    try {
        const hashedPassword = await bcrypt.hash(password, hashCount);
        const query = `INSERT INTO customer (Username, Name, Address, Type, City, PasswordHash, Contact) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        await pool.query(query, [username, name, address, type, city, hashedPassword, contact]);
        console.log(`Customer ${name} created successfully: username - ${username}, city - ${city}`);
    } catch (error) {
        console.log(error);
    }
}

async function userCreation(cities) {
    //Generate 5 Admins
    for (let i = 0; i < 5; i++) {
        const fullName = faker.person.fullName();
        const randomNumber = Math.floor(Math.random() * 1000);
        const username = fullName.split(' ').join('').toLowerCase() + randomNumber;

        const data = {
            name: fullName,
            username: username,
            address: faker.location.streetAddress(),
            password: 'Password@Admin',
            type: 'Admin',
            StoreID: null,
            contact: faker.phone.number({style: 'national'})
        };
        await createEmployee(data);
    }

    //Generate 8 StoreManagers
    for (let i = 1; i <= cities.length; i++) {
        const fullName = faker.person.fullName();
        const randomNumber = Math.floor(Math.random() * 1000);
        const username = fullName.split(' ').join('').toLowerCase() + randomNumber;

        const data = {
            name: fullName,
            username: username,
            address: faker.location.streetAddress(),
            password: 'Password@StoreManager',
            type: 'StoreManager',
            StoreID: i,
            contact: faker.phone.number({style: 'national'})
        };
        await createEmployee(data);
    }

    //Generate Drivers and Assistants for each store
    for (let i = 1; i <= cities.length; i++) {
        const DriverCount = Math.floor(Math.random() * 20) + 1;
        for (let j = 0; j < DriverCount; j++) {
            const name = faker.person.fullName();
            const randomNumber = Math.floor(Math.random() * 1000);
            const username = name.split(' ').join('').toLowerCase() + randomNumber;

            const data = {
                name: name,
                username: username,
                address: faker.location.streetAddress(),
                password: 'Password@Driver',
                type: 'Driver',
                StoreID: i,
                contact: faker.phone.number({style: 'national'})
            };
            await createEmployee(data);
        }

        const AssistantCount = Math.floor(Math.random() * 20) + DriverCount;
        for (let j = 0; j < AssistantCount; j++) {
            const name = faker.person.fullName();
            const randomNumber = Math.floor(Math.random() * 1000);
            const username = name.split(' ').join('').toLowerCase() + randomNumber;

            const data = {
                name: name,
                username: username,
                address: faker.location.streetAddress(),
                password: 'Password@Assistant',
                type: 'Assistant',
                StoreID: i,
                contact: faker.phone.number({style: 'national'})
            };
            await createEmployee(data);
        }
    }

    //Generate randomNumberOfCustomers Customers
    const randomNumberOfCustomers = Math.floor(Math.random() * (1000 - 100 + 1)) + 100;
    let createdCustomers = 0;

    const types = ['End', 'Retailer'];
    for (let i = 0; i < randomNumberOfCustomers; i++) {
        const name = faker.person.fullName();
        const randomNumber = Math.floor(Math.random() * 1000);
        const username = name.split(' ').join('').toLowerCase() + randomNumber;

        const data = {
            name: name,
            username: username,
            address: faker.location.streetAddress(),
            password: 'Password@Customer',
            type: types[Math.floor(Math.random() * types.length)],
            city: cities[Math.floor(Math.random() * cities.length)],
            contact: faker.phone.number({style: 'national'})
        };
        await createCustomer(data);
        createdCustomers++;
    }
    return createdCustomers;
}

export default userCreation;