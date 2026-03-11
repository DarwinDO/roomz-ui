# Crawl Automation

## Goal
Thêm one-click crawl trong admin UI và upload JSON crawl tr?c ti?p, không c?n terminal.

## Tasks
- [ ] Thêm schema DB cho `crawl_sources` và `crawl_jobs` -> Verify: migration apply du?c và policy admin pass
- [ ] T?o Edge Function `crawl-ingestion` ch?y Firecrawl ho?c import records upload -> Verify: function build/deploy du?c và tr? job result
- [ ] Thêm service/hook cho source/job/upload/run crawl -> Verify: unit tests pass cho contract chính
- [ ] M? r?ng `/admin/ingestion-review` v?i source manager, run crawl, upload file, job history -> Verify: build pass và UI route ho?t d?ng
- [ ] Ch?y lint, unit test, build, và DB sanity check -> Verify: các l?nh pass

## Done When
- [ ] Admin có th? t?o ngu?n crawl, b?m ch?y crawl, upload file JSON, và xem job/result ngay trên màn review
