create index idx_train_schedule_status_ on TrainSchedule (Status);
create index idx_shipment_status on Shipment(Status);
create index idx_truck_schedule_status on TruckSchedule(Status);
CREATE INDEX idx_username ON customer (Username);
create index idx_orderTracking on order_tracking(Status);