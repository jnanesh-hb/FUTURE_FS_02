# Client Lead Management System (Mini CRM)

A beginner-friendly but production-like Mini CRM built with:

- Node.js and Express
- MongoDB and Mongoose
- Vanilla HTML, CSS, and JavaScript
- JWT-based admin authentication

## Features

- Add, edit, delete, and search leads
- Track lead status: New, Contacted, In Progress, Converted, Closed
- Add follow-up notes, reminders, and interaction history
- Dashboard stats for totals, conversion rate, lead score, and source breakdown
- Export leads to CSV
- Basic lead scoring
- Optional email notification for new leads

## Project Structure

```text
lead-crm/
+-- backend/
¦   +-- config/
¦   +-- controllers/
¦   +-- middleware/
¦   +-- models/
¦   +-- routes/
¦   +-- utils/
¦   +-- .env.example
¦   +-- package.json
¦   +-- server.js
+-- docs/
¦   +-- api-routes.md
¦   +-- database-schema.md
+-- frontend/
¦   +-- app.js
¦   +-- index.html
¦   +-- styles.css
+-- README.md
```

## Run Locally

1. Install MongoDB locally or use MongoDB Atlas.
2. Copy `backend/.env.example` to `backend/.env`.
3. Update `MONGODB_URI` and `JWT_SECRET`.
4. Install dependencies:

```bash
cd backend
npm install
```

5. Start the app:

```bash
npm run dev
```

6. Open `http://localhost:5000`.

## Default Workflow

1. Register the first user. The first registered user becomes admin.
2. Login with the same credentials.
3. Add leads from the dashboard.
4. Click View on a lead to add notes or follow-up reminders.
5. Use search, filter, and export from the leads table.

## Notes

- Public lead capture is available through `POST /api/leads`.
- If email SMTP variables are added in `backend/.env`, a notification email is sent for each new lead.
- The frontend is served by Express, so there is no separate frontend build step.

## MongoDB Setup Options

The default `.env` uses local MongoDB:

```env
MONGODB_URI=mongodb://localhost:27017/lead-crm
```

Use one of these options before running `npm run dev`:

- Install MongoDB Server locally and make sure the MongoDB service is running.
- Use MongoDB Atlas and replace `MONGODB_URI` in `backend/.env` with your Atlas connection string.
- If you see `ECONNREFUSED 127.0.0.1:27017`, the backend is working but MongoDB is not running or not reachable.
