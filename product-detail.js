let currentProduct = null;

function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    if (!productId) {
        window.location.href = 'products.html';
        return;
    }
    
    currentProduct = products.find(p => p.id === productId);
    
    if (!currentProduct) {
        window.location.href = 'products.html';
        return;
    }
    
    renderProductDetail();
    loadRelatedProducts();
}

function renderProductDetail() {
    if (!currentProduct) return;
    
    // Set page title
    document.title = currentProduct.name + ' - AZ Beauty';
    document.getElementById('productBreadcrumb').textContent = currentProduct.name;
    
    // Main image
    const mainImage = document.getElementById('mainProductImage');
    if (mainImage) {
        mainImage.src = currentProduct.image;
        mainImage.alt = currentProduct.name;
    }
    
    // Thumbnails
    const thumbnails = document.getElementById('thumbnailImages');
    if (thumbnails) {
        thumbnails.innerHTML = `
            <div class="thumbnail active" onclick="changeMainImage('${currentProduct.image}')">
                <img src="${currentProduct.image}" alt="${currentProduct.name}">
            </div>
        `;
    }
    
    // Product info
    document.getElementById('productName').textContent = currentProduct.name;
    
    const rating = document.getElementById('productStars');
    if (rating) {
        rating.innerHTML = renderStars(currentProduct.rating);
    }
    
    document.getElementById('productRating').textContent = currentProduct.rating;
    document.getElementById('reviewsCount').textContent = `(${currentProduct.reviews} үнэлгээ)`;
    
    const currentPrice = document.getElementById('currentPrice');
    if (currentPrice) {
        currentPrice.textContent = formatPrice(currentProduct.price);
    }
    
    const originalPrice = document.getElementById('originalPrice');
    if (originalPrice && currentProduct.originalPrice) {
        originalPrice.textContent = formatPrice(currentProduct.originalPrice);
    } else if (originalPrice) {
        originalPrice.style.display = 'none';
    }
    
    const discount = document.getElementById('discount');
    if (discount && currentProduct.originalPrice) {
        const discountPercent = Math.round((1 - currentProduct.price / currentProduct.originalPrice) * 100);
        discount.textContent = `-${discountPercent}%`;
    } else if (discount) {
        discount.style.display = 'none';
    }
    
    document.getElementById('productDescription').textContent = currentProduct.description;
    document.getElementById('fullDescription').innerHTML = `
        <p>${currentProduct.description}</p>
        <p>Энэ бүтээгдэхүүн нь солонгосын шилдэг гоо сайхны брэндүүдийн нэг юм. Байгалийн найрлагатай, арьсанд ээлтэй.</p>
    `;
    
    document.getElementById('ingredients').innerHTML = `
        <p>Найрлага: Ус, Глицерин, Хиалуроны хүчил, Ниацинамид, Пантенол, Токоферол, Аллантоин</p>
    `;
    
    // Reviews
    const reviews = document.getElementById('reviews');
    if (reviews) {
        reviews.innerHTML = `
            <div class="review-item">
                <div class="review-header">
                    <strong>Сараа</strong>
                    <div class="stars">${renderStars(5)}</div>
                </div>
                <p>Маш сайн бүтээгдэхүүн! Арьс маань илүү гэрэлтэй болсон.</p>
            </div>
            <div class="review-item">
                <div class="review-header">
                    <strong>Болд</strong>
                    <div class="stars">${renderStars(4)}</div>
                </div>
                <p>Чанартай, үнэ хямд. Дахиж захиалах болно.</p>
            </div>
        `;
    }
}

function changeMainImage(imageSrc) {
    const mainImage = document.getElementById('mainProductImage');
    if (mainImage) {
        mainImage.src = imageSrc;
    }
    
    // Update active thumbnail
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
        if (thumb.querySelector('img').src === imageSrc) {
            thumb.classList.add('active');
        }
    });
}

function increaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantityInput.value = parseInt(quantityInput.value) + 1;
    }
}

function decreaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    if (quantityInput && parseInt(quantityInput.value) > 1) {
        quantityInput.value = parseInt(quantityInput.value) - 1;
    }
}

function addToCart() {
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    addToCart(currentProduct.id, quantity);
}

function buyNow() {
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    addToCart(currentProduct.id, quantity);
    window.location.href = 'checkout.html';
}

function addToWishlist() {
    showNotification('Хүслийн жагсаалтанд нэмэгдлээ!');
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
}

function loadRelatedProducts() {
    if (!currentProduct) return;
    
    const related = products
        .filter(p => p.category === currentProduct.category && p.id !== currentProduct.id)
        .slice(0, 4);
    
    const container = document.getElementById('relatedProducts');
    if (container) {
        container.innerHTML = related.map(renderProductCard).join('');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadProductDetail();
});
