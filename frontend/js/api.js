"use strict";

(() => {
  // Match this URL to the address and port of your Go API.
  const API_BASE_URL = "http://localhost:8080/api";

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(
        `API request failed (${response.status}): ${message || response.statusText}`
      );
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  window.JaneCafeAPI = {
    baseUrl: API_BASE_URL,

    // Fetch menu products from Go.
    getProducts() {
      return request("/products");
    },

    // Keep the existing order API support.
    createOrder(order) {
      return request("/orders", {
        method: "POST",
        body: JSON.stringify(order)
      });
    },

    getOrders() {
      return request("/orders");
    }
  };
})();