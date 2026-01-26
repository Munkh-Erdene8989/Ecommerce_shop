function loadCheckout() {
    loadCart(); // This will load order items in the summary
    
    // Handle payment method change
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const cardDetails = document.getElementById('cardDetails');
            if (this.value === 'card') {
                cardDetails.style.display = 'block';
                // Make card fields required
                document.getElementById('cardNumber').required = true;
                document.getElementById('cardExpiry').required = true;
                document.getElementById('cardCVV').required = true;
            } else {
                cardDetails.style.display = 'none';
                // Make card fields not required
                document.getElementById('cardNumber').required = false;
                document.getElementById('cardExpiry').required = false;
                document.getElementById('cardCVV').required = false;
            }
        });
    });
    
    // Format card number
    const cardNumber = document.getElementById('cardNumber');
    if (cardNumber) {
        cardNumber.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }
    
    // Format expiry date
    const cardExpiry = document.getElementById('cardExpiry');
    if (cardExpiry) {
        cardExpiry.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
    
    // Format CVV
    const cardCVV = document.getElementById('cardCVV');
    if (cardCVV) {
        cardCVV.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
}

function placeOrder(event) {
    event.preventDefault();
    
    if (cart.length === 0) {
        showNotification('Сагс хоосон байна');
        return;
    }
    
    // Get form data
    const formData = {
        customer: {
            name: document.getElementById('customerName').value,
            email: document.getElementById('customerEmail').value,
            phone: document.getElementById('customerPhone').value
        },
        shipping: {
            city: document.getElementById('city').value,
            district: document.getElementById('district').value,
            address: document.getElementById('address').value,
            postalCode: document.getElementById('postalCode').value
        },
        payment: document.querySelector('input[name="payment"]:checked').value,
        items: cart,
        total: calculateTotal()
    };
    
    // Validate card details if card payment
    if (formData.payment === 'card') {
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const cardExpiry = document.getElementById('cardExpiry').value;
        const cardCVV = document.getElementById('cardCVV').value;
        
        if (!cardNumber || cardNumber.length < 16) {
            showNotification('Зөв картын дугаар оруулна уу', 'error');
            return;
        }
        
        if (!cardExpiry || cardExpiry.length < 5) {
            showNotification('Зөв хүчинтэй хугацаа оруулна уу', 'error');
            return;
        }
        
        if (!cardCVV || cardCVV.length < 3) {
            showNotification('Зөв CVV оруулна уу', 'error');
            return;
        }
        
        formData.card = {
            number: cardNumber,
            expiry: cardExpiry,
            cvv: cardCVV
        };
    }
    
    // Save order to localStorage (in real app, this would go to server)
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = {
        id: Date.now(),
        ...formData,
        date: new Date().toISOString(),
        status: 'pending'
    };
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Clear cart
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Show success message and redirect
    showNotification('Захиалга амжилттай хийгдлээ!', 'success');
    
    setTimeout(() => {
        window.location.href = 'order-success.html?orderId=' + order.id;
    }, 2000);
}

function calculateTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingThreshold = 60000;
    const shippingCost = subtotal >= shippingThreshold ? 0 : 5000;
    return subtotal + shippingCost;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    const bgColor = type === 'error' ? '#f44336' : '#4caf50';
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 25px;
        border-radius: 4px;
        z-index: 10000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadCheckout();
    
    // Redirect if cart is empty
    if (cart.length === 0 && !window.location.search.includes('orderId')) {
        window.location.href = 'cart.html';
    }
});
