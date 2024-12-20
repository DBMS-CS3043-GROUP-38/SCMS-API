DELIMITER //

CREATE TRIGGER after_order_insert
    AFTER INSERT
    ON `Order`
    FOR EACH ROW
BEGIN
    INSERT INTO Order_Tracking (OrderID, TimeStamp, Status)
    VALUES (NEW.OrderID, NOW(), 'Pending');
END;
//


CREATE TRIGGER update_order_totals
    AFTER INSERT
    ON Contains
    FOR EACH ROW
BEGIN
    DECLARE productVolume DECIMAL(10, 2);
    DECLARE productPrice DECIMAL(10, 2);
    DECLARE newVolume DECIMAL(10, 2);
    DECLARE newValue DECIMAL(10, 2);

    -- Fetch the Product's volume and price
    SELECT TrainCapacityConsumption, Price
    INTO productVolume, productPrice
    FROM Product
    WHERE ProductID = NEW.ProductID;

    -- Calculate the additional volume and value
    SET newVolume = productVolume * NEW.Amount;
    SET newValue = productPrice * NEW.Amount;

    -- Update the Order's total volume and value
    UPDATE `Order`
    SET TotalVolume = TotalVolume + newVolume,
        Value       = Value + newValue
    WHERE OrderID = NEW.OrderID;
END;
//


CREATE TRIGGER before_train_contains_insert
    BEFORE INSERT
    ON Train_Contains
    FOR EACH ROW
BEGIN
    DECLARE total_volume DECIMAL(10, 2);
    DECLARE full_capacity DECIMAL(10, 2);
    DECLARE new_filled_capacity DECIMAL(10, 2);

    -- Get the TotalVolume of the Order being added
    SELECT TotalVolume
    INTO total_volume
    FROM `Order`
    WHERE OrderID = NEW.OrderID;

    -- Get the FullCapacity of the Train
    SELECT t.FullCapacity
    INTO full_capacity
    FROM Train t
             JOIN TrainSchedule ts ON t.TrainID = ts.TrainID
    WHERE ts.TrainScheduleID = NEW.TrainScheduleID;

    -- Calculate the new filled capacity
    SELECT FilledCapacity + total_volume
    INTO new_filled_capacity
    FROM TrainSchedule
    WHERE TrainScheduleID = NEW.TrainScheduleID;

    -- Check if the new filled capacity exceeds the full capacity
    IF new_filled_capacity > full_capacity THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: Adding this order would exceed the train\'s full capacity.';
    ELSE
        -- Update the FilledCapacity in the TrainSchedule table
        UPDATE TrainSchedule
        SET FilledCapacity = new_filled_capacity
        WHERE TrainScheduleID = NEW.TrainScheduleID;
    END IF;
END;
//

CREATE TRIGGER before_train_contains_delete
    BEFORE DELETE
    ON Train_Contains
    FOR EACH ROW
BEGIN
    DECLARE total_volume DECIMAL(10, 2);
    DECLARE new_filled_capacity DECIMAL(10, 2);

    -- Get the TotalVolume of the Order being removed
    SELECT TotalVolume
    INTO total_volume
    FROM `Order`
    WHERE OrderID = OLD.OrderID;

    -- Calculate the new filled capacity by subtracting the total volume
    SELECT FilledCapacity - total_volume
    INTO new_filled_capacity
    FROM TrainSchedule
    WHERE TrainScheduleID = OLD.TrainScheduleID;

    -- Update the FilledCapacity in the TrainSchedule table
    UPDATE TrainSchedule
    SET FilledCapacity = new_filled_capacity
    WHERE TrainScheduleID = OLD.TrainScheduleID;
END;
//


create trigger before_shipment_contains_insert
    before insert
    on Shipment_contains
    for each row
begin
    declare total_volume decimal(10, 2);
    declare capacity decimal(10, 2);
    declare new_filled_capacity decimal(10, 2);

    -- Get the TotalVolume of the Order being added
    select TotalVolume
    into total_volume
    from `Order`
    where OrderID = NEW.OrderID;

    -- Get the Capacity of the Shipment
    select Capacity
    into capacity
    from Shipment
    where ShipmentID = NEW.ShipmentID;

    -- Calculate the new filled capacity
    select FilledCapacity + total_volume
    into new_filled_capacity
    from Shipment
    where ShipmentID = NEW.ShipmentID;

    -- Check if the new filled capacity exceeds the capacity
    if new_filled_capacity > capacity then
        signal sqlstate '45000'
            set message_text = 'Error: Adding this order would exceed the shipment\'s capacity.';
    else
        -- Update the FilledCapacity in the Shipment table
        update Shipment
        set FilledCapacity = new_filled_capacity
        where ShipmentID = NEW.ShipmentID;
    end if;
end;
//

create trigger before_shipment_contains_delete
    before delete
    on Shipment_contains
    for each row
