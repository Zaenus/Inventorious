const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3002;

app.use(express.json());

// Serve static files (HTML, JS, CSS)
app.use(express.static('public'));

// Unprotected routes
app.get('/reports', (req, res) => res.sendFile(path.join(__dirname, 'public', 'reports.html')));

// Connect to SQLite database
const db = new sqlite3.Database('inventory.db', (err) => {
    if (err) console.error(err);
    console.log('Connected to SQLite database');
});

// Add a category
app.post('/categories', (req, res) => {
    const { name } = req.body;
    db.run('INSERT INTO categories (name) VALUES (?)', [name], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name });
    });
});

// Add a product
app.post('/products', (req, res) => {
    const { name, category_id } = req.body;
    db.run('INSERT INTO products (name, category_id) VALUES (?, ?)', [name, category_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, category_id });
    });
});

// Add inventory record
app.post('/inventory', (req, res) => {
    const { product_id, quantity, date } = req.body;
    db.run('INSERT INTO inventory (product_id, quantity, date) VALUES (?, ?, ?)', [product_id, quantity, date], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, product_id, quantity, date });
    });
});

// Add purchase record
app.post('/purchases', (req, res) => {
    const { product_id, quantity, date } = req.body;
    db.run('INSERT INTO purchases (product_id, quantity, date) VALUES (?, ?, ?)', [product_id, quantity, date], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, product_id, quantity, date });
    });
});

