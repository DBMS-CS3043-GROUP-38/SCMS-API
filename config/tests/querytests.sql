select * from salessummaryviewperquarter where Year = 2023;



select * from (select
                   s.Year,
                   s.Quarter,
                   s.ProductID,
                   s.ProductName,
                   s.ProductType,
                   s.TotalQuantity,
                   s.TotalRevenue,
                   ROW_NUMBER() over (partition by s.Year, s.Quarter order by s.TotalRevenue desc) as rn
               from salessummaryviewperquarter s) as Ranked where rn <=5;