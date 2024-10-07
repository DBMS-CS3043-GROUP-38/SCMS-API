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