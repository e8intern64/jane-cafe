package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

type Product struct {
	ID    int     `json:"id"`
	Name  string  `json:"name"`
	Desc  string  `json:"desc"`
	Price float64 `json:"price"`
	Emoji string  `json:"emoji"`
	Tag   string  `json:"tag,omitempty"`
}

type OrderItem struct {
	ProductID int     `json:"productId"`
	Name      string  `json:"name"`
	Price     float64 `json:"price"`
	Emoji     string  `json:"emoji"`
	Qty       int     `json:"qty"`
	Subtotal  float64 `json:"subtotal"`
}

type Order struct {
	ID        int         `json:"id"`
	Items     []OrderItem `json:"items"`
	Total     float64     `json:"total"`
	Status    string      `json:"status"`
	CreatedAt time.Time   `json:"createdAt"`
}

type OrderRequestItem struct {
	ProductID int `json:"productId"`
	Qty       int `json:"qty"`
}

type CreateOrderRequest struct {
	Items []OrderRequestItem `json:"items"`
}

var products = []Product{
	{ID: 1, Name: "Caramel Macchiato", Desc: "Espresso with caramel and milk", Price: 180, Emoji: "☕"},
	{ID: 2, Name: "Iced Spanish Latte", Desc: "Espresso with milk and sweetness", Price: 160, Emoji: "🧋"},
	{ID: 3, Name: "Americano", Desc: "Rich and smooth espresso", Price: 120, Emoji: "☕"},
	{ID: 4, Name: "Cafe Latte", Desc: "Espresso with steamed milk", Price: 150, Emoji: "🥛"},
	{ID: 5, Name: "Strawberry Frappe", Desc: "Blended strawberry with cream", Price: 190, Emoji: "🍓", Tag: "NEW"},
	{ID: 6, Name: "Matcha Latte", Desc: "Ceremonial grade matcha", Price: 170, Emoji: "🍵"},
	{ID: 7, Name: "Breakfast Sandwich", Desc: "Egg, cheese, bacon on brioche", Price: 210, Emoji: "🥪"},
	{ID: 8, Name: "Blueberry Muffin", Desc: "Loaded with fresh blueberries", Price: 120, Emoji: "🧁"},
}

var (
	orders      []Order
	nextOrderID = 1
	orderMutex  sync.Mutex
)

func main() {
	http.HandleFunc("/api/products", productsHandler)
	http.HandleFunc("/api/orders", ordersHandler)

	fmt.Println("Jane Cafe backend running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func productsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	writeJSON(w, http.StatusOK, products)
}

func ordersHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		orderMutex.Lock()
		defer orderMutex.Unlock()

		writeJSON(w, http.StatusOK, orders)

	case http.MethodPost:
		createOrderHandler(w, r)

	default:
		w.Header().Set("Allow", "GET, POST")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func createOrderHandler(w http.ResponseWriter, r *http.Request) {
	var request CreateOrderRequest

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&request); err != nil {
		http.Error(w, "Invalid order JSON", http.StatusBadRequest)
		return
	}

	if len(request.Items) == 0 {
		http.Error(w, "Your order must contain at least one item", http.StatusBadRequest)
		return
	}

	var items []OrderItem
	var total float64

	for _, requestedItem := range request.Items {
		if requestedItem.Qty < 1 || requestedItem.Qty > 99 {
			http.Error(w, "Quantity must be between 1 and 99", http.StatusBadRequest)
			return
		}

		var found *Product

		for i := range products {
			if products[i].ID == requestedItem.ProductID {
				found = &products[i]
				break
			}
		}

		if found == nil {
			http.Error(w, "Product not found", http.StatusBadRequest)
			return
		}

		subtotal := found.Price * float64(requestedItem.Qty)
		total += subtotal

		items = append(items, OrderItem{
			ProductID: found.ID,
			Name:      found.Name,
			Price:     found.Price,
			Emoji:     found.Emoji,
			Qty:       requestedItem.Qty,
			Subtotal:  subtotal,
		})
	}

	orderMutex.Lock()
	defer orderMutex.Unlock()

	order := Order{
		ID:        nextOrderID,
		Items:     items,
		Total:     total,
		Status:    "Pending",
		CreatedAt: time.Now(),
	}

	nextOrderID++
	orders = append(orders, order)

	writeJSON(w, http.StatusCreated, order)
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Could not encode JSON: %v", err)
	}
}
