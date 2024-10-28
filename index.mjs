import express from "express";
import dotenv from "dotenv";
import dashboardRoutes from './routes/dashboard/dashboard.mjs';
import itemsRouter from './routes/users/customer/displayItems.mjs';
import authRoutes from './routes/users/customer/auth.mjs';
import orderRoute from './routes/users/customer/order.mjs';
import citiesRoute from './routes/users/customer/cities.mjs';
import routeRoute from './routes/users/customer/getroute.mjs';
import profileRouter from './routes/users/customer/profile.mjs';
import cors from 'cors';
import driverRoute from './routes/users/driver/driverRoutes.mjs';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors(
    {
        origin: ['http://localhost:3001', 'http://localhost:3002'],
        credentials: true
    }
));

// Routes
app.use('/dashboard', dashboardRoutes);
app.use('/driver', driverRoute);


//Routes in customer UI
app.use('/api', itemsRouter);
app.use('/api/auth', authRoutes);
app.use('/api/order', orderRoute);
app.use('/api/cities', citiesRoute);
app.use('/api/getroutes', routeRoute);
app.use('/api/profile', profileRouter);


app.get('/test', (req, res) => {
    res.send('Server is working');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});