DELIMITER //

# For admin dashboard

# Cards
CREATE PROCEDURE GetQuarterlySales()
BEGIN
    SELECT YEAR(OrderDate) AS Year,
           QUARTER(OrderDate) AS Quarter,
           SUM(Value) AS TotalRevenue
    FROM order_details_with_latest_status
    WHERE LatestStatus NOT IN ('Cancelled', 'Attention')
    GROUP BY YEAR(OrderDate), QUARTER(OrderDate)
    ORDER BY Year DESC, Quarter DESC
    LIMIT 2;
END //

CREATE PROCEDURE GetTrainsCompletedToday()
BEGIN
    SELECT COUNT(CASE WHEN Status != 'Not Completed' THEN 1 END) AS completed,
           COUNT(TrainID) AS total
    FROM trainschedule
    WHERE DATE(ScheduleDateTime) = CURDATE();
END //

CREATE PROCEDURE GetPendingOrdersCount()
BEGIN
    SELECT COUNT(OrderID) AS pending
    FROM order_details_with_latest_status
    WHERE LatestStatus = 'Pending';
END //

CREATE PROCEDURE GetAttentionOrdersCount()
BEGIN
    SELECT COUNT(OrderID) AS attention
    FROM order_details_with_latest_status
    WHERE LatestStatus = 'Attention';
END //

CREATE PROCEDURE GetTodaySales()
BEGIN
    SELECT DATE(OrderDate) AS Date,
           SUM(Value) AS TotalRevenue
    FROM order_details_with_latest_status
    WHERE LatestStatus NOT LIKE 'Cancelled'
    GROUP BY DATE(OrderDate)
    ORDER BY Date DESC
    LIMIT 2;
END //

CREATE PROCEDURE GetTrainStatusesCount()
BEGIN
    SELECT Status, COUNT(TrainID) AS count
    FROM trainschedule
    GROUP BY Status;
END //

CREATE PROCEDURE GetQuarterlyOrdersCount()
BEGIN
    SELECT YEAR(OrderDate) AS Year,
           QUARTER(OrderDate) AS Quarter,
           COUNT(OrderID) AS TotalOrders
    FROM order_details_with_latest_status
    GROUP BY YEAR(OrderDate), QUARTER(OrderDate)
    ORDER BY Year DESC, Quarter DESC
    LIMIT 2;
END //

CREATE PROCEDURE GetTopQuarterlyStoreData()
BEGIN
    SELECT COUNT(OrderID) AS TotalOrders,
           StoreID,
           StoreCity,
           SUM(Value) AS TotalRevenue
    FROM order_details_with_latest_status
    WHERE YEAR(CURDATE()) = YEAR(OrderDate)
      AND QUARTER(CURDATE()) = QUARTER(OrderDate)
    GROUP BY StoreID
    ORDER BY TotalRevenue DESC
    LIMIT 1;
END //


CREATE PROCEDURE GetBestCustomerForCurrentQuarter()
BEGIN
    SELECT c.Name AS Name,
           c.City AS City,
           c.CustomerID AS ID,
           SUM(o.Value) AS TotalRevenue
    FROM (SELECT *
          FROM order_details_with_latest_status
          WHERE YEAR(OrderDate) = YEAR(CURDATE())
            AND QUARTER(OrderDate) = QUARTER(CURDATE())
            AND LatestStatus NOT IN ('Cancelled', 'Attention')) o
             JOIN customer c ON (o.CustomerID = c.CustomerID)
    GROUP BY o.CustomerID
    ORDER BY SUM(o.Value) DESC
    LIMIT 1;
END //

CREATE PROCEDURE GetReadyShipmentsByStore(IN sid INT)
BEGIN
    SELECT Status, COUNT(s.ShipmentID) AS shipmentCount
    FROM shipment s
             JOIN route r ON s.RouteID = r.RouteID
    WHERE r.StoreID = sid
    GROUP BY s.Status;
END //

CREATE PROCEDURE GetAvailableAssistantsByStore(IN sid INT)
BEGIN
    SELECT Status, COUNT(EmployeeID) AS count
    FROM assistant_details_with_employee
    WHERE StoreID = sid
    GROUP BY Status;
END //

CREATE PROCEDURE GetAvailableDriversByStore(IN sid INT)
BEGIN
    SELECT Status, COUNT(EmployeeID) AS count
    FROM driver_details_with_employee
    WHERE StoreID = sid
    GROUP BY Status;
