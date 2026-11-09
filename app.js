= 0) {
            removeFromCart(productId);
        } else {
            renderCart();
        }
    }
}

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    if (!cartItems) return;

    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            ${item.title}
            ₦${item.price} x ${item.quantity} = ₦${subtotal}
        `;
        cartItems.appendChild(cartItem);
    });

    if (cartTotal) {
        cartTotal.textContent = '₦' + total;
    }
}

// Cart panel toggle
const openCart = document.getElementById('openCart');
const closeCart = document.getElementById('closeCart');
const cartPanel = document.getElementById('cartPanel');
const overlay = document.getElementById('overlay');

if (openCart) {
    openCart.addEventListener('click', () => {
        if (cartPanel && overlay) {
            renderCart();
            cartPanel.classList.add('open');
            overlay.classList.add('open');
        }
    });
}

if (closeCart) {
    closeCart.addEventListener('click', () => {
        if (cartPanel) cartPanel.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
    });
}

if (overlay) {
    overlay.addEventListener('click', () => {
        if (cartPanel) cartPanel.classList.remove('open');
        overlay.classList.remove('open');
    });
}

// Checkout form
const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('customerName')?.value || '';
        const phone = document.getElementById('customerPhone')?.value || '';
        const address = document.getElementById('deliveryAddress')?.value || '';
        const payment = document.getElementById('paymentPreference')?.value || '';

        if (!name || !phone || !address) {
            alert('Please fill in all required fields.');
            return;
        }

        if (cart.length === 0) {
            alert('Your cart is empty.');
            return;
        }

        let total = 0;
        let itemsList = '';
        cart.forEach(item => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            itemsList += `- ${item.title} x${item.quantity}: ₦${subtotal} `;
        });

        const message = encodeURIComponent(
            `*New Order* ` +
            `*Customer Name:* ${name} ` +
            `*Phone:* ${phone} ` +
            `*Delivery Address:* ${address} ` +
            `*Payment Preference:* ${payment} ` +
            `*Order Items:* ${itemsList} ` +
            `*Total:* ₦${total}`
        );

        const whatsappUrl = `https://wa.me/2349126634340?text=${message}`;
        window.open(whatsappUrl, '_blank');

        // Clear cart after checkout
        cart = [];
        updateCartCount();
        if (cartPanel) cartPanel.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        checkoutForm.reset();
    });
}

// Update year in footer
const yearEl = document.getElementById('year');
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}
