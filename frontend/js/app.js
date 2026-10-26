// frontend/js/app.js

// --- GLOBAL STATE ---
let cart = [];
let modalItem = null;
let modalQty = 1;
let userOrders = [];
let userNotifications = [];

// --- MENU RENDERING (FETCHES FROM BACKEND) ---
async function renderMenu(selectedCategory = 'all') {
    const grid = document.getElementById('menu-grid');
    
    let url = 'http://localhost:8080/api/products';
    if (selectedCategory === 'all') {
        url += '?best_sellers=true';
    } else if (selectedCategory !== 'all') {
        url += `?category=${selectedCategory}`;
    }

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch products');
        const menuItems = await res.json();
        
        grid.innerHTML = menuItems.map(item => `
            <div class="menu-item" onclick="openModal(${item.id})">
                <div class="menu-img">
                    ${item.bestSeller ? '<span class="menu-tag">BESTSELLER</span>' : ''}
                </div>
                <div class="menu-info">
                    <div class="menu-name">${item.name}</div>
                    <div class="menu-desc">${item.desc}</div>
                    <div class="menu-bottom">
                        <div class="menu-price">₱${item.price.toFixed(2)}</div>
                        <button class="add-btn" onclick="event.stopPropagation(); openModal(${item.id})">+</button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (err) {
        console.error("Backend connection failed:", err);
        grid.innerHTML = `<div style="padding:20px;color:red;">⚠️ Cannot connect to server. Make sure Go backend is running!</div>`;
    }
}

// --- MODAL LOGIC ---
window.openModal = function(id) {
    fetch(`http://localhost:8080/api/products?id=${id}`)
        .then(res => res.json())
        .then(items => {
            if (items && items.length > 0) {
                modalItem = items[0];
                modalQty = 1;
                
                document.getElementById('modal-name').textContent = modalItem.name;
                document.getElementById('modal-desc').textContent = modalItem.desc;
                document.getElementById('modal-price').textContent = `₱${modalItem.price.toFixed(2)}`;
                document.getElementById('modal-qty').textContent = modalQty;
                document.getElementById('add-modal').classList.add('show');
            }
        })
        .catch(err => console.error("Error fetching product details:", err));
};

document.getElementById('qty-inc').addEventListener('click', () => { 
    modalQty++; 
    document.getElementById('modal-qty').textContent = modalQty; 
});

document.getElementById('qty-dec').addEventListener('click', () => { 
    if(modalQty > 1) {
        modalQty--; 
        document.getElementById('modal-qty').textContent = modalQty; 
    }
});

document.getElementById('btn-close-modal').addEventListener('click', () => 
    document.getElementById('add-modal').classList.remove('show')
);

document.getElementById('add-modal').addEventListener('click', (e) => { 
    if(e.target.id === 'add-modal') document.getElementById('add-modal').classList.remove('show'); 
});

document.getElementById('btn-add-cart').addEventListener('click', () => {
    if (modalItem) {
        addToCart(modalItem, modalQty);
        document.getElementById('add-modal').classList.remove('show');
    }
});

// --- CART LOGIC ---
function addToCart(item, qty) {
    const existing = cart.find(c => c.id === item.id);
    if (existing) existing.qty += qty;
    else cart.push({ ...item, qty });
    updateCartUI();
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);
    document.getElementById('cart-count').textContent = totalItems;
    const badge = document.getElementById('cart-badge');
    badge.style.display = totalItems > 0 ? 'inline' : 'none';
    badge.textContent = totalItems;
    renderCart();
}

function renderCart() {
    const content = document.getElementById('cart-content');
    if (cart.length === 0) {
        content.innerHTML = `<div class="empty-state"><h3>Your cart is empty</h3><p>Add items from the menu.</p></div>`;
        return;
    }
    const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
    content.innerHTML = `
        <div class="cart-layout">
            <div class="cart-items-card">
                <div style="font-weight:700;font-size:15px;margin-bottom:12px;">Items (${cart.length})</div>
                ${cart.map(item => `
                    <div style="display:flex; justify-content:space-between; margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid var(--border);">
                        <div>
                            <div style="font-weight:600;">${item.name}</div>
                            <div style="font-size:12px; color:var(--text-2);">₱${item.price.toFixed(2)} x ${item.qty}</div>
                        </div>
                        <div style="font-weight:700;">₱${(item.price * item.qty).toFixed(2)}</div>
                    </div>
                `).join('')}
            </div>
            <div class="cart-summary-card">
                <div style="font-weight:700;font-size:15px;margin-bottom:14px;">Order Summary</div>
                <div class="summary-row"><span>Subtotal</span><span>₱${subtotal.toFixed(2)}</span></div>
                <div class="summary-row total"><span>Total</span><span>₱${subtotal.toFixed(2)}</span></div>
                <button class="checkout-btn" onclick="placeOrder()">Place Order</button>
                <div style="text-align:center;margin-top:10px;font-size:11px;color:var(--text-3);">Payment: Cash on Pickup</div>
            </div>
        </div>
    `;
}