END //

CREATE PROCEDURE GetAvailableTrucksByStore(IN sid INT)
BEGIN
    SELECT Status, COUNT(TruckID) AS count
    FROM truck
    WHERE StoreID = sid
    GROUP BY Status;
END //

# Charts
CREATE PROCEDURE GetPastRevenueByQuarter()
BEGIN
    SELECT
        CONCAT(YEAR(OrderDate), '-Q', QUARTER(OrderDate)) AS quarter,
        SUM(Value) AS TotalRevenue
    FROM order_details_with_latest_status
    WHERE LatestStatus NOT LIKE 'Cancelled'
    GROUP BY quarter
    ORDER BY quarter DESC;
END //

CREATE PROCEDURE GetOrderStatusesCount()
BEGIN
    SELECT
        COUNT(*) AS count,
        LatestStatus AS status
    FROM order_details_with_latest_status
    GROUP BY LatestStatus;
END //

CREATE PROCEDURE GetPastMonthRevenue()
BEGIN
    SELECT
        DATE_FORMAT(OrderDate, '%d %M') AS day,
        SUM(Value) AS revenue
    FROM order_details_with_latest_status
    WHERE LatestStatus NOT LIKE 'Cancelled'
    GROUP BY OrderDate
    ORDER BY OrderDate DESC
    LIMIT 30;
END //

CREATE PROCEDURE GetRevenuePerStore(IN inputYear INT, IN inputQuarter INT)
BEGIN
    SELECT
        StoreCity AS store,
        TotalRevenue AS revenue
    FROM quarterly_store_report
    WHERE Year = inputYear AND Quarter = inputQuarter
    ORDER BY revenue DESC;
END //

CREATE PROCEDURE GetCustomerDistribution()
BEGIN
    SELECT Type, COUNT(CustomerID) AS count
    FROM customer
    GROUP BY Type;
END //

CREATE PROCEDURE GetRouteSalesByStore(IN sid INT)
BEGIN
    SELECT
        CONCAT(YEAR(OrderDate), '-Q', QUARTER(OrderDate)) as quarter,
        RouteID,
        SUM(Value) as revenue
    FROM order_details_with_latest_status
    WHERE LatestStatus NOT LIKE 'Cancelled'
      AND StoreID = sid
    GROUP BY quarter, RouteID
    ORDER BY quarter;
END //

# Searches
CREATE PROCEDURE GetOrderDetails(IN oid INT)
BEGIN
    SELECT
        OrderID AS 'Order ID',
        DATE_FORMAT(OrderDate, '%Y-%m-%d') AS OrderDate,
        CustomerID AS 'Customer ID',
        CustomerName AS 'Customer Name',
        CustomerType AS 'Customer Type',
        StoreID AS 'Store ID',
        StoreCity AS 'Store City',
        RouteID AS 'Route ID',
        trainschedule.TrainScheduleID AS 'TrainScheduleID',
        TrainID AS 'Train ID',
        ShipmentID AS 'Shipment ID',
        Value AS 'Value',
        TotalVolume AS 'Total Volume',
        LatestStatus AS 'Latest Status',
        DATE_FORMAT(LatestTimeStamp, '%Y-%m-%d %T') AS 'Last Updated',
        DriverID AS 'Driver ID',
        DriverName AS 'Driver Name',
        AssistantID AS 'Assistant ID',
        AssistantName AS 'Assistant Name',
        TruckID AS 'Truck ID',
        LicencePlate AS 'Truck Licence Plate'
    FROM order_details_with_latest_status
             LEFT JOIN trainschedule
                       ON order_details_with_latest_status.TrainScheduleID = trainschedule.TrainScheduleID
    WHERE OrderID = oid;
END //

