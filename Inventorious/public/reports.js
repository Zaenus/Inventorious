let currentReport = 'summary';
let reportData = [];
let currentLang = 'en';

const translations = {
    en: {
        select_language: 'Select Language',
        lang_en: 'English',
        lang_pt: 'Portuguese',
        back_to_management: 'Back to Management',
        select_report_type: 'Select Report Type',
        report_summary: 'Product Summary',
        report_categories: 'Categories',
        report_products: 'Products',
        report_movements: 'Stock Movements',
        filters: 'Filters',
        category: 'Category',
        product: 'Product',
        from_date: 'From Date',
        to_date: 'To Date',
        apply_filters: 'Apply Filters',
        export_to_excel: 'Export to Excel',
        product_name: 'Product Name',
        current_stock: 'Current Stock',
        total_usage: 'Total Usage',
        total_purchases: 'Total Purchases',
        name: 'Name',
        product_count: 'Product Count',
        quantity: 'Quantity',
        date: 'Date',
        type: 'Type',
        movement: 'Movement',
        balance_after: 'Balance After',
        type_purchase: 'Purchase',
        type_adjustment: 'Inventory',
        movement_in: 'IN',
        movement_out: 'OUT',
        no_data: 'No data available',
        no_categories: 'No categories available',
        no_products: 'No products available',
        search_product: 'Search Product',
        na: 'N/A',
        no_data_export: 'No data to export',
        inventory_reports: 'Inventory Reports',
        adjustment: 'Inventory Adjustment',
        purchase: 'Purchase',
        current_stock_header: 'Current Stock'
    },
    pt: {
        select_language: 'Selecionar Idioma',
        lang_en: 'Inglês',
        lang_pt: 'Português',
        back_to_management: 'Voltar para Gestão',
        select_report_type: 'Selecionar Tipo de Relatório',
        report_summary: 'Resumo do Produto',
        report_categories: 'Categorias',
        report_products: 'Produtos',
        report_movements: 'Movimentações de Estoque',
        filters: 'Filtros',
        category: 'Categoria',
        product: 'Produto',
        from_date: 'Data de Início',
        to_date: 'Data Final',
        apply_filters: 'Aplicar Filtros',
        export_to_excel: 'Exportar para Excel',
        product_name: 'Nome do Produto',
        current_stock: 'Estoque Atual',
        total_usage: 'Total de Uso',
        total_purchases: 'Total de Compras',
        name: 'Nome',
        product_count: 'Contagem de Produtos',
        quantity: 'Quantidade',
        date: 'Data',
        type: 'Tipo',
        movement: 'Movimento',
        balance_after: 'Saldo Após',
        type_purchase: 'Compra',
        type_adjustment: 'Inventário',
        movement_in: 'ENTRADA',
        movement_out: 'SAÍDA',
        no_data: 'Sem dados disponíveis',
        no_categories: 'Nenhuma categoria disponível',
        no_products: 'Nenhum produto disponível',
        search_product: 'Pesquisar Produto',
        na: 'N/D',
        no_data_export: 'Sem dados para exportar',
        inventory_reports: 'Relatórios de Estoque',
        adjustment: 'Ajuste Estoque',
        purchase: 'Compra',
        current_stock_header: 'Saldo Atual'
    }
};

// === Tradução ===
function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.dataset.translate;
        if (translations[lang][key]) el.textContent = translations[lang][key];
    });
    document.querySelectorAll('[data-placeholder]').forEach(el => {
        const key = el.dataset.placeholder;
        if (translations[lang][key]) el.placeholder = translations[lang][key];
    });
    document.title = translations[lang].inventory_reports;
}

// === Carregar categorias no filtro ===
async function loadFilterCategories() {
    try {
        const response = await fetch('/categories');
        if (!response.ok) throw new Error();
        const categories = await response.json();
        const select = document.getElementById('filter-category');
        select.innerHTML = `<option value="">${currentLang === 'en' ? 'All Categories' : 'Todas as Categorias'}</option>`;
        categories.forEach(cat => {
            select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });
    } catch (err) {
        console.error('Erro ao carregar categorias:', err);
    }
}

