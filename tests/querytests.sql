# This is just a test file to test the queries do not keep anything permanent here
select t.TruckID, t.LicencePlate, sum(r.Distance) as TotalDistance, sum(r.Time_duration) as TotalDuration
from
    truck t
join
        truckschedule ts on t.TruckID = ts.TruckID
join
        route r on ts.RouteID = r.RouteID
where ts.Status = 'Completed'
group by t.TruckID;