CREATE PROCEDURE search_entity(
    IN entity_type VARCHAR(50),
    IN search_by VARCHAR(50),
    IN search_term VARCHAR(255)
)
BEGIN
    CASE entity_type
        WHEN 'customer' THEN
            IF search_by IS NULL OR search_term IS NULL THEN
                SELECT
                    CustomerID   AS 'Customer ID',
                    Name         AS 'Customer Name',
                    City         AS 'City',
                    Contact      AS 'Phone',
                    Address      AS 'Address',
                    TotalRevenue AS 'Total Revenue',
                    TotalOrders  AS 'Total Orders'
                FROM customer_report;
            ELSEIF search_by = 'name' THEN
                SELECT
                    CustomerID   AS 'Customer ID',
                    Name         AS 'Customer Name',
                    City         AS 'City',
                    Contact      AS 'Phone',
                    Address      AS 'Address',
                    TotalRevenue AS 'Total Revenue',
                    TotalOrders  AS 'Total Orders'
                FROM customer_report
                WHERE Name LIKE CONCAT('%', search_term, '%');
            ELSEIF search_by = 'id' THEN
                SELECT
                    CustomerID   AS 'Customer ID',
                    Name         AS 'Customer Name',
                    City         AS 'City',
                    Contact      AS 'Phone',
                    Address      AS 'Address',
                    TotalRevenue AS 'Total Revenue',
                    TotalOrders  AS 'Total Orders'
                FROM customer_report
                WHERE CustomerID = search_term;
            END IF;

        WHEN 'driver' THEN
            IF search_by IS NULL OR search_term IS NULL THEN
                SELECT
                    DriverID       AS 'Driver ID',
                    Name           AS 'Driver Name',
                    StoreID        AS 'Store ID',
                    Contact        AS 'Phone',
                    Status         AS 'Availability',
                    CompletedHours AS 'CompletedHours',
                    WorkingHours   AS 'WorkHours'
                FROM driver_details_with_employee;
            ELSEIF search_by = 'name' THEN
                SELECT
                    DriverID       AS 'Driver ID',
                    Name           AS 'Driver Name',
                    StoreID        AS 'Store ID',
                    Contact        AS 'Phone',
                    Status         AS 'Availability',
                    CompletedHours AS 'CompletedHours',
                    WorkingHours   AS 'WorkHours'
                FROM driver_details_with_employee
                WHERE Name LIKE CONCAT('%', search_term, '%');
            ELSEIF search_by = 'id' THEN
                SELECT
                    DriverID       AS 'Driver ID',
                    Name           AS 'Driver Name',
                    StoreID        AS 'Store ID',
                    Contact        AS 'Phone',
                    Status         AS 'Availability',
                    CompletedHours AS 'CompletedHours',
                    WorkingHours   AS 'WorkHours'
                FROM driver_details_with_employee
                WHERE DriverID = search_term;
            END IF;

        WHEN 'assistant' THEN
            IF search_by IS NULL OR search_term IS NULL THEN
                SELECT
                    AssistantID    AS 'Assistant ID',
                    Name           AS 'Assistant Name',
                    StoreID        AS 'Store ID',
                    Contact        AS 'Phone',
                    Status         AS 'Availability',
                    CompletedHours AS 'CompletedHours',
                    WorkingHours   AS 'WorkHours'
                FROM assistant_details_with_employee;
            ELSEIF search_by = 'name' THEN
                SELECT
                    AssistantID    AS 'Assistant ID',
                    Name           AS 'Assistant Name',
                    StoreID        AS 'Store ID',
                    Contact        AS 'Phone',
                    Status         AS 'Availability',
                    CompletedHours AS 'CompletedHours',
                    WorkingHours   AS 'WorkHours'
                FROM assistant_details_with_employee
                WHERE Name LIKE CONCAT('%', search_term, '%');
            ELSEIF search_by = 'id' THEN
                SELECT
                    AssistantID    AS 'Assistant ID',
                    Name           AS 'Assistant Name',
                    StoreID        AS 'Store ID',
                    Contact        AS 'Phone',
                    Status         AS 'Availability',
                    CompletedHours AS 'CompletedHours',
                    WorkingHours   AS 'WorkHours'
                FROM assistant_details_with_employee
                WHERE AssistantID = search_term;
            END IF;

        WHEN 'route' THEN
            IF search_by IS NULL OR search_term IS NULL THEN
                SELECT
                    RouteID       AS 'Route ID',
                    StoreID       AS 'Store ID',
                    Distance      AS 'Distance(KM)',
                    Time_duration AS 'Time Duration',
                    Description   AS 'Description'
                FROM route;
            ELSEIF search_by = 'id' THEN
                SELECT
                    RouteID       AS 'Route ID',
                    StoreID       AS 'Store ID',
                    Distance      AS 'Distance(KM)',
                    Time_duration AS 'Time Duration',
                    Description   AS 'Description'
                FROM route
                WHERE RouteID = search_term;
            END IF;

        WHEN 'truck' THEN
            IF search_by IS NULL OR search_term IS NULL THEN
                SELECT
                    td.TruckID    AS 'Truck ID',
                    LicencePlate  AS 'Licence Plate',
                    StoreID       AS 'Store ID',
                    TotalDistance AS 'Total Distance(KM)',
                    Status        AS 'Availability'
                FROM truck
                         JOIN truck_distances td ON truck.TruckID = td.TruckID
                ORDER BY td.TruckID;
            ELSEIF search_by = 'id' THEN
                SELECT
                    td.TruckID    AS 'Truck ID',
                    LicencePlate  AS 'Licence Plate',
                    StoreID       AS 'Store ID',
                    TotalDistance AS 'Total Distance(KM)',
                    Status        AS 'Availability'
                FROM truck
                         JOIN truck_distances td ON truck.TruckID = td.TruckID
                WHERE td.TruckID = search_term
                ORDER BY td.TruckID;
            ELSEIF search_by = 'name' THEN
                SELECT
                    td.TruckID    AS 'Truck ID',
                    LicencePlate  AS 'Licence Plate',
                    StoreID       AS 'Store ID',
                    TotalDistance AS 'Total Distance(KM)',
                    Status        AS 'Availability'
                FROM truck
                         JOIN truck_distances td ON truck.TruckID = td.TruckID
                WHERE LicencePlate LIKE CONCAT('%', search_term, '%')
                ORDER BY td.TruckID;
            END IF;
        END CASE;
