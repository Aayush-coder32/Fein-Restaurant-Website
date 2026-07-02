(() => {
    const CART_KEY = "fein-cart";
    const DELIVERY_OPTIONS = {
        standard: {
            fee: 1200,
            eta: "24 - 32 mins"
        },
        priority: {
            fee: 2200,
            eta: "16 - 22 mins"
        },
        scheduled: {
            fee: 1500,
            eta: "At your selected time"
        }
    };
    const SERVICE_FEE = 650;
    const TAX_RATE = 0.08;
    const PROMO_CODES = {
        FEIN10: {
            type: "percent",
            value: 0.1,
            label: "10% off food subtotal"
        },
        CRUNCH500: {
            type: "flat",
            value: 500,
            minSubtotal: 3000,
            label: "500 RWF off orders from 3,000 RWF"
        },
        FREESHIP: {
            type: "shipping",
            value: 1,
            label: "Free delivery applied"
        }
    };

    const formatCurrency = (value) =>
        `${new Intl.NumberFormat("en-US").format(Math.max(0, Math.round(value)))} RWF`;

    const parsePrice = (value) => {
        const numeric = Number(String(value || "").replace(/[^\d]/g, ""));
        return Number.isFinite(numeric) ? numeric : 0;
    };

    const readCart = () => {
        try {
            const parsed = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]");
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const writeCart = (cart) => {
        try {
            window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
        } catch {
            // Keep checkout functional even if storage is unavailable.
        }
    };

    const state = {
        cart: readCart(),
        promo: null,
        paymentMethod: "card"
    };

    const elements = {};

    const cacheElements = () => {
        elements.form = document.getElementById("checkout-form");
        elements.orderItems = document.getElementById("order-items");
        elements.emptyState = document.getElementById("empty-state");
        elements.summaryCount = document.getElementById("summary-count");
        elements.summaryAlert = document.getElementById("summary-alert");
        elements.subtotalValue = document.getElementById("subtotal-value");
        elements.deliveryValue = document.getElementById("delivery-value");
        elements.serviceValue = document.getElementById("service-value");
        elements.taxValue = document.getElementById("tax-value");
        elements.discountValue = document.getElementById("discount-value");
        elements.totalValue = document.getElementById("total-value");
        elements.etaLabel = document.getElementById("eta-label");
        elements.payNow = document.getElementById("pay-now");
        elements.promoCode = document.getElementById("promo-code");
        elements.applyPromo = document.getElementById("apply-promo");
        elements.deliveryRadios = document.querySelectorAll('input[name="delivery_speed"]');
        elements.deliveryOptions = document.querySelectorAll(".delivery-option");
        elements.scheduleSlot = document.getElementById("schedule-slot");
        elements.scheduledDate = document.getElementById("scheduled-date");
        elements.scheduledTime = document.getElementById("scheduled-time");
        elements.methodTabs = document.querySelectorAll("[data-method-tab]");
        elements.methodPanels = document.querySelectorAll("[data-method-panel]");
        elements.quickAdds = document.querySelectorAll("[data-quick-add]");
        elements.cardNumber = document.getElementById("card-number");
        elements.cardName = document.getElementById("card-name");
        elements.cardExpiry = document.getElementById("card-expiry");
        elements.cardCvv = document.getElementById("card-cvv");
        elements.cardPreviewNumber = document.getElementById("card-preview-number");
        elements.cardPreviewName = document.getElementById("card-preview-name");
        elements.cardPreviewExpiry = document.getElementById("card-preview-expiry");
        elements.successModal = document.getElementById("success-modal");
        elements.successOrderId = document.getElementById("success-order-id");
        elements.successCopy = document.getElementById("success-copy");
        elements.successTotal = document.getElementById("success-total");
        elements.successEta = document.getElementById("success-eta");
        elements.closeSuccess = document.getElementById("close-success");
    };

    const activeDelivery = () => {
        const selected = document.querySelector('input[name="delivery_speed"]:checked')?.value || "standard";
        return DELIVERY_OPTIONS[selected];
    };

    const getTotals = () => {
        const subtotal = state.cart.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);
        const delivery = subtotal ? activeDelivery().fee : 0;
        const serviceFee = subtotal ? SERVICE_FEE : 0;
        const tax = subtotal ? Math.round(subtotal * TAX_RATE) : 0;

        let discount = 0;

        if (state.promo) {
            if (state.promo.type === "percent") {
                discount = Math.round(subtotal * state.promo.value);
            } else if (state.promo.type === "flat") {
                discount = subtotal >= (state.promo.minSubtotal || 0) ? state.promo.value : 0;
            } else if (state.promo.type === "shipping") {
                discount = delivery;
            }
        }

        const total = Math.max(0, subtotal + delivery + serviceFee + tax - discount);

        return {
            subtotal,
            delivery,
            serviceFee,
            tax,
            discount,
            total
        };
    };

    const showSummaryAlert = (message, tone = "info") => {
        elements.summaryAlert.hidden = false;
        elements.summaryAlert.className = `summary-alert ${tone}`;
        elements.summaryAlert.textContent = message;
    };

    const clearSummaryAlert = () => {
        elements.summaryAlert.hidden = true;
        elements.summaryAlert.textContent = "";
        elements.summaryAlert.className = "summary-alert";
    };

    const syncCart = (nextCart) => {
        state.cart = nextCart.filter((item) => item.quantity > 0);
        writeCart(state.cart);
        renderOrderSummary();
    };

    const addQuickPick = (button) => {
        const item = {
            name: button.dataset.name || "Fein Quick Pick",
            price: button.dataset.price || "0 RWF",
            quantity: 1
        };
        const existing = state.cart.find((entry) => entry.name === item.name);

        if (existing) {
            existing.quantity += 1;
        } else {
            state.cart.push(item);
        }

        writeCart(state.cart);
        renderOrderSummary();
        showSummaryAlert(`${item.name} added to your checkout basket.`, "success");
    };

    const renderOrderSummary = () => {
        const totals = getTotals();
        const itemCount = state.cart.reduce((count, item) => count + item.quantity, 0);

        elements.summaryCount.textContent = `${itemCount} item${itemCount === 1 ? "" : "s"}`;
        elements.orderItems.innerHTML = "";

        if (!state.cart.length) {
            elements.emptyState.hidden = false;
        } else {
            elements.emptyState.hidden = true;
            state.cart.forEach((item) => {
                const lineTotal = parsePrice(item.price) * item.quantity;
                const li = document.createElement("li");
                li.className = "order-item";
                li.dataset.name = item.name;
                li.innerHTML = `
                    <div class="item-main">
                        <div>
                            <h4>${item.name}</h4>
                            <p>${item.price} each</p>
                        </div>
                        <strong>${formatCurrency(lineTotal)}</strong>
                    </div>
                    <div class="qty-row">
                        <div class="qty-controls">
                            <button type="button" class="qty-btn" data-action="decrease">-</button>
                            <span>${item.quantity}</span>
                            <button type="button" class="qty-btn" data-action="increase">+</button>
                        </div>
                        <button type="button" class="remove-btn" data-action="remove">Remove</button>
                    </div>
                `;
                elements.orderItems.appendChild(li);
            });
        }

        elements.subtotalValue.textContent = formatCurrency(totals.subtotal);
        elements.deliveryValue.textContent = formatCurrency(totals.delivery);
        elements.serviceValue.textContent = formatCurrency(totals.serviceFee);
        elements.taxValue.textContent = formatCurrency(totals.tax);
        elements.discountValue.textContent = totals.discount ? `- ${formatCurrency(totals.discount)}` : "0 RWF";
        elements.totalValue.textContent = formatCurrency(totals.total);
        elements.etaLabel.textContent = activeDelivery().eta;

        const labelMap = {
            card: "Confirm payment",
            mobile: "Send payment",
            cash: "Reserve cash order"
        };
        elements.payNow.textContent = `${labelMap[state.paymentMethod]} - ${formatCurrency(totals.total)}`;
    };

    const changeItemQuantity = (itemName, delta) => {
        const nextCart = state.cart
            .map((item) =>
                item.name === itemName
                    ? {
                        ...item,
                        quantity: item.quantity + delta
                    }
                    : item
            )
            .filter((item) => item.quantity > 0);

        syncCart(nextCart);
    };

    const removeItem = (itemName) => {
        syncCart(state.cart.filter((item) => item.name !== itemName));
        showSummaryAlert(`${itemName} removed from the basket.`, "info");
    };

    const updateDeliverySelection = () => {
        elements.deliveryOptions.forEach((option) => {
            const input = option.querySelector("input");
            option.classList.toggle("active", input?.checked);
        });

        const scheduled = document.querySelector('input[name="delivery_speed"]:checked')?.value === "scheduled";
        elements.scheduleSlot.hidden = !scheduled;
        elements.scheduledDate.disabled = !scheduled;
        elements.scheduledTime.disabled = !scheduled;
        elements.scheduledDate.required = scheduled;
        elements.scheduledTime.required = scheduled;

        renderOrderSummary();
    };

    const setPaymentMethod = (method) => {
        state.paymentMethod = method;

        elements.methodTabs.forEach((tab) => {
            tab.classList.toggle("active", tab.dataset.methodTab === method);
        });

        elements.methodPanels.forEach((panel) => {
            const isActive = panel.dataset.methodPanel === method;
            panel.classList.toggle("active", isActive);
            panel.hidden = !isActive;
            panel.querySelectorAll("[data-payment-input]").forEach((input) => {
                input.disabled = !isActive;
                input.required = isActive && input.dataset.required === "true";
            });
        });

        renderOrderSummary();
    };

    const formatCardNumber = (value) =>
        value.replace(/[^\d]/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ").trim();

    const formatExpiry = (value) => {
        const digits = value.replace(/[^\d]/g, "").slice(0, 4);
        if (digits.length < 3) {
            return digits;
        }

        return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    };

    const updateCardPreview = () => {
        elements.cardNumber.value = formatCardNumber(elements.cardNumber.value);
        elements.cardExpiry.value = formatExpiry(elements.cardExpiry.value);
        elements.cardCvv.value = elements.cardCvv.value.replace(/[^\d]/g, "").slice(0, 4);

        elements.cardPreviewNumber.textContent = elements.cardNumber.value || "•••• •••• •••• 2048";
        elements.cardPreviewName.textContent = elements.cardName.value.trim().toUpperCase() || "YOUR NAME";
        elements.cardPreviewExpiry.textContent = elements.cardExpiry.value || "MM/YY";
    };

    const validatePaymentMethod = () => {
        if (state.paymentMethod === "card") {
            const digits = elements.cardNumber.value.replace(/[^\d]/g, "");
            if (digits.length !== 16) {
                showSummaryAlert("Enter a 16-digit card number to continue.", "error");
                return false;
            }

            if (elements.cardExpiry.value.length !== 5) {
                showSummaryAlert("Enter a valid expiry date in MM/YY format.", "error");
                return false;
            }

            if (elements.cardCvv.value.length < 3) {
                showSummaryAlert("Enter a valid CVV before confirming payment.", "error");
                return false;
            }
        }

        if (state.paymentMethod === "mobile") {
            const provider = document.getElementById("wallet-provider").value;
            const walletNumber = document.getElementById("wallet-number").value.trim();

            if (!provider || !walletNumber) {
                showSummaryAlert("Select a provider and enter the wallet number first.", "error");
                return false;
            }
        }

        if (state.paymentMethod === "cash" && !document.getElementById("cash-ready").checked) {
            showSummaryAlert("Please confirm that cash will be ready on delivery.", "error");
            return false;
        }

        return true;
    };

    const applyPromo = () => {
        const code = elements.promoCode.value.trim().toUpperCase();
        const promo = PROMO_CODES[code];

        if (!code) {
            showSummaryAlert("Enter a promo code before applying it.", "info");
            return;
        }

        if (!promo) {
            state.promo = null;
            renderOrderSummary();
            showSummaryAlert("That code is not available right now.", "error");
            return;
        }

        const subtotal = getTotals().subtotal;

        if (promo.minSubtotal && subtotal < promo.minSubtotal) {
            state.promo = null;
            renderOrderSummary();
            showSummaryAlert(`This code needs at least ${formatCurrency(promo.minSubtotal)} in food items.`, "error");
            return;
        }

        state.promo = promo;
        renderOrderSummary();
        showSummaryAlert(`${code} applied: ${promo.label}.`, "success");
    };

    const openSuccessModal = () => {
        const totals = getTotals();
        const methodLabel = {
            card: "card payment",
            mobile: "mobile payment",
            cash: "cash on delivery"
        }[state.paymentMethod];
        const orderId = `#FEIN${String(Date.now()).slice(-6)}`;

        elements.successOrderId.textContent = orderId;
        elements.successTotal.textContent = formatCurrency(totals.total);
        elements.successEta.textContent = activeDelivery().eta;
        elements.successCopy.textContent = `Your ${methodLabel} has been captured in this demo flow and the kitchen is now building the order.`;
        elements.successModal.hidden = false;
    };

    const closeSuccessModal = () => {
        elements.successModal.hidden = true;
    };

    const resetCheckoutState = () => {
        state.cart = [];
        state.promo = null;
        writeCart([]);
        elements.form.reset();
        document.querySelector('input[name="delivery_speed"][value="standard"]').checked = true;
        setPaymentMethod("card");
        updateDeliverySelection();
        updateCardPreview();
        clearSummaryAlert();
        renderOrderSummary();
    };

    const bindEvents = () => {
        elements.orderItems.addEventListener("click", (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) {
                return;
            }

            const item = target.closest(".order-item");
            const itemName = item?.dataset.name;

            if (!itemName) {
                return;
            }

            if (target.dataset.action === "increase") {
                changeItemQuantity(itemName, 1);
            }

            if (target.dataset.action === "decrease") {
                changeItemQuantity(itemName, -1);
            }

            if (target.dataset.action === "remove") {
                removeItem(itemName);
            }
        });

        elements.deliveryRadios.forEach((radio) => {
            radio.addEventListener("change", updateDeliverySelection);
        });

        elements.methodTabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                setPaymentMethod(tab.dataset.methodTab || "card");
            });
        });

        elements.quickAdds.forEach((button) => {
            button.addEventListener("click", () => addQuickPick(button));
        });

        elements.cardNumber.addEventListener("input", updateCardPreview);
        elements.cardName.addEventListener("input", updateCardPreview);
        elements.cardExpiry.addEventListener("input", updateCardPreview);
        elements.cardCvv.addEventListener("input", updateCardPreview);

        elements.applyPromo.addEventListener("click", applyPromo);

        elements.form.addEventListener("submit", (event) => {
            event.preventDefault();
            clearSummaryAlert();

            if (!state.cart.length) {
                showSummaryAlert("Add at least one meal before confirming payment.", "error");
                return;
            }

            if (!elements.form.reportValidity()) {
                showSummaryAlert("Please complete the required delivery details first.", "error");
                return;
            }

            if (!validatePaymentMethod()) {
                return;
            }

            openSuccessModal();
            resetCheckoutState();
        });

        elements.closeSuccess.addEventListener("click", closeSuccessModal);
        elements.successModal.addEventListener("click", (event) => {
            if (event.target === elements.successModal) {
                closeSuccessModal();
            }
        });
    };

    document.addEventListener("DOMContentLoaded", () => {
        cacheElements();
        setPaymentMethod("card");
        updateDeliverySelection();
        updateCardPreview();
        renderOrderSummary();
        bindEvents();
    });
})();
