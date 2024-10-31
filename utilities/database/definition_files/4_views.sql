DELIMITER //

# For dashboards
create view Driver_Details_With_Employee as
select d.DriverID,
       d.EmployeeID,
       e.Name,
       e.Username,
       e.StoreID,
       e.Address,
       e.Contact,
       e.Type,
       d.WorkingHours,
       d.CompletedHours,
       d.Status
from driver d
         join employee e on d.EmployeeID = e.EmployeeID;
//


create view Assistant_Details_With_Employee as
select a.AssistantID,
       a.EmployeeID,
       e.Name,
       e.Username,
       e.StoreID,
       e.Address,
       e.Contact,
       e.Type,
       a.WorkingHours,
       a.CompletedHours,
       a.Status
from assistant a
         join employee e on a.EmployeeID = e.EmployeeID;
//

# To get the order details with the latest status and some more details
CREATE VIEW Order_Details_With_Latest_Status AS
SELECT o.OrderID,
       o.CustomerID,
       c.Name       AS CustomerName,
       c.Type       AS CustomerType,
       o.Value,
       o.TotalVolume,
       o.OrderDate,
       tc.TrainScheduleID,
       r.StoreID,
       s.City       AS StoreCity,
       o.RouteID,
       ot.Status    AS LatestStatus,
       ot.TimeStamp AS LatestTimeStamp,
       sc.ShipmentID,
       ts.TruckScheduleID,
       a.AssistantID,
       a.Name       AS AssistantName,
       d.DriverID,
       d.Name       AS DriverName,
       t.TruckID,
       t.LicencePlate,
       sh.Status    AS ShipmentStatus

FROM `Order` o
         JOIN
     `Route` r ON o.RouteID = r.RouteID
         JOIN
     `Store` s ON r.StoreID = s.StoreID
         JOIN
     `Order_Tracking` ot ON o.OrderID = ot.OrderID
         JOIN
     (SELECT OrderID,
             MAX(TimeStamp) AS LatestTimeStamp
      FROM `Order_Tracking`
      GROUP BY OrderID) AS latest ON ot.OrderID = latest.OrderID AND ot.TimeStamp = latest.LatestTimeStamp
         join customer c on o.CustomerID = c.CustomerID
         left outer join shipment_contains sc on o.OrderID = sc.OrderID
         left outer join shipment sh on sc.ShipmentID = sh.ShipmentID
         left outer join truckschedule ts on sh.ShipmentID = ts.ShipmentID
         left outer join truck t on ts.TruckID = t.TruckID
         left outer join assistant_details_with_employee a
                         on ts.AssistantID = a.AssistantID
         left outer join (select DriverID, employee.Name
                          from driver
                                   join employee on driver.EmployeeID = employee.EmployeeID) d
                         on ts.DriverID = d.DriverID
         left outer join train_contains tc on tc.OrderID = o.OrderID;
;
//

create view shipment_progress as
SELECT sc.ShipmentID,
       COUNT(sc.OrderID) AS TotalOrders,
       SUM(IF(ods.LatestStatus = 'Delivered', 1, 0)) AS Delivered
FROM shipment_contains sc
         JOIN order_details_with_latest_status ods ON sc.OrderID = ods.OrderID
GROUP BY sc.ShipmentID
//

# Truck schedule with details
CREATE OR REPLACE VIEW truck_schedule_with_details AS
SELECT ts.TruckScheduleID,
       s.StoreID,
       ts.ShipmentID,
       ts.ScheduleDateTime,
       DATE_ADD(ts.ScheduleDateTime, INTERVAL TIME_TO_SEC(r.Time_duration) SECOND) AS EndTime,  -- Calculating EndTime
       shipment_progress.RouteID,
       ts.AssistantID,
       ts.DriverID,
       ts.TruckID,
       r.Time_duration as Hours,
       ts.Status,
       s.City AS StoreCity,
       a.Name AS AssistantName,
       d.Name AS DriverName,
       t.LicencePlate,
       shipment_progress.TotalOrders,
       shipment_progress.Delivered
FROM truckschedule ts
         JOIN truck t ON ts.TruckID = t.TruckID
         JOIN driver_details_with_employee d ON ts.DriverID = d.DriverID
         JOIN assistant_details_with_employee a ON ts.AssistantID = a.AssistantID
         JOIN (
             select s.ShipmentID,s.RouteID, p.TotalOrders, p.Delivered from shipment_progress p join shipment s on p.ShipmentID = s.ShipmentID
    ) AS shipment_progress ON ts.ShipmentID = shipment_progress.ShipmentID
         JOIN route r ON shipment_progress.RouteID = r.RouteID
         JOIN store s ON r.StoreID = s.StoreID
ORDER BY EndTime DESC;
//


# To get the order details with the latest status and some more details
CREATE VIEW Quarterly_Product_Report AS
SELECT YEAR(o.OrderDate)       AS Year,
       QUARTER(o.OrderDate)    AS Quarter,
       p.ProductID,
       p.Name                  AS ProductName,
       p.Type                  AS ProductType,
       SUM(c.Amount)           AS TotalQuantity,
       SUM(c.Amount * p.Price) AS TotalRevenue