END //

CREATE PROCEDURE GetProductById(IN prod_id INT)
BEGIN
    SELECT ProductID AS id, Name AS name, Type AS category, Price AS price
    FROM product
    WHERE ProductID = prod_id;
END //

CREATE PROCEDURE GetProductSales(IN pid INT)
BEGIN
    SELECT CONCAT(Year, ' - ', Quarter) AS Quarter, TotalRevenue
    FROM quarterly_product_report
    WHERE ProductID = pid
    ORDER BY Year, Quarter;
END //


# Selectors
CREATE PROCEDURE GetTodayTrains()
BEGIN
    SELECT
        TrainScheduleID AS trainID,
        DATE_FORMAT(ScheduleDateTime, '%a %T') AS Time,
        StoreCity AS Destination
    FROM
        train_schedule_with_destinations
    WHERE
        DATE(ScheduleDateTime) <= CURDATE()
      AND Status = 'Not Completed'
    ORDER BY ScheduleDateTime;
END //

CREATE PROCEDURE GetAvailableYears()
BEGIN
    SELECT DISTINCT YEAR(OrderDate) AS Year
    FROM order_details_with_latest_status
    ORDER BY Year DESC;
END //

CREATE PROCEDURE GetAvailableQuarters(IN selectedYear INT)
BEGIN
    SELECT DISTINCT QUARTER(OrderDate) AS Quarter
    FROM order_details_with_latest_status
    WHERE YEAR(OrderDate) = selectedYear
    ORDER BY Quarter DESC;
END //

CREATE PROCEDURE GetStores()
BEGIN
    SELECT StoreID, City
    FROM store;
END //

CREATE PROCEDURE GetProductCategories()
BEGIN
    SELECT DISTINCT Type AS category
    FROM product;
END //

# Tables
CREATE PROCEDURE GetTrainsToday()
BEGIN
    SELECT
        TrainScheduleID AS id,
        StoreCity AS destination,
        FilledPercentage AS capacityFilled,
        FullCapacity AS fullCapacity,
        ScheduleDateTime AS time
    FROM train_schedule_with_destinations
    WHERE DATE(ScheduleDateTime) = CURDATE()
    ORDER BY ScheduleDateTime;
END //

CREATE PROCEDURE GetBestProductsQuarter()
BEGIN
    SELECT
        ProductID AS id,
        ProductName AS name,
        ProductType AS category,
        TotalRevenue AS revenue
    FROM quarterly_product_report
    WHERE Year = YEAR(CURDATE())
      AND Quarter = QUARTER(CURDATE())
    ORDER BY revenue DESC;
END //