begin
    declare total_volume decimal(10, 2);
    declare new_filled_capacity decimal(10, 2);

    -- Get the TotalVolume of the Order being removed
    select TotalVolume
    into total_volume
    from `Order`
    where OrderID = OLD.OrderID;

    -- Calculate the new filled capacity by subtracting the total volume
    select FilledCapacity - total_volume
    into new_filled_capacity
    from Shipment
    where ShipmentID = OLD.ShipmentID;

    -- Update the FilledCapacity in the Shipment table
    update Shipment
    set FilledCapacity = new_filled_capacity
    where ShipmentID = OLD.ShipmentID;
end;
//

-- Update driver related triggers


CREATE TRIGGER update_completed_hours_and_availability

    AFTER UPDATE
    ON TruckSchedule
    FOR EACH ROW
BEGIN

    declare Hours time;
    -- Check if the status has changed to 'Completed'
    IF NEW.Status = 'Completed' AND OLD.Status <> 'Completed' THEN

        SELECT r.Time_duration
        INTO Hours
        FROM Shipment s
                 JOIN Route r ON s.RouteID = r.RouteID
        WHERE s.ShipmentID = NEW.ShipmentID;

        -- Update CompletedHours for the Driver
        UPDATE Driver
        SET CompletedHours = ADDTIME(CompletedHours, Hours),
            Status         = 'Available'
        WHERE DriverID = NEW.DriverID;

        -- Update CompletedHours for the Assistant
        UPDATE Assistant
        SET CompletedHours = ADDTIME(CompletedHours, Hours),
            Status         = 'Available'
        WHERE AssistantID = NEW.AssistantID;

        update truck
        set Status = 'Available'
        where TruckID = NEW.TruckID;

    END IF;
END //


CREATE TRIGGER insert_in_truck_orders
    AFTER UPDATE
    ON TruckSchedule
    FOR EACH ROW

BEGIN
    -- Check if the status has changed to 'In Progress'
    IF NEW.Status = 'In Progress' AND OLD.Status <> 'In Progress' THEN

        -- Insert new entries in Order_tracking for each order in Shipment_contains
        INSERT INTO Order_tracking (OrderID, TimeStamp, Status)
        SELECT s.OrderID, NOW(), 'InTruck'
        FROM Shipment_contains AS s
        WHERE s.ShipmentID = NEW.ShipmentID;

    END IF;
END //

CREATE TRIGGER revert_in_truck_orders
    AFTER UPDATE
    ON TruckSchedule
    FOR EACH ROW
BEGIN
    -- Check if the status has changed to 'Not Completed'
    IF NEW.Status = 'Not Completed' AND OLD.Status = 'In Progress' THEN

        -- Delete new entries in Order_tracking for each order in Shipment_contains
        DELETE
        FROM Order_tracking
        WHERE OrderID IN (SELECT OrderID
                          FROM Shipment_contains
                          WHERE ShipmentID = NEW.ShipmentID)
          AND Status = 'InTruck';

    END IF;
END //

CREATE TRIGGER check_and_put_back_undelivered_orders
AFTER UPDATE ON TruckSchedule
FOR EACH ROW
BEGIN
  -- Check if the status has changed to 'In Progress'
  IF NEW.Status = 'Completed' AND OLD.Status <> 'Completed' THEN

    -- Insert new entries in Order_tracking for each order in Shipment_contains
    INSERT INTO Order_tracking (OrderID, TimeStamp, Status)
    SELECT s.OrderID, NOW(), 'InStore'
    FROM Shipment_contains AS s
    WHERE s.ShipmentID = NEW.ShipmentID
    AND NOT EXISTS (
        SELECT 1 
        FROM Order_tracking AS ot 
        WHERE ot.OrderID = s.OrderID AND ot.Status = 'Delivered'
      );
    END IF;
END //



# Chehan triggers
CREATE TRIGGER check_shipment_status_after_insert
    AFTER INSERT
    ON Shipment_contains
    FOR EACH ROW
BEGIN
    DECLARE shipment_capacity DECIMAL(10, 2);
    DECLARE shipment_filled_capacity DECIMAL(10, 2);
    DECLARE shipment_created_date DATE;

    -- Retrieve the relevant shipment data
    SELECT Capacity, FilledCapacity, CreatedDate
    INTO shipment_capacity, shipment_filled_capacity, shipment_created_date
    FROM Shipment
    WHERE ShipmentID = NEW.ShipmentID;

    -- Check if the capacity is at least 80% filled or if it's older than 7 days
    IF (shipment_filled_capacity >= 0.8 * shipment_capacity) OR (DATEDIFF(CURDATE(), shipment_created_date) > 7) THEN
        -- Update the shipment status to 'Ready'
        UPDATE Shipment
        SET Status = 'Ready'
        WHERE ShipmentID = NEW.ShipmentID;
    END IF;
END//

DELIMITER ;