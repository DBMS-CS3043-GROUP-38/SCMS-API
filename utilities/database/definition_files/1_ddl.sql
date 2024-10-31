# SCMS Database Definition

drop schema if exists scms;
create schema scms;
use scms;

CREATE TABLE `Store`
(
    `StoreID` INT AUTO_INCREMENT,
    `City`    VARCHAR(45) NOT NULL,
    PRIMARY KEY (`StoreID`)
);

CREATE TABLE `Employee`
(
    `EmployeeID`   INT AUTO_INCREMENT,
    `Name`         VARCHAR(100)                                          NOT NULL,
    `Username`     VARCHAR(50)                                           NOT NULL unique ,
    `Address`      VARCHAR(100),
    `Contact`      VARCHAR(15) not null ,
    `PasswordHash` VARCHAR(200)                                          NOT NULL,
    `Type`         ENUM ('Admin', 'StoreManager', 'Driver', 'Assistant') NOT NULL,
    `StoreID`      INT,
    PRIMARY KEY (`EmployeeID`),
    FOREIGN KEY (`StoreID`) REFERENCES Store (`StoreID`)
);


CREATE TABLE `Driver`
(
    `DriverID`       INT AUTO_INCREMENT,
    `EmployeeID`     INT NOT NULL,
    `WorkingHours`   TIME,
    `CompletedHours` TIME,
    `Status`         ENUM ('Available', 'Busy'),
    PRIMARY KEY (`DriverID`),
    FOREIGN KEY (`EmployeeID`) REFERENCES `Employee` (`EmployeeID`)
);

CREATE TABLE `Assistant`
(
    `AssistantID`    INT AUTO_INCREMENT,
    `EmployeeID`     INT NOT NULL,
    `WorkingHours`   TIME,
    `CompletedHours` TIME,
    `Status`         ENUM ('Available', 'Busy'),
    PRIMARY KEY (`AssistantID`),
    FOREIGN KEY (`EmployeeID`) REFERENCES `Employee` (`EmployeeID`)
);

CREATE TABLE `Product`
(
    `ProductID`                INT AUTO_INCREMENT,
    `Name`                     VARCHAR(100)   NOT NULL,
    `TrainCapacityConsumption` DECIMAL(10, 2) NOT NULL,
    `Price`                    DECIMAL(10, 2) NOT NULL,
    `Type`                     ENUM ('Clothes', 'Groceries', 'Electronics', 'Cosmetics', 'Others'),
    PRIMARY KEY (`ProductID`)
);

CREATE TABLE `Train`
(
    `TrainID`      INT AUTO_INCREMENT,
    `FullCapacity` DECIMAL(10, 2) NOT NULL,
    `StoreID`      INT            NOT NULL,
    `Time`         TIME           NOT NULL,
    `Day`          ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
    PRIMARY KEY (`TrainID`),
    FOREIGN KEY (`StoreID`) REFERENCES Store (`StoreID`)
);

CREATE TABLE `TrainSchedule`
(
    `TrainScheduleID`  INT AUTO_INCREMENT,
    `FilledCapacity`   DECIMAL(10, 2) NOT NULL,
    `TrainID`          INT            NOT NULL,
    `ScheduleDateTime` TIMESTAMP      NOT NULL,
    `Status`           ENUM ('Not Completed', 'Completed', 'In Progress'),
    PRIMARY KEY (`TrainScheduleID`),
    FOREIGN KEY (`TrainID`) REFERENCES `Train` (`TrainID`)
);

create table `Train_Contains`
(
    `TrainScheduleID` INT,
    `OrderID`         INT,
    PRIMARY KEY (`TrainScheduleID`, `OrderID`),
    FOREIGN KEY (`TrainScheduleID`) REFERENCES `TrainSchedule` (`TrainScheduleID`)
);


CREATE TABLE `Truck`
(
    `TruckID`      INT AUTO_INCREMENT,
    `StoreID`      INT        NOT NULL,
    `LicencePlate` VARCHAR(8) NOT NULL,
    `Status`       ENUM ('Available', 'Busy'),
    PRIMARY KEY (`TruckID`),
    FOREIGN KEY (`StoreID`) REFERENCES Store (`StoreID`)
);

CREATE TABLE `Route`
(
    `RouteID`       INT AUTO_INCREMENT,
    `Time_duration` TIME NOT NULL,
    `Description`   TEXT,
    `StoreID`       INT  NOT NULL,
    `Distance`      DECIMAL(5, 2),
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
    `Username`     VARCHAR(50)              not null UNIQUE,
    `Name`         VARCHAR(100)             NOT NULL,
    `Address`      VARCHAR(100),
    `Contact`      VARCHAR(15) not null ,
    `Type`         ENUM ('End', 'Retailer') NOT NULL,
    `City`         VARCHAR(50),
    `PasswordHash` VARCHAR(200),
    PRIMARY KEY (`CustomerID`)
);

CREATE TABLE `Order`
(
    `OrderID`      INT AUTO_INCREMENT,
    `CustomerID`   INT            NOT NULL,
    `Value`        DECIMAL(10, 2) NOT NULL,
    `OrderDate`    DATE           NOT NULL,
    `DeliveryDate` DATE,
    `RouteID`      INT            NOT NULL,
    `TotalVolume`  DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (`OrderID`),
    FOREIGN KEY (`CustomerID`) REFERENCES `Customer` (`CustomerID`),
    FOREIGN KEY (`RouteID`) REFERENCES `Route` (`RouteID`)
);

create table `Contains`
(
    `OrderID`   INT NOT NULL,
    `ProductID` INT NOT NULL,
    `Amount`    INT NOT NULL,
    PRIMARY KEY (`OrderID`, `ProductID`),
    FOREIGN KEY (`OrderID`) REFERENCES `Order` (`OrderID`),
    FOREIGN KEY (`ProductID`) REFERENCES `Product` (`ProductID`)
);


CREATE TABLE `Shipment`
(
    `ShipmentID`     INT AUTO_INCREMENT,
    `CreatedDate`    DATE           NOT NULL,
    `Capacity`       DECIMAL(10, 2) NOT NULL,
    `RouteID`        INT            NOT NULL,
    `FilledCapacity` DECIMAL(10, 2),
    `Status`         ENUM ('Ready', 'NotReady', 'Completed'),
    PRIMARY KEY (`ShipmentID`),
    FOREIGN KEY (`RouteID`) REFERENCES `Route` (`RouteID`)
);

create table `Shipment_contains`
(
    `ShipmentID` INT NOT NULL,
    `OrderID`    INT NOT NULL,
    PRIMARY KEY (`ShipmentID`, `OrderID`),
    FOREIGN KEY (`ShipmentID`) REFERENCES `Shipment` (`ShipmentID`)
);


CREATE TABLE `TruckSchedule`
(
    `TruckScheduleID`  INT AUTO_INCREMENT,
    `ShipmentID`       INT       NOT NULL,
    `ScheduleDateTime` TIMESTAMP NOT NULL,
    `AssistantID`      INT       NOT NULL,
    `DriverID`         INT       NOT NULL,
    `TruckID`          INT       NOT NULL,
    `Status`           ENUM ('Not Completed', 'In Progress', 'Completed'),
    PRIMARY KEY (`TruckScheduleID`),
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