// --- ORDER PLACEMENT & NOTIFICATIONS ---
async function placeOrder() {
    if (cart.length === 0) return;
    
    const orderData = {
        userId: 1, 
        items: cart.map(item => ({ productId: item.id, qty: item.qty }))
    };

    try {
        const res = await fetch('http://localhost:8080/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        if (res.ok) {
            const newOrder = await res.json();
            
            // Add to local orders array
            userOrders.unshift(newOrder); 
            
            // Create a notification
            userNotifications.unshift({
                id: Date.now(),
                title: "Order Placed!",
                message: `Your order #${newOrder.id} for ₱${newOrder.total.toFixed(2)} has been received.`,
                time: "Just now",
                read: false
            });

            cart = [];
            updateCartUI();
            alert('Order placed successfully! Check My Orders.');
        } else {
            const errText = await res.text();
            alert('Failed to place order: ' + errText);
        }
    } catch (err) {
        console.error(err);
        alert('Server error. Make sure backend is running on port 8080.');
    }
}

function renderOrders() {
    const container = document.getElementById('view-orders');
    let contentArea = container.querySelector('.orders-list') || container; 
    
    if (userOrders.length === 0) {
        contentArea.innerHTML = `<div class="empty-state"><h3>No active orders</h3></div>`;
        return;
    }

    contentArea.innerHTML = userOrders.map(order => `
        <div class="order-card" style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:16px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <strong>Order #${order.id}</strong>
                <span style="color:var(--brand); font-weight:600;">${order.total.toFixed(2)}</span>
            </div>
            <div style="font-size:12px; color:var(--text-2); margin-bottom:8px;">
                ${order.items.length} items • ${order.paymentMethod}
            </div>
            <div style="font-size:13px; font-weight:600; color:#16a34a;">Status: ${order.status.toUpperCase()}</div>
        </div>
    `).join('');
}

function renderNotifications() {
    const container = document.getElementById('view-notifications');
    let contentArea = container.querySelector('.notif-list') || container;

    if (userNotifications.length === 0) {
        contentArea.innerHTML = `<div class="empty-state"><h3>No notifications yet</h3></div>`;
        return;
    }

    contentArea.innerHTML = userNotifications.map(notif => `
        <div class="notif-item" style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:16px; margin-bottom:10px; display:flex; gap:12px; align-items:center;">
            <div style="width:8px; height:8px; background:var(--brand); border-radius:50%; flex-shrink:0;"></div>
            <div style="flex:1;">
                <div style="font-weight:600; font-size:14px;">${notif.title}</div>
                <div style="font-size:12px; color:var(--text-2); margin-top:2px;">${notif.message}</div>
                <div style="font-size:11px; color:var(--text-3); margin-top:4px;">${notif.time}</div>
            </div>
        </div>
    `).join('');
}

// --- NAVIGATION & CATEGORY TABS ---
function switchView(viewName) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (navItem) navItem.classList.add('active');
    
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + viewName).classList.add('active');
    
    // Trigger renders based on active view
    if (viewName === 'cart') renderCart();
    if (viewName === 'orders') renderOrders();
    if (viewName === 'notifications') renderNotifications();
}

document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.addEventListener('click', () => switchView(item.dataset.view));
});

document.getElementById('topbar-cart-btn').addEventListener('click', () => switchView('cart'));

document.querySelectorAll('.cat').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.cat').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderMenu(tab.dataset.category || 'all');
    });
});

// --- ACCOUNT LOGIC ---
function updateName() {
    const newName = document.getElementById('edit-name-input').value;
    if(newName) {
        document.getElementById('account-name-display').textContent = newName;
        document.getElementById('sidebar-name').textContent = newName;
        const initials = newName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
        document.getElementById('account-avatar').textContent = initials;
        document.getElementById('sidebar-avatar').textContent = initials;
    }
}

document.getElementById('upload-pic').addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgHTML = `<img src="${e.target.result}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            document.getElementById('account-avatar').innerHTML = imgHTML;
            document.getElementById('sidebar-avatar').innerHTML = imgHTML;
        };
        reader.readAsDataURL(this.files[0]);
    }
});

// Initial Load
renderMenu();