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

DELIMITER ;