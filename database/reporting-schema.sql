
-- 4. Rapportering & Statistikk

-- View for age distribution (NIF standard categories)
-- Uses postgres age() function which is precise
-- CORRECTED: Changed birth_date -> date_of_birth
-- REMOVED: gender (not present in table)
create or replace view view_member_stats_by_age as
select
  organization_id,
  count(*) as total_members,
  count(*) filter (where extract(year from age(current_date, date_of_birth)) between 0 and 5) as age_0_5,
  count(*) filter (where extract(year from age(current_date, date_of_birth)) between 6 and 12) as age_6_12,
  count(*) filter (where extract(year from age(current_date, date_of_birth)) between 13 and 19) as age_13_19,
  count(*) filter (where extract(year from age(current_date, date_of_birth)) between 20 and 25) as age_20_25,
  count(*) filter (where extract(year from age(current_date, date_of_birth)) >= 26) as age_26_plus,
  count(*) filter (where date_of_birth is null) as age_unknown
from members
where deleted_at is null 
and membership_status = 'active' -- Only count active paying members for reports usually
group by organization_id;

-- View for growth (Monthly/Yearly) - simple version based on created_at
create or replace view view_member_growth_monthly as
select
  organization_id,
  to_char(created_at, 'YYYY-MM') as month,
  count(*) as new_members
from members
where deleted_at is null
group by organization_id, to_char(created_at, 'YYYY-MM')
order by month desc;
