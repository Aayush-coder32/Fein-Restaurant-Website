(() => {
    const explorer = document.querySelector(".menu-explorer");

    if (!explorer) {
        return;
    }

    const CATEGORY_BY_ICON = {
        "fa-drumstick-bite": "Chicken",
        "fa-cookie-bite": "Snacks",
        "fa-pizza-slice": "Pizza & Wraps",
        "fa-martini-glass": "Drinks"
    };
    const CATEGORY_ORDER = ["All", "Chicken", "Snacks", "Pizza & Wraps", "Drinks"];
    const BUDGET_LABELS = {
        all: "Any budget",
        "under-2000": "Under 2,000 RWF",
        "2000-3500": "2,000 - 3,500 RWF",
        "3500-plus": "3,500+ RWF"
    };
    const BADGE_PRIORITY = {
        "Crowd pick": 4,
        "Chef special": 3,
        "Best value": 2,
        "Cool sip": 1,
        "Quick bite": 0
    };

    const state = {
        search: "",
        category: "All",
        budget: "all",
        sort: "featured"
    };

    const elements = {
        search: document.getElementById("menu-search"),
        budget: document.getElementById("menu-budget"),
        sort: document.getElementById("menu-sort"),
        chips: document.getElementById("menu-category-pills"),
        results: document.getElementById("menu-results-copy"),
        clear: document.getElementById("menu-clear-filters"),
        grid: document.getElementById("menu-grid"),
        empty: document.getElementById("menu-empty-state"),
        total: document.getElementById("menu-total-items"),
        average: document.getElementById("menu-average-price"),
        budgetPick: document.getElementById("menu-budget-pick"),
        spotlight: document.getElementById("menu-active-spotlight")
    };

    const normalizeText = (value) => value.replace(/\s+/g, " ").trim();
    const parsePrice = (value) => Number(String(value || "").replace(/[^\d]/g, "")) || 0;
    const formatCurrency = (value) => `${new Intl.NumberFormat("en-US").format(value)} RWF`;
    const slugify = (value) => normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const escapeHtml = (value) =>
        String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const highlightText = (value, query) => {
        const safeValue = escapeHtml(value);

        if (!query) {
            return safeValue;
        }

        return safeValue.replace(new RegExp(`(${escapeRegExp(query)})`, "ig"), "<mark>$1</mark>");
    };

    const categoryFromCell = (cell) => {
        const icon = cell?.querySelector("i");

        if (!icon) {
            return "Menu";
        }

        const match = Array.from(icon.classList).find((className) => CATEGORY_BY_ICON[className]);
        return match ? CATEGORY_BY_ICON[match] : "Menu";
    };

    const getBadge = (item) => {
        if (["Grilled Chicken", "Margherita Pizza", "Milkshake (Chocolate/Vanilla/Strawberry)"].includes(item.name)) {
            return "Crowd pick";
        }

        if (item.name.includes("Pizza") || item.name.includes("Wrap")) {
            return "Chef special";
        }

        if (item.price <= 2000) {
            return "Best value";
        }

        if (item.category === "Drinks") {
            return "Cool sip";
        }

        return "Quick bite";
    };

    const getPriceTone = (price) => {
        if (price <= 2000) {
            return "Budget friendly";
        }

        if (price >= 4000) {
            return "Signature pick";
        }

        return "Mid-range favorite";
    };

    const collectItems = () => {
        const rows = Array.from(document.querySelectorAll(".menuTable tbody tr"));
        let activeCategory = "Menu";

        return rows
            .map((row, index) => {
                const cells = Array.from(row.querySelectorAll("td"));
                let offset = 0;

                if (cells[0]?.classList.contains("righter")) {
                    activeCategory = categoryFromCell(cells[0]);
                    offset = 1;
                }

                const name = normalizeText(cells[offset]?.textContent || "");
                const description = normalizeText(cells[offset + 1]?.textContent || "");
                const price = parsePrice(cells[offset + 2]?.textContent || "");

                if (!name || !description || !price) {
                    return null;
                }

                const item = {
                    id: `${slugify(name)}-${index + 1}`,
                    name,
                    description,
                    category: activeCategory,
                    price,
                    priceLabel: formatCurrency(price)
                };

                return {
                    ...item,
                    badge: getBadge(item),
                    tone: getPriceTone(price)
                };
            })
            .filter(Boolean);
    };

    const menuItems = collectItems();

    const getSortedItems = (items) => {
        const nextItems = [...items];

        if (state.sort === "price-low") {
            return nextItems.sort((left, right) => left.price - right.price || left.name.localeCompare(right.name));
        }

        if (state.sort === "price-high") {
            return nextItems.sort((left, right) => right.price - left.price || left.name.localeCompare(right.name));
        }

        if (state.sort === "name") {
            return nextItems.sort((left, right) => left.name.localeCompare(right.name));
        }

        return nextItems.sort(
            (left, right) =>
                (BADGE_PRIORITY[right.badge] || 0) - (BADGE_PRIORITY[left.badge] || 0) ||
                right.price - left.price ||
                left.name.localeCompare(right.name)
        );
    };

    const filterByBudget = (item) => {
        if (state.budget === "under-2000") {
            return item.price < 2000;
        }

        if (state.budget === "2000-3500") {
            return item.price >= 2000 && item.price <= 3500;
        }

        if (state.budget === "3500-plus") {
            return item.price > 3500;
        }

        return true;
    };

    const getVisibleItems = () => {
        const query = state.search.toLowerCase();

        return getSortedItems(
            menuItems.filter((item) => {
                const inCategory = state.category === "All" || item.category === state.category;
                const inBudget = filterByBudget(item);
                const matchesQuery =
                    !query ||
                    item.name.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query) ||
                    item.category.toLowerCase().includes(query);

                return inCategory && inBudget && matchesQuery;
            })
        );
    };

    const renderCategoryPills = () => {
        const categories = CATEGORY_ORDER.filter(
            (category) => category === "All" || menuItems.some((item) => item.category === category)
        );

        elements.chips.innerHTML = categories
            .map((category) => {
                const count =
                    category === "All"
                        ? menuItems.length
                        : menuItems.filter((item) => item.category === category).length;

                return `
                    <button
                        type="button"
                        class="menu-chip${state.category === category ? " active" : ""}"
                        data-category="${escapeHtml(category)}"
                    >
                        <span>${escapeHtml(category)}</span>
                        <strong>${count}</strong>
                    </button>
                `;
            })
            .join("");
    };

    const renderSignals = (items) => {
        const average = items.length
            ? Math.round(items.reduce((total, item) => total + item.price, 0) / items.length)
            : 0;
        const cheapest = items.length
            ? items.reduce((best, item) => (item.price < best.price ? item : best), items[0])
            : null;
        const spotlightParts = [];

        if (state.category !== "All") {
            spotlightParts.push(state.category);
        }

        if (state.budget !== "all") {
            spotlightParts.push(BUDGET_LABELS[state.budget]);
        }

        if (state.search) {
            spotlightParts.push(`"${state.search}"`);
        }

        elements.total.textContent = `${items.length} dishes`;
        elements.average.textContent = average ? formatCurrency(average) : "0 RWF";
        elements.budgetPick.textContent = cheapest ? cheapest.name : "No match";
        elements.spotlight.textContent = spotlightParts.length ? spotlightParts.join(" • ") : "Full menu view";
    };

    const renderResultsCopy = (items) => {
        const summary = [];

        if (state.category !== "All") {
            summary.push(state.category);
        }

        if (state.budget !== "all") {
            summary.push(BUDGET_LABELS[state.budget]);
        }

        if (state.search) {
            summary.push(`matching "${state.search}"`);
        }

        elements.results.textContent = summary.length
            ? `${items.length} dishes ${summary.join(" • ")}`
            : `${items.length} dishes available right now`;
        elements.clear.hidden = !summary.length;
    };

    const renderCards = (items) => {
        if (!items.length) {
            elements.grid.innerHTML = "";
            elements.empty.hidden = false;
            return;
        }

        elements.empty.hidden = true;
        elements.grid.innerHTML = items
            .map(
                (item) => `
                    <article
                        class="menu-card"
                        data-menu-card
                        data-item-name="${escapeHtml(item.name)}"
                        data-item-price="${escapeHtml(item.priceLabel)}"
                    >
                        <div class="menu-card-top">
                            <span class="menu-card-category">${escapeHtml(item.category)}</span>
                            <span class="menu-card-badge">${escapeHtml(item.badge)}</span>
                        </div>
                        <h3>${highlightText(item.name, state.search)}</h3>
                        <p>${highlightText(item.description, state.search)}</p>
                        <div class="menu-card-meta">
                            <div class="menu-price-stack">
                                <strong>${escapeHtml(item.priceLabel)}</strong>
                                <span>${escapeHtml(item.tone)}</span>
                            </div>
                            <button
                                type="button"
                                class="orderOnline"
                                data-menu-add="true"
                                data-name="${escapeHtml(item.name)}"
                                data-price="${escapeHtml(item.priceLabel)}"
                            >
                                Add to Cart
                            </button>
                        </div>
                    </article>
                `
            )
            .join("");
    };

    const render = () => {
        const items = getVisibleItems();
        renderCategoryPills();
        renderSignals(items);
        renderResultsCopy(items);
        renderCards(items);
    };

    const resetFilters = () => {
        state.search = "";
        state.category = "All";
        state.budget = "all";
        state.sort = "featured";
        elements.search.value = "";
        elements.budget.value = "all";
        elements.sort.value = "featured";
        render();
    };

    elements.search.addEventListener("input", () => {
        state.search = normalizeText(elements.search.value);
        render();
    });

    elements.budget.addEventListener("change", () => {
        state.budget = elements.budget.value;
        render();
    });

    elements.sort.addEventListener("change", () => {
        state.sort = elements.sort.value;
        render();
    });

    elements.chips.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) {
            return;
        }

        const chip = event.target.closest("[data-category]");

        if (!(chip instanceof HTMLElement)) {
            return;
        }

        state.category = chip.getAttribute("data-category") || "All";
        render();
    });

    elements.clear.addEventListener("click", resetFilters);

    render();
})();
