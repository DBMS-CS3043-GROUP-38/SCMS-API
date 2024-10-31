DELIMITER //


CREATE PROCEDURE GetQuarterlySalesByStore(IN sid INT)
BEGIN
    SELECT YEAR(OrderDate) AS Year,
           QUARTER(OrderDate) AS Quarter,
           SUM(Value) AS TotalRevenue
    FROM order_details_with_latest_status
    WHERE (LatestStatus != 'Cancelled' OR LatestStatus != 'Attention')
      AND StoreID = sid
    GROUP BY YEAR(OrderDate), QUARTER(OrderDate)
    ORDER BY Year DESC, Quarter DESC
    LIMIT 2;
END //


CREATE PROCEDURE GetCompletedTrainsByStore(IN sid INT)
BEGIN
    SELECT COUNT(CASE WHEN Status = 'Completed' THEN 1 END) AS completed,
           COUNT(CASE WHEN Status != 'Not Completed' THEN 1 END) AS total
    FROM trainschedule
             JOIN train ON trainschedule.TrainID = train.TrainID
    WHERE DATE(ScheduleDateTime) = CURDATE()
      AND StoreID = sid;
END //


CREATE PROCEDURE GetTrainStatusesByStore(IN sid INT)
BEGIN
    SELECT Status, COUNT(train.TrainID) AS count
    FROM trainschedule
             JOIN train ON trainschedule.TrainID = train.TrainID
    WHERE StoreID = sid
    GROUP BY Status;
END //

CREATE PROCEDURE GetShipmentStatusesByStore(IN sid INT)
BEGIN
    SELECT Status, COUNT(ShipmentID) AS count
    FROM shipment
             JOIN route ON shipment.RouteID = route.RouteID
    WHERE StoreID = sid
    GROUP BY Status;
END //

CREATE PROCEDURE GetQuarterlyOrdersByStore(IN sid INT)
BEGIN
    SELECT YEAR(OrderDate) AS Year,
           QUARTER(OrderDate) AS Quarter,
           COUNT(OrderID) AS TotalOrders
    FROM order_details_with_latest_status
    WHERE StoreID = sid
    GROUP BY YEAR(OrderDate), QUARTER(OrderDate)
    ORDER BY Year DESC, Quarter DESC
    LIMIT 2;
END //

CREATE PROCEDURE GetTruckScheduleStatusesByStore(IN sid INT)
BEGIN
    SELECT Status, COUNT(TruckScheduleID) AS count
    FROM truck_schedule_with_details
    WHERE StoreID = sid
    GROUP BY Status;
END //


CREATE PROCEDURE GetPastRevenueByStore(IN sid INT)
BEGIN
    SELECT
        CONCAT(YEAR(OrderDate), '-Q', QUARTER(OrderDate)) AS quarter,
        SUM(Value) AS TotalRevenue
    FROM order_details_with_latest_status
    WHERE LatestStatus NOT LIKE 'Cancelled'
      AND StoreID = sid
    GROUP BY quarter
    ORDER BY quarter DESC;
END //

CREATE PROCEDURE GetOrderStatusesByStore(IN sid INT)
BEGIN
    SELECT COUNT(*) AS count, LatestStatus AS status
    FROM order_details_with_latest_status
    WHERE StoreID = sid
    GROUP BY LatestStatus;
END //

CREATE PROCEDURE GetTodayTrainsByStore(IN sid INT)
BEGIN
    SELECT
        TrainScheduleID AS trainID,
        DATE_FORMAT(ScheduleDateTime, '%a %T') AS Time,
        StoreCity AS Destination
    FROM
        train_schedule_with_destinations
    WHERE
        DATE(ScheduleDateTime) = CURDATE()
      AND Status = 'In Progress'
      AND StoreID = sid
    ORDER BY
        ScheduleDateTime;
END //

CREATE PROCEDURE GetTrainsTodayByStore(IN sid INT)
BEGIN
    SELECT
        TrainScheduleID AS id,
        StoreCity AS destination,
        FilledPercentage AS capacityFilled,
        FullCapacity AS fullCapacity,
        ScheduleDateTime AS time
    FROM
        train_schedule_with_destinations
    WHERE
        DATE(ScheduleDateTime) = CURDATE()
      AND StoreID = sid
    ORDER BY
        ScheduleDateTime;
END //

CREATE PROCEDURE GetActiveTrainsByStore(IN sid INT)
BEGIN
    SELECT
        TrainID AS id,
        TrainScheduleID AS scheduleID,
        StoreCity AS destination,
        FilledPercentage AS capacityFilled,
        FullCapacity AS fullCapacity,
        ScheduleDateTime AS time,
        Status AS status
    FROM
        train_schedule_with_destinations
    WHERE
        StoreID = sid
      AND Status != 'Completed'
    ORDER BY
        ScheduleDateTime;
END //

CREATE PROCEDURE GetActiveShipmentsByStore(IN sid INT)
BEGIN
    SELECT
        ShipmentID AS id,
        route.RouteID AS routeID,
        FilledCapacity AS capacityFilled,
        Capacity AS fullCapacity,
        CreatedDate AS createdDate,
        Status AS status
    FROM
        shipment
            JOIN
        route ON shipment.RouteID = route.RouteID
    WHERE
        StoreID = sid
      AND Status != 'Completed'
    ORDER BY
        CreatedDate;
END //

