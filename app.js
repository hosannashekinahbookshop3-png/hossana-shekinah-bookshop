document.addEventListener('DOMContentLoaded', async () => {
  let products = [];
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  let currentFilter = 'All';

  // --- Render products ---
  function renderProducts(filteredProducts) {
    const productGrid = document.getElementById('productGrid');
    const resultCount = document.getElementById('resultCount');
    if (!productGrid) return;

    productGrid.innerHTML = '';

    if (filteredProducts.length === 0) {
      productGrid.innerHTML = 'No products found.';
      if (resultCount) resultCount.textContent = 'No products found.';
      return;
    }

    if (resultCount) resultCount.textContent = `Showing ${filteredProducts.length} product(s)`;

    filteredProducts.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      const imageHtml = product.image ?
        `img class="product-image" src="${product.image}" alt="${product.title}" onerror="this.style.display='none'"` :
        `div class="product-image" style="background:#ddd;height:150px;display:flex;align-items:center;justify-content:center;color:#888">No image`;
      card.innerHTML = `
        ${imageHtml}
        div class="product-info"
          span class="category-label">${product.category || 'Uncategorized'}/span>
          h3>${product.title}/h3>
          p class="product-price">₦${product.price}/p>
          button class="button dark add-to-cart" data-id="${product.id}">Add to Cart/button>
        /div>
      /div>`;
      productGrid.appendChild(card);
    });
  }

  // --- Fetch products ---
  async function fetchProducts() {
    try {
      const response = await fetch('products.json');
      if (!response.ok) throw new Error('Failed to fetch products');
      products = await response.json();
      applyFilters();
    } catch (error) {
      console.error('Error fetching products:', error);
      const productGrid = document.getElementById('productGrid');
      if (productGrid) productGrid.innerHTML = 'Failed to load products. Please try again later.';
      const resultCount = document.getElementById('resultCount');
      if (resultCount) resultCount.textContent = 'Failed to load products.';
    }
  }

  // --- Filters ---
  function applyFilters() {
    const search = document.getElementById('search');
    const query = search ? search.value.toLowerCase() : '';

    let filtered = products;

    if (currentFilter !== 'All') {
      filtered = filtered.filter(p => p.category === currentFilter);
    }

    if (query) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    }

    renderProducts(filtered);
  }

  // --- Build filter buttons ---
  function buildFilters() {
    const filtersContainer = document.getElementById('filters');
    if (!filtersContainer) return;

    const categories = [...new Set(products.map(p => p.category).filter(c => c))];
    categories.sort();

    filtersContainer.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = 'button dark';
    allBtn.textContent = 'All';
    allBtn.dataset.category = 'All';
    allBtn.addEventListener('click', () => {
      currentFilter = 'All';
      applyFilters();
      // Update active state
      document.querySelectorAll('#filters button').forEach(b => b.classList.remove('active'));
      allBtn.classList.add('active');
    });
    filtersContainer.appendChild(allBtn);

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'button dark';
      btn.textContent = cat;
      btn.dataset.category = cat;
      btn.addEventListener('click', () => {
        currentFilter = cat;
        applyFilters();
        document.querySelectorAll('#filters button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
      filtersContainer.appendChild(btn);
    });
  }

  // --- Add to cart ---
  function addToCart(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) return;

    const existing = cart.find(item => item.id == productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        quantity: 1
      });
    }
    saveCart();
    renderCart();
    updateCartCount();
  }

  // --- Remove from cart ---
  function removeFromCart(productId) {
    cart = cart.filter(item => item.id != productId);
    saveCart();
    renderCart();
    updateCartCount();
  }

  // --- Update quantity ---
  function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id == productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity  0) {
      removeFromCart(productId);
    } else {
      saveCart();
      renderCart();
      updateCartCount();
    }
  }

  // --- Save cart ---
  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  // --- Render cart ---
  function renderCart() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotal');
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = 'Your cart is empty.';
      if (cartTotalEl) cartTotalEl.textContent = '₦0';
      return;
    }

    cart.forEach(item => {
      const subtotal = item.price * item.quantity;
      total += subtotal;

      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      cartItem.innerHTML = `
        div>
          span>${item.title}/span>
          div>
            button data-action="decrease" data-id="${item.id}">-/button>
            span>${item.quantity}/span>
            button data-action="increase" data-id="${item.id}">+/button>
          /div>
          span>₦${item.price} x ${item.quantity} = ₦${subtotal}/span>
          button data-action="remove" data-id="${item.id}">Remove/button>
        /div>
      `;
      cartItemsContainer.appendChild(cartItem);
    });

    if (cartTotalEl) cartTotalEl.textContent = `₦${total}`;
  }

  // --- Update cart count ---
  function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      cartCount.textContent = totalItems;
    }
  }

  // --- Cart panel toggle ---
  function openCart() {
    const cartPanel = document.getElementById('cartPanel');
    const overlay = document.getElementById('overlay');
    if (cartPanel) cartPanel.style.display = 'block';
    if (overlay) overlay.style.display = 'block';
  }

  function closeCart() {
    const cartPanel = document.getElementById('cartPanel');
    const overlay = document.getElementById('overlay');
    if (cartPanel) cartPanel.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
  }

  // --- Checkout form ---
  async function submitCheckout() {
    const checkoutForm = document.getElementById('checkoutForm');
    if (!checkoutForm || cart.length === 0) return;

    const formData = new FormData(checkoutForm);
    const name = formData.get('name');
    const phone = formData.get('phone');
    const address = formData.get('address');
    const payment = formData.get('payment');

    // Calculate subtotal
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Format multi-item order message
    let orderItems = '';
    cart.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      orderItems += `${index + 1}. ${item.title} - ₦${item.price} x ${item.quantity} = ₦${itemTotal}\n`;
    });

    const message = `New Order\n\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\nPayment: ${payment}\n\n--- Order Items ---\n${orderItems}\n--- Subtotal: ₦${subtotal} ---\n\nThank you!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/2349126634340?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    // Clear cart after checkout
    cart = [];
    saveCart();
    renderCart();
    updateCartCount();
    closeCart();
  }

  // --- Initialize ---
  fetchProducts().then(() => {
    buildFilters();
    renderCart();
    updateCartCount();
  });

  // --- Event listeners ---
  // Search
  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      applyFilters();
    });
  }

  // Product grid delegation
  const productGrid = document.getElementById('productGrid');
  if (productGrid) {
    productGrid.addEventListener('click', (e) => {
      // Add to cart button
      if (e.target.classList.contains('add-to-cart')) {
        const productId = e.target.dataset.id;
        addToCart(productId);
        return;
      }

      // Cart item actions (delegation for dynamically created items)
      const cartItemsContainer = document.getElementById('cartItems');
      if (cartItemsContainer.contains(e.target)) {
        const btn = e.target.closest('button');
        if (!btn) return;
        const action = btn.dataset.action;
        const productId = btn.dataset.id;

        if (action === 'remove') {
          removeFromCart(productId);
        } else if (action === 'increase') {
          updateQuantity(productId, 1);
        } else if (action === 'decrease') {
          updateQuantity(productId, -1);
        }
      }
    });
  }

  // Open cart
  const openCartBtn = document.getElementById('openCart');
  if (openCartBtn) {
    openCartBtn.addEventListener('click', openCart);
  }

  // Close cart
  const closeCartBtn = document.getElementById('closeCart');
  if (closeCartBtn) {
    closeCartBtn.addEventListener('click', closeCart);
  }

  // Overlay click to close
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.addEventListener('click', closeCart);
  }

  // Checkout form
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      submitCheckout();
    });
  }
});
