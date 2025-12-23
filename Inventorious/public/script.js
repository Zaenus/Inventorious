// Updated public/script.js

let currentLang = 'en';

const translations = {
    en: {
        inventory_management: 'Inventory Management',
        select_language: 'Select Language',
        lang_en: 'English',
        lang_pt: 'Portuguese',
        view_reports: 'View Reports',
        add_category: 'Add Category',
        category_name: 'Category Name',
        select_product: 'Select Product',
        all_categories: 'All Categories',
        search_product: 'Search Product',
        add_new_product: 'Add New Product',
        inventory_and_purchases: 'Inventory & Purchases',
        date: 'Date',
        product_name: 'Product Name',
        usage: 'Usage',
        select_product_to_view_records: 'Select a product to view records',
        select_category_to_view_products: 'Select a category to view products',
        no_products_found: 'No products found',
        no_records_found: 'No inventory or purchase records found.',
        category_added_success: 'Category added successfully',
        failed_add_category: 'Failed to add category',
        enter_product_name: 'Enter product name:',
        please_select_category_and_name: 'Please select a category and enter a product name',
        product_added_success: 'Product added successfully',
        failed_add_product: 'Failed to add product',
        please_enter_quantity: 'Please enter a valid quantity',
        inventory_added_success: 'Inventory added successfully',
        purchase_added_success: 'Purchase added successfully',
        failed_to_add_inventory: 'Failed to add inventory',
        failed_to_add_purchase: 'Failed to add purchase',
        products_list: 'Products List',
        category: 'Category',
        inventory: 'Inventory',
        purchase: 'Purchase',
        add: 'Add'
    },
    pt: {
        inventory_management: 'Gestão de Inventário',
        select_language: 'Selecionar Idioma',
        lang_en: 'Inglês',
        lang_pt: 'Português',
        view_reports: 'Ver Relatórios',
        add_category: 'Adicionar Categoria',
        category_name: 'Nome da Categoria',
        select_product: 'Selecionar Produto',
        all_categories: 'Todas as Categorias',
        search_product: 'Pesquisar Produto',
        add_new_product: 'Adicionar Novo Produto',
        inventory_and_purchases: 'Inventário e Compras',
        date: 'Data',
        product_name: 'Nome do Produto',
        usage: 'Uso',
        select_product_to_view_records: 'Selecione um produto para visualizar registros',
        select_category_to_view_products: 'Selecione uma categoria para visualizar produtos',
        no_products_found: 'Nenhum produto encontrado',
        no_records_found: 'Nenhum registro de inventário ou compra encontrado.',
        category_added_success: 'Categoria adicionada com sucesso',
        failed_add_category: 'Falha ao adicionar categoria',
        enter_product_name: 'Insira o nome do produto:',
        please_select_category_and_name: 'Por favor, selecione uma categoria e insira o nome do produto',
        product_added_success: 'Produto adicionado com sucesso',
        failed_add_product: 'Falha ao adicionar produto',
        please_enter_quantity: 'Por favor, insira uma quantidade válida',
        inventory_added_success: 'Inventário adicionado com sucesso',
        purchase_added_success: 'Compra adicionada com sucesso',
        failed_to_add_inventory: 'Falha ao adicionar inventário',
        failed_to_add_purchase: 'Falha ao adicionar compra',
        products_list: 'Lista de Produtos',
        category: 'Categoria',
        inventory: 'Inventário',
        purchase: 'Compra',
        add: 'Adicionar'
    }
};

// Function to capitalize string
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Function to set language
function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-translate]').forEach(el => {
        el.textContent = translations[lang][el.dataset.translate];
    });
    document.querySelectorAll('[data-placeholder]').forEach(el => {
        el.placeholder = translations[lang][el.dataset.placeholder];
    });
    document.title = translations[lang].inventory_management;
    loadCategories();
    // Reset table messages
    if (!document.getElementById('category-select').value) {
        document.getElementById('products-list').innerHTML = `<tr><td colspan="4" class="p-2 sm:p-3 text-center text-sm sm:text-base">${translations[lang].select_category_to_view_products}</td></tr>`;
    }
    document.getElementById('inventory-list').innerHTML = `<tr><td colspan="5" class="p-2 sm:p-3 text-center text-sm sm:text-base">${translations[lang].select_product_to_view_records}</td></tr>`;
}

