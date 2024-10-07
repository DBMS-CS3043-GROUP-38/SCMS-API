# Remember to uncomment delimiter lines if you are using MySQL Workbench

CREATE TABLE `Store`
(
    `StoreID` INT AUTO_INCREMENT,
    `City`    VARCHAR(45) NOT NULL,
    PRIMARY KEY (`StoreID`)
);

CREATE TABLE `Employee`
(
    `EmployeeID`   INT AUTO_INCREMENT,
    `Name`         VARCHAR(100) NOT NULL,
    `Username`     VARCHAR(50)  NOT NULL,
    `Address`      VARCHAR(100),
    `PasswordHash` VARCHAR(200) NOT NULL,
    `Type`         ENUM ('Admin', 'StoreManager', 'Driver', 'Assistant') NOT NULL,
    `StoreID`      INT,
    PRIMARY KEY (`EmployeeID`),
    FOREIGN KEY (`StoreID`) REFERENCES Store (`StoreID`)
);


CREATE TABLE `Driver`
(
    `DriverID`       INT AUTO_INCREMENT,
    `EmployeeID`     INT NOT NULL,
    `WorkingHours`   INT,
    `CompletedHours` INT,
    `Status`         ENUM ('Available', 'Busy'),
    PRIMARY KEY (`DriverID`),
    FOREIGN KEY (`EmployeeID`) REFERENCES `Employee` (`EmployeeID`)
);

CREATE TABLE `Assistant`
(
    `AssistantID`    INT AUTO_INCREMENT,
    `EmployeeID`     INT NOT NULL,
    `WorkingHours`   INT,
    `CompletedHours` INT,
    `Status`         ENUM ('Available', 'Busy'),
    PRIMARY KEY (`AssistantID`),
    FOREIGN KEY (`EmployeeID`) REFERENCES `Employee` (`EmployeeID`)
);

CREATE TABLE `Shipment`
(
    `ShipmentID`     INT AUTO_INCREMENT,
    `CreatedDate`    DATE           NOT NULL,
    `Capacity`       DECIMAL(10, 2) NOT NULL,
    `FilledCapacity` DECIMAL(10, 2),
    `Status`         ENUM ('Ready', 'NotReady'),
    PRIMARY KEY (`ShipmentID`)
);

CREATE TABLE `Product`
(
    `ProductID`                INT AUTO_INCREMENT,
    `Name`                     VARCHAR(100)   NOT NULL,
    `TrainCapacityConsumption` DECIMAL(10, 2) NOT NULL,
    `Price`                    DECIMAL(10, 2) NOT NULL,
    `Type`                     ENUM ('Clothes', 'Groceries', 'Electronics', 'Cosmetics', 'KitchenItems', 'Others'),
    PRIMARY KEY (`ProductID`)
);

CREATE TABLE `Train`
(
    `TrainID`       INT AUTO_INCREMENT,
    `FullCapacity`  DECIMAL(10, 2) NOT NULL,
    `StoreID` INT            NOT NULL,
    `Time`          TIME           NOT NULL,
    `Day`           ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
    PRIMARY KEY (`TrainID`),
    FOREIGN KEY (`StoreID`) REFERENCES Store (`StoreID`)
);

CREATE TABLE `TrainSchedule`
(
    `TrainScheduleID`  INT AUTO_INCREMENT,
    `FilledCapacity`   DECIMAL(10, 2) NOT NULL,
    `TrainID`          INT            NOT NULL,
    `ScheduleDateTime` TIMESTAMP      NOT NULL,
    `Status`           ENUM ('Future', 'Completed'),
    PRIMARY KEY (`TrainScheduleID`),
    FOREIGN KEY (`TrainID`) REFERENCES `Train` (`TrainID`)
);



CREATE TABLE `Truck`
(
    `TruckID`       INT AUTO_INCREMENT,
    `StoreID` INT        NOT NULL,
    `LicencePlate`  VARCHAR(8) NOT NULL,
    `Status`        ENUM ('Available', 'Busy'),
    PRIMARY KEY (`TruckID`),
    FOREIGN KEY (`StoreID`) REFERENCES Store (`StoreID`)
);

CREATE TABLE `Route`
(
    `RouteID`       INT AUTO_INCREMENT,
    `Time_duration` TIME NOT NULL,
    `Description`   TEXT,
    `StoreID`         INT  NOT NULL,
    PRIMARY KEY (`RouteID`),
    FOREIGN KEY (`StoreID`) REFERENCES Store (`StoreID`)
);

CREATE TABLE `Order_status`
(
    `Status` VARCHAR(50),
    PRIMARY KEY (`Status`)
);

CREATE TABLE `Customer`
(
    `CustomerID`   INT AUTO_INCREMENT,
    `Username`     VARCHAR(50),
    `Name`         VARCHAR(100)             NOT NULL,
    `Address`      VARCHAR(100),
    `Type`         ENUM ('End', 'Retailer') NOT NULL,
    `City`         VARCHAR(50),
    `PasswordHash` VARCHAR(200),
    PRIMARY KEY (`CustomerID`)
);

