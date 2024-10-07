select * from (select
                   s.Year,
                   s.Quarter,
                   s.ProductID,
                   s.ProductName,
                   s.ProductType,
                   s.TotalQuantity,
                   s.TotalRevenue,
                   ROW_NUMBER() over (partition by s.Year, s.Quarter order by s.TotalRevenue desc) as rn
               from quarterly_order_report s) as Ranked where rn <=5;

select * from quarterly_store_report order by Year, Quarter, TotalRevenue desc;

select * from order_details_with_latest_status;

select OrderDate, SUM(Value) as TotalRevenue
from order_details_with_latest_status
where OrderDate >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
  AND LatestStatus NOT LIKE 'Cancelled'
GROUP BY OrderDate
ORDER BY OrderDate;