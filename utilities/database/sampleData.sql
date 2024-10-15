-- Need checking......
INSERT INTO `Employee` (`Name`, `Username`, `Address`, `Contact`, `PasswordHash`, `Type`, `StoreID`) VALUES
('John Doe', 'johndoe', '123 Main St', '555-1234', 'hash1', 'Driver', 1),
('Jane Smith', 'janesmith', '456 Oak Ave', '555-5678', 'hash2', 'Assistant', 1),
('David Lee', 'davidlee', '789 Pine St', '555-9101', 'hash3', 'Driver', 2),
('Emily Davis', 'emilyd', '101 Maple Blvd', '555-1122', 'hash4', 'Assistant', 2),
('Michael Brown', 'mikebrown', '202 Birch Rd', '555-1314', 'hash5', 'Driver', 3),
('Sarah Wilson', 'sarahw', '303 Cedar Dr', '555-1516', 'hash6', 'Assistant', 3),
('Chris Green', 'chrisg', '404 Elm St', '555-1718', 'hash7', 'Driver', 1),
('Anna White', 'annawhite', '505 Ash Ave', '555-1920', 'hash8', 'Assistant', 1),
('Tom Black', 'tomblack', '606 Spruce Ln', '555-2122', 'hash9', 'Driver', 2),
('Rachel Blue', 'rachelb', '707 Walnut Rd', '555-2324', 'hash10', 'Assistant', 2),

('Alice Johnson', 'alicej', '123 Main St, Cityville', '1234567890', 'hashedpassword1', 'Admin', 1),
('Bob Smith', 'bobsmith', '456 Elm St, Townsville', '0987654321', 'hashedpassword2', 'StoreManager', 1),
('Carol White', 'carolw', '789 Oak St, Villageburg', '1231231234', 'hashedpassword3', 'StoreManager', 2),
('David Brown', 'davidb', '135 Maple St, Hamletton', '4564564567', 'hashedpassword4', 'Admin', 2),
('Eve Davis', 'eved', '246 Pine St, Capital City', '7897897890', 'hashedpassword5', 'Admin', 1);




INSERT INTO `Driver` (`EmployeeID`, `WorkingHours`, `CompletedHours`, `Status`) VALUES
(1, 40, 30, 'Available'), 
(3, 40, 35, 'Busy'),       
(5, 40, 40, 'Busy'),       -- Michael Brown, completed all 40 hours
(7, 40, 25, 'Available'),  -- Chris Green, partially completed
(9, 40, 38, 'Busy');       -- Tom Black, almost completed

-- For each day.............. Change the set of employees.....
UPDATE `Driver` SET `CompletedHours` = 0, `Status` = 'Available' WHERE `EmployeeID` IN (1, 3, 5, 7, 9);

INSERT INTO `Assistant` (`EmployeeID`, `WorkingHours`, `CompletedHours`, `Status`) VALUES
(2, 60, 50, 'Busy'),       
(4, 60, 55, 'Busy'),       -- Emily Davis, completed 55 hours
(6, 60, 45, 'Available'),  -- Sarah Wilson, completed 45 hours
(8, 60, 30, 'Available'),  -- Anna White, completed 30 hours
(10, 60, 58, 'Busy');      -- Rachel Blue, completed 58 hours

-- Same as above
UPDATE `Assistant` SET `CompletedHours` = 0, `Status` = 'Available' WHERE `EmployeeID` IN (2, 4, 6, 8, 10);



-- Need to look into date (same as above)
INSERT INTO `TruckSchedule` (`StoreID`, `ShipmentID`, `ScheduleDateTime`, `RouteID`, `AssistantID`, `DriverID`, `TruckID`, `Hours`, `Status`) VALUES
(1, 101, '2023-09-01 08:00:00', 1, 2, 1, 1, '08:00', 'Completed'),   -- John Doe and Jane Smith
(2, 102, '2023-09-02 09:00:00', 2, 4, 3, 2, '09:00', 'Completed'),   -- David Lee and Emily Davis
(3, 103, '2023-09-03 10:00:00', 3, 6, 5, 3, '10:00', 'Completed'),   -- Michael Brown and Sarah Wilson
(1, 104, '2023-09-04 11:00:00', 1, 8, 7, 4, '08:00', 'Completed'),   -- Chris Green and Anna White
(2, 105, '2023-09-05 12:00:00', 2, 10, 9, 5, '09:00', 'Completed'),  -- Tom Black and Rachel Blue

(1, 106, '2023-10-01 08:00:00', 1, 2, 1, 1, '08:00', 'Not Completed'),   -- John Doe and Jane Smith
(2, 107, '2023-10-02 09:00:00', 2, 4, 3, 2, '09:00', 'Not Completed');   -- David Lee and Emily Davis



-- Time, day automated - No need to add
INSERT INTO `Train` (`FullCapacity`, `StoreID`, `Time`, `Day`) VALUES
(1000.00, 1, '08:00:00', 'Monday'),
(1500.00, 1, '09:00:00', 'Wednesday'),
(2000.00, 2, '10:00:00', 'Friday'),
(1200.00, 3, '11:00:00', 'Monday'),
(1800.00, 3, '13:00:00', 'Saturday');

-- same for scheduleDateTime
INSERT INTO `TrainSchedule` (`FilledCapacity`, `TrainID`, `ScheduleDateTime`, `Status`) VALUES
(0, 1, '2023-09-04 08:00:00', 'Completed'),   -- Train scheduled on a Monday
(500.00, 2, '2023-09-06 09:00:00', 'Completed'),  -- Wednesday schedule
(1000.00, 3, '2023-09-08 10:00:00', 'Completed'),  -- Friday schedule
(200.00, 4, '2023-09-04 11:00:00', 'Completed'),  -- Monday schedule
(800.00, 5, '2023-09-09 13:00:00', 'Completed');  -- Saturday schedule



INSERT INTO `Train_Contains` (`TrainScheduleID`, `OrderID`) VALUES
(1, 101),   -- First TrainSchedule contains Order 101
(2, 102),   -- Second TrainSchedule contains Order 102
(3, 103),   -- Third TrainSchedule contains Order 103
(4, 104),   -- Fourth TrainSchedule contains Order 104
(5, 105);   -- Fifth TrainSchedule contains Order 105



INSERT INTO `Order_Tracking` (`OrderID`, `TimeStamp`, `Status`) VALUES
(101, '2023-09-04 08:00:00', 'Shipped'),
(102, '2023-09-06 09:00:00', 'Delivered'),
(103, '2023-09-08 10:00:00', 'In Transit'),
(104, '2023-09-04 11:00:00', 'Delivered'),
(105, '2023-09-09 13:00:00', 'Shipped');



-- Check with orderID
INSERT INTO Shipment_contains (ShipmentID, OrderID) VALUES
(1, 101),
(1, 102),
(2, 103),
(3, 104),
(4, 105);


