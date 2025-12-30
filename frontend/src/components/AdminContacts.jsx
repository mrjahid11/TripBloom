import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaCheck } from 'react-icons/fa';
import AdminChat from './AdminChat';

const AdminContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [chatUser, setChatUser] = useState(null);

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

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (Array.isArray(data)) {
          // keep customers and operators
          const list = data.filter(u => ['CUSTOMER','USER','TOUR_OPERATOR','OPERATOR'].includes((u.role||'').toUpperCase()) || (u.role||'').toUpperCase() === 'ADMIN' ? false : true);
          setUsers(data);
        } else if (data && data.users) {
          setUsers(data.users);
        }
      } catch (err) {
        console.error('Failed to load users', err);
      }
    };
    loadUsers();
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

  // Auto-select chat user from query param (from notification click)
  useEffect(() => {
    if (users.length === 0) return;
    const params = new URLSearchParams(location.search);
    const chatUserId = params.get('chatUserId');
    if (chatUserId && !chatUser) {
      const foundUser = users.find(u => u._id === chatUserId);
      if (foundUser) {
        setChatUser(foundUser);
      }
    }
  }, [location.search, users]);

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Contact Messages</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage customer inquiries and live chat</p>
      </div>
      {error && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Messages Column */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-green-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Inbox</h3>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  <p className="mt-2 font-medium">No messages yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contacts.map(c => (
                    <div id={`contact-${c._id}`} key={c._id} className={`p-4 rounded-xl border-l-4 transition-all hover:shadow-md ${c.handled ? 'bg-gray-50 dark:bg-gray-700/50 border-l-gray-400' : 'bg-white dark:bg-gray-700 border-l-red-500 shadow-sm'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${c.handled ? 'bg-gray-400' : 'bg-gradient-to-br from-primary to-green-600'}`}>
                            {(c.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{c.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{c.email}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{new Date(c.createdAt).toLocaleString()}</div>
                          </div>
                        </div>
                        <div>
                          {c.handled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                              <FaCheck className="text-[10px]" /> Handled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                              New
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 ml-13 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 rounded-lg p-3">{c.message}</div>
                      {!c.handled && (
                        <div className="mt-3 ml-13">
                          <button onClick={() => markHandled(c._id)} className="px-4 py-1.5 bg-gradient-to-r from-primary to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow">
                            Mark handled
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Chat Column */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
              <h3 className="text-lg font-semibold text-white">Live Chat</h3>
              <p className="text-blue-100 text-sm">Select a user to start</p>
            </div>
            <div className="p-4">
              <div className="max-h-48 overflow-y-auto space-y-1 mb-4">
                {users.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No users loaded</div>
                ) : (
                  users.slice(0, 10).map(u => (
                    <button
                      key={u._id}
                      onClick={() => setChatUser(u)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 ${chatUser && chatUser._id === u._id ? 'bg-gradient-to-r from-primary to-green-600 text-white shadow-md' : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${chatUser && chatUser._id === u._id ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                        {(u.fullName || u.name || u.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm truncate ${chatUser && chatUser._id === u._id ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                          {u.fullName || u.name || u.email}
                        </div>
                        <div className={`text-xs truncate ${chatUser && chatUser._id === u._id ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}>
                          {Array.isArray(u.roles) ? u.roles.join(', ') : u.role || 'User'}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {chatUser ? (
                <AdminChat currentUserId={localStorage.getItem('userId')} otherUserId={chatUser._id} otherName={chatUser.fullName || chatUser.name || chatUser.email} />
              ) : (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <svg className="mx-auto h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <p className="text-sm">Select a user to chat</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContacts;
