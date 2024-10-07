const transformTopProducts = (data) => {
    const transformedData = {};
    data.forEach((row) => {
        if (!transformedData[row.Year]) {
            transformedData[row.Year] = {};
        }
        if (!transformedData[row.Year][`Q${row.Quarter}`]) {
            transformedData[row.Year][`Q${row.Quarter}`] = [];
        }
        transformedData[row.Year][`Q${row.Quarter}`].push({
            ID: row.ProductID,
            Name: row.ProductName,
            Quantity: row.TotalQuantity,
            Revenue: row.TotalRevenue,
        });
    });
    return transformedData;
}


const transformTopStores = (data) => {
    const transformedData = {};
    data.forEach((row) => {
        if (!transformedData[row.Year]) {
            transformedData[row.Year] = {};
        }
        if (!transformedData[row.Year][`Q${row.Quarter}`]) {
            transformedData[row.Year][`Q${row.Quarter}`] = [];
        }
        transformedData[row.Year][`Q${row.Quarter}`].push({
            ID: row.StoreID,
            City: row.StoreCity,
            Orders: row.NumberOfOrders,
            Revenue: row.TotalRevenue,
        });
    });
    return transformedData;
}

export { transformTopProducts, transformTopStores };