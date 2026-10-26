package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"mjane-cafe/database"
)

type Product struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Category    string  `json:"category"`
	Price       float64 `json:"price"`
	Desc        string  `json:"desc"`
	Description string  `json:"description,omitempty"`
	BestSeller  bool    `json:"bestSeller"`
}

type OrderItem struct {
	ProductID int     `json:"productId"`
	Name      string  `json:"name"`
	Price     float64 `json:"price"`
	Qty       int     `json:"qty"`
	Subtotal  float64 `json:"subtotal"`
}

type Order struct {
	ID            int         `json:"id"`
	UserID        int         `json:"userId,omitempty"`
	Items         []OrderItem `json:"items"`
	Total         float64     `json:"total"`
	Status        string      `json:"status"`
	PaymentMethod string      `json:"paymentMethod"`
	CreatedAt     time.Time   `json:"createdAt"`
}

type CreateOrderRequest struct {
	UserID int `json:"userId"`
	Items  []struct {
		ProductID int `json:"productId"`
		Qty       int `json:"qty"`
	} `json:"items"`
}

var (
	orderMutex  sync.Mutex
	nextOrderID = 1
)

func main() {
	database.Init()

	http.HandleFunc("/api/products", productsHandler)
	http.HandleFunc("/api/orders", ordersHandler)

	fmt.Println("☕ Jane Cafe Backend running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", corsMiddleware(http.DefaultServeMux)))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		if next != nil {
			next.ServeHTTP(w, r)
		}
	})
}

func productsHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("🔍 DEBUG: Received request to /api/products | Method: %s | Query: %s", r.Method, r.URL.RawQuery)
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	category := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("category")))
	bestSellers := r.URL.Query().Get("best_sellers")

	var query string
	var args []interface{}

	if bestSellers == "true" {
		query = "SELECT id, name, category, price, description, is_best_seller FROM products WHERE is_best_seller = 1"
	} else if category != "" && category != "all" {
		query = "SELECT id, name, category, price, description, is_best_seller FROM products WHERE category = ?"
		args = append(args, category)
	} else {
		query = "SELECT id, name, category, price, description, is_best_seller FROM products"
	}

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		log.Printf("Query error: %v", err)
		return
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		rows.Scan(&p.ID, &p.Name, &p.Category, &p.Price, &p.Description, &p.BestSeller)
		p.Desc = p.Description
		products = append(products, p)
	}

	writeJSON(w, http.StatusOK, products)
}

func ordersHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getOrders(w, r)
	case http.MethodPost:
		createOrder(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getOrders(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT o.id, o.user_id, o.total, o.status, o.payment_method, o.created_at 
		FROM orders o ORDER BY o.created_at DESC
	`)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var orders []Order
	for rows.Next() {
		var o Order
		rows.Scan(&o.ID, &o.UserID, &o.Total, &o.Status, &o.PaymentMethod, &o.CreatedAt)
		orders = append(orders, o)
	}
	writeJSON(w, http.StatusOK, orders)
}

func createOrder(w http.ResponseWriter, r *http.Request) {
	var req CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if len(req.Items) == 0 {
		http.Error(w, "Order must have at least one item", http.StatusBadRequest)
		return
	}

	var items []OrderItem
	var total float64

	for _, item := range req.Items {
		if item.Qty < 1 || item.Qty > 99 {
			http.Error(w, "Quantity must be between 1 and 99", http.StatusBadRequest)
			return
		}

		var prod Product
		err := database.DB.QueryRow(
			"SELECT id, name, price FROM products WHERE id = ?", item.ProductID,
		).Scan(&prod.ID, &prod.Name, &prod.Price)

		if err == sql.ErrNoRows {
			http.Error(w, fmt.Sprintf("Product ID %d not found", item.ProductID), http.StatusBadRequest)
			return
		}
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		subtotal := prod.Price * float64(item.Qty)
		total += subtotal
		items = append(items, OrderItem{
			ProductID: prod.ID, Name: prod.Name, Price: prod.Price, Qty: item.Qty, Subtotal: subtotal,
		})
	}

	orderMutex.Lock()
	result, err := database.DB.Exec(
		"INSERT INTO orders (user_id, total, status, payment_method) VALUES (?, ?, ?, ?)",
		req.UserID, total, "pending", "Cash on Pickup",
	)
	orderMutex.Unlock()

	if err != nil {
		http.Error(w, "Failed to create order", http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	order := Order{
		ID: int(id), UserID: req.UserID, Items: items, Total: total,
		Status: "pending", PaymentMethod: "Cash on Pickup", CreatedAt: time.Now(),
	}

	writeJSON(w, http.StatusCreated, order)
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
