drop schema if exists scms;

create schema scms;

use scms;

CREATE TABLE `Store` (
    `StoreID` INT AUTO_INCREMENT,
    `City` VARCHAR(45) NOT NULL,
    PRIMARY KEY (`StoreID`)
);

CREATE TABLE `Employee` (
    `EmployeeID` INT AUTO_INCREMENT,
    `Name` VARCHAR(100) NOT NULL,
    `Username` VARCHAR(50) NOT NULL,
    `Address` VARCHAR(100),
    `Contact` VARCHAR(15),
    `PasswordHash` VARCHAR(200) NOT NULL,
    `Type` ENUM(
        'Admin',
        'StoreManager',
        'Driver',
        'Assistant'
    ) NOT NULL,
    `StoreID` INT,
    PRIMARY KEY (`EmployeeID`),
    FOREIGN KEY (`StoreID`) REFERENCES Store (`StoreID`)
);

CREATE TABLE `Driver` (
    `DriverID` INT AUTO_INCREMENT,
    `EmployeeID` INT NOT NULL,
    `WorkingHours` INT,
    `CompletedHours` INT,
    `Status` ENUM('Available', 'Busy'),
    PRIMARY KEY (`DriverID`),
    FOREIGN KEY (`EmployeeID`) REFERENCES `Employee` (`EmployeeID`)
);

CREATE TABLE `Assistant` (
    `AssistantID` INT AUTO_INCREMENT,
    `EmployeeID` INT NOT NULL,
    `WorkingHours` INT,
    `CompletedHours` INT,
    `Status` ENUM('Available', 'Busy'),
    PRIMARY KEY (`AssistantID`),
    FOREIGN KEY (`EmployeeID`) REFERENCES `Employee` (`EmployeeID`)
);

CREATE TABLE `Product` (
    `ProductID` INT AUTO_INCREMENT,
    `Name` VARCHAR(100) NOT NULL,
    `TrainCapacityConsumption` DECIMAL(10, 2) NOT NULL,
    `Price` DECIMAL(10, 2) NOT NULL,
    `Type` ENUM(
        'Clothes',
        'Groceries',
        'Electronics',
        'Cosmetics',
        'KitchenItems',
        'Others'
    ),
    PRIMARY KEY (`ProductID`)
);

CREATE TABLE `Train` (
    `TrainID` INT AUTO_INCREMENT,
    `FullCapacity` DECIMAL(10, 2) NOT NULL,
    `StoreID` INT NOT NULL,
    `Time` TIME NOT NULL,
    `Day` ENUM(
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
    ),
    PRIMARY KEY (`TrainID`),
    FOREIGN KEY (`StoreID`) REFERENCES Store (`StoreID`)
);

CREATE TABLE `TrainSchedule` (
    `TrainScheduleID` INT AUTO_INCREMENT,
    `FilledCapacity` DECIMAL(10, 2) NOT NULL,
    `TrainID` INT NOT NULL,
    `ScheduleDateTime` TIMESTAMP NOT NULL,
    `Status` ENUM(
        'Not Completed',
        'Completed',
        'In Progress'
    ),
    PRIMARY KEY (`TrainScheduleID`),
    FOREIGN KEY (`TrainID`) REFERENCES `Train` (`TrainID`)
);

create table `Train_Contains` (
    `TrainScheduleID` INT,
    `OrderID` INT,
    PRIMARY KEY (`TrainScheduleID`, `OrderID`),
    FOREIGN KEY (`TrainScheduleID`) REFERENCES `TrainSchedule` (`TrainScheduleID`)
);

CREATE TABLE `Truck` (
    `TruckID` INT AUTO_INCREMENT,
    `StoreID` INT NOT NULL,
    `LicencePlate` VARCHAR(8) NOT NULL,
    `Status` ENUM('Available', 'Busy'),
    PRIMARY KEY (`TruckID`),
    FOREIGN KEY (`StoreID`) REFERENCES Store (`StoreID`)
);

