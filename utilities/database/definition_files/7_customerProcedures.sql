DELIMITER //

CREATE PROCEDURE CreateOrderWithItems(
    IN p_CustomerID INT,
    IN p_Value DECIMAL(10, 2),
    IN p_OrderDate DATE,
    IN p_DeliveryDate DATE,
    IN p_RouteID INT,
    IN p_TotalVolume DECIMAL(10, 2),
    IN p_Products JSON -- JSON array to store multiple products (ProductID, Amount)
)
BEGIN
    DECLARE productID INT;
    DECLARE amount INT;
    DECLARE productIndex INT DEFAULT 0;
    DECLARE productCount INT;

    -- Start transaction
    START TRANSACTION;

    -- Insert into the order table
    INSERT INTO `Order` (`CustomerID`, `Value`, `OrderDate`, `DeliveryDate`, `RouteID`, `TotalVolume`)
    VALUES (p_CustomerID, p_Value, IFNULL(p_OrderDate, CURDATE()), p_DeliveryDate, p_RouteID, p_TotalVolume);

    -- Get the last inserted OrderID
    SET @lastOrderID = LAST_INSERT_ID();

    -- Calculate the number of products in the JSON array
    SET productCount = JSON_LENGTH(p_Products);

    -- Loop through the products and insert them into the Contains table
    WHILE productIndex < productCount
        DO
            -- Extract ProductID and Amount from JSON array
            SET productID = JSON_UNQUOTE(JSON_EXTRACT(p_Products, CONCAT('$[', productIndex, '].ProductID')));
            SET amount = JSON_UNQUOTE(JSON_EXTRACT(p_Products, CONCAT('$[', productIndex, '].Amount')));

            -- Insert into Contains table
            INSERT INTO `Contains` (`OrderID`, `ProductID`, `Amount`)
            VALUES (@lastOrderID, productID, amount);

            -- Increment index
            SET productIndex = productIndex + 1;
        END WHILE;

    -- Commit the transaction
    COMMIT;
END//

CREATE PROCEDURE GetRoutesByCity(IN cityName VARCHAR(255))
BEGIN
    SELECT RouteID, Description
    FROM route
             LEFT JOIN store USING (StoreID)
    WHERE City = cityName;
END//


CREATE PROCEDURE GetCustomerReport(IN customerId INT)
BEGIN
    SELECT * FROM customer_report c WHERE c.CustomerID = customerId;
END //


DELIMITER ;