// === Busca de produtos no filtro ===
async function searchFilterProducts(query) {
    if (query.length < 2) {
        document.getElementById('filter-product-results').classList.add('hidden');
        return;
    }
    const categoryId = document.getElementById('filter-category').value;
    let url = `/products/search/${encodeURIComponent(query)}`;
    if (categoryId) url += `?category_id=${categoryId}`;

    try {
        const response = await fetch(url);
        const products = await response.json();
        const resultsList = document.getElementById('filter-product-results');
        resultsList.innerHTML = '';

        if (products.length === 0) {
            resultsList.innerHTML = `<li class="p-2 text-gray-500">${translations[currentLang].no_products}</li>`;
        } else {
            products.forEach(prod => {
                const li = document.createElement('li');
                li.textContent = prod.name;
                li.className = 'p-2 hover:bg-gray-100 cursor-pointer';
                li.onclick = () => {
                    document.getElementById('filter-product-search').value = prod.name;
                    document.getElementById('filter-product-id').value = prod.id;
                    resultsList.classList.add('hidden');
                };
                resultsList.appendChild(li);
            });
        }
        resultsList.classList.remove('hidden');
    } catch (err) {
        console.error('Erro na busca de produtos:', err);
    }
}

// === Monta query string dos filtros ===
function getFilterQuery() {
    const categoryId = document.getElementById('filter-category').value;
    const productId = document.getElementById('filter-product-id').value;
    const fromDate = document.getElementById('from-date').value;
    const toDate = document.getElementById('to-date').value;

    let query = '';
    if (productId) query += `product_id=${productId}`;
    else if (categoryId) query += `category_id=${categoryId}`;  // ← está aqui!
    if (fromDate) query += `${query ? '&' : ''}from_date=${fromDate}`;
    if (toDate) query += `${query ? '&' : ''}to_date=${toDate}`;
    return query ? `?${query}` : '';
}

