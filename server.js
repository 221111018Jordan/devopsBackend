// Impor library
require('dotenv').config(); // Muat variabel dari .env
const express = require('express');
const mysql = require('mysql2/promise'); // Gunakan versi promise
const cors = require('cors');

// Inisialisasi aplikasi Express
const app = express();
const port = process.env.SERVER_PORT || 4000;

// --- Konfigurasi Database Pool ---
// Pool koneksi lebih efisien daripada koneksi tunggal
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// --- Middleware ---
// 1. CORS: Izinkan request dari frontend React Anda
app.use(cors({
  origin: '*' // Untuk demo, izinkan semua. Ganti dengan 'http://localhost:5173'
}));

// 2. Body Parser: Izinkan server membaca JSON dari body request
app.use(express.json());

// --- Tes Koneksi Database ---
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('🎉 Berhasil terhubung ke database Aiven!');
    connection.release(); // Kembalikan koneksi ke pool
  } catch (err) {
    console.error('❌ Gagal terhubung ke database:', err.stack);
  }
}

// --- Rute API (CRUD) ---

/**
 * [READ] - GET /tasks
 * Mengambil semua tugas dari database
 */
app.get('/tasks', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error('Error mengambil tasks:', err);
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
});

/**
 * [CREATE] - POST /tasks
 * Menambah tugas baru ke database
 */
app.post('/tasks', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Teks tugas tidak boleh kosong' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO tasks (text) VALUES (?)',
      [text]
    );
    // Kirim kembali objek tugas yang baru dibuat
    res.status(201).json({
      id: result.insertId,
      text: text,
    });
  } catch (err) {
    console.error('Error menambah task:', err);
    res.status(500).json({ error: 'Gagal menambah data' });
  }
});

/**
 * [UPDATE] - PUT /tasks/:id
 * Memperbarui teks tugas berdasarkan ID
 */
app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Teks tugas tidak boleh kosong' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE tasks SET text = ? WHERE id = ?',
      [text, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tugas tidak ditemukan' });
    }
    
    // Kirim kembali data yang sudah diupdate
    res.json({ id: parseInt(id), text: text });
  } catch (err) {
    console.error('Error mengupdate task:', err);
    res.status(500).json({ error: 'Gagal mengupdate data' });
  }
});

/**
 * [DELETE] - DELETE /tasks/:id
 * Menghapus tugas berdasarkan ID
 */
app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM tasks WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tugas tidak ditemukan' });
    }

    // Sukses, tidak perlu kirim konten
    res.status(204).send();
  } catch (err) {
    console.error('Error menghapus task:', err);
    res.status(500).json({ error: 'Gagal menghapus data' });
  }
});

// --- Menjalankan Server ---
app.listen(port, () => {
  console.log(`🚀 Server backend berjalan di http://localhost:${port}`);
  testConnection(); // Tes koneksi DB saat server start
});