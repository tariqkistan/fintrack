-- Switch default account currency from USD to ZAR (South African Rand)

ALTER TABLE public.accounts
  ALTER COLUMN currency SET DEFAULT 'ZAR';

UPDATE public.accounts
SET currency = 'ZAR'
WHERE currency = 'USD';
