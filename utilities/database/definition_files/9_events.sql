DELIMITER //

CREATE EVENT ResetCompletedHours
    ON SCHEDULE
        EVERY 1 WEEK
            STARTS '2024-10-28 00:00:00'  -- Set to a Monday
    DO
    BEGIN
        -- Reset CompletedHours for drivers
        UPDATE driver
        SET CompletedHours = '00:00:00';

        -- Reset CompletedHours for assistants
        UPDATE assistant
        SET CompletedHours = '00:00:00';
    END;
//


CREATE EVENT IF NOT EXISTS `UpdateTrainSchedules`
    ON SCHEDULE EVERY 1 DAY
        STARTS '2024-01-01 00:00:00'
    DO
    BEGIN
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
            BEGIN
                -- Rollback transaction if any error occurs
                ROLLBACK;
            END;

        -- Start transaction
        START TRANSACTION;

        -- Step 1: Update TrainSchedule status to 'Completed' if conditions are met
        UPDATE TrainSchedule
        SET Status = 'Completed'
        WHERE Status = 'Not Completed' and Status = 'In Progress'
          AND ScheduleDateTime + INTERVAL 6 HOUR < NOW();

        -- Step 2: Insert 'Pending' entries into Order_Tracking for the affected orders
        INSERT INTO Order_Tracking (OrderID, TimeStamp, Status)
        SELECT tc.OrderID, NOW(), 'Pending'
        FROM Train_Contains tc
                 JOIN TrainSchedule ts ON ts.TrainScheduleID = tc.TrainScheduleID
        WHERE ts.Status = 'Completed'
          AND ts.ScheduleDateTime + INTERVAL 6 HOUR < NOW();

        -- Commit the transaction if all operations succeed
        COMMIT;
    END;
//

DELIMITER ;