# Jane Cafe

Jane Cafe is a simple cafe ordering web app built with:
- Frontend: HTML, CSS, JavaScript
- Backend: Go (Golang)
- Database: SQLite

The app allows users to:
- browse the menu
- filter items by category
- view bestseller items
- add items to cart
- place orders
- view recent local order notifications in the app

---

## Project Structure

```text
mjane-cafe/
├── backend/
│   └── cmd/
│       └── server/
│           └── main.go
├── database/
│   ├── jane_cafe.db
│   └── setup.go
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── js/
│       ├── api.js
│       └── app.js
├── go.mod
├── go.sum
├── .gitignore
└── README.md
```

---

## Technologies Used

### Frontend
- HTML
- CSS
- JavaScript
- Browser fetch API

### Backend
- Go
- net/http package
- SQLite driver via modernc.org/sqlite

### Database
- SQLite database file: `database/jane_cafe.db`

---

## Requirements

Before running the app, make sure the following are installed:

### Required
- Go 1.20 or higher
- A modern browser (Chrome, Edge, or Firefox)

### Optional
- VS Code (recommended for editing and running terminal commands)
- SQLite browser or DB viewer (helpful for checking the database)

---

## Setup Instructions

1. Open a terminal in the project root folder.

```bash
cd C:\Projects\mjane-cafe
```

2. Download Go dependencies.

```bash
go mod download
```

3. Start the backend server.

```bash
go run ./backend/cmd/server
```

Expected output should include:

```text
☕ Jane Cafe Backend running at http://localhost:8080
```

4. Open the frontend in a browser.

- You can open the file directly:

```text
frontend/index.html
```

or load it using a local web server if preferred.

5. The app will call the Go API at:

```text
http://localhost:8080
```

---

## Main Features

- View product menu
- Filter by category: coffee, tea, pastries
- Show best sellers
- Add products to cart
- Place orders
- View local order summary in the UI
- Receive order notifications in the frontend

---

## Database Design

The SQLite database contains the following major tables:

### 1. products
Stores all menu items.

Columns include:
- id
- name
- category
- price
- description
- is_best_seller
- image_url

Purpose:
- This is the menu catalog shown to the user.
- The frontend fetches this table from the backend API.

### 2. users
Stores user profile information for potential account functionality.

Columns include:
- id
- name
- email
- phone
- avatar_url
- points
- stamps

Purpose:
- Prepared for loyalty and customer account features.
- At the moment, there is no login system or active user authentication flow implemented.

### 3. orders
Stores order transactions.

Columns include:
- id
- user_id
- total
- status
- payment_method
- created_at

Purpose:
- Saves completed customer orders.
- Used to track order totals and order history.

---

## API Endpoints

### GET /api/products
Returns the product list.

Possible queries:
- `/api/products`
- `/api/products?category=coffee`
- `/api/products?best_sellers=true`

### POST /api/orders
Creates a new order.

Request body example:

```json
{
  "userId": 1,
  "items": [
    { "productId": 1, "qty": 2 },
    { "productId": 4, "qty": 1 }
  ]
}
```

---

## Important Notes

### 1. The app uses a fixed local backend port
The Go server listens on port 8080.

If the frontend shows:

> Cannot connect to server. Make sure Go backend is running!

Then the backend server is not running or another app is already using port 8080.

### 2. Port 8080 may already be in use
If you see an error like:

```text
bind: Only one usage of each socket address is normally permitted
```

then another process is already listening on port 8080.

To fix this, run:

```bash
netstat -ano | findstr :8080
```

Then stop the process using the PID:

```bash
taskkill /PID <PID> /F
```

### 3. Database path is relative
The backend opens the SQLite database using a relative path:

```go
./database/jane_cafe.db
```

This means it works best when the app is started from the project root folder.

If you run the backend from another folder, it may connect to a different or unexpected location.

### 4. Product table resets on startup
The database setup currently clears the products table when the backend starts and reseeds the default menu.

This ensures the menu stays clean and duplicate records are prevented.

### 5. No user login is implemented yet
The users table exists for future customer/account management, but there is no real login or registration flow in the current application.

### 6. Local database is generated and gitignored
The SQLite file in `database/jane_cafe.db` is created automatically when the Go backend starts. It is meant to be a local runtime database for development and testing, and it is intentionally ignored by Git so the repository stays clean and reproducible.

So while the table is present, the app currently does not create or track active logged-in users in real time.

---

## Common Problems and Fixes

### Problem: Frontend says cannot connect to server
Fix:

```bash
go run ./backend/cmd/server
```

Then refresh the page.

---

### Problem: Port 8080 already used
Fix:

```bash
netstat -ano | findstr :8080
```

Then:

```bash
taskkill /PID <PID> /F
```

---

### Problem: Duplicate products appear in the menu
This can happen if the database was not reset properly or if the app was started multiple times while reseeding.

The project includes logic to clear and reseed the products table on startup to keep it consistent.

---

### Problem: Order succeeds but database does not show a visible change
Check the correct database file and table:
- file: `database/jane_cafe.db`
- table: `orders`

The app creates order records in the orders table, not in the menu/products table.

---

## How to Run the App in One Sentence

Start the Go backend in the project root, then open the frontend HTML file in the browser and the app will connect to the backend through http://localhost:8080.

---

## Summary

Jane Cafe is a small cafe ordering application with:
- a Go backend serving API routes
- a SQLite database storing menu, users, and orders
- a browser frontend that communicates with the backend

It is a working prototype for menu browsing and order placement, with room for future user authentication, user profiles, and richer order management features.
