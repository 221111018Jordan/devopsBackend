import { useState, useEffect } from 'react';
import './App.css';

// URL API backend Anda. Pastikan port-nya benar (3000).
const API_URL = 'http://localhost:4000/tasks';

function App() {
  // State tetap sama, tapi akan diisi dari API
  const [tasks, setTasks] = useState([]);
  const [inputText, setInputText] = useState('');
  const [editingId, setEditingId] = useState(null);

  // --- EFEK (HOOK) ---

  /**
   * [READ]
   * Gunakan useEffect untuk mengambil data dari API saat komponen dimuat.
   */
  useEffect(() => {
    fetchTasks();
  }, []); // Array dependensi kosong berarti ini hanya berjalan sekali saat mount

  const fetchTasks = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Gagal mengambil tugas:', error);
    }
  };

  // --- HANDLERS (LOGIKA CRUD) ---

  /**
   * Menangani submit form (CREATE dan UPDATE)
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (editingId !== null) {
      // --- UPDATE ---
      try {
        const response = await fetch(`${API_URL}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: inputText }),
        });
        const updatedTask = await response.json();
        
        // Update state lokal
        setTasks(
          tasks.map((task) =>
            task.id === editingId ? updatedTask : task
          )
        );
        setEditingId(null);
        
      } catch (error) {
        console.error('Gagal mengupdate tugas:', error);
      }
    } else {
      // --- CREATE ---
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: inputText }),
        });
        const newTask = await response.json();
        
        // Tambahkan ke state lokal
        setTasks([...tasks, newTask]);
        
      } catch (error) {
        console.error('Gagal menambah tugas:', error);
      }
    }
    
    setInputText('');
  };

  /**
   * Menyiapkan form untuk mode UPDATE
   */
  const handleEdit = (task) => {
    setEditingId(task.id);
    setInputText(task.text);
  };

  /**
   * [DELETE]
   */
  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
      try {
        await fetch(`${API_URL}/${id}`, {
          method: 'DELETE',
        });
        
        // Hapus dari state lokal
        setTasks(tasks.filter((task) => task.id !== id));
        
      } catch (error) {
        console.error('Gagal menghapus tugas:', error);
      }
    }
  };

  /**
   * Membatalkan mode edit
   */
  const handleCancelEdit = () => {
    setEditingId(null);
    setInputText('');
  };

  // --- RENDER (VIEW) ---
  // Tampilannya (JSX) sama persis dengan sebelumnya, tidak perlu diubah!
  return (
    <div className="app-container">
      <h1>Daftar Tugas (Full Stack CRUD)</h1>
      <form onSubmit={handleSubmit} className="task-form">
        <input
          type="text"
          placeholder="Masukkan tugas baru..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button type="submit">
          {editingId !== null ? 'Update' : 'Tambah'}
        </button>
        {editingId !== null && (
          <button type="button" onClick={handleCancelEdit} className="cancel-btn">
            Batal
          </button>
        )}
      </form>

      <ul className="task-list">
        {/* Tampilkan pesan jika tidak ada tugas */}
        {tasks.length === 0 && <p style={{textAlign: 'center', color: '#888'}}>Belum ada tugas.</p>}
        
        {tasks.map((task) => (
          <li key={task.id}>
            <span>{task.text}</span>
            <div className="task-buttons">
              <button onClick={() => handleEdit(task)} className="edit-btn">
                Edit
              </button>
              <button onClick={() => handleDelete(task.id)} className="delete-btn">
                Hapus
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;