CREATE TABLE `Route` (
    `RouteID` INT AUTO_INCREMENT,
    `Time_duration` TIME NOT NULL,
    `Description` TEXT,
    `StoreID` INT NOT NULL,
    `Distance` DECIMAL(5, 2),
    PRIMARY KEY (`RouteID`),
    FOREIGN KEY (`StoreID`) REFERENCES Store (`StoreID`)
);

CREATE TABLE `Order_status` (
    `Status` VARCHAR(50),
    PRIMARY KEY (`Status`)
);

CREATE TABLE `Customer` (
    `CustomerID` INT AUTO_INCREMENT,
    `Username` VARCHAR(50),
    `Name` VARCHAR(100) NOT NULL,
    `Address` VARCHAR(100),
    `Contact` VARCHAR(15),
    `Type` ENUM('End', 'Retailer') NOT NULL,
    `City` VARCHAR(50),
    `PasswordHash` VARCHAR(200),
    PRIMARY KEY (`CustomerID`)
);

CREATE TABLE `Order` (
    `OrderID` INT AUTO_INCREMENT,
    `CustomerID` INT NOT NULL,
    `Value` DECIMAL(10, 2) NOT NULL,
    `OrderDate` DATE NOT NULL,
    `DeliveryDate` DATE,
    `RouteID` INT NOT NULL,
    `TotalVolume` DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (`OrderID`),
    FOREIGN KEY (`CustomerID`) REFERENCES `Customer` (`CustomerID`),
    FOREIGN KEY (`RouteID`) REFERENCES `Route` (`RouteID`)
);

create table `Contains` (
    `OrderID` INT NOT NULL,
    `ProductID` INT NOT NULL,
    `Amount` INT NOT NULL,
    PRIMARY KEY (`OrderID`, `ProductID`),
    FOREIGN KEY (`OrderID`) REFERENCES `Order` (`OrderID`),
    FOREIGN KEY (`ProductID`) REFERENCES `Product` (`ProductID`)
);

CREATE TABLE `Shipment` (
    `ShipmentID` INT AUTO_INCREMENT,
    `CreatedDate` DATE NOT NULL,
    `Capacity` DECIMAL(10, 2) NOT NULL,
    `RouteID` INT NOT NULL,
    `FilledCapacity` DECIMAL(10, 2),
    `Status` ENUM(
        'Ready',
        'NotReady',
        'Completed'
    ),
    PRIMARY KEY (`ShipmentID`),
    FOREIGN KEY (`RouteID`) REFERENCES `Route` (`RouteID`)
);

create table `Shipment_contains` (
    `ShipmentID` INT NOT NULL,
    `OrderID` INT NOT NULL,
    PRIMARY KEY (`ShipmentID`, `OrderID`),
    FOREIGN KEY (`ShipmentID`) REFERENCES `Shipment` (`ShipmentID`)
);

CREATE TABLE `TruckSchedule` (
    `TruckScheduleID` INT AUTO_INCREMENT,
    `StoreID` INT NOT NULL,
    `ShipmentID` INT NOT NULL,
    `ScheduleDateTime` TIMESTAMP NOT NULL,
    `RouteID` INT NOT NULL,
    `AssistantID` INT NOT NULL,
    `DriverID` INT NOT NULL,
    `TruckID` INT NOT NULL,
    `Hours` TIME,
    `Status` ENUM(
        'Not Completed',
        'In Progress',
        'Completed'
    ),
    PRIMARY KEY (`TruckScheduleID`),
    FOREIGN KEY (`StoreID`) REFERENCES Store (`StoreID`),
    FOREIGN KEY (`RouteID`) REFERENCES `Route` (`RouteID`),
    FOREIGN KEY (`DriverID`) REFERENCES `Driver` (`DriverID`),
    FOREIGN KEY (`TruckID`) REFERENCES `Truck` (`TruckID`),
    FOREIGN KEY (`AssistantID`) REFERENCES `Assistant` (`AssistantID`),
    FOREIGN KEY (`ShipmentID`) REFERENCES `Shipment` (`ShipmentID`)
);

CREATE TABLE `Order_Tracking` (
    `OrderID` INT NOT NULL,
    `TimeStamp` TIMESTAMP NOT NULL,
    `Status` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`OrderID`, `TimeStamp`),
    FOREIGN KEY (`OrderID`) REFERENCES `Order` (`OrderID`),
    foreign key (`Status`) references `Order_status` (`Status`)
);

