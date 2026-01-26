function loadCart() {
    const cartItems = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const orderItems = document.getElementById('orderItems');
    
    if (cart.length === 0) {
        if (emptyCart) emptyCart.style.display = 'block';
        if (cartItems) {
            cartItems.innerHTML = '';
            cartItems.appendChild(emptyCart);
        }
        updateCartSummary();
        return;
    }
    
    if (emptyCart) emptyCart.style.display = 'none';
    
    // Render cart items
    if (cartItems) {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/300x300?text=Product'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                    <div class="cart-item-actions">
                        <div class="quantity-selector">
                            <button onclick="updateCartQuantity(${item.id}, -1)">-</button>
                            <input type="number" value="${item.quantity}" min="1" onchange="updateCartQuantity(${item.id}, 0, this.value)">
                            <button onclick="updateCartQuantity(${item.id}, 1)">+</button>
                        </div>
                        <button class="remove-item" onclick="removeFromCart(${item.id})">
                            <i class="fas fa-trash"></i> Устгах
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Render order summary items (for checkout page)
    if (orderItems) {
        orderItems.innerHTML = cart.map(item => `
            <div class="order-item">
                <img src="${item.image}" alt="${item.name}" class="order-item-image" onerror="this.src='https://via.placeholder.com/300x300?text=Product'">
                <div class="order-item-info">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-price">
                        ${formatPrice(item.price)} x ${item.quantity} = ${formatPrice(item.price * item.quantity)}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    updateCartSummary();
}

function updateCartQuantity(productId, change, newValue = null) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    
    if (newValue !== null) {
        item.quantity = parseInt(newValue) || 1;
    } else {
        item.quantity = Math.max(1, item.quantity + change);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
    updateCartCount();
}

function updateCartSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingThreshold = 60000;
    const shippingCost = subtotal >= shippingThreshold ? 0 : 5000;
    const total = subtotal + shippingCost;
    
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const totalEl = document.getElementById('total');
    const freeShippingNotice = document.getElementById('freeShippingNotice');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (shippingEl) shippingEl.textContent = formatPrice(shippingCost);
    if (totalEl) totalEl.textContent = formatPrice(total);
    
    // Order summary for checkout page
    const orderSubtotal = document.getElementById('orderSubtotal');
    const orderShipping = document.getElementById('orderShipping');
    const orderTotal = document.getElementById('orderTotal');
    
    if (orderSubtotal) orderSubtotal.textContent = formatPrice(subtotal);
    if (orderShipping) orderShipping.textContent = formatPrice(shippingCost);
    if (orderTotal) orderTotal.textContent = formatPrice(total);
    
    if (freeShippingNotice) {
        if (subtotal >= shippingThreshold) {
            freeShippingNotice.style.display = 'none';
        } else {
            const remaining = shippingThreshold - subtotal;
            freeShippingNotice.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <span>${formatPrice(remaining)} дээш үнэгүй хүргэлт</span>
            `;
            freeShippingNotice.style.display = 'flex';
        }
    }
    
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
    }
}

function proceedToCheckout() {
    if (cart.length === 0) {
        showNotification('Сагс хоосон байна');
        return;
    }
    window.location.href = 'checkout.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
});
