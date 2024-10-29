import express from "express";
import dotenv from "dotenv";
import dashboardRoutes from './routes/dashboard/dashboard.mjs';
import customerRoutes from './routes/users/customer/customerRoutes.mjs';
import cors from 'cors';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors(
    {
        origin: ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3000'],
        credentials: true
    }
)); 

// Routes
app.use('/dashboard', dashboardRoutes);


//Routes in customer UI
app.use('/customer', customerRoutes);


app.get('/test', (req, res) => {
    res.send('Server is working');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});