DELIMITER / /
# Triggers

# Comment this trigger when running the script for creating orders and uncomment when running simulations

# Auto adding pending status for new orders
CREATE TRIGGER after_order_insert
    AFTER INSERT
    ON `Order`
    FOR EACH ROW
BEGIN
    INSERT INTO Order_Tracking (OrderID, TimeStamp, Status)
    VALUES (NEW.OrderID, NOW(), 'Pending');
END;

/ /

# Trigger to update the total volume and value of an order when a new product is added to contains
CREATE TRIGGER update_order_totals
    AFTER INSERT
    ON Contains
    FOR EACH ROW
BEGIN
    DECLARE productVolume DECIMAL(10, 2);
    DECLARE productPrice DECIMAL(10, 2);
    DECLARE newVolume DECIMAL(10, 2);
    DECLARE newValue DECIMAL(10, 2);

    -- Fetching the Product's volume and price
    SELECT TrainCapacityConsumption, Price
    INTO productVolume, productPrice
    FROM Product
    WHERE ProductID = NEW.ProductID;

    -- Calculating the additional volume and value
    SET newVolume = productVolume * NEW.Amount;
    SET newValue = productPrice * NEW.Amount;

    -- Updating the Order's total volume and value
    UPDATE `Order`
    SET TotalVolume = TotalVolume + newVolume,
        Value       = Value + newValue
    WHERE OrderID = NEW.OrderID;
END;

/ /

# Trigger to update the total volume of a train when order is added to train_contains
CREATE TRIGGER before_train_contains_insert
    BEFORE INSERT
    ON Train_Contains
    FOR EACH ROW
BEGIN
    DECLARE total_volume DECIMAL(10, 2);
    DECLARE full_capacity DECIMAL(10, 2);
    DECLARE new_filled_capacity DECIMAL(10, 2);

    -- Getting the TotalVolume of the Order
    SELECT TotalVolume
    INTO total_volume
    FROM `Order`
    WHERE OrderID = NEW.OrderID;

    -- Getting the FullCapacity of the Train
    SELECT t.FullCapacity
    INTO full_capacity
    FROM Train t
             JOIN TrainSchedule ts ON t.TrainID = ts.TrainID
    WHERE ts.TrainScheduleID = NEW.TrainScheduleID;

    -- Calculating the new filled capacity
    SELECT FilledCapacity + total_volume
    INTO new_filled_capacity
    FROM TrainSchedule
    WHERE TrainScheduleID = NEW.TrainScheduleID;

    -- Checking if the new filled capacity exceeds the full capacity
    IF new_filled_capacity > full_capacity THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: Adding this order would exceed the train\'s full capacity.';
    ELSE
        -- Updating the FilledCapacity in the TrainSchedule table
        UPDATE TrainSchedule
        SET FilledCapacity = new_filled_capacity
        WHERE TrainScheduleID = NEW.TrainScheduleID;
    END IF;
END;

/ /

# Trigger to check if the driver and assistant hours exceed the limit
CREATE TRIGGER check_exceeding_hours BEFORE INSERT ON TruckSchedule
FOR EACH ROW
BEGIN
    DECLARE total_driver_hours INT;
    DECLARE total_assistant_hours INT;

    -- Getting total hours for the driver for the current week
    SELECT IFNULL(SUM(Hours), 0) INTO total_driver_hours
    FROM TruckSchedule
    WHERE DriverID = NEW.DriverID
      AND WEEK(ScheduleDateTime) = WEEK(NEW.ScheduleDateTime);

    -- Getting total hours for the assistant for the current week
    SELECT IFNULL(SUM(Hours), 0) INTO total_assistant_hours
    FROM TruckSchedule
    WHERE AssistantID = NEW.AssistantID
      AND WEEK(ScheduleDateTime) = WEEK(NEW.ScheduleDateTime);

    -- Checking if driver hours exceed 40 hours per week
    IF total_driver_hours + NEW.Hours > 40 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Driver work hours exceed 40 hours per week';
    END IF;

    -- Checking if assistant hours exceed 60 hours per week
    IF total_assistant_hours + NEW.Hours > 60 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Assistant work hours exceed 60 hours per week';
    END IF;
