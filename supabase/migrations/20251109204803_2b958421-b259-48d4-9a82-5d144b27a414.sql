-- Add empresa column to payment_conditions table
ALTER TABLE payment_conditions 
ADD COLUMN empresa text NOT NULL DEFAULT 'ZC';