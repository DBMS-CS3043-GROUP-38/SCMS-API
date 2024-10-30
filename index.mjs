import express from "express";
import dotenv from "dotenv";
import dashboardRoutes from './routes/dashboard/dashboard.mjs';
import customerRoutes from './routes/users/customer/customerRoutes.mjs';
import cors from 'cors';
import driverRoute from './routes/users/driver/driverRoutes.mjs';
import assistantRoute from './routes/users/assistants/assistantRoutes.mjs';
dotenv.config();
 
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors(
)); 

// Routes
app.use('/dashboard', dashboardRoutes);
app.use('/driver', driverRoute);
app.use('/assistant', assistantRoute);

 
//Routes in customer UI
app.use('/customer', customerRoutes);

  
app.get('/test', (req, res) => {
    res.send('Server is working');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});  