END//

CREATE TRIGGER check_consecutive_scheduling BEFORE INSERT ON TruckSchedule
FOR EACH ROW
BEGIN
    DECLARE last_schedule_date TIMESTAMP;
    DECLARE second_last_schedule_date TIMESTAMP;

    -- Making sure driver is not assigned to consecutive schedules
    SELECT ScheduleDateTime INTO last_schedule_date
    FROM TruckSchedule
    WHERE DriverID = NEW.DriverID
    ORDER BY ScheduleDateTime DESC
    LIMIT 1;

    IF last_schedule_date IS NOT NULL AND TIMESTAMPDIFF(HOUR, last_schedule_date, NEW.ScheduleDateTime) < 24 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Driver cannot be assigned to consecutive schedules within 24 hours';
    END IF;

    -- Making sure assistant does not exceed two consecutive turns
    SELECT ScheduleDateTime INTO second_last_schedule_date
    FROM TruckSchedule
    WHERE AssistantID = NEW.AssistantID
    ORDER BY ScheduleDateTime DESC
    LIMIT 1 OFFSET 1;

    IF second_last_schedule_date IS NOT NULL AND TIMESTAMPDIFF(HOUR, second_last_schedule_date, NEW.ScheduleDateTime) < 24 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Assistant cannot have more than two consecutive turns within 24 hours';
    END IF;
END//

# Views

# TO get details of the driver with the employee details
create view Driver_Details_With_Employee as
select d.DriverID, d.EmployeeID, e.Name, e.Username, e.Address, e.Contact, e.Type, d.WorkingHours, d.CompletedHours, d.Status
from driver d
    join employee e on d.EmployeeID = e.EmployeeID;

/ /

# TO get details of the assistant with the employee details
create view Assistant_Details_With_Employee as
select a.AssistantID, a.EmployeeID, e.Name, e.Username, e.Address, e.Contact, e.Type, a.WorkingHours, a.CompletedHours, a.Status
from assistant a
    join employee e on a.EmployeeID = e.EmployeeID;

/ /

# To get details of the truck with the more details
create view truck_schedule_with_details as
select
    ts.TruckScheduleID,
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
    t.LicencePlate
from
    truckschedule ts
    join truck t on ts.TruckID = t.TruckID
    join route r on ts.RouteID = r.RouteID
    join store s on t.StoreID = s.StoreID
    join driver_details_with_employee d on ts.DriverID = d.DriverID
    join assistant_details_with_employee a on ts.AssistantID = a.AssistantID;

# To get the order details with the latest status and some more details
CREATE VIEW Order_Details_With_Latest_Status AS
SELECT
    o.OrderID,
    o.CustomerID,
    c.Name AS CustomerName,
    c.Type AS CustomerType,
    o.Value,
    o.TotalVolume,
    o.OrderDate,
    tc.TrainScheduleID,
    r.StoreID,
    s.City AS StoreCity,
    o.RouteID,
    ot.Status AS LatestStatus,
    ot.TimeStamp AS LatestTimeStamp,
    sc.ShipmentID,
    ts.TruckScheduleID,
    a.AssistantID,
    a.Name AS AssistantName,
    d.DriverID,
    d.Name AS DriverName,
    t.TruckID,
    t.LicencePlate,
    sh.Status AS ShipmentStatus

FROM
    `Order` o
    JOIN `Route` r ON o.RouteID = r.RouteID
    JOIN `Store` s ON r.StoreID = s.StoreID
    JOIN `Order_Tracking` ot ON o.OrderID = ot.OrderID
    JOIN (
        SELECT OrderID, MAX(TimeStamp) AS LatestTimeStamp
        FROM `Order_Tracking`
        GROUP BY
            OrderID
    ) AS latest ON ot.OrderID = latest.OrderID
    AND ot.TimeStamp = latest.LatestTimeStamp
    join customer c on o.CustomerID = c.CustomerID
    left outer join shipment_contains sc on o.OrderID = sc.OrderID
    left outer join shipment sh on sc.ShipmentID = sh.ShipmentID
    left outer join truckschedule ts on sh.ShipmentID = ts.ShipmentID
    left outer join truck t on ts.TruckID = t.TruckID
    left outer join assistant_details_with_employee a on ts.AssistantID = a.AssistantID
    left outer join (
        select DriverID, employee.Name
        from driver
            join employee on driver.EmployeeID = employee.EmployeeID
    ) d on ts.DriverID = d.DriverID
    left outer join train_contains tc on tc.OrderID = o.OrderID;

