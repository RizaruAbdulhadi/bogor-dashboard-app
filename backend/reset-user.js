const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'dashboarddb',
    password: 'Abdulhadi',
    port: 5432,
});

async function resetUser(username, newPassword) {
    try {
        const saltRounds = 10;
        const hash = await bcrypt.hash(newPassword, saltRounds);

        const query = `
      UPDATE users
      SET password = $1
      WHERE username = $2
      RETURNING id, username;
    `;

        const result = await pool.query(query, [hash, username]);

        if (result.rowCount > 0) {
            console.log(`✅ User "${username}" berhasil direset dengan password baru.`);
        } else {
            console.log(`⚠️ User "${username}" tidak ditemukan.`);
        }
    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await pool.end();
    }
}

// Ganti 'admin' dan '123456' sesuai kebutuhan
resetUser('admin', 'Abdulhadi16*');
