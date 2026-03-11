-- Fix typo in subscriptions plan constraint (roomz_plus -> rommz_plus)
UPDATE subscriptions
SET plan = 'rommz_plus'
WHERE plan = 'roomz_plus';

ALTER TABLE subscriptions
    DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE subscriptions
    ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('free', 'rommz_plus'));
