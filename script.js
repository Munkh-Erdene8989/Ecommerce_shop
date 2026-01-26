// Sample product data
const products = [
    {
        id: 1,
        name: "COSRX Advanced Snail 96 Mucin Power Essence",
        brand: "COSRX",
        category: "skincare",
        price: 45000,
        originalPrice: 55000,
        image: "https://via.placeholder.com/300x300?text=COSRX+Snail+Essence",
        rating: 4.8,
        reviews: 1250,
        description: "Тархины уураг агуулсан серум, арьсыг чийгшүүлж, гэрэлтгэнэ.",
        inStock: true,
        skinType: ["normal", "dry", "sensitive"],
        benefits: ["moisturizing", "brightening"]
    },
    {
        id: 2,
        name: "Beauty of Joseon Glow Serum",
        brand: "Beauty of Joseon",
        category: "skincare",
        price: 38000,
        originalPrice: 45000,
        image: "https://via.placeholder.com/300x300?text=BOJ+Glow+Serum",
        rating: 4.9,
        reviews: 890,
        description: "Рицинол агуулсан гэрэлтгэх серум.",
        inStock: true,
        skinType: ["normal", "oily"],
        benefits: ["brightening", "anti-aging"]
    },
    {
        id: 3,
        name: "Innisfree Green Tea Seed Serum",
        brand: "Innisfree",
        category: "skincare",
        price: 42000,
        originalPrice: 50000,
        image: "https://via.placeholder.com/300x300?text=Innisfree+Green+Tea",
        rating: 4.7,
        reviews: 2100,
        description: "Ногоон цайны үрийн экстракт агуулсан чийгшүүлэгч серум.",
        inStock: true,
        skinType: ["normal", "dry", "sensitive"],
        benefits: ["moisturizing"]
    },
    {
        id: 4,
        name: "Laneige Water Bank Hyaluronic Cream",
        brand: "Laneige",
        category: "skincare",
        price: 65000,
        originalPrice: 75000,
        image: "https://via.placeholder.com/300x300?text=Laneige+Water+Bank",
        rating: 4.6,
        reviews: 1560,
        description: "Хиалуроны хүчил агуулсан гүн чийгшүүлэгч тос.",
        inStock: true,
        skinType: ["normal", "dry"],
        benefits: ["moisturizing"]
    },
    {
        id: 5,
        name: "Etude House Sunprise Mild Airy Finish",
        brand: "Etude House",
        category: "suncare",
        price: 28000,
        originalPrice: 35000,
        image: "https://via.placeholder.com/300x300?text=Etude+Sunprise",
        rating: 4.5,
        reviews: 980,
        description: "Тослог арьстай зориулсан нарнаас хамгаалах тос.",
        inStock: true,
        skinType: ["oily"],
        benefits: ["moisturizing"]
    },
    {
        id: 6,
        name: "Missha Perfect Cover BB Cream",
        brand: "Missha",
        category: "makeup",
        price: 32000,
        originalPrice: 40000,
        image: "https://via.placeholder.com/300x300?text=Missha+BB+Cream",
        rating: 4.7,
        reviews: 3200,
        description: "SPF 42 агуулсан бүрэн хамрах BB крем.",
        inStock: true,
        skinType: ["normal", "dry", "oily"],
        benefits: ["moisturizing"]
    },
    {
        id: 7,
        name: "3CE Velvet Lip Tint",
        brand: "3CE",
        category: "makeup",
        price: 35000,
        originalPrice: 42000,
        image: "https://via.placeholder.com/300x300?text=3CE+Lip+Tint",
        rating: 4.8,
        reviews: 1890,
        description: "Урт удаан тогтдог уруулын будаг.",
        inStock: true,
        skinType: [],
        benefits: []
    },
    {
        id: 8,
        name: "Mediheal N.M.F Aquaring Ampoule Mask",
        brand: "Mediheal",
        category: "masks",
        price: 15000,
        originalPrice: 20000,
        image: "https://via.placeholder.com/300x300?text=Mediheal+Mask",
        rating: 4.6,
        reviews: 2450,
        description: "Чийгшүүлэх маск, 10 ширхэг.",
        inStock: true,
        skinType: ["normal", "dry", "sensitive"],
        benefits: ["moisturizing"]
    },
    {
        id: 9,
        name: "Mise-en-scene Perfect Repair Treatment",
        brand: "Mise-en-scene",
        category: "hair",
        price: 25000,
        originalPrice: 30000,
        image: "https://via.placeholder.com/300x300?text=Mise+Treatment",
        rating: 4.7,
        reviews: 1120,
        description: "Гэмтсэн үсийг засах эмчилгээ.",
        inStock: true,
        skinType: [],
        benefits: []
    },
    {
        id: 10,
        name: "Klairs Freshly Juiced Vitamin Drop",
        brand: "Klairs",
        category: "skincare",
        price: 48000,
        originalPrice: 58000,
        image: "https://via.placeholder.com/300x300?text=Klairs+Vitamin+C",
        rating: 4.9,
        reviews: 1670,
        description: "Витамин C агуулсан гэрэлтгэх серум.",
        inStock: true,
        skinType: ["normal", "oily"],
        benefits: ["brightening", "anti-aging"]
    },
    {
        id: 11,
        name: "Round Lab 1025 Dokdo Toner",
        brand: "Round Lab",
        category: "skincare",
        price: 36000,
        originalPrice: 42000,
        image: "https://via.placeholder.com/300x300?text=Round+Lab+Toner",
        rating: 4.8,
        reviews: 980,
        description: "Цэвэрлэх, чийгшүүлэх тонер.",
        inStock: true,
        skinType: ["normal", "oily", "sensitive"],
        benefits: ["moisturizing"]
    },
    {
        id: 12,
        name: "Anua Heartleaf 77% Soothing Toner",
        brand: "Anua",
        category: "skincare",
        price: 40000,
        originalPrice: 48000,
        image: "https://via.placeholder.com/300x300?text=Anua+Toner",
        rating: 4.7,
        reviews: 1340,
        description: "Сэвэгний навчны экстракт агуулсан тайвшруулах тонер.",
        inStock: true,
        skinType: ["sensitive", "oily"],
        benefits: ["moisturizing"]
    }
];

// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartCount() {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = cartCount;
    });
}

function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showNotification('Сагсанд нэмэгдлээ!');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    if (window.location.pathname.includes('cart.html')) {
        loadCart();
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #4caf50;
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

function formatPrice(price) {
    return new Intl.NumberFormat('mn-MN').format(price) + '₮';
}

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

function renderProductCard(product) {
    const discount = product.originalPrice 
        ? Math.round((1 - product.price / product.originalPrice) * 100)
        : 0;

    return `
        <div class="product-card" onclick="window.location.href='product-detail.html?id=${product.id}'">
            <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x300?text=Product'">
            <div class="product-info">
                <div class="product-brand">${product.brand}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">
                    <span class="current-price">${formatPrice(product.price)}</span>
                    ${product.originalPrice ? `<span class="original-price">${formatPrice(product.originalPrice)}</span>` : ''}
                    ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
                </div>
                <div class="product-rating">
                    <div class="stars">${renderStars(product.rating)}</div>
                    <span>${product.rating}</span>
                    <span>(${product.reviews})</span>
                </div>
            </div>
        </div>
    `;
}

// Load featured products on homepage
function loadFeaturedProducts() {
    const featuredContainer = document.getElementById('featuredProducts');
    const newProductsContainer = document.getElementById('newProducts');
    const bestSellerContainer = document.getElementById('bestSellerProducts');

    if (featuredContainer) {
        const featured = products.slice(0, 4);
        featuredContainer.innerHTML = featured.map(renderProductCard).join('');
    }

    if (newProductsContainer) {
        const newProducts = products.slice(4, 8);
        newProductsContainer.innerHTML = newProducts.map(renderProductCard).join('');
    }

    if (bestSellerContainer) {
        const bestSellers = products.slice(8, 12);
        bestSellerContainer.innerHTML = bestSellers.map(renderProductCard).join('');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    loadFeaturedProducts();
});