CREATE PROCEDURE GetProductsByType(IN productType VARCHAR(255))
BEGIN
    IF productType = 'All' THEN
        SELECT
            product.ProductID AS id,
            product.Name AS 'Product Name',
            product.Price AS 'Price',
            COUNT(contains.OrderID) AS 'Total Orders',
            SUM(contains.Amount * product.Price) AS 'Total Revenue'
        FROM product
                 JOIN contains ON product.ProductID = contains.ProductID
        GROUP BY product.ProductID;
    ELSE
        SELECT
            product.ProductID AS id,
            product.Name AS 'Product Name',
            product.Price AS 'Price',
            COUNT(contains.OrderID) AS 'Total Orders',
            SUM(contains.Amount * product.Price) AS 'Total Revenue'
        FROM product
                 JOIN contains ON product.ProductID = contains.ProductID
        WHERE product.Type = productType
        GROUP BY product.ProductID;
    END IF;
END //


CREATE PROCEDURE GetWeeklyTrains()
BEGIN
    SELECT
        TrainID AS TrainID,
        Day AS WeekDay,
        Time AS Time,
        FullCapacity AS Capacity,
        s.City AS Destination
    FROM train
             JOIN store s ON s.StoreID = train.StoreID
    ORDER BY WeekDay, Time;
END //

CREATE PROCEDURE GetScheduledTrains()
BEGIN
    SELECT
        TrainID AS id,
        TrainScheduleID AS scheduleID,
        StoreCity AS destination,
        FilledPercentage AS capacityFilled,
        FullCapacity AS fullCapacity,
        ScheduleDateTime AS time,
        TotalOrders AS orders
    FROM train_schedule_with_destinations
    WHERE Status = 'Not Completed'
    ORDER BY ScheduleDateTime;
END //

CREATE PROCEDURE GetActiveTrains()
BEGIN
    SELECT
        TrainID AS id,
        TrainScheduleID AS scheduleID,
        StoreCity AS destination,
        FilledPercentage AS capacityFilled,
        FullCapacity AS fullCapacity,
        ScheduleDateTime AS time,
        Status AS status
    FROM train_schedule_with_destinations
    WHERE Status != 'Completed'
    ORDER BY ScheduleDateTime;
END //

CREATE PROCEDURE GetPendingOrders()
BEGIN
    SELECT
        OrderID AS OrderID,
        DATE_FORMAT(OrderDate, '%Y-%m-%d') AS OrderDate,
        Value AS Value,
        TotalVolume AS TotalVolume,
        StoreCity AS StoreCity,
        RouteID AS RouteID
    FROM order_details_with_latest_status
    WHERE LatestStatus = 'Pending';
END //

CREATE PROCEDURE GetOrdersByTrain(IN trainSchID INT)
BEGIN
    SELECT
        o.OrderID AS orderID,
        o.CustomerID AS customerID,
        o.TotalVolume AS Capacity,
        o.Value AS Price
    FROM
        (SELECT OrderID FROM train_contains WHERE TrainScheduleID = trainSchID) t
            JOIN
        `order` o ON o.OrderID = t.OrderID;
END //

CREATE PROCEDURE GetTopProductsQuarter(IN y INT, IN q INT)
BEGIN
    SELECT
        ProductID AS ProductID,
        ProductName AS Name,
        ProductType AS Category,
        TotalRevenue AS Revenue
    FROM
        quarterly_product_report
    WHERE
        Year = y
      AND Quarter = q
    ORDER BY
        Revenue DESC;
END //

CREATE PROCEDURE GetTopCustomersQuarter(IN inputYear INT, IN inputQuarter INT)
BEGIN
    SELECT
        c.CustomerID AS CustomerID,
        c.Name AS Name,
        c.City AS City,
        SUM(o.Value) AS Revenue
    FROM
        (SELECT *
         FROM order_details_with_latest_status
         WHERE YEAR(OrderDate) = inputYear
           AND QUARTER(OrderDate) = inputQuarter
           AND LatestStatus NOT IN ('Cancelled', 'Attention')) o
            JOIN
        customer c ON o.CustomerID = c.CustomerID
    GROUP BY
        o.CustomerID
    ORDER BY
        Revenue DESC
    LIMIT 100;
END //

CREATE PROCEDURE GetOrderProducts(IN inputOrderID INT)
BEGIN
    SELECT
        product.ProductID AS ProductID,
        product.Name AS ProductName,
        CONCAT(product.Price, ' x ', contains.Amount) AS 'Price x Quantity',
        contains.Amount * product.Price AS TotalPrice
    FROM
        contains
            JOIN
        product ON contains.ProductID = product.ProductID
    WHERE
        contains.OrderID = inputOrderID
    ORDER BY
        product.ProductID;