;

/ /

# To get the total completed hours of the driver
CREATE VIEW DriverCompletedHours AS
SELECT D.DriverID, E.Name, SUM(TS.Hours) AS TotalCompletedHours
FROM
    Driver D
    JOIN Employee E ON D.EmployeeID = E.EmployeeID
    JOIN TruckSchedule TS ON D.DriverID = TS.DriverID
WHERE
    TS.Status = 'Completed'
GROUP BY
    D.DriverID;

CREATE VIEW AssistantCompletedHours AS
SELECT A.AssistantID, E.Name, SUM(TS.Hours) AS TotalCompletedHours
FROM
    Assistant A
    JOIN Employee E ON A.EmployeeID = E.EmployeeID
    JOIN TruckSchedule TS ON A.AssistantID = TS.AssistantID
WHERE
    TS.Status = 'Completed'
GROUP BY
    A.AssistantID;

/ /

# To get sales made by each product per quarter
CREATE VIEW Quarterly_Product_Report AS
SELECT
    YEAR(o.OrderDate) AS Year,
    QUARTER(o.OrderDate) AS Quarter,
    p.ProductID,
    p.Name AS ProductName,
    p.Type AS ProductType,
    SUM(c.Amount) AS TotalQuantity,
    SUM(c.Amount * p.Price) AS TotalRevenue
FROM
    `Order` o
    JOIN Contains c ON o.OrderID = c.OrderID
    JOIN Product p ON c.ProductID = p.ProductID
    JOIN (
        SELECT OrderID, MAX(TimeStamp) AS LatestTimestamp
        FROM order_tracking
        GROUP BY
            OrderID
    ) latest_status ON o.OrderID = latest_status.OrderID
    JOIN order_tracking ot ON latest_status.OrderID = ot.OrderID
    AND latest_status.LatestTimestamp = ot.TimeStamp
WHERE
    ot.Status != 'Cancelled'
    or ot.Status != 'Attention'
GROUP BY
    YEAR(o.OrderDate),
    QUARTER(o.OrderDate),
    p.ProductID
ORDER BY Quarter, TotalRevenue DESC;

/ /

# To get the total revenue and number of orders per quarter for each store
CREATE VIEW Quarterly_Store_Report AS
SELECT
    YEAR(o.OrderDate) AS Year,
    QUARTER(o.OrderDate) AS Quarter,
    s.StoreID,
    s.City AS StoreCity,
    COUNT(o.OrderID) AS NumberOfOrders,
    SUM(o.Value) AS TotalRevenue
FROM
    `Order` o
    JOIN `Route` r ON o.RouteID = r.RouteID
    JOIN `Store` s ON r.StoreID = s.StoreID
    JOIN `Order_Tracking` ot ON o.OrderID = ot.OrderID
WHERE
    ot.Status not in('Cancelled', 'Attention')
GROUP BY
    YEAR(o.OrderDate),
    QUARTER(o.OrderDate),
    s.StoreID;

/ /

# To get the train schedule with percentages and destinations
create view Train_Schedule_With_Destinations as
select
    ts.TrainScheduleID,
    (
        t.FullCapacity - ts.FilledCapacity
    ) as RemainingCapacity,
    t.FullCapacity,
    (
        ts.FilledCapacity / t.FullCapacity
    ) * 100 as `FilledPercentage`,
    ts.TrainID,
    ts.ScheduleDateTime,
    ts.Status,
    t.StoreID,
    t.Time,
    t.Day,
    s.City as StoreCity,
    COUNT(c.OrderID) as TotalOrders
