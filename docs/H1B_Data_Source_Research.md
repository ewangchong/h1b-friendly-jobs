# H1B Data Source Research

This document outlines the findings of research into data sources for building an H1B-friendly jobs website.

## 1. Job Board APIs & Data Sources

| Data Source | Access Method | H1B Data Availability | Cost | Technical Feasibility | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Indeed** | Web Scraping | Yes, by searching for "H1B" or "visa sponsorship" in job descriptions. | N/A | High | Requires robust web scraping infrastructure and maintenance. The Indeed API does not appear to support H1B filtering. |
| **LinkedIn** | Web Scraping | Yes, by searching for "H1B" or "visa sponsorship" in job descriptions. | N/A | High | Similar to Indeed, requires web scraping. The LinkedIn API is for posting jobs, not searching. |
| **Glassdoor** | Web Scraping / Potential API Partnership | Yes, through web scraping. The public API does not support H1B filtering, but partnership may provide access. | N/A (scraping) / Unknown (partnership) | High (scraping) / Medium (partnership) | Partnership is a possibility for more direct data access. |
| **Specialized H1B Job Boards** (e.g., H1BConnect, OPTnation) | Web Scraping | Yes, these sites are focused on H1B jobs. | N/A | Medium | Smaller scale than major job boards, but highly relevant data. |
| **MyVisaJobs.com, H1BGrader.com** | Web Scraping | Yes, these sites aggregate government data. | N/A | Medium | These sites have already processed the government data, which could be a valuable source if scraping is successful. |

## 2. Government & Official H1B Data

| Data Source | Access Method | Data Included | Cost | Technical Feasibility | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **USCIS H-1B Employer Data Hub** | CSV Download | Employer name, location, industry (NAICS), number of petitions (initial, continuing), approvals, denials. | Free | High | Excellent source for identifying companies with a history of H1B sponsorship. Data is structured and easy to parse. |
| **Department of Labor (DOL) LCA Data** | Excel Download | Company name, job title, wage rate, work location. | Free | High | Provides detailed information about specific jobs for which H1B visas have been sought. |
| **H1B Approval/Denial Statistics** | Reports/Articles | Aggregated data on approval and denial rates by company, industry, etc. | Free | Low | Useful for providing users with insights into a company's H1B track record, but not a direct source of job listings. |

## 3. Data Quality & Legal Considerations

*   **Data Accuracy:** Government data from USCIS and DOL is the most accurate and reliable source for historical H1B sponsorship information. Job board data is more real-time but may contain less explicit H1B information, requiring careful parsing and filtering.
*   **Data Freshness:** Job board data is highly time-sensitive. A robust scraping and data update process is crucial. Government data is updated less frequently (quarterly or annually).
*   **Web Scraping:** Web scraping job boards carries legal risks. It is essential to:
    *   Review the terms of service of each website.
    *   Respect `robots.txt` files.
    *   Avoid overwhelming the target servers with requests.
    *   Consult with legal counsel to ensure compliance with all applicable laws and regulations.
*   **Using Government Data:** Publicly available government data is generally free to use, but it's important to comply with any stated terms of use or attribution requirements. The data is provided "as is," so you are responsible for any analysis or presentation of the information.
