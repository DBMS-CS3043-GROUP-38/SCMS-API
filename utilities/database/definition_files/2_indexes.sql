CREATE INDEX idx_order_id ON `Order` (OrderID);
create index idx_train_schedule_id on TrainSchedule (TrainScheduleID, Status);
CREATE INDEX idx_username ON customer (Username);
create index idx_orderTracking on order_tracking(OrderID);