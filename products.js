// Load products based on filters
function loadProducts() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const sort = urlParams.get('sort');
    const skinType = urlParams.get('skin');
    
    let filteredProducts = [...products];
    
    // Filter by category
    if (category) {
        filteredProducts = filteredProducts.filter(p => p.category === category);
        document.getElementById('pageTitle').textContent = getCategoryName(category);
        document.getElementById('breadcrumbCategory').textContent = getCategoryName(category);
    }
    
    // Filter by skin type
    if (skinType) {
        filteredProducts = filteredProducts.filter(p => 
            p.skinType && p.skinType.includes(skinType)
        );
    }
    
    // Sort products
    if (sort === 'price-low') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sort === 'new') {
        filteredProducts = filteredProducts.slice().reverse();
    } else if (sort === 'popular') {
        filteredProducts.sort((a, b) => b.reviews - a.reviews);
    }
    
    renderProducts(filteredProducts);
}

function getCategoryName(category) {
    const names = {
        'skincare': 'Гоо сайхан',
        'makeup': 'Нүүрний будаг',
        'hair': 'Үсний бүтээгдэхүүн',
        'masks': 'Маск',
        'suncare': 'Нарнаас хамгаалах',
        'body': 'Биеийн арчилгаа'
    };
    return names[category] || 'Бүтээгдэхүүн';
}

function renderProducts(productsList) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    if (productsList.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px;"><h3>Бүтээгдэхүүн олдсонгүй</h3></div>';
        return;
    }
    
    grid.innerHTML = productsList.map(renderProductCard).join('');
}

function sortProducts() {
    const sortValue = document.getElementById('sortSelect').value;
    const url = new URL(window.location);
    url.searchParams.set('sort', sortValue);
    window.location.href = url.toString();
}

function applyFilters() {
    const checkboxes = document.querySelectorAll('.filter-group input[type="checkbox"]:checked');
    const radios = document.querySelectorAll('.filter-group input[type="radio"]:checked');
    
    // Build filter URL
    const url = new URL(window.location);
    
    // Clear existing filters
    url.searchParams.delete('category');
    url.searchParams.delete('price');
    url.searchParams.delete('skin');
    
    // Apply category filters
    checkboxes.forEach(cb => {
        if (['skincare', 'makeup', 'hair', 'masks', 'suncare', 'body'].includes(cb.value)) {
            url.searchParams.set('category', cb.value);
        }
        if (['normal', 'oily', 'dry', 'sensitive'].includes(cb.value)) {
            url.searchParams.set('skin', cb.value);
        }
    });
    
    // Apply price filter
    radios.forEach(radio => {
        if (radio.name === 'price') {
            url.searchParams.set('price', radio.value);
        }
    });
    
    window.location.href = url.toString();
}

function clearFilters() {
    window.location.href = 'products.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    
    // Set active filter based on URL
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    if (category) {
        const checkbox = document.querySelector(`input[value="${category}"]`);
        if (checkbox) checkbox.checked = true;
    }
    
    const sort = urlParams.get('sort');
    if (sort) {
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.value = sort;
    }
});
