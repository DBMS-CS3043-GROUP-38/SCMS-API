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



DELIMITER ;