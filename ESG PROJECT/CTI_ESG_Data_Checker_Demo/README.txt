CTI Sustainability Data Checker Demo

Open this folder and you will see a tiny workflow that mirrors real ESG data quality work.
It is intentionally small and fast so you can judge how I think.

Why I built it
I built this demo for the Sustainability data and AI Analyst intern role.
The role is about accuracy, stress testing AI outputs, and catching edge cases inside real reports.
This demo is a mini version of that mindset.

What it does
1 Upload and validate ESG data in CSV format
2 Paste a report excerpt and extract key ESG values
3 Flag missing fields, invalid ranges, and internal inconsistencies
4 Generate a clear issue list and a quality score so decisions are fast

How to run
Option 1
Open index.html in your browser

Option 2 recommended
Run a local web server inside this folder
python -m http.server 8000
Then open http://localhost:8000

CSV format
company,year,scope1_tCO2e,scope2_tCO2e,scope3_tCO2e,total_tCO2e,energy_MWh,water_m3,female_pct,employee_count,source

What to try
1 Click Load sample data and then Run checks
2 Upload your own CSV and see how the checks react
3 Paste a paragraph from a sustainability report and click Extract and check

How I would contribute at CTI
1 Turn messy disclosures into clean, source traceable data
2 Stress test AI with real documents and build a library of tricky cases
3 Create validation rules that are strict, explainable, and efficient
4 Keep quality high while shipping fast in a small founder led team

If you want to go further
Give me one real report and one target datapoint list.
I will build a stronger validation suite and an admin friendly review flow.

Regards, Dania Sami
LinkedIn https://www.linkedin.com/in/dania-sami-51a829264/
