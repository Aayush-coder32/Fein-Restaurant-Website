(() => {
    const CART_KEY = "fein-cart";
    const FLASH_KEY = "fein-flash";
    const MENU_PAGE = "menu.html";
    const BOOKING_PAGE = "booky.html";
    const PAYMENT_PAGE = "payment.html";
    let cartIcon = null;
    let toastTimer = null;

    const normalizeText = (value) => value.replace(/\s+/g, " ").trim();

    const currentPath = () => window.location.pathname.toLowerCase();

    const isCurrentPage = (pageName) =>
        currentPath().endsWith(`/${pageName}`) ||
        currentPath().endsWith(`\\${pageName}`) ||
        currentPath().endsWith(pageName);

    const readCart = () => {
        try {
vgvvvconst parsed = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]");
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const writeCart = (cart) => {
        try {
            window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
        } catch {
            // Ignore storage errors and keep the UI usable.
        }
    };

    const queueToast = (message) => {
        try {
            window.sessionStorage.setItem(FLASH_KEY, message);
        } catch {
            // Ignore storage errors and keep navigation working.
        }
    };

    const flushQueuedToast = () => {
        try {
            const message = window.sessionStorage.getItem(FLASH_KEY);
            if (!message) {
                return;
            }

            window.sessionStorage.removeItem(FLASH_KEY);
            showToast(message);
        } catch {
            // Ignore storage errors and keep the page usable.
        }
    };

    const ensureToast = () => {
        let toast = document.querySelector(".site-toast");

        if (!toast) {
            toast = document.createElement("div");
            toast.className = "site-toast";
            toast.setAttribute("aria-live", "polite");
            toast.setAttribute("aria-atomic", "true");
            document.body.appendChild(toast);
        }

        return toast;
    };

    const showToast = (message) => {
        const toast = ensureToast();
        toast.textContent = message;
        toast.classList.add("is-visible");

        if (toastTimer) {
            window.clearTimeout(toastTimer);
        }

        toastTimer = window.setTimeout(() => {
            toast.classList.remove("is-visible");
        }, 2400);
    };

    const totalCartItems = (cart = readCart()) =>
        cart.reduce((count, item) => count + (Number(item.quantity) || 0), 0);

    const updateCartBadge = () => {
        if (!cartIcon || !cartIcon.parentElement) {
            return;
        }

        let badge = document.querySelector(".cart-badge");

        if (!badge) {
            badge = document.createElement("span");
            badge.className = "cart-badge";
            cartIcon.insertAdjacentElement("afterend", badge);
        }

        const count = totalCartItems();
        badge.textContent = count > 99 ? "99+" : String(count);
        badge.hidden = count === 0;
        cartIcon.setAttribute(
            "aria-label",
            count ? `View cart with ${count} item${count === 1 ? "" : "s"}` : "View cart"
        );
    };

    const addCartItem = (item) => {
        if (!item || !item.name) {
            return null;
        }

        const cart = readCart();
        const existing = cart.find((entry) => entry.name === item.name);

        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                name: item.name,
                price: item.price || "",
                quantity: 1
            });
        }

        writeCart(cart);
        updateCartBadge();
        showToast(`${item.name} added to cart.`);
        return item;
    };

    const goTo = (path, message) => {
        if (message) {
            queueToast(message);
        }

        window.location.href = path;
    };

    const openPage = (pageName, message) => {
        if (isCurrentPage(pageName)) {
            if (message) {
                showToast(message);
            }
            return;
        }

        goTo(pageName, message);
    };

    const openMenu = (message) => {
        if (isCurrentPage(MENU_PAGE)) {
            document.querySelector(".menu-explorer, .menuTable")?.scrollIntoView({ behavior: "smooth", block: "start" });
            if (message) {
                showToast(message);
            }
            return;
        }

        goTo(MENU_PAGE, message);
    };

    const openPayment = (message) => {
        openPage(PAYMENT_PAGE, message);
    };

    const addAndCheckout = (item, message) => {
        const addedItem = addCartItem(item);
        if (!addedItem) {
            return;
        }

        openPayment(message || `${addedItem.name} ready for payment.`);
    };

    const getMenuRowItem = (button) => {
        const row = button.closest("tr");
        const cells = row?.querySelectorAll("td");

        if (!cells || cells.length < 4) {
            return null;
        }

        return {
            name: normalizeText(cells[1].textContent || ""),
            price: `${normalizeText(cells[3].textContent || "")} RWF`
        };
    };

    const getExplorerItem = (button) => {
        const card = button.closest("[data-menu-card]");

        if (!card) {
            return null;
        }

        return {
            name: normalizeText(card.getAttribute("data-item-name") || button.getAttribute("data-name") || ""),
            price: normalizeText(card.getAttribute("data-item-price") || button.getAttribute("data-price") || "")
        };
    };

    const getComboItem = (button) => {
        const section = button.closest(".today");
        const heading = section?.querySelector("h3");
        const priceText = button.closest(".price")?.querySelector("p span");

        return {
            name: normalizeText(heading?.textContent || "Today's combo"),
            price: normalizeText(priceText?.textContent || "9 999 RWF")
        };
    };

    const getHomeItem = (button) => {
        const itemCard = button.closest(".item");
        const name = itemCard?.querySelector("h3");
        const price = itemCard?.querySelector(".price");

        if (!name) {
            return null;
        }

        return {
            name: normalizeText(name.textContent || ""),
            price: normalizeText(price?.textContent || "")
        };
    };

    const getOfferItem = (button) => {
        const section = button.closest(".underStarter, .underStarter2");
        const dealName = normalizeText(section?.querySelector("p")?.textContent || "Fein Special Deal");

        if (dealName.toLowerCase().includes("pizza")) {
            return {
                name: "Pizza Days Feast Box",
                price: "5 900 RWF"
            };
        }

        return {
            name: "Tasty Thursday Burger Box",
            price: "6 400 RWF"
        };
    };

    const handleCartClick = () => {
        const count = totalCartItems();

        if (!count) {
            openPayment("Your cart is empty right now. Start with a quick pick or add items from the menu.");
            return;
        }

        openPayment(`${count} item${count === 1 ? "" : "s"} ready for checkout.`);
    };

    const bindHeaderIcons = () => {
        const icons = document.querySelectorAll(".svgs svg, .svgs i");
        const actions = [
            {
                label: "Browse menu",
                handler: () => openMenu("Browse the full menu and start your order.")
            },
            {
                label: "Book a table",
                handler: () => openPage(BOOKING_PAGE, "Table booking page opened.")
            },
            {
                label: "View cart",
                handler: handleCartClick
            }
        ];

        icons.forEach((icon, index) => {
            const config = actions[index];

            if (!config) {
                return;
            }

            icon.setAttribute("role", "button");
            icon.setAttribute("tabindex", "0");
            icon.setAttribute("aria-label", config.label);

            icon.addEventListener("click", config.handler);
            icon.addEventListener("keydown", (event) => {
                if (event.key !== "Enter" && event.key !== " ") {
                    return;
                }

                event.preventDefault();
                config.handler();
            });

            if (index === 2) {
                cartIcon = icon;
            }
        });
    };

    const bindOrderControls = () => {
        document.addEventListener("click", (event) => {
            if (!(event.target instanceof Element)) {
                return;
            }

            const target = event.target.closest(".orderOnline, .item button, [data-menu-add]");

            if (!(target instanceof HTMLElement)) {
                return;
            }

            const label = normalizeText(target.textContent || "").toLowerCase();

            if (target.matches("a")) {
                event.preventDefault();
            }

            if (target.closest("[data-menu-card]")) {
                event.preventDefault();
                addCartItem(getExplorerItem(target));
                return;
            }

            if (target.closest(".menuTable")) {
                event.preventDefault();
                addCartItem(getMenuRowItem(target));
                return;
            }

            if (target.closest(".comboCont")) {
                event.preventDefault();
                addCartItem(getComboItem(target));
                return;
            }

            if (target.closest(".item")) {
                event.preventDefault();
                const item = getHomeItem(target);
                addAndCheckout(item, `${item?.name || "Your order"} is ready for payment.`);
                return;
            }

            if (target.closest(".underStarter, .underStarter2")) {
                event.preventDefault();
                const item = getOfferItem(target);
                addAndCheckout(item, `${item.name} moved to checkout.`);
                return;
            }

            if (target.closest(".button") || label.includes("order online") || label.includes("place an order")) {
                event.preventDefault();
                openPayment("Checkout opened. Review your basket and payment details.");
                return;
            }

            event.preventDefault();
            openPayment("Review your order and complete payment.");
        });
    };

    document.addEventListener("DOMContentLoaded", () => {
        bindHeaderIcons();
        bindOrderControls();
        updateCartBadge();
        flushQueuedToast();
    });
})();
