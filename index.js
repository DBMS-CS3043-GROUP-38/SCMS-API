import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const connection = mysql.createConnection({
    host:process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

connection.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("Connected to the database");
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})