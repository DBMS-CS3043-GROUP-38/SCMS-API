import userCreation from "./usercreation.mjs";
import storeCreation from "./storecreation.mjs";
import productCreation from "./productCreation.mjs";
import statusCreation from "./statusCreation.mjs";
import trainCreation from "./trainCreation.mjs";
import truckCreation from "./truckCreation.mjs";
import createRoutesForStores from "./createRoutes.mjs";
import createOrders from "./createOrders.mjs";
import createShipment from "./createShipment.mjs";
import truckSchedule from "./truckSchedule.mjs";
import pool from '../database/db.mjs';


const storeCities = ['Kurunegala', 'Colombo', 'Galle', 'Jaffna', 'Anuradhapura', 'Badulla', 'Batticaloa'];
const productCategories = ['Clothes', 'Groceries', 'Electronics', 'Cosmetics', 'KitchenItems', 'Others'];
const orderStatuses = ['Pending', 'PendingDispatch', 'TrainAssigned', 'InTrain', 'InStore', 'InShipment', 'InTruck', 'Attention', 'Delivered', 'Cancelled'];

const databaseInitialisation = async () => {
    await storeCreation(storeCities);
    const customerCount = await userCreation(storeCities);
    const nuOfProducts = await productCreation(productCategories);
    await statusCreation(orderStatuses);
    await trainCreation(200, storeCities.length);
    await truckCreation(storeCities.length);
    const routesCreated = await createRoutesForStores(storeCities.length);
    await createOrders(nuOfProducts, orderStatuses, routesCreated, customerCount);
    await createShipment();
    await truckSchedule();
}

//Run the function
databaseInitialisation().then(async () => {
    console.log("Database initialisation completed");
    await pool.end()
    process.exit();
}).catch((error) => {
    console.error("Database initialisation failed", error);
    process.exit();
});