DELIMITER //


CREATE FUNCTION AddFutureTrains()
    RETURNS VARCHAR(255)
    DETERMINISTIC
BEGIN
    DECLARE end_date DATE;
    DECLARE start_date DATE;
    DECLARE done INT DEFAULT FALSE;
    DECLARE train_id INT;
    DECLARE full_capacity DECIMAL(10, 2);
    DECLARE store_id INT;
    DECLARE train_time TIME;
    DECLARE train_day VARCHAR(10);
    DECLARE schedules_added INT DEFAULT 0;
    DECLARE date_ptr DATE;

    -- Declare cursor
    DECLARE train_cursor CURSOR FOR
        SELECT TrainID, FullCapacity, StoreID, Time, Day
        FROM Train;

    -- Declare handler for cursor
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Get start date
    SELECT COALESCE(DATE_ADD(MAX(DATE(ScheduleDateTime)), INTERVAL 1 DAY), CURDATE())
    INTO start_date
    FROM TrainSchedule;

    -- Set end date
    SET end_date = DATE_ADD(start_date, INTERVAL 6 DAY);

    -- Open cursor and loop through trains
    OPEN train_cursor;

    read_loop:
    LOOP
        FETCH train_cursor INTO train_id, full_capacity, store_id, train_time, train_day;

        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Set pointer to start date
        SET date_ptr = start_date;

        -- Loop through dates
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

    RETURN CONCAT('Schedules added from ', start_date, ' to ', end_date, ': ', schedules_added);
END //


DELIMITER ;