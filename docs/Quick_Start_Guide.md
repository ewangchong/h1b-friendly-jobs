# H1B Jobs Scraping System - Quick Start Guide

## 🚀 **Immediate Access**

**Website**: https://alvumt49396s.space.minimax.io
**Admin Dashboard**: https://alvumt49396s.space.minimax.io/admin

## 📈 **Monitor System Status**

### View Real-time Statistics
1. Go to `/admin` on your website
2. See live metrics:
   - Total jobs in database
   - Active H1B jobs
   - Recent scraping runs
   - Error summaries

### Check Scraping Sources
- **Sources**: Indeed, H1BGrader, MyVisaJobs
- **Status**: Green = Active, Red = Inactive
- **Last Run**: Shows when each source was last scraped

## ⚙️ **Manual Controls**

### Trigger Immediate Scraping
```bash
# From admin dashboard:
1. Click "Start Scraping" button
2. Monitor progress in "Recent Runs" section

# Or via API (requires service key):
curl -X POST "https://qogxbfgkrtullrvjgrrf.supabase.co/functions/v1/scraping-orchestrator" \
  -H "Authorization: Bearer [SERVICE_KEY]" \
  -d '{"force_run": true}'
```

### Manage Sources
- **Enable/Disable**: Toggle sources on/off
- **Frequency**: Adjust how often each source runs
- **Keywords**: Modify search terms for better targeting

### Data Cleanup
- **Old Jobs**: Deactivate jobs older than 30 days
- **Run History**: Clean up old scraping logs
- **Export Data**: Download jobs/companies in CSV/JSON

## 🔄 **Automated Schedule**

**Current Setting**: Every 6 hours
- **Times**: 12:00 AM, 6:00 AM, 12:00 PM, 6:00 PM UTC
- **What Happens**: All active sources are checked and scraped if due
- **Cleanup**: Old jobs automatically deactivated

### Modify Schedule
```sql
-- To change frequency, update in database:
UPDATE job_sources 
SET scraping_frequency_hours = 12 
WHERE name = 'Indeed';
```

## 📊 **Monitor Performance**

### Key Metrics to Watch
- **Jobs Found vs Saved**: Should be 60-80% save rate
- **Error Count**: Should be <10% of total runs
- **Processing Time**: Typically 2-5 minutes per run
- **H1B Confidence**: 70%+ jobs should have confidence >0.6

### Common Issues
- **High Error Rate**: Check if job boards blocked scraper
- **Low Save Rate**: May need to adjust NLP keywords
- **Slow Performance**: Consider reducing pages per run
- **No New Jobs**: Verify source websites are accessible

## 🔧 **Troubleshooting**

### If Scraping Stops Working
1. **Check Source Status**: Admin dashboard → Data Sources
2. **Review Errors**: Look at "Recent Errors" section
3. **Test Manually**: Use "Start Scraping" button
4. **Check Logs**: Review scraping_runs table for details

### Common Error Messages
- **"Rate Limited"**: Increase delay_ms for source
- **"Invalid JWT"**: Service role key access needed
- **"No jobs found"**: Check if search keywords are effective
- **"Network timeout"**: Target site may be blocking requests

### Emergency Fixes
```sql
-- Disable problematic source temporarily
UPDATE job_sources SET is_active = false WHERE name = 'Indeed';

-- Reset stuck runs
UPDATE scraping_runs SET status = 'failed' 
WHERE status = 'running' AND started_at < NOW() - INTERVAL '1 hour';

-- Clean up old raw data
DELETE FROM scraped_jobs_raw WHERE scraped_at < NOW() - INTERVAL '7 days';
```

## 📧 **Adding New Job Sources**

### 1. Add Source Configuration
```sql
INSERT INTO job_sources (name, base_url, source_type, search_keywords) 
VALUES (
  'LinkedIn Jobs', 
  'https://www.linkedin.com/jobs', 
  'linkedin',
  ARRAY['h1b sponsorship', 'visa sponsorship']
);
```

### 2. Implement Scraper Function
- Create new edge function for the job board
- Follow pattern from `indeed-scraper`
- Handle site-specific parsing and rate limits

### 3. Update Orchestrator
- Add new source type to orchestrator logic
- Test manual runs before enabling automation

## 💯 **Optimization Tips**

### Improve H1B Detection
```sql
-- Add new H1B keywords
INSERT INTO h1b_keywords (keyword, weight, category) VALUES
('work visa support', 0.7, 'explicit'),
('visa assistance', 0.7, 'explicit'),
('international candidates welcome', 0.5, 'implicit');
```

### Adjust Scraping Frequency
```sql
-- More frequent for high-value sources
UPDATE job_sources SET scraping_frequency_hours = 4 WHERE name = 'Indeed';

-- Less frequent for slower sources
UPDATE job_sources SET scraping_frequency_hours = 24 WHERE source_type = 'h1b_board';
```

### Performance Tuning
```sql
-- Reduce pages for faster runs
UPDATE job_sources SET max_pages_per_run = 5 WHERE name = 'Indeed';

-- Increase delay if getting blocked
UPDATE job_sources SET rate_limit_delay_ms = 5000 WHERE name = 'Indeed';
```

## 📨 **Backup & Recovery**

### Export Current Data
```bash
# Use admin dashboard export function or:
curl -X POST "https://qogxbfgkrtullrvjgrrf.supabase.co/functions/v1/scraping-admin?action=export_data" \
  -H "Content-Type: application/json" \
  -d '{"export_type": "jobs", "format": "json"}'
```

### Restore from Backup
- Jobs and companies can be re-imported via SQL
- Scraping configuration should be version controlled
- Edge function code is backed up in `/workspace/supabase/functions/`

## 📅 **Maintenance Schedule**

### Daily
- Check admin dashboard for errors
- Verify jobs are being added

### Weekly
- Review performance metrics
- Clean up old data if needed
- Check for new job sources to add

### Monthly
- Optimize H1B keywords based on results
- Review and update scraping frequencies
- Analyze job market trends from data

---

## 🎆 **Success Indicators**

✅ **System is Working Well When:**
- New jobs appear daily
- H1B confidence scores are accurate
- Error rate stays below 10%
- Admin dashboard shows regular activity
- Users find relevant, current job listings

⚠️ **Investigate When:**
- No new jobs for >24 hours
- Error rate exceeds 20%
- Scraping runs consistently fail
- H1B confidence scores seem inaccurate
- Users report stale job listings

The system is designed to be largely self-maintaining, but monitoring these indicators will help ensure optimal performance and user satisfaction.