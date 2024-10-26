# This is just a test file to test the queries do not keep anything permanent here
select t.TruckID, t.LicencePlate, sum(r.Distance) as TotalDistance, sum(r.Time_duration) as TotalDuration, s.City
from truck t
         join
     truckschedule ts on t.TruckID = ts.TruckID
         join
     route r on ts.RouteID = r.RouteID
         join
     store s on t.StoreID = s.StoreID
where ts.Status = 'Completed'
group by t.TruckID;


select *
from truck_report;

select *
from quarterly_product_report;
select *
from quarterly_store_report;

select AddFutureTrainsTest();


UPDATE `TrainSchedule`
SET `Status` = 'Completed'
WHERE `ScheduleDateTime` < NOW();

SET FOREIGN_KEY_CHECKS = 0;
truncate table `TrainSchedule`;
SET FOREIGN_KEY_CHECKS = 1;


call LoadInStoreOrders(${StoreID});


CALL CreateShipment(1, @newShipmentID);
SELECT @newShipmentID;


select
    YEAR(OrderDate) as year,
    QUARTER(OrderDate) as quarter,
      RouteID
     , SUM(Value)                                        as revenue
from order_details_with_latest_status
where LatestStatus NOT LIKE 'Cancelled'
group by YEAR(OrderDate), QUARTER(OrderDate), RouteID
order by revenue desc;


SELECT
    CONCAT(YEAR(OrderDate), 'Q', QUARTER(OrderDate)) as quarter,
    RouteID,
    SUM(Value) as revenue
FROM order_details_with_latest_status
WHERE LatestStatus NOT LIKE 'Cancelled'
  AND StoreID = ?
GROUP BY quarter, RouteID
ORDER BY revenue DESC;