// Fetch categories and populate dropdown
async function loadCategories() {
    const response = await fetch('/categories');
    const categories = await response.json();
    const select = document.getElementById('category-select');
    select.innerHTML = `<option value="">${translations[currentLang].all_categories}</option>`;
    categories.forEach(cat => {
        select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
}

// Fetch all categories to map IDs to names
async function getCategoryMap() {
    const response = await fetch('/categories');
    const categories = await response.json();
    const categoryMap = {};
    categories.forEach(cat => {
        categoryMap[cat.id] = cat.name;
    });
    return categoryMap;
}

// Fetch and display products based on category
async function loadProducts(categoryId) {
    const searchQuery = document.getElementById('product-search').value;
    let url = categoryId ? `/products/${categoryId}` : '/reports/products';
    if (searchQuery) {
        url = `/products/search/${encodeURIComponent(searchQuery)}`;
        if (categoryId) url += `?category_id=${categoryId}`;
    }
    const response = await fetch(url);
    const products = await response.json();
    const categoryMap = await getCategoryMap();
    const list = document.getElementById('products-list');
    // Preserve existing input values and prevent focus loss
    const existingInputs = {};
    list.querySelectorAll('input').forEach(input => {
        existingInputs[`${input.dataset.id}-${input.dataset.type}`] = input.value;
    });

    list.innerHTML = '';
    if (products.length === 0) {
        list.innerHTML = `<tr><td colspan="4" class="p-2 sm:p-3 text-center text-sm sm:text-base">${translations[currentLang].no_products_found}</td></tr>`;
        return;
    }
    products.forEach(prod => {
        const keyInventory = `${prod.id}-inventory`;
        const keyPurchase = `${prod.id}-purchase`;
        list.innerHTML += `
            <tr class="hover:bg-gray-50">
                <td class="p-2 sm:p-3 text-sm sm:text-base" data-product-id="${prod.id}">${prod.name}</td>
                <td class="p-2 sm:p-3 text-sm sm:text-base">${prod.category_name || categoryMap[prod.category_id] || 'Unknown'}</td>
                <td class="p-2 sm:p-3 text-sm sm:text-base">
                    <input type="number" min="0" step="1" class="inventory-input w-24 p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" data-id="${prod.id}" data-type="inventory" placeholder="${translations[currentLang].inventory}" value="${existingInputs[keyInventory] || ''}">
                    <button class="inventory-submit bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700 text-sm ml-2" data-id="${prod.id}" data-type="inventory">${translations[currentLang].add}</button>
                </td>
                <td class="p-2 sm:p-3 text-sm sm:text-base">
                    <input type="number" min="0" step="1" class="purchase-input w-24 p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" data-id="${prod.id}" data-type="purchase" placeholder="${translations[currentLang].purchase}" value="${existingInputs[keyPurchase] || ''}">
                    <button class="purchase-submit bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700 text-sm ml-2" data-id="${prod.id}" data-type="purchase">${translations[currentLang].add}</button>
                </td>
            </tr>
        `;
    });
    // Add event listeners for submit buttons
    document.querySelectorAll('.inventory-submit, .purchase-submit').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation(); // Prevent click from triggering table re-render
            const productId = btn.dataset.id;
            const type = btn.dataset.type;
            const input = document.querySelector(`input[data-id="${productId}"][data-type="${type}"]`);
            const quantity = input.value;
            console.log(`Button click input value for ${type} (${productId}):`, quantity); // Debug log
            if (!quantity || quantity <= 0 || isNaN(quantity)) {
                showNotification(translations[currentLang].please_enter_quantity, 'error');
                return;
            }
            const date = new Date().toISOString().split('T')[0];
            const endpoint = type === 'inventory' ? '/inventory' : '/purchases';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: productId, quantity: parseInt(quantity), date })
            });
            if (response.ok) {
                showNotification(translations[currentLang][`${type}_added_success`]);
                input.value = ''; // Clear input after successful submission
                const selectedProductId = document.querySelector('#products-list tr:hover')?.querySelector('td[data-product-id]')?.dataset.productId;
                if (selectedProductId === productId) {
                    loadInventory(productId); // Refresh inventory table if this product is selected
                }
            } else {
                showNotification(translations[currentLang][`failed_to_add_${type}`], 'error');
            }
        });
    });
    // Add event listeners for clicking product name to show inventory
    document.querySelectorAll('#products-list tr td:first-child').forEach(cell => {
        cell.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from triggering table re-render
            const productId = cell.dataset.productId;
            const productName = cell.textContent;
            loadInventory(productId);
        });
    });
    // Add event listener to monitor focus and keyboard input
    document.querySelectorAll('.inventory-input, .purchase-input').forEach(input => {
        input.addEventListener('focus', () => {
            console.log(`Input focused: ${input.dataset.type} (${input.dataset.id})`);
        });
        input.addEventListener('blur', () => {
            console.log(`Input blurred: ${input.dataset.type} (${input.dataset.id})`);
        });
        input.addEventListener('input', (e) => {
            console.log(`Keyboard input detected: ${e.target.value} for ${e.target.dataset.type} (${e.target.dataset.id})`);
        });
        input.addEventListener('keydown', (e) => {
            console.log(`Key pressed: ${e.key} for ${e.target.dataset.type} (${e.target.dataset.id})`);
        });
    });
}