// Get all categories
app.get('/categories', (req, res) => {
    db.all('SELECT * FROM categories', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get products by category
app.get('/products/:category_id', (req, res) => {
    const { category_id } = req.params;
    db.all('SELECT * FROM products WHERE category_id = ?', [category_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get inventory and purchases for a product, grouped by date with usage
app.get('/inventory/:product_id', (req, res) => {
    const { product_id } = req.params;
    db.all(
        `WITH records AS (
            SELECT 
                COALESCE(i.date, p.date) AS date,
                products.name AS product_name,
                COALESCE(SUM(i.quantity), 0) AS inventory_quantity,
                COALESCE(SUM(p.quantity), 0) AS purchase_quantity
            FROM products
            LEFT JOIN inventory i ON products.id = i.product_id
            LEFT JOIN purchases p ON products.id = p.product_id AND (i.date = p.date OR i.date IS NULL OR p.date IS NULL)
            WHERE products.id = ?
            GROUP BY COALESCE(i.date, p.date), products.name
        )
        SELECT 
            date,
            product_name,
            inventory_quantity,
            purchase_quantity,
            COALESCE(
                (LAG(inventory_quantity) OVER (ORDER BY date) + 
                 LAG(purchase_quantity) OVER (ORDER BY date)) - inventory_quantity,
                0
            ) AS usage
        FROM records
        ORDER BY date DESC`,
        [product_id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// Search products by name and optional category
app.get('/products/search/:query', (req, res) => {
    const { query } = req.params;
    const { category_id } = req.query; // Optional category_id from query string
    const searchTerm = `%${query}%`;
    let sql = 'SELECT id, name, category_id FROM products WHERE name LIKE ?';
    let params = [searchTerm];

    if (category_id) {
        sql += ' AND category_id = ?';
        params.push(category_id);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Lista todos os produtos (nome + id)
app.get('/api/products', (req, res) => {
    db.all(`SELECT id, name FROM products ORDER BY name`, [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows.map(row => ({ id: row.id, name: row.name })));
    });
});

// Get categories report
app.get('/reports/categories', (req, res) => {
    // No filters for categories
    db.all(
        `SELECT c.id, c.name, COUNT(p.id) AS product_count 
         FROM categories c 
         LEFT JOIN products p ON c.id = p.category_id 
         GROUP BY c.id`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// Get products report
app.get('/reports/products', (req, res) => {
    let sql = `SELECT p.id, p.name, c.name AS category_name 
               FROM products p 
               JOIN categories c ON p.category_id = c.id`;
    let params = [];
    if (req.query.category_id) {
        sql += ` WHERE p.category_id = ?`;
        params.push(req.query.category_id);
    }
    sql += ` ORDER BY p.name`;
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Faça o mesmo para /reports/purchases
app.get('/reports/summary', (req, res) => {
    const { category_id, product_id, from_date, to_date } = req.query;

    // Monta WHERE dinâmico
    let where = [];
    let params = [];

    if (product_id) {
        where.push('p.id = ?');
        params.push(product_id);
    } else if (category_id) {
        where.push('p.category_id = ?');
        params.push(category_id);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    // Query principal
    const sql = `
        SELECT 
            p.id,
            p.name AS product_name,
            c.name AS category_name,
            COALESCE((
                SELECT quantity 
                FROM inventory i 
                WHERE i.product_id = p.id
                ${from_date ? 'AND i.date >= ?' : ''}
                ${to_date ? 'AND i.date <= ?' : ''}
                ORDER BY i.date DESC, i.id DESC 
                LIMIT 1
            ), 0) AS current_stock,
            COALESCE((
                SELECT SUM(quantity) 
                FROM purchases pur 
                WHERE pur.product_id = p.id
                ${from_date ? 'AND pur.date >= ?' : ''}
                ${to_date ? 'AND pur.date <= ?' : ''}
            ), 0) AS total_purchases,
            COALESCE((
                SELECT SUM(ABS(quantity)) 
                FROM inventory i 
                WHERE i.product_id = p.id 
                  AND i.quantity < 0
                ${from_date ? 'AND i.date >= ?' : ''}
                ${to_date ? 'AND i.date <= ?' : ''}
            ), 0) AS total_out,
            COALESCE((
                SELECT SUM(quantity) 
                FROM inventory i 
                WHERE i.product_id = p.id 
                  AND i.quantity > 0
                ${from_date ? 'AND i.date >= ?' : ''}
                ${to_date ? 'AND i.date <= ?' : ''}
            ), 0) AS total_in
        FROM products p
        JOIN categories c ON p.category_id = c.id
        ${whereClause}
        ORDER BY p.name
    `;

    // Monta parâmetros na ordem exata que aparecem na query
    const dateParams = [];
    for (let i = 0; i < 6; i++) {  // máximo 6 parâmetros de data
        if (from_date) dateParams.push(from_date);
        if (to_date) dateParams.push(to_date);
    }

    db.all(sql, [...params, ...dateParams.slice(0, sql.split('?').length - 1 - params.length)], (err, rows) => {
        if (err) {
            console.error('Erro SQL em /reports/summary:', err.message);
            return res.status(500).json({ error: err.message });
        }

        // Calcula total_usage: entrada (ajuste +) + compras - saída (ajuste -)
        rows.forEach(row => {
            const entrada_ajuste = row.total_in || 0;
            const saida_ajuste = row.total_out || 0;
            const compras = row.total_purchases || 0;
            row.total_usage = entrada_ajuste + compras - saida_ajuste;
        });

        res.json(rows);
    });
});

app.get('/reports/purchases', (req, res) => {

    const { category_id, product_id, from_date, to_date } = req.query;

    let sql = `
        SELECT pur.date, p.name AS product_name, pur.quantity
        FROM purchases pur
        JOIN products p ON pur.product_id = p.id
        WHERE 1=1
    `;
    const params = [];

    if (category_id) {
        sql += ` AND p.category_id = ?`;
        params.push(category_id);
    }
    if (product_id) {
        sql += ` AND pur.product_id = ?`;
        params.push(product_id);
    }
    if (from_date) {
        sql += ` AND pur.date >= ?`;
        params.push(from_date);
        console.log('Data início:', from_date);
    }
    if (to_date) {
        sql += ` AND pur.date <= ?`;
        params.push(to_date);
    }

    sql += ` ORDER BY pur.date DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Erro SQL:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// === ROTA PARA INVENTORY + LOGS ===
app.get('/reports/inventory', (req, res) => {
    console.log('GET /reports/inventory → query:', req.query);  // ← LOG AQUI

    const { category_id, product_id, from_date, to_date } = req.query;

    let sql = `
        SELECT i.date, p.name AS product_name, i.quantity
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        WHERE 1=1
    `;
    const params = [];

    if (category_id) {
        sql += ` AND p.category_id = ?`;
        params.push(category_id);
    }
    if (product_id) {
        sql += ` AND i.product_id = ?`;
        params.push(product_id);
    }
    if (from_date) {
        sql += ` AND i.date >= ?`;
        params.push(from_date);
    }
    if (to_date) {
        sql += ` AND i.date <= ?`;
        params.push(to_date);
    }

    sql += ` ORDER BY i.date DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Erro SQL:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});