# Jane Cafe ☕

An online cafe ordering application with a Go backend. This project is currently under development.

## Features

- Cafe menu interface
- Product and order API endpoints
- Go backend server
- Web frontend built with HTML, CSS, and JavaScript

*Note: Some features may still be in progress or not yet connected to the backend.*

## Prerequisites

Before running the application, install:

- [Go](https://go.dev/dl/) — the Go programming language
- [Git](https://git-scm.com/downloads) — to clone the repository
- A modern web browser, such as Google Chrome or Microsoft Edge

## Installation and Setup

### 1. Clone the repository

Open a terminal and run:

```bash
git clone https://github.com/e8intern64/jane-cafe.git
```

### 2. Navigate to the project folder

```bash
cd jane-cafe
```

### 3. Download the Go dependencies

```bash
go mod download
```

## Running the Application

From the project root directory, run:

```bash
go run ./cmd/server
```

Keep the terminal open while the server is running.

Once the server starts, open your browser and navigate to the local address configured by the Go server. Check the server startup message or the port configured in `cmd/server/main.go` for the correct address.

If the frontend is not served automatically by the backend, open `web/index.html` in your browser for a frontend preview. Backend API integration may still be in progress.

## Project Structure

```text
jane-cafe/
├── cmd/
│   └── server/
│       └── main.go
├── database/
├── internal/
├── migrations/
├── web/
│   ├── index.html
│   ├── style.css
│   └── js/
│       └── app.js
├── .gitignore
├── go.mod
├── go.sum
└── README.md
```

## Backend API

The Go backend currently defines the following API endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/products` | Retrieve products |
| GET | `/api/orders` | Retrieve orders |
| POST | `/api/orders` | Submit an order |

The endpoints and their behavior may change as development continues.

## Troubleshooting

Go command not found

Install Go and reopen your terminal. Verify the installation by running:

```bash
go version
```

Dependencies fail to download

Check your internet connection and run:

```bash
go mod tidy
```

**The server does not start**

Make sure you are in the project root directory and check the error message in the terminal.

**The browser cannot connect to the server**

Confirm that the Go server is running and use the correct local address and port configured in the application.

## Development Status

Jane Cafe is a work in progress. The frontend, backend API, and database integration are being developed and tested. Not all features may be fully functional yet.

