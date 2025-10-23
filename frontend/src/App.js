import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/users', newUser);
      setUsers([...users, response.data]);
      setNewUser({ name: '', email: '' });
      setError(null);
    } catch (err) {
      setError('Failed to create user');
      console.error('Error creating user:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Full-Stack Application</h1>
        <p>React Frontend + Flask Backend + Nginx</p>
      </header>

      <main className="App-main">
        <div className="container">
          <section className="users-section">
            <h2>Users</h2>
            {loading && <p>Loading users...</p>}
            {error && <p className="error">{error}</p>}
            {!loading && !error && (
              <div className="users-list">
                {users.map(user => (
                  <div key={user.id} className="user-card">
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                    {user.created_at && (
                      <small>Created: {new Date(user.created_at).toLocaleDateString()}</small>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button onClick={fetchUsers} className="refresh-btn">
              Refresh Users
            </button>
          </section>

          <section className="add-user-section">
            <h2>Add New User</h2>
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-group">
                <label htmlFor="name">Name:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newUser.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <button type="submit" className="submit-btn">
                Add User
              </button>
            </form>
          </section>
        </div>
      </main>

      <footer className="App-footer">
        <p>Powered by React, Flask, and Nginx</p>
      </footer>
    </div>
  );
}

export default App;