// === Carregar relatório ===
async function loadReport() {
    const query = getFilterQuery();
    console.log('Frontend: Aplicando filtros →', query);

    // === MOVIMENTAÇÕES DE ESTOQUE — VERSÃO FINAL 100% FUNCIONAL ===
    if (currentReport === 'movements') {
        const list = document.getElementById('movements-list');
        list.innerHTML = '<tr><td colspan="4" class="p-2 text-center">Carregando...</td></tr>';

        try {
            // === FAZ OS FETCHES AQUI (uma única vez, com a query correta) ===
            const [invRes, purRes, summaryRes, productsRes] = await Promise.all([
                fetch(`/reports/inventory${query}`).catch(() => ({ ok: false })),
                fetch(`/reports/purchases${query}`).catch(() => ({ ok: false })),
                fetch(`/reports/summary${query}`).catch(() => ({ ok: false })),
                fetch(`/reports/products${query}`).catch(() => ({ ok: false }))
            ]);

            const inventoryRecords = invRes.ok ? await invRes.json() : [];
            const purchaseRecords = purRes.ok ? await purRes.json() : [];
            const summary = summaryRes.ok ? await summaryRes.json() : [];
            const allProducts = productsRes.ok ? await productsRes.json() : [];

            // Mapa de saldo atual
            const currentStockMap = {};
            summary.forEach(item => {
                currentStockMap[item.product_name] = item.current_stock ?? 0;
            });

            // Todos os nomes de produtos (com ou sem movimento)
            const productNames = new Set([
                ...allProducts.map(p => p.name),
                ...inventoryRecords.map(r => r.product_name || ''),
                ...purchaseRecords.map(r => r.product_name || ''),
                ...summary.map(s => s.product_name || '')
            ]);

            const periodData = {};
            productNames.forEach(name => {
                if (!name) return;
                periodData[name] = {
                    product_name: name,
                    adjustment: 0,
                    purchase: 0,
                    current_stock: currentStockMap[name] ?? 0
                };
            });

            // Acumula compras
            purchaseRecords.forEach(r => {
                if (periodData[r.product_name]) {
                    periodData[r.product_name].purchase += Math.abs(r.quantity || 0);
                }
            });

            // Acumula ajustes
            inventoryRecords.forEach(r => {
                if (periodData[r.product_name]) {
                    periodData[r.product_name].adjustment += (r.quantity || 0);
                }
            });

            const rows = Object.values(periodData)
                .sort((a, b) => a.product_name.localeCompare(b.product_name));

            reportData = rows;

            const html = rows.length === 0
                ? `<tr><td colspan="4" class="p-2 text-center">${translations[currentLang].no_data}</td></tr>`
                : rows.map(item => {
                    const adj = item.adjustment;
                    const pur = item.purchase;
                    const adjDisplay = adj > 0 ? `+${adj}` : (adj < 0 ? adj : '0');
                    const purDisplay = pur > 0 ? `+${pur}` : '0';
                    const adjClass = adj > 0 ? 'text-green-600' : (adj < 0 ? 'text-red-600' : 'text-gray-500');
                    const purClass = pur > 0 ? 'text-green-600' : 'text-gray-500';

                    return `<tr class="hover:bg-gray-50">
                        <td class="p-2 sm:p-3 font-medium">${item.product_name}</td>
                        <td class="p-2 sm:p-3 text-right ${adjClass}">${adjDisplay}</td>
                        <td class="p-2 sm:p-3 text-right ${purClass}">${purDisplay}</td>
                        <td class="p-2 sm:p-3 font-bold text-right">${item.current_stock}</td>
                    </tr>`;
                }).join('');

            list.innerHTML = html;

        } catch (err) {
            console.error('Erro no relatório de movimentações:', err);
            list.innerHTML = `<tr><td colspan="4" class="p-2 text-center text-red-600">Erro ao carregar dados</td></tr>`;
        }
        return;
    }

    // === TODOS OS OUTROS RELATÓRIOS (summary, categories, products) ===
    try {
        const response = await fetch(`/reports/${currentReport}${query}`);
        if (!response.ok) throw new Error('Erro na resposta');
        const data = await response.json();
        reportData = data;

        let html = '';
        let list;

        switch (currentReport) {
            case 'summary':
                list = document.getElementById('summary-list');
                html = data.length === 0
                    ? `<tr><td colspan="5" class="p-2 text-center">${translations[currentLang].no_data}</td></tr>`
                    : data.map(item => `
                        <tr class="hover:bg-gray-50">
                            <td class="p-2 sm:p-3">${item.product_name}</td>
                            <td class="p-2 sm:p-3">${item.category_name || '-'}</td>
                            <td class="p-2 sm:p-3">${item.current_stock ?? translations[currentLang].na}</td>
                            <td class="p-2 sm:p-3">${item.total_purchases || 0}</td>
                            <td class="p-2 sm:p-3">${item.total_usage || 0}</td>
                        </tr>`).join('');
                break;

            case 'categories':
                list = document.getElementById('categories-list');
                html = data.length === 0
                    ? `<tr><td colspan="2" class="p-2 text-center">${translations[currentLang].no_categories}</td></tr>`
                    : data.map(item => `
                        <tr class="hover:bg-gray-50">
                            <td class="p-2 sm:p-3">${item.name}</td>
                            <td class="p-2 sm:p-3">${item.product_count}</td>
                        </tr>`).join('');
                break;

            case 'products':
                list = document.getElementById('products-list');
                html = data.length === 0
                    ? `<tr><td colspan="2" class="p-2 text-center">${translations[currentLang].no_products}</td></tr>`
                    : data.map(item => `
                        <tr class="hover:bg-gray-50">
                            <td class="p-2 sm:p-3">${item.name}</td>
                            <td class="p-2 sm:p-3">${item.category_name || '-'}</td>
                        </tr>`).join('');
                break;
        }

        if (list) list.innerHTML = html;

    } catch (err) {
        console.error('Erro ao carregar relatório:', err);
        alert('Erro ao carregar relatório');
    }
}

