# Stockwise Inventory

Stockwise is a small inventory workspace for tracking products, stock movements, reorder thresholds, and stock value. It has a browser dashboard and a JSON API built with Express and MongoDB.

**Project author and maintainer:** Chandra Prakash Mishra  
**Repository:** this local project is authored by Chandra Prakash Mishra. It is a fresh implementation inspired by the inventory-management brief in the supplied archive; the source implementation was not copied verbatim.

## Features

- Add, edit, search, filter, and remove product records.
- Track SKU, category, supplier, price, quantity, and reorder threshold.
- Apply atomic stock increases and decreases; insufficient stock cannot create a negative quantity.
- See low-stock products and category-level inventory totals.
- Paginate and sort product lists using an allowlisted set of fields.
- Serve the dashboard and API from the same Express app.
- Keep local configuration out of Git with `.env`; `.env.example` contains only safe defaults.

## Requirements

- Node.js 18 or later
- MongoDB running locally, or a MongoDB connection string you are authorized to use

## Run locally

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://localhost:5000`. Set `MONGODB_URI` in your local `.env` if MongoDB is not using the local default. Never commit `.env` or share database credentials.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Process health |
| `GET` | `/api/health/ready` | MongoDB readiness check |
| `GET` | `/api/products` | List, search, filter, sort, and paginate |
| `POST` | `/api/products` | Create a product |
| `GET` | `/api/products/summary` | Inventory and category summary |
| `GET` | `/api/products/low-stock` | List products at or below reorder level |
| `GET` | `/api/products/:id` | Retrieve a product |
| `PUT` | `/api/products/:id` | Update editable product fields |
| `PATCH` | `/api/products/:id/stock` | Apply a stock adjustment |
| `DELETE` | `/api/products/:id` | Delete a product |

Example list query: `/api/products?search=paper&category=Office&page=1&limit=20&sortBy=name&order=asc`.

Stock adjustment body: `{ "change": -2 }` or `{ "change": 10 }`.

## Ownership and publishing

The local Git history is initialized with Chandra Prakash Mishra as the author. No GitHub repository has been created or pushed by this project setup. To host it under your GitHub account, create an empty repository while signed in as `chandraprakashmishra18`, add that repository as the `origin` remote, then push the local `main` branch.

The API currently has no user authentication. Keep it local or behind an access-controlled network until authentication and deployment security are added.