CREATE TABLE `Order`
(
    `OrderID`         INT AUTO_INCREMENT,
    `CustomerID`      INT            NOT NULL,
    `Value`           DECIMAL(10, 2) NOT NULL,
    `OrderDate`       DATE           NOT NULL,
    `DeliveryDate`    DATE,
    `RouteID`         INT            NOT NULL,
    `TotalVolume`     DECIMAL(10, 2) NOT NULL,
    `ShipmentID`      INT,
    `TrainScheduleID` INT,
    PRIMARY KEY (`OrderID`),
    FOREIGN KEY (`ShipmentID`) REFERENCES `Shipment` (`ShipmentID`),
    FOREIGN KEY (`CustomerID`) REFERENCES `Customer` (`CustomerID`),
    FOREIGN KEY (`RouteID`) REFERENCES `Route` (`RouteID`),
    FOREIGN KEY (`TrainScheduleID`) REFERENCES `TrainSchedule` (`TrainScheduleID`)
);

create table `Contains`
(
    `OrderID`   INT            NOT NULL,
    `ProductID` INT            NOT NULL,
    `Amount`    INT            NOT NULL,
    PRIMARY KEY (`OrderID`, `ProductID`),
    FOREIGN KEY (`OrderID`) REFERENCES `Order` (`OrderID`),
    FOREIGN KEY (`ProductID`) REFERENCES `Product` (`ProductID`)
);



CREATE TABLE `TruckSchedule`
(
    `TruckScheduleID` INT AUTO_INCREMENT,
    `StoreID`           INT NOT NULL,
    `ShipmentID`      INT  NOT NULL,
    `ScheduleDate`    DATE NOT NULL,
    `RouteID`         INT  NOT NULL,
    `AssistantID`     INT  NOT NULL,
    `DriverID`        INT  NOT NULL,
    `TruckID`         INT  NOT NULL,
    `Hours`           DECIMAL(5, 2),
    `Status`          ENUM ('Future', 'Completed'),
    PRIMARY KEY (`TruckScheduleID`),
    FOREIGN KEY (`StoreID`) REFERENCES Store (`StoreID`),
    FOREIGN KEY (`RouteID`) REFERENCES `Route` (`RouteID`),
    FOREIGN KEY (`DriverID`) REFERENCES `Driver` (`DriverID`),
    FOREIGN KEY (`TruckID`) REFERENCES `Truck` (`TruckID`),
    FOREIGN KEY (`AssistantID`) REFERENCES `Assistant` (`AssistantID`),
    FOREIGN KEY (`ShipmentID`) REFERENCES `Shipment` (`ShipmentID`)
);

CREATE TABLE `Order_Tracking`
(
    `OrderID`   INT         NOT NULL,
    `TimeStamp` TIMESTAMP   NOT NULL,
    `Status`    VARCHAR(50) NOT NULL,
    PRIMARY KEY (`OrderID`, `TimeStamp`),
    FOREIGN KEY (`OrderID`) REFERENCES `Order` (`OrderID`),
    foreign key (`Status`) references `Order_status` (`Status`)
);

# DELIMITER //
CREATE TRIGGER update_order_totals
AFTER INSERT ON Contains
FOR EACH ROW
BEGIN
    DECLARE productVolume DECIMAL(10, 2);
    DECLARE productPrice DECIMAL(10, 2);
    DECLARE newVolume DECIMAL(10, 2);
    DECLARE newValue DECIMAL(10, 2);

    -- Fetch the Product's volume and price
    SELECT TrainCapacityConsumption, Price INTO productVolume, productPrice
    FROM Product
    WHERE ProductID = NEW.ProductID;

    -- Calculate the additional volume and value
    SET newVolume = productVolume * NEW.Amount;
    SET newValue = productPrice * NEW.Amount;

    -- Update the Order's total volume and value
    UPDATE `Order`
    SET TotalVolume = TotalVolume + newVolume,
        Value = Value + newValue
    WHERE OrderID = NEW.OrderID;
END;
# DELIMITER ;

CREATE VIEW Quarterly_Order_Report AS
SELECT
    YEAR(o.OrderDate) AS Year,
    QUARTER(o.OrderDate) AS Quarter,
    p.ProductID,
    p.Name AS ProductName,
    p.Type AS ProductType,
    SUM(c.Amount) AS TotalQuantity,
    SUM(c.Amount * p.Price) AS TotalRevenue
FROM
    scms.`order` o
        JOIN scms.Contains c ON o.OrderID = c.OrderID
        JOIN scms.Product p ON c.ProductID = p.ProductID
        JOIN (
        SELECT OrderID, MAX(TimeStamp) AS LatestTimestamp
        FROM scms.order_tracking
        GROUP BY OrderID
    ) latest_status ON o.OrderID = latest_status.OrderID
        JOIN scms.order_tracking ot ON latest_status.OrderID = ot.OrderID
        AND latest_status.LatestTimestamp = ot.TimeStamp
WHERE
    ot.Status = 'Delivered'
GROUP BY
    YEAR(o.OrderDate),
    QUARTER(o.OrderDate),
    p.ProductID
ORDER BY
    Quarter,
    TotalRevenue DESC;

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
JOIN
    `Route` r ON o.RouteID = r.RouteID
JOIN
    `Store` s ON r.StoreID = s.StoreID
JOIN
    `Order_Tracking` ot ON o.OrderID = ot.OrderID
WHERE
    ot.Status = 'Delivered'
GROUP BY
    YEAR(o.OrderDate), QUARTER(o.OrderDate), s.StoreID;
