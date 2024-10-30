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
    FROM truckschedule
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


DELIMITER ;