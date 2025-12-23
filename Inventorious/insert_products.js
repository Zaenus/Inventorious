const sqlite3 = require('sqlite3').verbose();

// List of unique products from Plan1 sheet
const products = [
    'AVES CORAÇÃO DE FRANGO',
    'AVES COXA E SOBRECOXA',
    'AVES FILÉ DA COXA',
    'AVES FILÉ DE PEITO',
    'AVES MEDALHÃO DE FRANGO',
    'AVES SASSAMI',
    'AVES COXINHA DA ASA',
    'BOVINO ACÉM',
    'BOVINO COXÃO MOLE',
    'BOVINO MAMINHA',
    'BOVINO COSTELA',
    'BOVINO CUPIM',
    'BOVINO FRALDINHA',
    'BOVINO PONTA DE PEITO',
    'BOVINO FILÉ DE COSTELA',
    'BOVINO FILÉ MIGNON',
    'BOVINO LAGARTO',
    'BOVINO MIOLO DO ALCATRA',
    'BOVINO ANCHO PARMEGIANA',
    'BOVINO RABO',
    'PEIXE BACALHAU',
    'PEIXE CAMARÃO',
    'PEIXE FILÉ DE MERLUZÃO',
    'PEIXE FILÉ DE TILÁPIA',
    'PEIXE POSTA DE CAÇÃO',
    'PEIXE FILÉ DE PANGA',
    'PEIXE SALMÃO',
    'PEIXE ABADEJO',
    'SUÍNO ALCATRA',
    'SUÍNO BISTECA',
    'SUÍNO COSTELINHA',
    'SUÍNO LINGUIÇA TOSCANA',
    'SUÍNO LINGUIÇA FINA APIMENTADA',
    'SUÍNO LOMBO',
    'SUÍNO PANCETA',
    'SUÍNO PICANHA TEMPERADA',
    'SUÍNO TOUCINHO',
    'CARNE SECA',
    'FRIOS MUSSARELA',
    'FRIOS PRESUNTO',
    'FRIOS SALAME',
    'FRIOS QUEIJO FRESCO',
    'FRIOS QUEIJO CHEDDAR',
    'FRIOS QUEIJO PRATO',
    'KIT SALGADO',
    'INGREDIENTES FEIJOADA',
    'CONG BRÓCOLIS',
    'CONG BATATA PALITO 7MM',
    'CONG BATATA SMILE',
    'CONG MANDIOCA',
    'CONG POLENTA PALITO',
    'CONG COUVE FLOR',
    'CONG ANÉIS DE CEBOLA',
    'OVO DE CODORNA',
    'AZEITONA VERDE',
    'AZEITONA PRETA',
    'HAMBURGUER CASEIRO',
    'QUEIJO COALHO',
    'LINGUIÇA PAIO',
    'CALABRESA',
    'COSTELINHA DEFUMADA',
    'NUGGETS',
    'BACON MANTA',
    'BACON FATIADO',
    'MANTEIGA',
    'PASTEL DE NATA',
    'ALHO',
    'MARGARINA',
    'DONUTS CREME/D.LEITE',
    'PÃO DE BRIOCHE NYC',
    'PÃO SIRIO',
    'MORTADELA CERATTI',
    'BACON MANTA AURORA',
    'BACON EM CUBOS AURORA',
    'PEITO DE PERU',
    'QUEIJO PRATO SCALA',
    'QUEIJO MUSSARELA SCALA',
    'CATUPIRY BISNAGA',
    'CREAM CHESE BISNAGA',
    'SALSICHA',
    'COSTELINHA SUÍNA SALGADA',
    'LINGUIÇA CUIABANA'
];

// Connect to SQLite database
const db = new sqlite3.Database('inventory.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        return;
    }
    console.log('Connected to SQLite database');
});

// Function to create category and insert products
function insertProducts() {
    // Step 1: Create or find the "Carnes e Frios" category
    db.get('SELECT id FROM categories WHERE name = ?', ['Carnes e Frios'], (err, row) => {
        if (err) {
            console.error('Error checking category:', err.message);
            db.close();
            return;
        }

        let categoryId;
        if (row) {
            // Category exists
            categoryId = row.id;
            console.log('Category "Carnes e Frios" already exists with ID:', categoryId);
            insertAllProducts(categoryId);
        } else {
            // Create new category
            db.run('INSERT INTO categories (name) VALUES (?)', ['Carnes e Frios'], function(err) {
                if (err) {
                    console.error('Error creating category:', err.message);
                    db.close();
                    return;
                }
                categoryId = this.lastID;
                console.log('Created category "Carnes e Frios" with ID:', categoryId);
                insertAllProducts(categoryId);
            });
        }
    });
}

// Function to insert all products
function insertAllProducts(categoryId) {
    let insertedCount = 0;
    let skippedCount = 0;

    // Check existing products to avoid duplicates
    db.all('SELECT name FROM products WHERE category_id = ?', [categoryId], (err, existingProducts) => {
        if (err) {
            console.error('Error fetching existing products:', err.message);
            db.close();
            return;
        }

        const existingNames = new Set(existingProducts.map(p => p.name.toLowerCase()));

        products.forEach(product => {
            if (existingNames.has(product.toLowerCase())) {
                console.log(`Product "${product}" already exists, skipping.`);
                skippedCount++;
                checkCompletion();
                return;
            }

            db.run('INSERT INTO products (name, category_id) VALUES (?, ?)', [product, categoryId], function(err) {
                if (err) {
                    console.error(`Error inserting product "${product}":`, err.message);
                } else {
                    console.log(`Inserted product "${product}" with ID: ${this.lastID}`);
                    insertedCount++;
                }
                checkCompletion();
            });
        });

        function checkCompletion() {
            if (insertedCount + skippedCount === products.length) {
                console.log(`Insertion complete: ${insertedCount} products inserted, ${skippedCount} products skipped.`);
                db.close();
            }
        }
    });
}

// Run the insertion process
insertProducts();