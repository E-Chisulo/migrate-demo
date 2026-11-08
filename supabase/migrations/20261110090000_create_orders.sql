create table public.orders (
  id bigint generated always as identity primary key,
  customer_name text not null,
  total numeric(12,2) not null,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;
