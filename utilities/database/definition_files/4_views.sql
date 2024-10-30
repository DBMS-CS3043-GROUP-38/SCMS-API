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

# Truck schedule with details
create view truck_schedule_with_details as
select ts.TruckScheduleID,
       ts.StoreID,
       ts.ShipmentID,
       ts.ScheduleDateTime,
       ts.RouteID,
       ts.AssistantID,
       ts.DriverID,
       ts.TruckID,
       ts.Hours,
       ts.Status,
       s.City as StoreCity,
       a.Name as AssistantName,
       d.Name as DriverName,
       t.LicencePlate,
       Status.TotalOrders,
       Status.Delivered
from truckschedule ts
         join truck t on ts.TruckID = t.TruckID
         join route r on ts.RouteID = r.RouteID
         join store s on t.StoreID = s.StoreID
         join driver_details_with_employee d on ts.DriverID = d.DriverID
         join assistant_details_with_employee a on ts.AssistantID = a.AssistantID
         join (select Shipment_contains.ShipmentID,
                      COUNT(Shipment_contains.OrderID)          as TotalOrders,
                      SUM(IF(LatestStatus = 'Delivered', 1, 0)) as Delivered
               from shipment_contains
                        join order_details_with_latest_status
                             on shipment_contains.OrderID = Order_Details_With_Latest_Status.OrderID
               group by ShipmentID) as status on ts.ShipmentID = status.ShipmentID
;


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
         JOIN Route r ON ts.RouteID = r.RouteID
WHERE ts.Status = 'Completed'
GROUP BY ts.TruckID;
//


-- Shakthi - View for Driver and Assistant login
create view login_info_view as select e.Type, e.EmployeeID, e.Name, e.Username, e.PasswordHash, a.AssistantID, d.DriverID 
from Employee as e 
left join Assistant as a on e.EmployeeID = a.EmployeeID 
left join Driver as d on e.EmployeeID = d.EmployeeID where e.Type = ('Driver') or e.Type = ('Assistant') ;

//

# Rashmika customer views
CREATE VIEW customer_profile AS
SELECT
    CustomerID,
    Name,
    Username,
    Address,
    Type,
    City,
    Contact
FROM
    Customer;
//


DELIMITER ;