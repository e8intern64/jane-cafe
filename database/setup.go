// database/setup.go
package database

import (
	"database/sql"
	"log"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

func Init() {
	var err error
	DB, err = sql.Open("sqlite", "./database/jane_cafe.db")
	if err != nil {
		log.Fatal("❌ Failed to connect to database:", err)
	}
	DB.SetMaxOpenConns(1)
	log.Println("✅ Connected to SQLite successfully")

	createTables()
	resetProductsTable()
	ensureUniqueProductNames()
	seedMenu()
	fixBestSellers()
}

func createTables() {
	query := `
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        is_best_seller BOOLEAN DEFAULT FALSE,
        image_url TEXT
    );
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        avatar_url TEXT,
        points INTEGER DEFAULT 0,
        stamps INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        total REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_method TEXT DEFAULT 'Cash on Pickup',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    `
	_, err := DB.Exec(query)
	if err != nil {
		log.Fatal("❌ Failed to create tables:", err)
	}
	log.Println("✅ Database tables created/verified")
}

func resetProductsTable() {
	_, err := DB.Exec("DELETE FROM products")
	if err != nil {
		log.Println("⚠️ Failed to clear products table:", err)
		return
	}
	_, err = DB.Exec("DELETE FROM sqlite_sequence WHERE name = 'products'")
	if err != nil {
		log.Println("⚠️ Failed to reset product IDs:", err)
	}
	log.Println("✅ Product table reset for clean menu seed")
}

func ensureUniqueProductNames() {
	_, err := DB.Exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_products_name ON products(name)`)
	if err != nil {
		log.Println("⚠️ Failed to create unique product-name index:", err)
	}
}

func seedMenu() {
	stmt, err := DB.Prepare("INSERT OR IGNORE INTO products (name, category, price, description, is_best_seller) VALUES (?, ?, ?, ?, ?)")
	if err != nil {
		log.Fatal("❌ Failed to prepare insert statement:", err)
	}
	defer stmt.Close()

	menu := []struct {
		Name, Category, Desc string
		Price                float64
		Best                 bool
	}{
		{"Matcha Latte", "coffee", "Ceremonial grade matcha with steamed milk", 135.00, true},
		{"Ice Americano", "coffee", "Bold espresso over ice with cold water", 145.00, false},
		{"Spanish Latte", "coffee", "Sweet condensed milk latte with espresso", 120.00, false},
		{"Matcha Strawberry", "tea", "Fresh strawberry blended with matcha tea", 125.00, true},
		{"Seasalt Brown Sugar", "tea", "Brown sugar pearls with sea salt topping", 110.00, false},
		{"Sea Salt Matcha", "tea", "Creamy matcha with sea salt foam", 100.00, false},
		{"Tuna Puff", "pastries", "Flaky pastry filled with seasoned tuna", 135.00, true},
		{"Classic Croissant", "pastries", "Buttery, golden croissant baked fresh daily", 135.00, false},
		{"Blueberry Cheese Puff", "pastries", "Puff pastry with blueberry cream cheese filling", 150.00, false},
	}

	for _, m := range menu {
		result, err := stmt.Exec(m.Name, m.Category, m.Price, m.Desc, m.Best)
		if err != nil {
			log.Printf("⚠️ Failed to insert %s: %v", m.Name, err)
			continue
		}
		if rows, err := result.RowsAffected(); err == nil && rows > 0 {
			log.Printf("✅ Seeded %s", m.Name)
		}
	}
	log.Println("✅ Menu items verified successfully")
}

// fixBestSellers ensures the correct items are marked as best sellers
// This fixes SQLite boolean storage issues where TRUE might be stored as 0
func fixBestSellers() {
	_, err := DB.Exec(`UPDATE products SET is_best_seller = 1 
		WHERE name IN ('Matcha Latte', 'Matcha Strawberry', 'Tuna Puff')`)
	if err != nil {
		log.Println("⚠️ Failed to update best sellers:", err)
		return
	}

	// Verify the fix
	rows, err := DB.Query("SELECT id, name, is_best_seller FROM products WHERE is_best_seller = 1")
	if err != nil {
		log.Println("⚠️ Failed to verify best sellers:", err)
		return
	}
	defer rows.Close()

	log.Println("✅ Best sellers fixed:")
	count := 0
	for rows.Next() {
		var id int
		var name string
		var best bool
		rows.Scan(&id, &name, &best)
		log.Printf("   - %s (ID: %d)", name, id)
		count++
	}
	if count == 0 {
		log.Println("   ️ No best sellers found after update")
	}
}