// === Mostrar container correto ===
function showReportContainer() {
    // Esconde todos os relatórios
    const reportContainers = ['summary', 'categories', 'products', 'movements'];
    reportContainers.forEach(type => {
        const el = document.getElementById(`${type}-container`);
        if (el) el.classList.add('hidden');
    });

    // Mostra o atual
    const current = document.getElementById(`${currentReport}-container`);
    if (current) current.classList.remove('hidden');

    // FORÇA os filtros a aparecerem sempre
    document.getElementById('filters-container').classList.remove('hidden');
}

// === EXPORTAR PARA EXCEL (PERFEITO) ===
function exportToExcel() {
    if (!reportData || reportData.length === 0) {
        alert(translations[currentLang].no_data_export);
        return;
    }

    const titles = {
        summary: translations[currentLang].report_summary,
        categories: translations[currentLang].report_categories,
        products: translations[currentLang].report_products,
        movements: translations[currentLang].report_movements
    };

    const sheetName = titles[currentReport] || 'Relatório';
    const today = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const fileName = `${sheetName} ${today}.xlsx`;

    let rows = [];

    switch (currentReport) {
        case 'summary':
            rows = reportData.map(i => ({
                [translations[currentLang].product_name]: i.product_name,
                [translations[currentLang].category]: i.category_name || translations[currentLang].na,
                [translations[currentLang].current_stock]: i.current_stock ?? translations[currentLang].na,
                [translations[currentLang].total_purchases]: i.total_purchases || 0,
                [translations[currentLang].total_usage]: i.total_usage || 0
            }));
            break;
        case 'categories':
            rows = reportData.map(i => ({
                [translations[currentLang].name]: i.name,
                [translations[currentLang].product_count]: i.product_count
            }));
            break;
        case 'products':
            rows = reportData.map(i => ({
                [translations[currentLang].name]: i.name,
                [translations[currentLang].category]: i.category_name || translations[currentLang].na
            }));
            break;
        case 'movements':
            rows = reportData.map(i => {
                const adj = i.adjustment || 0;
                const pur = i.purchase || 0;
                const adjDisplay = adj > 0 ? `+${adj}` : (adj < 0 ? adj : '0');
                const purDisplay = pur > 0 ? `+${pur}` : '0';

                return {
                    [translations[currentLang].product_name]: i.product_name,
                    [translations[currentLang].adjustment || 'Adjustment']: adjDisplay,
                    [translations[currentLang].purchase || 'Purchase']: purDisplay,
                    [translations[currentLang].current_stock_header]: i.current_stock ?? 0
                };
            });
            break;
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    // Auto-ajuste de colunas
    if (rows.length > 0) {
        const colWidths = Object.keys(rows[0]).map((_, i) => ({
            wch: Math.max(...rows.map(r => (r[Object.keys(r)[i]] || '').toString().length), 12) + 2
        }));
        ws['!cols'] = colWidths;
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
    XLSX.writeFile(wb, fileName);
}

// === Eventos ===
document.getElementById('language-select')?.addEventListener('change', e => {
    setLanguage(e.target.value);
    loadReport();
});

document.getElementById('report-type')?.addEventListener('change', e => {
    currentReport = e.target.value;
    showReportContainer();
    loadReport();
});

document.getElementById('export-excel')?.addEventListener('click', exportToExcel);

document.getElementById('filter-product-search')?.addEventListener('input', e => {
    searchFilterProducts(e.target.value);
});

document.getElementById('filter-category')?.addEventListener('change', () => {
    document.getElementById('filter-product-search').value = '';
    document.getElementById('filter-product-id').value = '';
    document.getElementById('filter-product-results').classList.add('hidden');
});

document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrapper')) {
        document.getElementById('filter-product-results')?.classList.add('hidden');
    }
});

document.getElementById('apply-filters')?.addEventListener('click', () => {
    loadReport();        // já é suficiente
});

// === INICIALIZAÇÃO ===
setLanguage('en');
loadFilterCategories();
showReportContainer();
loadReport();