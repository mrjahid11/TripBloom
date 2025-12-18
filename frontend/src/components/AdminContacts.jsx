import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaCheck } from 'react-icons/fa';

const AdminContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchContacts = async () => {
    setLoading(true);
    setError('');
    try {
      const role = localStorage.getItem('userRole') || '';
      const res = await axios.get('/api/admin/contacts', { headers: { 'x-user-role': role } });
      if (res.data && res.data.contacts) {
        // ensure newest first
        const sorted = res.data.contacts.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        setContacts(sorted);
      }
    } catch (err) {
      console.error('Failed to load contacts', err);
      setError('Failed to load messages. Make sure you are authenticated as admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const markHandled = async (id) => {
    try {
      const role = localStorage.getItem('userRole') || '';
      await axios.post(`/api/admin/contacts/${id}/handled`, {}, { headers: { 'x-user-role': role } });
      fetchContacts();
    } catch (err) {
      console.error('Failed to mark handled', err);
      setError('Failed to update message');
    }
  };

  // handle focus from query param
  const location = useLocation();
  const listRef = useRef(null);
  useEffect(() => {
    if (!contacts || contacts.length === 0) return;
    const params = new URLSearchParams(location.search);
    const focus = params.get('focus');
    if (focus) {
      // wait a tick for render
      setTimeout(() => {
        const el = document.getElementById(`contact-${focus}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-primary', 'ring-opacity-40', 'contact-focus');
          setTimeout(() => el.classList.remove('ring-4', 'ring-primary', 'ring-opacity-40', 'contact-focus'), 3000);
        }
      }, 150);
    }
  }, [location.search, contacts]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Contact Messages</h2>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      {loading ? (
        <div>Loading messages...</div>
      ) : (
        <div className="grid gap-4">
          {contacts.length === 0 && (<div className="text-gray-600">No messages found.</div>)}
          {contacts.map(c => (
            <div id={`contact-${c._id}`} key={c._id} className={`p-4 rounded-lg border ${c.handled ? 'bg-gray-800 dark:bg-gray-800 border-gray-700 text-gray-200' : 'bg-white dark:bg-gray-800 border-red-200'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-lg">{c.name} <span className="text-sm text-gray-500">• {c.email}</span></div>
                  <div className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  {c.handled ? (
                    <span className="text-green-600 flex items-center gap-1"><FaCheck /> Handled</span>
                  ) : (
                    <span className="flex items-center gap-2 text-red-600">
                      <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" aria-hidden="true"></span>
                      <span className="font-medium">New</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{c.message}</div>
              <div className="mt-3 flex gap-2">
                {!c.handled && (
                  <button onClick={() => markHandled(c._id)} className="px-3 py-1 bg-primary text-white rounded-md">Mark handled</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminContacts;