// Fetch and display products based on search query
async function searchProducts(query) {
    if (query.length < 1) {
        document.getElementById('product-results').classList.add('hidden');
        loadProducts(document.getElementById('category-select').value);
        return;
    }
    const categoryId = document.getElementById('category-select').value;
    let url = `/products/search/${encodeURIComponent(query)}`;
    if (categoryId) url += `?category_id=${categoryId}`;
    const response = await fetch(url);
    const products = await response.json();
    const resultsList = document.getElementById('product-results');
    resultsList.innerHTML = '';
    if (products.length === 0) {
        resultsList.innerHTML = `<li class="p-2 text-gray-500 text-sm sm:text-base">${translations[currentLang].no_products_found}</li>`;
    } else {
        products.forEach(prod => {
            const li = document.createElement('li');
            li.textContent = prod.name;
            li.className = 'p-2 hover:bg-gray-100 cursor-pointer text-sm sm:text-base';
            li.dataset.id = prod.id;
            li.addEventListener('click', () => {
                document.getElementById('product-search').value = prod.name;
                document.getElementById('product-results').classList.add('hidden');
                loadProducts(categoryId); // Reload products to reflect search
                loadInventory(prod.id); // Load inventory for selected product
            });
            resultsList.appendChild(li);
        });
    }
    resultsList.classList.remove('hidden');
}

// Fetch and display inventory and purchases for a product
async function loadInventory(productId) {
    const response = await fetch(`/inventory/${productId}`);
    const records = await response.json();
    const list = document.getElementById('inventory-list');
    list.innerHTML = '';
    if (records.length === 0) {
        list.innerHTML = `<tr><td colspan="5" class="p-2 sm:p-3 text-center text-sm sm:text-base">${translations[currentLang].no_records_found}</td></tr>`;
        return;
    }
    records.forEach(item => {
        list.innerHTML += `
            <tr class="hover:bg-gray-50">
                <td class="p-2 sm:p-3 text-sm sm:text-base">${item.date}</td>
                <td class="p-2 sm:p-3 text-sm sm:text-base">${item.product_name}</td>
                <td class="p-2 sm:p-3 text-sm sm:text-base">${item.inventory_quantity || 0}</td>
                <td class="p-2 sm:p-3 text-sm sm:text-base">${item.purchase_quantity || 0}</td>
                <td class="p-2 sm:p-3 text-sm sm:text-base">${item.usage || 0}</td>
            </tr>
        `;
    });
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `fixed top-4 right-4 sm:top-6 sm:right-6 p-3 sm:p-4 rounded-md text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
    notification.classList.remove('hidden');
    setTimeout(() => notification.classList.add('hidden'), 3000);
}

// Add category
document.getElementById('category-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('category-name').value;
    const response = await fetch('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    if (response.ok) {
        showNotification(translations[currentLang].category_added_success);
        loadCategories();
        e.target.reset();
    } else {
        showNotification(translations[currentLang].failed_add_category, 'error');
    }
});

// Add product
document.getElementById('add-product-btn').addEventListener('click', async () => {
    const categoryId = document.getElementById('category-select').value;
    const name = prompt(translations[currentLang].enter_product_name);
    if (!name || !categoryId) {
        showNotification(translations[currentLang].please_select_category_and_name, 'error');
        return;
    }
    const response = await fetch('/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category_id: categoryId })
    });
    if (response.ok) {
        showNotification(translations[currentLang].product_added_success);
        document.getElementById('product-search').value = '';
        loadProducts(categoryId);
    } else {
        showNotification(translations[currentLang].failed_add_product, 'error');
    }
});

// Search product
document.getElementById('product-search').addEventListener('input', (e) => {
    searchProducts(e.target.value);
});

// Load products when category changes
document.getElementById('category-select').addEventListener('change', (e) => {
    document.getElementById('product-search').value = '';
    document.getElementById('product-results').classList.add('hidden');
    document.getElementById('inventory-list').innerHTML = `<tr><td colspan="5" class="p-2 sm:p-3 text-center text-sm sm:text-base">${translations[currentLang].select_product_to_view_records}</td></tr>`;
    loadProducts(e.target.value);
});

// Hide search results when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative') && !e.target.closest('#products-table')) {
        document.getElementById('product-results').classList.add('hidden');
        // Only reload if category changes or search is cleared intentionally
        const categorySelect = document.getElementById('category-select');
        if (categorySelect.value !== categorySelect.dataset.lastValue) {
            loadProducts(categorySelect.value);
            categorySelect.dataset.lastValue = categorySelect.value;
        }
    }
});

// Language change
document.getElementById('language-select').addEventListener('change', (e) => {
    setLanguage(e.target.value);
});

// Initialize
setLanguage('en');
loadCategories();
document.getElementById('category-select').dataset.lastValue = '';