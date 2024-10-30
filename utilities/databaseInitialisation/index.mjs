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


const storeCities = ['Kurunegala', 'Colombo', 'Galle', 'Jaffna', 'Batticaloa'];
const orderStatuses = ['Pending', 'PendingDispatch', 'InTrain', 'InStore', 'InShipment', 'InTruck', 'Attention', 'Delivered', 'Cancelled'];
const products = [
    {
        "ProductID": 1,
        "Name": "Classic Denim Jeans",
        "TrainCapacityConsumption": 3.45,
        "Price": 55.20,
        "Type": "Clothes"
    },
    {
        "ProductID": 2,
        "Name": "Silk Blouse",
        "TrainCapacityConsumption": 2.98,
        "Price": 89.99,
        "Type": "Clothes"
    },
    {
        "ProductID": 3,
        "Name": "Casual Cotton T-Shirt",
        "TrainCapacityConsumption": 1.75,
        "Price": 20.99,
        "Type": "Clothes"
    },
    {
        "ProductID": 4,
        "Name": "Wool Sweater",
        "TrainCapacityConsumption": 4.37,
        "Price": 68.49,
        "Type": "Clothes"
    },
    {
        "ProductID": 5,
        "Name": "Leather Jacket",
        "TrainCapacityConsumption": 3.89,
        "Price": 150.00,
        "Type": "Clothes"
    },
    {
        "ProductID": 6,
        "Name": "Formal Dress Pants",
        "TrainCapacityConsumption": 2.76,
        "Price": 45.50,
        "Type": "Clothes"
    },
    {
        "ProductID": 7,
        "Name": "Floral Summer Dress",
        "TrainCapacityConsumption": 1.32,
        "Price": 35.70,
        "Type": "Clothes"
    },
    {
        "ProductID": 8,
        "Name": "Winter Puffer Jacket",
        "TrainCapacityConsumption": 4.15,
        "Price": 130.00,
        "Type": "Clothes"
    },
    {
        "ProductID": 9,
        "Name": "Workout Leggings",
        "TrainCapacityConsumption": 3.02,
        "Price": 25.30,
        "Type": "Clothes"
    },
    {
        "ProductID": 10,
        "Name": "V-Neck Sweater",
        "TrainCapacityConsumption": 2.67,
        "Price": 40.75,
        "Type": "Clothes"
    },
    {
        "ProductID": 11,
        "Name": "Linen Shorts",
        "TrainCapacityConsumption": 1.29,
        "Price": 28.40,
        "Type": "Clothes"
    },
    {
        "ProductID": 12,
        "Name": "Polka Dot Skirt",
        "TrainCapacityConsumption": 4.08,
        "Price": 38.60,
        "Type": "Clothes"
    },
    {
        "ProductID": 13,
        "Name": "Vintage Graphic Tee",
        "TrainCapacityConsumption": 3.57,
        "Price": 18.20,
        "Type": "Clothes"
    },
    {
        "ProductID": 14,
        "Name": "Cargo Pants",
        "TrainCapacityConsumption": 2.43,
        "Price": 50.80,
        "Type": "Clothes"
    },
    {
        "ProductID": 15,
        "Name": "Plaid Button-Down Shirt",
        "TrainCapacityConsumption": 1.85,
        "Price": 22.50,
        "Type": "Clothes"
    },
    {
        "ProductID": 16,
        "Name": "Smartphone - Model X",
        "TrainCapacityConsumption": 3.45,
        "Price": 899.99,
        "Type": "Electronics"
    },
    {
        "ProductID": 17,
        "Name": "Bluetooth Earbuds",
        "TrainCapacityConsumption": 1.78,
        "Price": 59.99,
        "Type": "Electronics"
    },
    {
        "ProductID": 18,
        "Name": "4K UHD TV",
        "TrainCapacityConsumption": 4.57,
        "Price": 500.00,
        "Type": "Electronics"
    },
    {
        "ProductID": 19,
        "Name": "Smartwatch",
        "TrainCapacityConsumption": 2.34,
        "Price": 150.00,
        "Type": "Electronics"
    },
    {
        "ProductID": 20,
        "Name": "Laptop - Model Z",
        "TrainCapacityConsumption": 3.89,
        "Price": 1200.00,
        "Type": "Electronics"
    },
    {
        "ProductID": 21,
        "Name": "Wireless Mouse",
        "TrainCapacityConsumption": 1.56,
        "Price": 29.99,
        "Type": "Electronics"
    },
    {
        "ProductID": 22,
        "Name": "Gaming Headset",
        "TrainCapacityConsumption": 2.47,
        "Price": 69.99,
        "Type": "Electronics"
    },
    {
        "ProductID": 23,
        "Name": "Bluetooth Speaker",
        "TrainCapacityConsumption": 4.05,
        "Price": 45.50,
        "Type": "Electronics"
    },
    {
        "ProductID": 24,
        "Name": "Tablet - Model Y",
        "TrainCapacityConsumption": 3.28,
        "Price": 329.00,
        "Type": "Electronics"
    },
    {
        "ProductID": 25,
        "Name": "Portable Charger",
        "TrainCapacityConsumption": 1.89,
        "Price": 24.99,
        "Type": "Electronics"
    },
    {
        "ProductID": 26,
        "Name": "Fitness Tracker",
        "TrainCapacityConsumption": 2.73,
        "Price": 79.99,
        "Type": "Electronics"
    },
    {
        "ProductID": 27,
        "Name": "Digital Camera",
        "TrainCapacityConsumption": 3.92,
        "Price": 450.00,
        "Type": "Electronics"
    },
    {
        "ProductID": 28,
        "Name": "Home Security Camera",
        "TrainCapacityConsumption": 2.34,
        "Price": 99.99,
        "Type": "Electronics"
    },
    {
        "ProductID": 29,
        "Name": "Electric Toothbrush",
        "TrainCapacityConsumption": 4.32,
        "Price": 29.99,
        "Type": "Electronics"
    },
    {
        "ProductID": 30,
        "Name": "Hair Dryer",
        "TrainCapacityConsumption": 1.25,
        "Price": 25.00,
        "Type": "Electronics"
    },
    {
        "ProductID": 31,
        "Name": "Moisturizing Cream",
        "TrainCapacityConsumption": 1.87,
        "Price": 15.49,
        "Type": "Cosmetics"
    },
    {
        "ProductID": 32,
        "Name": "Liquid Foundation",
        "TrainCapacityConsumption": 3.12,
        "Price": 20.99,
        "Type": "Cosmetics"
    },
    {
        "ProductID": 33,
        "Name": "Lipstick - Rouge",
        "TrainCapacityConsumption": 2.98,
        "Price": 12.99,
        "Type": "Cosmetics"
    },
    {
        "ProductID": 34,
        "Name": "Eyeliner Pencil",
        "TrainCapacityConsumption": 1.53,
        "Price": 8.49,
        "Type": "Cosmetics"
    },
    {
        "ProductID": 35,
        "Name": "Shampoo - Herbal",
        "TrainCapacityConsumption": 3.71,
        "Price": 6.50,
        "Type": "Cosmetics"
    },
    {
        "ProductID": 36,
        "Name": "Face Serum",
        "TrainCapacityConsumption": 2.34,
        "Price": 19.99,
        "Type": "Cosmetics"
    },
    {
        "ProductID": 37,
        "Name": "Nail Polish - Red",
        "TrainCapacityConsumption": 1.78,
        "Price": 4.99,
        "Type": "Cosmetics"
    },
    {
        "ProductID": 38,
        "Name": "Sunscreen SPF 50",
        "TrainCapacityConsumption": 4.05,
        "Price": 9.99,
        "Type": "Cosmetics"
    },
    {
        "ProductID": 39,
        "Name": "Makeup Remover",
        "TrainCapacityConsumption": 2.89,
        "Price": 7.50,
        "Type": "Cosmetics"
    },
    {
        "ProductID": 40,
        "Name": "Body Lotion",
        "TrainCapacityConsumption": 3.47,
        "Price": 5.99,
        "Type": "Cosmetics"
    },
    {
        "ProductID": 41,
        "Name": "Lip Balm",
        "TrainCapacityConsumption": 1.36,
        "Price": 2.99,
        "Type": "Cosmetics"
    },
    {
        "ProductID": 42,
        "Name": "Hair Serum",
        "TrainCapacityConsumption": 3.29,
        "Price": 14.99,
        "Type": "Cosmetics"
    },
    {
        "ProductID": 43,
        "Name": "Deodorant Spray",
        "TrainCapacityConsumption": 1.72,
        "Price": 5.99,
        "Type": "Cosmetics"
    },
    {
        "ProductID": 44,
        "Name": "Face Mask - Clay",
        "TrainCapacityConsumption": 4.12,
        "Price": 3.49,
        "Type": "Cosmetics"
    },
    {
        "ProductID": 45,
        "Name": "Mascara - Black",
        "TrainCapacityConsumption": 2.23,
        "Price": 11.99,
        "Type": "Cosmetics"
    },
    {
        "ProductID": 46,
        "Name": "Rice - Basmati",
        "TrainCapacityConsumption": 1.54,
        "Price": 1.99,
        "Type": "Groceries"
    },
    {
        "ProductID": 47,
        "Name": "Olive Oil - Extra Virgin",
        "TrainCapacityConsumption": 2.98,
        "Price": 6.99,
        "Type": "Groceries"
    },
    {
        "ProductID": 48,
        "Name": "Organic Honey",
        "TrainCapacityConsumption": 3.42,
        "Price": 4.49,
        "Type": "Groceries"
    },
    {
        "ProductID": 49,
        "Name": "Whole Wheat Bread",
        "TrainCapacityConsumption": 1.85,
        "Price": 2.99,
        "Type": "Groceries"
    },
    {
        "ProductID": 50,
        "Name": "Canned Tuna",
        "TrainCapacityConsumption": 2.67,
        "Price": 1.29,
        "Type": "Groceries"
    },
    {
        "ProductID": 51,
        "Name": "Almond Milk",
        "TrainCapacityConsumption": 4.07,
        "Price": 3.29,
        "Type": "Groceries"
    },
    {
        "ProductID": 52,
        "Name": "Eggs - Free Range",
        "TrainCapacityConsumption": 2.98,
        "Price": 2.59,
        "Type": "Groceries"
    },
    {
        "ProductID": 53,
        "Name": "Ground Coffee",
        "TrainCapacityConsumption": 3.25,
        "Price": 4.99,
        "Type": "Groceries"
    },
    {
        "ProductID": 54,
        "Name": "Tomato Sauce",
        "TrainCapacityConsumption": 1.43,
        "Price": 1.49,
        "Type": "Groceries"
    },
    {
        "ProductID": 55,
        "Name": "Pasta - Fusilli",
        "TrainCapacityConsumption": 2.21,
        "Price": 1.89,
        "Type": "Groceries"
    },
    {
        "ProductID": 56,
        "Name": "Cheddar Cheese",
        "TrainCapacityConsumption": 3.78,
        "Price": 3.99,
        "Type": "Groceries"
    },
    {
        "ProductID": 57,
        "Name": "Frozen Berries",
        "TrainCapacityConsumption": 1.97,
        "Price": 5.99,
        "Type": "Groceries"
    },
    {
        "ProductID": 58,
        "Name": "Greek Yogurt",
        "TrainCapacityConsumption": 2.65,
        "Price": 1.29,
        "Type": "Groceries"
    },
    {
        "ProductID": 59,
        "Name": "Breakfast Cereal",
        "TrainCapacityConsumption": 1.73,
        "Price": 3.59,
        "Type": "Groceries"
    },
    {
        "ProductID": 60,
        "Name": "Bag of Oranges",
        "TrainCapacityConsumption": 4.32,
        "Price": 4.99,
        "Type": "Groceries"
    },
    {
        "ProductID": 61,
        "Name": "Yoga Mat",
        "TrainCapacityConsumption": 1.72,
        "Price": 25.00,
        "Type": "Others"
    },
    {
        "ProductID": 62,
        "Name": "Camping Tent",
        "TrainCapacityConsumption": 3.89,
        "Price": 99.99,
        "Type": "Others"
    },
    {
        "ProductID": 63,
        "Name": "Water Bottle - Stainless Steel",
        "TrainCapacityConsumption": 1.45,
        "Price": 18.50,
        "Type": "Others"
    },
    {
        "ProductID": 64,
        "Name": "Electric Kettle",
        "TrainCapacityConsumption": 2.75,
        "Price": 35.20,
        "Type": "Others"
    },
    {
        "ProductID": 65,
        "Name": "Ceramic Coffee Mug",
        "TrainCapacityConsumption": 1.85,
        "Price": 8.99,
        "Type": "Others"
    },
    {
        "ProductID": 66,
        "Name": "Portable Folding Chair",
        "TrainCapacityConsumption": 3.29,
        "Price": 22.00,
        "Type": "Others"
    },
    {
        "ProductID": 67,
        "Name": "LED Desk Lamp",
        "TrainCapacityConsumption": 2.88,
        "Price": 27.50,
        "Type": "Others"
    },
    {
        "ProductID": 68,
        "Name": "Picture Frame - Wood",
        "TrainCapacityConsumption": 1.65,
        "Price": 12.99,
        "Type": "Others"
    },
    {
        "ProductID": 69,
        "Name": "Board Game - Strategy",
        "TrainCapacityConsumption": 3.47,
        "Price": 29.99,
        "Type": "Others"
    },
    {
        "ProductID": 70,
        "Name": "Wall Clock",
        "TrainCapacityConsumption": 2.34,
        "Price": 15.00,
        "Type": "Others"
    },
    {
        "ProductID": 71,
        "Name": "Umbrella - Compact",
        "TrainCapacityConsumption": 1.98,
        "Price": 9.50,
        "Type": "Others"
    },
    {
        "ProductID": 72,
        "Name": "Running Shoes - Black",
        "TrainCapacityConsumption": 4.05,
        "Price": 49.99,
        "Type": "Others"
    },
    {
        "ProductID": 73,
        "Name": "Cooking Apron",
        "TrainCapacityConsumption": 1.25,
        "Price": 7.99,
        "Type": "Others"
    },
    {
        "ProductID": 74,
        "Name": "Backpack - Waterproof",
        "TrainCapacityConsumption": 3.54,
        "Price": 39.00,
        "Type": "Others"
    },
    {
        "ProductID": 75,
        "Name": "Wireless Charging Pad",
        "TrainCapacityConsumption": 2.63,
        "Price": 19.99,
        "Type": "Others"
    }
]
const routes = [
    {
        "RouteID": 1,
        "Time_duration": "06:57:07",
        "Description": "Kurunegala to Anamaduwa via A10 ",
        "StoreID": 1,
        "Distance": 68.96
    },
    {
        "RouteID": 2,
        "Time_duration": "08:36:49",
        "Description": "Kurunegala to Polgahawela via A3",
        "StoreID": 1,
        "Distance": 55.92
    },
    {
        "RouteID": 3,
        "Time_duration": "02:27:23",
        "Description": "Kurunegala to Badagamuwa via A6.",
        "StoreID": 1,
        "Distance": 26.00
    },
    {
        "RouteID": 4,
        "Time_duration": "10:13:16",
        "Description": "Kurunegala to Mallawapitiya via B3.",
        "StoreID": 1,
        "Distance": 67.86
    },
    {
        "RouteID": 5,
        "Time_duration": "02:56:08",
        "Description": "Kurunegala to Pothuhara via Tower junction.",
        "StoreID": 1,
        "Distance": 21.73
    },
    {
        "RouteID": 6,
        "Time_duration": "02:17:37",
        "Description": "Colombo to Negombo via Katunayaka.",
        "StoreID": 2,
        "Distance": 32.44
    },
    {
        "RouteID": 7,
        "Time_duration": "07:08:10",
        "Description": "Colombo to Kaluthara via A10 road .",
        "StoreID": 2,
        "Distance": 23.63
    },
    {
        "RouteID": 8,
        "Time_duration": "04:22:20",
        "Description": "Colombo to Rathnapura via B5 road .",
        "StoreID": 2,
        "Distance": 76.91
    },
    {
        "RouteID": 9,
        "Time_duration": "02:02:29",
        "Description": "Galle to Koggala via  sea railway junction.",
        "StoreID": 3,
        "Distance": 29.46
    },
    {
        "RouteID": 10,
        "Time_duration": "05:59:58",
        "Description": "Galle to Rathgama via  B19 road.",
        "StoreID": 3,
        "Distance": 50.99
    },
    {
        "RouteID": 11,
        "Time_duration": "09:35:12",
        "Description": "Galle to Baddegama via  B132 road.",
        "StoreID": 3,
        "Distance": 85.69
    },
    {
        "RouteID": 12,
        "Time_duration": "03:10:28",
        "Description": "Galle to Matara via  A2 road.",
        "StoreID": 3,
        "Distance": 73.68
    },
    {
        "RouteID": 13,
        "Time_duration": "05:46:12",
        "Description": "Jaffna to kaytes via AB19 road.",
        "StoreID": 4,
        "Distance": 91.89
    },
    {
        "RouteID": 14,
        "Time_duration": "10:44:56",
        "Description": "Jaffna to Dabakolapatuna via AB17 road.",
        "StoreID": 4,
        "Distance": 84.09
    },
    {
        "RouteID": 15,
        "Time_duration": "10:18:39",
        "Description": "Jaffna to Kodikkamam via A9 road.",
        "StoreID": 4,
        "Distance": 55.87
    },
    {
        "RouteID": 16,
        "Time_duration": "10:42:46",
        "Description": "Jaffna to Kodikkamam via A9 road.",
        "StoreID": 4,
        "Distance": 54.64
    },
    {
        "RouteID": 17,
        "Time_duration": "06:09:40",
        "Description": "Batticaloa to Polonnaruwa via A11.",
        "StoreID": 5,
        "Distance": 52.84
    },
    {
        "RouteID": 18,
        "Time_duration": "04:45:33",
        "Description": "Batticaloa to Kenniya via A15.",
        "StoreID": 5,
        "Distance": 57.11
    },
    {
        "RouteID": 19,
        "Time_duration": "07:31:13",
        "Description": "Batticaloa to Trincomalee via A15.",
        "StoreID": 5,
        "Distance": 66.50
    },
    {
        "RouteID": 20,
        "Time_duration": "03:18:04",
        "Description": "Batticaloa to Ampara via A27.",
        "StoreID": 5,
        "Distance": 54.34
    },
    {
        "RouteID": 21,
        "Time_duration": "10:15:37",
        "Description": "Batticaloa to Akkareipattu via A4.",
        "StoreID": 5,
        "Distance": 68.86
    }
]

const databaseInitialisation = async () => {
    await storeCreation(storeCities);
    const customerCount = await userCreation(storeCities);
    const nuOfProducts = await productCreation(products);
    await statusCreation(orderStatuses);
    await trainCreation(100, storeCities.length);
    await truckCreation(storeCities.length);
    const routesCreated = await createRoutesForStores(routes);
    await createOrders(nuOfProducts, orderStatuses, routesCreated, customerCount);
    // await createShipment();
    // await truckSchedule();
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