from
    TrainSchedule ts
    join Train t on ts.TrainID = t.TrainID
    join Store s on t.StoreID = s.StoreID
    left outer join train_contains c on ts.TrainScheduleID = c.TrainScheduleID
group by
    ts.TrainScheduleID;

;

/ /

# To get the total revenue and number of orders for each customer
create view customer_report as
select
    c.CustomerID,
    c.Name,
    c.Username,
    c.Address,
    c.Type,
    c.City,
    count(o.OrderID) as TotalOrders,
    sum(o.Value) as TotalRevenue
from Customer c
    join `Order` O on c.CustomerID = O.CustomerID
group by
    c.CustomerID;

/ /

# To get the total distance and duration for each truck
create view truck_report as
select
    t.TruckID,
    t.LicencePlate,
    sum(r.Distance) as TotalDistance,
    sum(r.Time_duration) as TotalDuration,
    s.City
from
    truck t
    join truckschedule ts on t.TruckID = ts.TruckID
    join route r on ts.RouteID = r.RouteID
    join store s on t.StoreID = s.StoreID
where
    ts.Status = 'Completed'
group by
    t.TruckID;

/ /

# to get the daily store sales (sales on a date for each store)
CREATE VIEW v_daily_store_sales AS
SELECT
    s.StoreID,
    s.City AS StoreCity,
    DATE(o.OrderDate) AS SaleDate,
    COUNT(o.OrderID) AS NumberOfOrders,
    SUM(o.Value) AS TotalRevenue
FROM
    `Order` o
    JOIN Route r ON o.RouteID = r.RouteID
    JOIN Store s ON r.StoreID = s.StoreID
    JOIN Order_Tracking ot ON o.OrderID = ot.OrderID
WHERE
    ot.Status NOT IN('Cancelled', 'Attention')
GROUP BY
    s.StoreID,
    s.City,
    DATE(o.OrderDate)
ORDER BY SaleDate DESC, TotalRevenue DESC;

/ /

# Functions

-- This function adds future train schedules for the next 7 days
-- These two functions might be implemented in the back end later.
CREATE FUNCTION AddFutureTrains()
    RETURNS INT
    DETERMINISTIC
BEGIN
    DECLARE end_date DATE;
    DECLARE start_date DATE;
    DECLARE done INT DEFAULT FALSE;
    DECLARE train_id INT;
    DECLARE full_capacity DECIMAL(10, 2);
    DECLARE store_id INT;
    DECLARE train_time TIME;
    DECLARE train_day ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
    DECLARE schedules_added INT DEFAULT 0;
    DECLARE date_ptr DATE;

    DECLARE train_cursor CURSOR FOR
        SELECT TrainID, FullCapacity, StoreID, Time, Day
        FROM Train;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Set the end date to 7 days from now
    SET end_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY);

    -- Set the start date to the last scheduled date or today
    SELECT COALESCE(MAX(DATE(ScheduleDateTime)), CURDATE())
    INTO start_date
    FROM TrainSchedule
    WHERE ScheduleDateTime >= CURDATE();


    -- CLOSE FUNCTION IF ALREADY SCHEDULED FOR 7 DAYS
    IF start_date >= end_date THEN
        RETURN 0;
    END IF;

    -- Loop through each train
    OPEN train_cursor;
    read_loop:
    LOOP
        FETCH train_cursor INTO train_id, full_capacity, store_id, train_time, train_day;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Add schedules for this train
        SET date_ptr = start_date;
        WHILE date_ptr <= end_date
            DO
                IF DAYNAME(date_ptr) = train_day THEN
                    INSERT IGNORE INTO TrainSchedule (FilledCapacity, TrainID, ScheduleDateTime, Status)
                    VALUES (0, train_id, TIMESTAMP(CONCAT(date_ptr, ' ', train_time)), 'Not Completed');
                    SET schedules_added = schedules_added + 1;
                END IF;
                SET date_ptr = DATE_ADD(date_ptr, INTERVAL 1 DAY);
            END WHILE;
    END LOOP;

    CLOSE train_cursor;

    RETURN schedules_added;
END;

/ /

DELIMITER;
