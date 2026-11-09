document.addEventListener('DOMContentLoaded', () => {
  const productGrid = document.getElementById('productGrid');
  const resultCount = document.getElementById('resultCount');
  const filtersContainer = document.getElementById('filters');
  const searchInput = document.getElementById('search');
  const cartCount = document.getElementById('cartCount');
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  const cartPanel = document.getElementById('cartPanel');
  const overlay = document.getElementById('overlay');
  const openCartBtn = document.getElementById('openCart');
  const closeCartBtn = document.getElementById('closeCart');
  const checkoutForm = document.getElementById('checkoutForm');
  const yearEl = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  let products = [];
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  let currentFilter = 'All';

  /* ---- helpers ---- */
  function esc(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/
/g, '&lt;').replace(/>/g, '&gt;');
  }

  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  function updateCartCount() {
    if (cartCount) {
      const total = cart.reduce((s, i) => s + i.quantity, 0);
      cartCount.textContent = String(total);
    }
  }

  /* ---- product rendering ---- */
  function renderProducts(list) {
    if (!productGrid) return;
    productGrid.innerHTML = '';

    if (list.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'No products found.';
      productGrid.appendChild(p);
      if (resultCount) resultCount.textContent = 'No products found.';
      return;
    }

    if (resultCount) resultCount.textContent = 'Showing ' + list.length + ' product(s)';

    list.forEach(function(product) {
      const card = document.createElement('div');
      card.className = 'product';
      card.dataset.id = product.id;

      /* cover (image or typographic) */
      const cover = document.createElement('div');
      cover.className = 'cover';

      if (product.image && product.image.trim() !== '') {
        const img = document.createElement('img');
        img.src = product.image;
        img.alt = product.title;
        img.loading = 'lazy';
        cover.appendChild(img);
      } else {
        const titleDiv = document.createElement('div');
        titleDiv.textContent = product.title;
        cover.appendChild(titleDiv);
      }

      /* category */
      const cat = document.createElement('div');
      cat.className = 'category';
      cat.textContent = product.category || 'Uncategorized';

      /* title */
      const h3 = document.createElement('h3');
      h3.textContent = product.title;

      /* price */
      const price = document.createElement('div');
      price.className = 'price';
      price.textContent = '\u20A6' + product.price;

      /* add button */
      const btn = document.createElement('button');
      btn.className = 'add';
      btn.dataset.id = product.id;
      btn.textContent = 'Add';

      card.appendChild(cover);
      card.appendChild(cat);
      card.appendChild(h3);
      card.appendChild(price);
      card.appendChild(btn);
      productGrid.appendChild(card);
    });
  }

  /* ---- filters ---- */
  function buildFilters() {
    if (!filtersContainer) return;
    filtersContainer.innerHTML = '';

    var cats = [];
    var seen = {};
    products.forEach(function(p) {
      if (p.category && !seen[p.category]) {
        seen[p.category] = true;
        cats.push(p.category);
      }
    });
    cats.sort();

    var allBtn = document.createElement('button');
    allBtn.className = 'filter active';
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', function() {
      currentFilter = 'All';
      applyFilters();
    });
    filtersContainer.appendChild(allBtn);

    cats.forEach(function(cat) {
      var b = document.createElement('button');
      b.className = 'filter';
      b.textContent = cat;
      b.addEventListener('click', function() {
        currentFilter = cat;
        applyFilters();
      });
      filtersContainer.appendChild(b);
    });
  }

  function applyFilters() {
    var query = '';
    if (searchInput) query = searchInput.value.toLowerCase();

    var filtered = products;

    if (currentFilter !== 'All') {
      filtered = filtered.filter(function(p) { return p.category === currentFilter; });
    }

    if (query) {
      filtered = filtered.filter(function(p) {
        return p.title.toLowerCase().indexOf(query) !== -1 ||
          (p.category && p.category.toLowerCase().indexOf(query) !== -1);
      });
    }

    renderProducts(filtered);
    setActiveFilter();
  }

  function setActiveFilter() {
    var btns = filtersContainer ? filtersContainer.querySelectorAll('.filter') : [];
    btns.forEach(function(b) {
      b.classList.remove('active');
      if ((currentFilter === 'All' && b.textContent === 'All') ||
          (currentFilter !== 'All' && b.textContent === currentFilter)) {
        b.classList.add('active');
      }
    });
  }

  /* ---- cart ---- */
  function addToCart(productId) {
    var product = products.find(function(p) { return String(p.id) === String(productId); });
    if (!product) return;

    var existing = cart.find(function(i) { return String(i.id) === String(productId); });
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id: product.id, title: product.title, price: product.price, quantity: 1 });
    }
    saveCart();
    renderCart();
    updateCartCount();
  }

  function removeFromCart(productId) {
    cart = cart.filter(function(i) { return String(i.id) !== String(productId); });
    saveCart();
    renderCart();
    updateCartCount();
  }

  function updateQuantity(productId, delta) {
    var item = cart.find(function(i) { return String(i.id) === String(productId); });
    if (!item) return;
    item.quantity += delta;
    if (item.quantity > 0) {
      saveCart();
    } else {
      removeFromCart(productId);
      return;
    }
    renderCart();
    updateCartCount();
  }

  function renderCart() {
    if (!cartItems) return;
    cartItems.innerHTML = '';

    if (cart.length === 0) {
      var p = document.createElement('p');
      p.className = 'empty';
      p.textContent = 'Your cart is empty.';
      cartItems.appendChild(p);
      if (cartTotal) cartTotal.textContent = '\u20A60';
      return;
    }

    var total = 0;

    cart.forEach(function(item) {
      var sub = item.price * item.quantity;
      total += sub;

      var row = document.createElement('div');
      row.className = 'cart-line';

      /* product info */
      var info = document.createElement('div');
      info.className = 'product-info';
      var titleSpan = document.createElement('span');
      titleSpan.className = 'name';
      titleSpan.textContent = item.title;
      info.appendChild(titleSpan);
      var priceSpan = document.createElement('span');
      priceSpan.className = 'price-line';
      priceSpan.textContent = '\u20A6' + item.price + ' x ' + item.quantity + ' = \u20A6' + sub;
      info.appendChild(priceSpan);
      row.appendChild(info);

      /* qty controls */
      var qtyWrap = document.createElement('div');
      qtyWrap.className = 'qty';

      var dec = document.createElement('button');
      dec.className = 'qty-btn decrease';
      dec.dataset.id = item.id;
      dec.textContent = '-';

      var qty = document.createElement('span');
      qty.className = 'quantity';
      qty.textContent = String(item.quantity);

      var inc = document.createElement('button');
      inc.className = 'qty-btn increase';
      inc.dataset.id = item.id;
      inc.textContent = '+';

      qtyWrap.appendChild(dec);
      qtyWrap.appendChild(qty);
      qtyWrap.appendChild(inc);
      row.appendChild(qtyWrap);

      /* remove */
      var rem = document.createElement('button');
      rem.className = 'remove-btn';
      rem.dataset.id = item.id;
      rem.textContent = 'Remove';
      row.appendChild(rem);

      cartItems.appendChild(row);
    });

    if (cartTotal) cartTotal.textContent = '\u20A6' + total;
  }

  /* ---- cart panel ---- */
  function openCart() {
    if (cartPanel) cartPanel.classList.add('show');
    if (overlay) overlay.classList.add('show');
  }

  function closeCart() {
    if (cartPanel) cartPanel.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
  }

  /* ---- checkout ---- */
  function submitCheckout(e) {
    e.preventDefault();

    if (cart.length === 0) {
      alert('Your cart is empty. Add at least one item before checking out.');
      return;
    }

    var name = '';
    var phone = '';
    var address = '';
    var payment = '';

    if (checkoutForm) {
      var fd = new FormData(checkoutForm);
      name = fd.get('name') || '';
      phone = fd.get('phone') || '';
      address = fd.get('address') || '';
      payment = fd.get('payment') || '';
    }

    /* build order summary */
    var lines = [];
    var subtotal = 0;
    cart.forEach(function(item, idx) {
      var itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      lines.push((idx + 1) + '. ' + item.title + ' \u2013 \u20A6' + item.price + ' x ' + item.quantity + ' = \u20A6' + itemTotal);
    });

    var msg = 'New Order\n\nName: ' + name + '\nPhone: ' + phone + '\nAddress: ' + address + '\nPayment: ' + payment + '\n\n--- Order Items ---\n' + lines.join('\n') + '\n\n--- Subtotal: \u20A6' + subtotal + ' ---\n\nThank you!';

    var encoded = encodeURIComponent(msg);
    var waUrl = 'https://wa.me/2349126634340?text=' + encoded;

    var waWindow = window.open(waUrl, '_blank');

    /* only clear cart after confirming WhatsApp window opened */
    if (waWindow && !waWindow.closed) {
      cart = [];
      saveCart();
      renderCart();
      updateCartCount();
      closeCart();
      if (checkoutForm) checkoutForm.reset();
    } else {
      alert('Please allow the WhatsApp window to open before the cart is cleared.');
    }
  }

  /* ---- event delegation on product grid ---- */
  function handleGridClick(e) {
    var target = e.target;
    var addBtn = target.closest('.add');
    if (addBtn) {
      addToCart(addBtn.dataset.id);
      return;
    }

    var cartLine = target.closest('.cart-line');
    if (cartLine) {
      if (target.classList.contains('remove-btn')) {
        removeFromCart(target.dataset.id);
      } else if (target.classList.contains('decrease')) {
        updateQuantity(target.dataset.id, -1);
      } else if (target.classList.contains('increase')) {
        updateQuantity(target.dataset.id, 1);
      }
    }
  }

  /* ---- init ---- */
  fetch('products.json')
    .then(function(r) {
      if (!r.ok) throw new Error('Failed to fetch products');
      return r.json();
    })
    .then(function(data) {
      products = data;
      buildFilters();
      applyFilters();
      renderCart();
      updateCartCount();
    })
    .catch(function(err) {
      console.error('Error loading products:', err);
      if (productGrid) {
        productGrid.innerHTML = '';
        var errP = document.createElement('p');
        errP.textContent = 'Failed to load products. Please try again later.';
        productGrid.appendChild(errP);
      }
      if (resultCount) resultCount.textContent = 'Failed to load products.';
    });

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (productGrid) {
    productGrid.addEventListener('click', handleGridClick);
  }

  if (openCartBtn) openCartBtn.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (overlay) overlay.addEventListener('click', closeCart);
  if (checkoutForm) checkoutForm.addEventListener('submit', submitCheckout);
});
