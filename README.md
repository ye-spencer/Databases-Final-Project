# Predict the Centennial Podium 🏆

**A full-stack track & field analytics platform that predicts Centennial Conference championship results.**

By **Mirra Klimov** & **Spencer Ye** — Johns Hopkins University, Databases Final Project

<p align="center">
  <img src="docs/images/trophy.png" alt="Championship trophy" width="350"/>
</p>

## Overview

Predict the Centennial Podium scrapes 16+ years (2010–2026) of NCAA Division III track & field results from [TFRRS](https://www.tfrrs.org/) for all 10 Centennial Conference schools, stores them in a normalized PostgreSQL database, and uses statistical models to predict who will make the podium — and which team will win — at the conference championship. A Next.js web app lets you browse athletes, meets, schools, and predictions interactively.

**The pipeline:**

```
TFRRS.org  ──►  Python scraper  ──►  Neon PostgreSQL  ──►  Prediction models  ──►  Next.js web app
                (BeautifulSoup)      (9-table schema)      (scikit-learn)         (React + Tailwind)
```

## Repository Structure

| Directory | Description |
|---|---|
| [`scrape_tffrs/`](scrape_tffrs/) | Python web scraper that downloads and parses every all-performances page from TFRRS for each school, season, and gender, then inserts athletes, meets, relays, and performances into the database |
| [`db_generating/`](db_generating/) | SQL scripts: table creation ([`table_generation.sql`](db_generating/table_generation.sql)), manually curated school/location data ([`add_manual_info.sql`](db_generating/add_manual_info.sql)), prediction tables ([`analysis_tables.sql`](db_generating/analysis_tables.sql)), and the Phase 1 analytical queries ([`queries.sql`](db_generating/queries.sql)) |
| [`prediction_analysis/`](prediction_analysis/) | Linear-regression prediction model ([`linear.py`](prediction_analysis/linear.py)) that fits each athlete's in-season trajectory and projects their championship result |
| [`predict-the-centenni-podium/`](predict-the-centenni-podium/) | Next.js web application for exploring the data and viewing podium predictions |
| [`mirra_klimov_spencer_ye.pdf`](mirra_klimov_spencer_ye.pdf) | Final project report |
| [`Phase1Submission.pdf`](Phase1Submission.pdf) | Phase 1 design submission (ER model & requirements) |
| [`SQL CODE DOCUMENTATION.pdf`](SQL%20CODE%20DOCUMENTATION.pdf) | Documentation of all SQL used in the project |

## Features

### 🌐 Web App (`predict-the-centenni-podium`)

- **Home** — live database stats (schools, athletes, performances, events, meets) plus a rotating "random stat" card that reveals the SQL query behind it
- **Athletes** — searchable athlete directory with per-athlete pages showing season history and personal bests
- **Meets** — every meet since 2010 with full results
- **Schools** — all 10 Centennial Conference programs with rosters and team info
- **Predictions** — the headline feature: pick a season (2024 Indoor → 2026 Indoor), gender, and one of three prediction models, and see projected event podiums plus predicted team scores using standard NCAA scoring (10‑8‑6‑5‑4‑3‑2‑1 for the top 8)

### 📊 Prediction Models

1. **Season Best** — each athlete's best mark of the current season
2. **Linear Regression** — fits a regression over each athlete's meet-by-meet progression (best mark per meet vs. date) using scikit-learn, then extrapolates to championship day; athletes with fewer than two data points fall back to their season best
3. **Average Season Performance** — each athlete's mean result across the season

Predictions correctly handle direction per event group: *lower is better* for sprints/distance (`MIN`), *higher is better* for throws/jumps/combined events (`MAX`), and relays are aggregated at the school level.

### 🗄️ Database

A normalized 9-table PostgreSQL schema hosted on [Neon](https://neon.tech/):

- `School` / `GeographicLocation` — the 10 conference schools and their locations
- `Athlete` / `AthleteSeason` — athletes and their per-season affiliations (school, class year, indoor/outdoor)
- `TrackMeet` / `TrackEvent` — meets and the event catalog (typed by sprints/distance/jumps/throws/combined, with units and relay flags)
- `Performance` — every individual and relay result, with wind readings where applicable
- `RelayTeam` / `RelayTeamMembers` — relay squads and leg assignments
- `CentennialConferenceEvents` — which events are contested at the indoor/outdoor conference championships
- `LinearRegressionPredictions` — precomputed model output served to the web app

### 🕷️ Scraper

- Reverse-engineered the TFRRS URL pattern (`all_performances/<state>_college_<gender>_<school>.html?list_hnd=…&season_hnd=…`) — see [`pattern_finding.md`](scrape_tffrs/pattern_finding.md)
- Covers all 10 schools × 2 genders × indoor/outdoor seasons from 2010 through 2026
- Parses athletes, class years, meets, dates, marks, wind gauges, and relay teams with BeautifulSoup, with assertion-based validation and error logging
- Rate-limited requests and unit tests for the parsing and repository layers

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- A PostgreSQL database (we used [Neon](https://neon.tech/)'s free tier)

### 1. Set up the database

Run the SQL scripts against your database in this order:

```bash
psql $DATABASE_URL -f db_generating/table_generation.sql   # create the 9 core tables
psql $DATABASE_URL -f db_generating/add_manual_info.sql    # insert schools & locations
psql $DATABASE_URL -f db_generating/analysis_tables.sql    # create the predictions table
```

### 2. Scrape the data

```bash
cd scrape_tffrs
pip install requests beautifulsoup4 psycopg2-binary python-dotenv
echo 'DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"' > .env
python download_page.py        # full historical scrape (2010–2025, all schools)
python scrape_2026_indoor.py   # current 2026 indoor season
```

### 3. Generate predictions

```bash
cd prediction_analysis
pip install scikit-learn psycopg2-binary python-dotenv
cp .env.example .env           # then fill in your DATABASE_URL
python linear.py               # fits regressions and uploads predictions
```

### 4. Run the web app

```bash
cd predict-the-centenni-podium
npm install
echo 'DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"' > .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to explore the data and predictions.

## Screenshots

<!-- Run the app (step 4 above) and drop screenshots into docs/images/, e.g.: -->
<!-- ![Home page](docs/images/home.png) -->
<!-- ![Predictions page](docs/images/predictions.png) -->
<!-- ![Athlete detail](docs/images/athlete.png) -->

*Screenshots of the running app can be added here — see the final report ([`mirra_klimov_spencer_ye.pdf`](mirra_klimov_spencer_ye.pdf)) for a full write-up of the project.*

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Next.js API routes, `pg` connection pool |
| Database | PostgreSQL (Neon serverless) |
| ML / Analysis | Python, scikit-learn, psycopg2 |
| Scraping | Python, Requests, BeautifulSoup 4 |

## Authors

- **Mirra Klimov**
- **Spencer Ye**
