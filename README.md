# BackendAstro

BackendAstro is the Express and MongoDB backend used for the Astro portfolio platform. It powers authentication, blog management, booking slots, visitor submissions, and category-based content filtering.

## What this backend handles

- Admin registration and login with hashed passwords
- Slot creation and slot booking workflows
- Visitor data submission and retrieval
- Blog creation, listing, filtering, detail lookup, and deletion
- Blog category creation and category listing

## Tech stack

- Node.js
- Express
- MongoDB
- Mongoose
- bcryptjs
- CORS
- dotenv

## Project structure

```text
BackendAstro/
|-- index.js        # Express app, schemas, and route handlers
|-- package.json    # Dependencies and scripts
```

## Data models

The server defines and uses these main MongoDB models:

- `User` - admin credentials
- `Slot` - appointment date, time range, mode, and booking state
- `Data` - visitor or lead submissions
- `Blog` - blog content, image, category, timestamps
- `Category` - reusable blog categories

## API overview

### Auth
- `POST /api/register`
- `POST /api/login`

### Slot management
- `POST /api/slots`
- `GET /api/slots`
- `POST /api/slots/book`

### Visitor data
- `POST /data`
- `GET /api/latestdata`
- `GET /getData`

### Blog and category management
- `GET /api/blogs`
- `POST /api/blogs`
- `GET /api/blogs/:id`
- `DELETE /api/blogs/:id`
- `GET /api/blogsfilter`
- `GET /api/categories`
- `POST /add-category`
- `GET /api/getcategories`

## Local setup

```bash
git clone https://github.com/Deepakraja03/BackendAstro.git
cd BackendAstro
npm install
npm run dev
```

## Environment variables

Create a `.env` file in the project root.

```env
DB=your_mongodb_connection_string
PORT=5000
```

## Notes on the current implementation

- The code currently keeps schemas and routes in a single `index.js` file for simplicity
- CORS is configured for the deployed portfolio frontend and local development
- Booking works by pairing stored visitor submission data with an available slot record

## Suggested next improvements

- Split routes, models, and middleware into separate folders
- Add request validation for public endpoints
- Return auth tokens for protected admin actions
- Add tests for blog and slot flows
- Add centralized error handling and logging
