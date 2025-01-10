-- Índices para otimização de consultas na tabela treatments
CREATE INDEX idx_treatments_order_id ON treatments(order_id);
CREATE INDEX idx_treatments_dates ON treatments(new_delivery_deadline, treatment_status);
CREATE INDEX idx_treatments_status ON treatments(treatment_status);
CREATE INDEX idx_treatments_created_at ON treatments(created_at); 