FROM `Order` o
         JOIN Contains c ON o.OrderID = c.OrderID
         JOIN Product p ON c.ProductID = p.ProductID
         JOIN (SELECT OrderID, MAX(TimeStamp) AS LatestTimestamp
               FROM order_tracking
               GROUP BY OrderID) latest_status ON o.OrderID = latest_status.OrderID
         JOIN order_tracking ot ON latest_status.OrderID = ot.OrderID
    AND latest_status.LatestTimestamp = ot.TimeStamp
WHERE ot.Status != 'Cancelled'
   or ot.Status != 'Attention'
GROUP BY YEAR(o.OrderDate),
         QUARTER(o.OrderDate),
         p.ProductID
ORDER BY Quarter,
         TotalRevenue DESC;
//

CREATE VIEW Quarterly_Store_Report AS
SELECT YEAR(o.OrderDate)    AS Year,
       QUARTER(o.OrderDate) AS Quarter,
       s.StoreID,
       s.City               AS StoreCity,
       COUNT(o.OrderID)     AS NumberOfOrders,
       SUM(o.Value)         AS TotalRevenue
FROM `Order` o
         JOIN
     `Route` r ON o.RouteID = r.RouteID
         JOIN
     `Store` s ON r.StoreID = s.StoreID
         JOIN
     `Order_Tracking` ot ON o.OrderID = ot.OrderID
WHERE ot.Status not in ('Cancelled', 'Attention')
GROUP BY YEAR(o.OrderDate), QUARTER(o.OrderDate), s.StoreID;
//

create view Train_Schedule_With_Destinations as
select ts.TrainScheduleID,
       (t.FullCapacity - ts.FilledCapacity)       as RemainingCapacity,
       t.FullCapacity,
       (ts.FilledCapacity / t.FullCapacity) * 100 as `FilledPercentage`,
       ts.TrainID,
       ts.ScheduleDateTime,
       ts.Status,
       t.StoreID,
       t.Time,
       t.Day,
       s.City                                     as StoreCity,
       COUNT(c.OrderID)                           as TotalOrders
from TrainSchedule ts
         join Train t on ts.TrainID = t.TrainID
         join Store s on t.StoreID = s.StoreID
         left outer join train_contains c on ts.TrainScheduleID = c.TrainScheduleID
group by ts.TrainScheduleID;
;
//

create view customer_report as
select c.CustomerID,
       c.Name,
       c.Username,
       c.Address,
       c.Type,
       c.City,
       c.Contact,
       count(o.OrderID) as TotalOrders,
       sum(o.Value)     as TotalRevenue
from Customer c
         join
     `Order` O on c.CustomerID = O.CustomerID
group by c.CustomerID;
//

# to get the daily store sales (sales on a date for each store)
CREATE VIEW v_daily_store_sales AS
SELECT s.StoreID,
       s.City            AS StoreCity,
       DATE(o.OrderDate) AS SaleDate,
       COUNT(o.OrderID)  AS NumberOfOrders,
       SUM(o.Value)      AS TotalRevenue
FROM `Order` o
         JOIN
     Route r ON o.RouteID = r.RouteID
         JOIN
     Store s ON r.StoreID = s.StoreID
         JOIN
     Order_Tracking ot ON o.OrderID = ot.OrderID
WHERE ot.Status NOT IN ('Cancelled', 'Attention')
GROUP BY s.StoreID, s.City, DATE(o.OrderDate)
ORDER BY SaleDate DESC, TotalRevenue DESC
;
//


CREATE VIEW Truck_Distances AS
SELECT ts.TruckID,
       SUM(r.Distance) AS TotalDistance
FROM TruckSchedule ts
    join shipment on ts.ShipmentID = shipment.ShipmentID
         JOIN Route r ON shipment.RouteID = r.RouteID
WHERE ts.Status = 'Completed'
GROUP BY ts.TruckID;
//


-- Shakthi - View for Driver and Assistant login
create view login_info_view as
select e.Type, e.EmployeeID, e.Name, e.Username, e.PasswordHash, a.AssistantID, d.DriverID
from Employee as e
         left join Assistant as a on e.EmployeeID = a.EmployeeID
         left join Driver as d on e.EmployeeID = d.EmployeeID
where e.Type = ('Driver')
   or e.Type = ('Assistant');

//

# Rashmika customer views
CREATE VIEW customer_profile AS
SELECT CustomerID,
       Name,
       Username,
       Address,
       Type,
       City,
       Contact
FROM Customer;
//

# Chehan's
CREATE OR REPLACE VIEW RouteStore AS
SELECT s.ShipmentID, r.StoreID
FROM shipment s
         JOIN route r ON s.RouteID = r.RouteID;
//

CREATE OR REPLACE VIEW AvailableDrivers AS
SELECT d.DriverID, d.CompletedHours, e.StoreID
FROM driver d
         JOIN employee e ON d.EmployeeID = e.EmployeeID
WHERE d.Status = 'Available'
  AND d.CompletedHours <= d.WorkingHours
ORDER BY d.CompletedHours
;
//

CREATE OR REPLACE VIEW AvailableAssistants AS
SELECT a.AssistantID, a.CompletedHours, e.StoreID
FROM assistant a
         JOIN employee e ON a.EmployeeID = e.EmployeeID
WHERE a.Status = 'Available'
  AND a.CompletedHours <= a.WorkingHours
ORDER BY a.CompletedHours
;
//



DELIMITER ;