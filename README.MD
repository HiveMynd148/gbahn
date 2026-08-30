# Gradbahn

I built Gradbahn while applying to Master's programmes in Germany myself, mostly because I was tired of tracking deadlines, ECTS conversions, and application fees across a dozen browser tabs and a messy spreadsheet. It's a full-stack app for international students to search German university programmes, convert their existing credits and grades into the German system, plan a budget, and keep track of where each application stands.

## What it does

- Searchable programme catalogue - filter by university, federal state, NC status, GRE requirement, or a fee cap
- Full programme pages: degree type, application route, language requirements, ECTS breakdown, deadlines, required documents, tuition
- Credit-to-ECTS conversion and Bavarian formula grade calculation, so you can see roughly how your transcript maps over
- Daily exchange rate sync (via Open Exchange Rates) so application fees show up in your own currency
- Budget planner, up to five saved plans
- A dashboard to save programmes, set a status per application, and jot notes
- JWT auth (access + refresh tokens)
- Dark mode, because I do most of this at night

## Tech stack

Frontend is React 18 on Vite, Tailwind, React Router v6, Axios, Lucide for icons, react-hot-toast for notifications.

Backend is FastAPI on Python 3.11+, Postgres 15, SQLAlchemy 2, Alembic for migrations, Pydantic 2, APScheduler for the daily rate refresh, python-jose and passlib for auth.

Everything runs through Docker Compose, with pgAdmin available in the dev setup.

## Layout

```
gradbahn/
├─ backend/
│  ├─ app/
│  │  ├─ models/        # ORM entities
│  │  ├─ routers/       # API endpoints
│  │  ├─ schemas/       # Pydantic models
│  │  ├─ services/      # business logic
│  │  ├─ config.py
│  │  ├─ database.py
│  │  ├─ dependencies.py
│  │  ├─ scheduler.py
│  │  └─ main.py
│  ├─ alembic/          # migrations
│  ├─ tests/            # pytest suite
│  ├─ hydrate_db.py
│  ├─ requirements.txt
│  └─ Dockerfile*
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ contexts/
│  │  ├─ hooks/
│  │  ├─ pages/
│  │  └─ router/
│  ├─ public/
│  └─ Dockerfile*
├─ Scraper/             # data ingestion pipeline
├─ docker-compose.yml
├─ docker-compose.dev.yml
├─ download_webpages.py  # downloads programme pages directly for scraper input
├─ .env.example
└─ LICENSE
```

## Running it

You need Docker and Docker Compose, nothing else.

```bash
git clone https://github.com/HiveMynd148/gradbahn.git
cd gradbahn
cp .env.example .env
```

Set a real `SECRET_KEY` and `POSTGRES_PASSWORD` in `.env` before running this anywhere other than your own machine - the defaults are not safe to leave in place.

```bash
docker compose up --build
```

- Frontend: `http://localhost`
- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

For hot-reload and pgAdmin while developing:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Frontend dev server runs at `http://localhost:5173`, backend picks up source changes automatically.

## Frontend routes

| Path | Component | Access |
|---|---|---|
| `/` | HomePage | public |
| `/programmes` | ProgrammesPage | public |
| `/programmes/:id` | ProgrammeDetailPage | public |
| `/calculator` | CalculatorPage | public |
| `/budget` | BudgetPlannerPage | public (saving plans requires login) |
| `/login` | LoginPage | public only |
| `/register` | RegisterPage | public only |
| `/dashboard` | DashboardPage | protected |
| `/plans` | PlansPage | protected |
| `/documentation` | InfoPage | protected |

## API

Everything's under `/api/v1`. Swagger UI at `/docs` is the fastest way to poke around, but here's the shape of it:

**Auth** (`/auth`) - `POST /register`, `POST /login` (returns access + refresh tokens), `POST /refresh`, `GET /me`

**Universities** (`/universities`) - `GET /` (search, skip, limit), `GET /{id}`, `GET /{id}/programmes`

**Programmes** (`/programmes`) - `GET /` with filters (`search`, `nc_status`, `gre_required`, `max_fee`, `university_id`, `federal_state`), `GET /{id}`, `GET /{id}/cost` for fee conversion, `GET /federal-states`

**Dashboard** (`/dashboard`) - `GET /`, `POST /programmes`, `PATCH /programmes/{id}`, `DELETE /programmes/{id}`, `PATCH /settings`

**Budgets** (`/budgets`) - `GET /`, `POST /` (max 5 per user), `PUT /{budget_id}`, `DELETE /{budget_id}`

**Exchange rates** (`/exchange-rates`) - `GET /`, `GET /{currency}`, `POST /refresh` (auth required)

## Data pipeline

The `Scraper/` folder is honestly the messiest part of this project, but it works:

1. `scraper.py` pulls programme listings off the DAAD database
2. `pdf_downloader.py` grabs the Prüfungsordnung PDFs from each university's site
3. `downloader.py` saves raw programme pages for offline parsing
4. `extract_rules.py` pulls structured admission requirements out of all that
5. `cross_reference.py` checks the new data against what's already in the DB
6. `check_integrity.py` sanity-checks the whole thing before it goes live

`backend/hydrate_db.py` takes the cleaned output and seeds Postgres.

Some university sites change their formatting without warning, so this pipeline needs the occasional manual fix when a scrape comes back wrong - a known annoyance, not yet automated away.

## Testing

```bash
cd backend
pytest -vv
```

Covers auth, dashboard CRUD, programme search, and the 5-budget limit.

## License

MIT. See `LICENSE`.