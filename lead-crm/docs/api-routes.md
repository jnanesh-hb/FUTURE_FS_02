# API Routes

## Authentication

- `POST /api/auth/register` - Register a user
- `POST /api/auth/login` - Login and receive JWT
- `GET /api/auth/me` - Get current logged-in user

## Leads

- `POST /api/leads` - Public lead creation endpoint
- `GET /api/leads` - List leads with search and status filter
- `GET /api/leads/:id` - Get a lead with follow-up history
- `PUT /api/leads/:id` - Update lead details
- `PATCH /api/leads/:id/status` - Update only the lead status
- `DELETE /api/leads/:id` - Delete a lead and its follow-ups

## Follow-ups

- `GET /api/followups/lead/:leadId` - Get follow-ups for a lead
- `POST /api/followups/lead/:leadId` - Add a note/reminder/follow-up
- `PUT /api/followups/:id` - Update a follow-up item
- `DELETE /api/followups/:id` - Delete a follow-up item

## Dashboard

- `GET /api/dashboard/stats` - KPI cards and chart data
- `GET /api/dashboard/pending-followups` - Upcoming pending reminders
- `GET /api/dashboard/export` - Export all leads as CSV