END //


CREATE PROCEDURE GetTrackingDetails(IN inputOrderID INT)
BEGIN
    SELECT
        DATE_FORMAT(TimeStamp, '%e-%b-%y %T') AS 'Time Stamp',
        Status
    FROM
        order_tracking
    WHERE
        OrderID = inputOrderID
    ORDER BY
        TimeStamp;
END //

CREATE PROCEDURE GetTrainAssignedOrders()
BEGIN
    SELECT
        tc.OrderID AS OrderID,
        ts.TrainScheduleID AS TrainScheduleID,
        ts.StoreCity AS Destination,
        DATE_FORMAT(ts.ScheduleDateTime, '%e-%b-%y %T') AS TrainTime
    FROM
        (SELECT *
         FROM order_details_with_latest_status
         WHERE LatestStatus = 'PendingDispatch') AS trainAssigned
            JOIN
        train_contains tc ON trainAssigned.OrderID = tc.OrderID
            JOIN
        train_schedule_with_destinations ts ON tc.TrainScheduleID = ts.TrainScheduleID;
END //

CREATE PROCEDURE GetOrdersInTrain()
BEGIN
    SELECT
        tc.OrderID AS OrderID,
        ts.TrainScheduleID AS TrainScheduleID,
        ts.StoreCity AS Destination,
        DATE_FORMAT(ts.ScheduleDateTime, '%e-%b-%y %T') AS TrainTime
    FROM
        (SELECT *
         FROM order_details_with_latest_status
         WHERE LatestStatus = 'InTrain') AS trainAssigned
            JOIN
        train_contains tc ON trainAssigned.OrderID = tc.OrderID
            JOIN
        train_schedule_with_destinations ts ON tc.TrainScheduleID = ts.TrainScheduleID;
END //

CREATE PROCEDURE GetOrdersByStatus(IN orderStatus VARCHAR(50))
BEGIN
    IF orderStatus = 'InStore' THEN
        SELECT OrderID, StoreID, StoreCity, RouteID
        FROM order_details_with_latest_status
        WHERE LatestStatus = 'InStore';
    ELSEIF orderStatus = 'InShipment' THEN
        SELECT OrderID, StoreID, ShipmentID, ShipmentStatus
        FROM order_details_with_latest_status
        WHERE LatestStatus = 'InShipment';
    ELSEIF orderStatus = 'InTruck' THEN
        SELECT OrderID, StoreID, TruckID, AssistantID, DriverID
        FROM order_details_with_latest_status
        WHERE LatestStatus = 'InTruck';
    END IF;
END //

CREATE PROCEDURE GetAttentionOrders()
BEGIN
    SELECT OrderID,
           StoreCity,
           o.CustomerID,
           o.CustomerName,
           c.Contact AS CustomerContact,
           LatestTimeStamp AS TimeStamp
    FROM order_details_with_latest_status o
             JOIN customer c ON o.CustomerID = c.CustomerID
    WHERE LatestStatus = 'Attention';
END;


CREATE PROCEDURE GetStoreData()
BEGIN
    SELECT s.StoreID,
           s.City,
           COUNT(DISTINCT r.RouteID)     AS Routes,
           COUNT(DISTINCT a.AssistantID) AS Assistants,
           COUNT(DISTINCT d.DriverID)    AS Drivers,
           COUNT(DISTINCT t.TruckID)     AS Trucks
    FROM store s
             JOIN route r ON s.StoreID = r.StoreID
             JOIN truck t ON t.StoreID = s.StoreID
             JOIN driver_details_with_employee d ON d.StoreID = s.StoreID
             JOIN assistant_details_with_employee a ON a.StoreID = s.StoreID
    GROUP BY s.StoreID;
END //

CREATE PROCEDURE GetManagerData()
BEGIN
    SELECT e.StoreID,
           s.City,
           e.EmployeeID,
           e.Name,
           e.Contact,
           e.Address
    FROM employee e
             JOIN store s ON e.StoreID = s.StoreID
    WHERE e.Type = 'StoreManager';
END //

CREATE PROCEDURE GetTopCustomers()
BEGIN
    SELECT CustomerID,
           Name,
           TotalOrders,
           TotalRevenue
    FROM customer_report
    ORDER BY TotalRevenue DESC
    LIMIT 100;
END //




DELIMITER ;