// File: routes/apiRoutes.js

import express from 'express';
import itemsRouter from './displayItems.mjs';
import authRoutes from './auth.mjs';
import orderRoute from './order.mjs';
import citiesRoute from './cities.mjs';
import routeRoute from './getroute.mjs';
import profileRouter from './profile.mjs';

const apiRouter = express.Router();

// Use each route with its corresponding path
apiRouter.use('/', itemsRouter);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/order', orderRoute);
apiRouter.use('/cities', citiesRoute);
apiRouter.use('/getroutes', routeRoute);
apiRouter.use('/profile', profileRouter);

export default apiRouter;
