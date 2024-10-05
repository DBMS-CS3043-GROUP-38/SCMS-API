import userCreation from "./usercreation.mjs";
import storeCreation from "./storecreation.mjs";
import productCreation from "./productCreation.mjs";
import statusCreation from "./statusCreation.mjs";
import trainCreation from "./trainCreation.mjs";
import truckCreation from "./truckCreation.mjs";
import createRoutesForStores from "./createRoutes.mjs";
import createOrders from "./createOrders.mjs";


const storeCities = ['Kurunegala', 'Colombo', 'Galle', 'Kandy', 'Jaffna', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Matara', 'Ratnapura', 'Trincomalee', 'Vavuni'];
const productCategories = ['Clothes', 'Groceries', 'Electronics', 'Cosmetics', 'KitchenItems', 'Others'];
const orderStatuses = ['Pending', 'PendingTrain', 'TrainAssigned', 'InTrain', 'InStore', 'InShipment', 'InTruck', 'Attention', 'Delivered', 'Cancelled'];

const databaseInitialisation = async () => {
    await storeCreation(storeCities);
    const customerCount = await userCreation(storeCities);
    const nuOfProducts = await productCreation(productCategories);
    await statusCreation(orderStatuses);
    await trainCreation(50, storeCities.length);
    await truckCreation(storeCities.length);
    const routesCreated = await createRoutesForStores(storeCities.length);
    await createOrders(nuOfProducts, orderStatuses, routesCreated, customerCount);
}

//Run the function
databaseInitialisation().then(() => {
    console.log("Database initialisation completed");
    process.exit();
}).catch((error) => {
    console.error("Database initialisation failed", error);
    process.exit();
});