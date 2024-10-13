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
};

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
};

// Function to convert and format revenue data
const formatRevenueData = (data) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Convert the data to the desired format
    const convertedData = data.map(item => {
        const monthIndex = item.Month - 1; // Month is 1-based, so subtract 1 for the array index
        return {
            month: `${item.Year} ${monthNames[monthIndex].toLowerCase()}`, // Format month as 'YYYY mmm'
            revenue: parseFloat(item.TotalRevenue) // Convert revenue to a number
        };
    });

    // Sort the converted data by Year and Month in descending order
    convertedData.sort((b, a) => {
        const [yearA, monthA] = a.month.split(" ");
        const [yearB, monthB] = b.month.split(" ");

        return yearB - yearA || monthNames.indexOf(monthB.charAt(0).toUpperCase() + monthB.slice(1)) - monthNames.indexOf(monthA.charAt(0).toUpperCase() + monthA.slice(1));
    });

    return convertedData;
};

// Export all transformation functions
export { transformTopProducts, transformTopStores, formatRevenueData };
