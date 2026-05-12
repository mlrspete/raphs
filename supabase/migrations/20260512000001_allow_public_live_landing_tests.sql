grant select on public.landing_page_tests to anon;

create policy "Public can read live landing page tests"
on public.landing_page_tests
for select
to anon
using (status = 'live');