CREATE PROCEDURE GetInStoreOrdersByStore(IN sid INT)
BEGIN
    SELECT
        OrderID AS OrderID,
        DATE_FORMAT(OrderDate, '%Y-%m-%d') AS OrderDate,
        Value AS Value,
        TotalVolume AS TotalVolume,
        StoreCity AS StoreCity,
        RouteID AS RouteID
    FROM
        order_details_with_latest_status
    WHERE
        LatestStatus = 'InStore'
      AND StoreID = sid;
END //

CREATE PROCEDURE GetOrdersInTrainByStore(IN sid INT)
BEGIN
    SELECT
        tc.OrderID AS OrderID,
        ts.TrainScheduleID AS TrainScheduleID,
        ts.StoreCity AS Destination,
        DATE_FORMAT(ts.ScheduleDateTime, '%e-%b-%y %T') AS TrainTime
    FROM
        (SELECT *
         FROM order_details_with_latest_status
         WHERE LatestStatus = 'InTrain'
           AND StoreID = sid) AS trainAssigned
            JOIN train_contains tc ON trainAssigned.OrderID = tc.OrderID
            JOIN train_schedule_with_destinations ts ON tc.TrainScheduleID = ts.TrainScheduleID;
END //

CREATE PROCEDURE GetOrdersByStatusAndStore(IN sid INT, IN status VARCHAR(20))
BEGIN
    IF status = 'InStore' THEN
        SELECT OrderID, StoreID, StoreCity, RouteID
        FROM order_details_with_latest_status
        WHERE StoreID = sid AND LatestStatus = 'InStore';

    ELSEIF status = 'InShipment' THEN
        SELECT OrderID, StoreID, ShipmentID, ShipmentStatus
        FROM order_details_with_latest_status
        WHERE StoreID = sid AND LatestStatus = 'InShipment';

    ELSEIF status = 'InTruck' THEN
        SELECT OrderID, StoreID, TruckID, AssistantID, DriverID
        FROM order_details_with_latest_status
        WHERE StoreID = sid AND LatestStatus = 'InTruck';
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid status provided';
    END IF;
END //

CREATE PROCEDURE GetDriversByStore(IN sid INT)
BEGIN
    SELECT
        DriverID AS 'Driver ID',
        Name AS 'Driver Name',
        Contact AS 'Phone',
        Status AS 'Availability',
        CompletedHours AS 'CompletedHours',
        WorkingHours AS 'WorkHours'
    FROM
        driver_details_with_employee
    WHERE
        StoreID = sid;
END //

CREATE PROCEDURE GetAssistantsByStore(IN sid INT)
BEGIN
    SELECT
        AssistantID AS 'Assistant ID',
        Name AS 'Assistant Name',
        StoreID AS 'Store ID',
        Contact AS 'Phone',
        Status AS 'Availability',
        CompletedHours AS 'CompletedHours',
        WorkingHours AS 'WorkHours'
    FROM
        assistant_details_with_employee
    WHERE
        StoreID = sid;
END //

CREATE PROCEDURE GetTrucksByStore(IN sid INT)
BEGIN
    SELECT
        truck.TruckID AS 'Truck ID',
        LicencePlate AS 'Licence Plate',
        COALESCE(TotalDistance, 0) AS 'Total Distance(KM)',
        Status AS 'Availability'
    FROM
        truck
            left outer join
        truck_distances td ON truck.TruckID = td.TruckID
    WHERE
        StoreID = sid
    ORDER BY
        td.TruckID;
END //

CREATE PROCEDURE GetRoutesByStore(IN sid INT)
BEGIN
    SELECT
        RouteID AS 'Route ID',
        StoreID AS 'Store ID',
        Distance AS 'Distance(KM)',
        Time_duration AS 'Time Duration',
        Description AS 'Description'
    FROM
        route
    WHERE
        StoreID = sid;
END //


CREATE PROCEDURE GetOrdersByShipment(IN sid INT)
BEGIN
    SELECT
        OrderID AS orderID,
        order_details_with_latest_status.CustomerID AS customerID,
        CustomerName AS customerName,
        RouteID AS routeID,
        Address AS address,
        Contact AS contact,
        TotalVolume AS volume,
        DATE_FORMAT(OrderDate, '%Y-%m-%d') AS orderDate
    FROM
        order_details_with_latest_status
            JOIN
        customer ON customer.CustomerID = order_details_with_latest_status.CustomerID
    WHERE
        ShipmentID = sid;
END //

CREATE PROCEDURE GetTruckScheduleByShipment(IN shid INT)
BEGIN
    SELECT *
    FROM truck_schedule_with_details
    WHERE ShipmentID = shid;
END //

CREATE PROCEDURE GetTruckSchedulesByStore(IN sid INT)
BEGIN
    SELECT
        TruckScheduleID AS 'Schedule ID',
        ShipmentID AS 'Shipment ID',
        TruckID AS 'Truck ID',
        DriverID AS 'Driver ID',
        DriverName AS 'Driver Name',
        AssistantID AS 'Assistant ID',
        AssistantName AS 'Assistant Name',
        Delivered AS 'Delivered',
        TotalOrders AS 'Total Orders',
        ScheduleDateTime AS 'Schedule Time',
        Status AS 'Status'
    FROM
        truck_schedule_with_details
    WHERE
        StoreID = sid;
END //


CREATE PROCEDURE GetTodaySalesByStore(IN sid INT)
BEGIN
    SELECT
        DATE(OrderDate) AS Date,
        SUM(Value) AS TotalRevenue
    FROM
        order_details_with_latest_status
    WHERE
        LatestStatus NOT LIKE 'Cancelled'
      AND StoreID = sid
    GROUP BY
        DATE(OrderDate)
    ORDER BY
        Date DESC
    LIMIT 2;
END //



DELIMITER ;