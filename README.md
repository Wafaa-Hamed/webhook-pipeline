// Webhook-Driven Task Processing Pipeline

A simplified Zapier-like system that receives webhooks, processes them asynchronously through a job queue, and delivers the processed results to multiple subscribers.

// Overview
This system allows users to:

Create pipelines
Send webhooks to a pipeline URL
Process incoming data using a background worker
Deliver processed results to subscriber endpoints
Track job status and delivery history


//Architecture
Client → Webhook Endpoint → Jobs Table → Worker → Processing → Subscribers → Deliveries
Flow:
A request is sent to:

POST /webhooks/:pipelineId
A job is created with status pending
A worker picks the job and processes it
The result is stored in DB
The result is sent to all subscribers with retry logic
Delivery attempts are logged in the deliveries table

// Tech Stack
Backend: Node.js + Express + TypeScript
Database: PostgreSQL
ORM: Drizzle ORM
Containerization: Docker + Docker Compose
Background Worker: Custom Node worker
HTTP Requests: Fetch API

// Processing Actions

The system supports the following actions:

uppercase → Converts string to uppercase
reverseString → Reverses the string
addTimestamp → Adds processing timestamp

// Project Structure
src/
 ├── db/
 │   ├── index.ts
 │   └── schema.ts
 ├── modules/
 │   |__pipelines/
        |__ pipelines.controller.ts
 ├── worker.ts
 ├── index.ts


// API Endpoints

➕ Create Pipeline
POST /pipelines
{
  "name": "My Pipeline",
  "webhookPath": "/my-webhook",
  "action": "uppercase"
}

👤 Add Subscriber
POST /pipelines/:pipelineId/subscribers
{
  "url": "https://example.com/webhook"
}

📥 Send Webhook
POST /webhooks/:pipelineId
{
  "data": "hello world"
}

Response:

{
  "message": "Job queued successfully",
  "jobId": "uuid"
}

📊 Get Job Status
GET /jobs/:jobId

Response:

{
  "job": {},
  "deliveries": []
}

📋 Get All Pipelines
GET /pipelines

🔍 Get Pipeline by ID
GET /pipelines/:id

✏️ Update Pipeline
PUT /pipelines/:id

❌ Delete Pipeline
DELETE /pipelines/:id

// Retry Logic
Each delivery attempt retries up to 3 times
Delay between retries: 1 second
Each attempt is logged in the deliveries table
Final status is marked as:
success
failed

// Design Decisions
Decoupled worker: Processing is handled in a separate service
Database as queue: Jobs are stored in PostgreSQL
Retry mechanism: Ensures reliability in case of failures
Simple architecture: Easy to understand and extend
Extensible actions: New processing actions can be added easily


// Running with Docker
Prerequisites:
Docker
Docker Compose
Run the project:
docker-compose up --build
Services:
App → http://localhost:3000
Worker → Background process
Database → PostgreSQL on port 5432

// Development
Install dependencies:
npm install
Run locally:
npm run dev

// Environment Variables
DATABASE_URL=postgres://postgres:postgres@localhost:5432/webhook_db



Built as a final project to demonstrate:

Backend architecture
Asynchronous processing
Database design
Reliability & retry strategies

// Summary

This project demonstrates a scalable webhook processing system with:

Background workers
Reliable delivery system
Retry handling
Clean architecture