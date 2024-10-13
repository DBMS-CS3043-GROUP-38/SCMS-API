# This is just a test file to test the queries do not keep anything permanent here
select t.TruckID, t.LicencePlate, sum(r.Distance) as TotalDistance, sum(r.Time_duration) as TotalDuration, s.City
from
    truck t
join
        truckschedule ts on t.TruckID = ts.TruckID
join
        route r on ts.RouteID = r.RouteID
join
        store s on t.StoreID = s.StoreID
where ts.Status = 'Completed'
group by t.TruckID;


select * from truck_report;

select * from quarterly_product_report;
select * from quarterly_store_report;

select AddFutureTrainsTest();


UPDATE `TrainSchedule`
SET `Status` = 'Completed'
WHERE `ScheduleDateTime` < NOW();

SET FOREIGN_KEY_CHECKS = 0;
truncate table `TrainSchedule`;
SET FOREIGN_KEY_CHECKS = 1;
