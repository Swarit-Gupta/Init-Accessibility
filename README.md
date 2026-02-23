# Init-Accessibility

> **Accessibility for Everyone** – A full-stack web application providing tools for elderly users, neurodivergent individuals, and marginalized communities.

## Live Demo

Deploy to Vercel in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSwarit-Gupta%2FInit-Accessibility)

---

## Features

### 👴 Elderly Tools
- **Font size scaling** – adjust from 80% to 160% with one click
- **High contrast mode** – maximum readability for low-vision users
- **Text-to-Speech** – built-in browser speech synthesis with speed control
- **Full keyboard navigation** – every control reachable without a mouse

### 🧠 Neurodivergent-Friendly
- **Dyslexia-friendly font** – weighted letterforms that reduce character reversal
- **Reduce motion** – disables all non-essential animations and transitions
- **Adjustable line spacing** – normal / relaxed / loose
- **Color-blind modes** – protanopia, deuteranopia, tritanopia palette adjustments
- **Visible focus indicators** – prominent focus rings throughout (WCAG 2.4.11)

### 🌍 Community Resources
- **Multi-language UI** – English, Spanish, French, Arabic (with RTL layout)
- **Persistent cloud preferences** – settings saved to PostgreSQL and synced across devices
- **Low-bandwidth friendly** – no external fonts, no JS frameworks, under 50 KB
- **WCAG 2.1 AA** compliant semantic HTML and ARIA landmarks

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES2022) |
| Backend | Vercel Serverless Functions (Node.js 18+) |
| Database | Vercel Postgres (PostgreSQL via `@vercel/postgres`) |
| Deployment | Vercel |

---

## Project Structure

```
├── index.html              # Main page (static, served by Vercel CDN)
├── styles/
│   └── main.css            # All styles with CSS custom property theming
├── scripts/
│   └── main.js             # Client-side interactivity + API calls
├── api/
│   ├── setup.js            # GET /api/setup – initialise DB tables + seed data
│   ├── preferences.js      # GET/POST /api/preferences – per-user settings
│   ├── feedback.js         # POST /api/feedback – user feedback submissions
│   └── resources.js        # GET /api/resources – community resources from DB
├── schema.sql              # Raw SQL schema (reference / manual migration)
├── vercel.json             # Vercel deployment configuration
└── package.json            # Node.js dependencies
```

---

## Deploying to Vercel

### 1. Fork / clone this repository

```bash
git clone https://github.com/Swarit-Gupta/Init-Accessibility.git
cd Init-Accessibility
```

### 2. Install the Vercel CLI (optional – you can also use the dashboard)

```bash
npm install -g vercel
```

### 3. Create a Vercel Postgres database

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → your project → **Storage** tab.
2. Click **Create Database** → choose **Postgres**.
3. Vercel automatically adds the `POSTGRES_URL` (and related) environment variables to your project.

Alternatively, use [Neon](https://neon.tech) or any PostgreSQL provider and set:

```
POSTGRES_URL=postgres://user:password@host:5432/dbname?sslmode=require
```

### 4. Deploy

```bash
vercel --prod
```

Or push to `main` / open a pull request — Vercel's GitHub integration deploys automatically.

### 5. Initialise the database

After your first deploy, call the setup endpoint **once**:

```
https://<your-deployment>.vercel.app/api/setup
```

> **Production tip:** set the `SETUP_SECRET` environment variable and call `/api/setup?secret=<your-secret>` to prevent unauthorised re-runs.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_URL` | ✅ | PostgreSQL connection string (set automatically by Vercel Postgres) |
| `SETUP_SECRET` | Optional | Secret token to protect the `/api/setup` endpoint |
| `ADMIN_SECRET` | Optional | Secret token to protect the `GET /api/feedback` admin endpoint |

---

## API Reference

### `GET /api/preferences?session_id=<uuid>`
Returns saved accessibility preferences for the given anonymous session.

### `POST /api/preferences`
```json
{ "session_id": "uuid-v4", "preferences": { "theme": "dark", "fontSizeScale": 1.2, … } }
```

### `POST /api/feedback`
```json
{ "name": "Alice", "email": "alice@example.com", "category": "bug-report", "message": "…" }
```

### `GET /api/resources`
Returns the list of community resources from the database (with CDN caching). Falls back to built-in defaults if the database is unreachable.

### `GET /api/setup`
Creates database tables and seeds initial resource data. Call once after provisioning.

---

## Accessibility Statement

This application targets **WCAG 2.1 Level AA** compliance:
- All interactive elements are keyboard-operable (SC 2.1.1)
- Focus order is logical and visible (SC 2.4.3, 2.4.7, 2.4.11)
- Colour contrast meets 4.5:1 (SC 1.4.3) in default and high-contrast modes
- Text can be resized up to 160% without loss of content (SC 1.4.4)
- No content flashes more than 3 times per second (SC 2.3.1)
- ARIA live regions announce toolbar changes to screen readers (SC 4.1.3)

---

## License

MIT

