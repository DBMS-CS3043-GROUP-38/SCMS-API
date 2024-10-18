import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dashboardRoutes from './routes/dashboard/dashboard.mjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors({
    origin: 'http://localhost:3000',  // Adjust based on where your frontend is running
    credentials: true,  // Allow credentials (cookies) to be included
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/dashboard', dashboardRoutes);

app.get('/test', (req, res) => {
    res.send('Server is working');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});