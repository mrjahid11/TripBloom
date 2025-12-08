import React, { useState, useEffect } from 'react';
import { FaComments, FaPaperPlane, FaUsers, FaBullhorn, FaUser, FaSearch } from 'react-icons/fa';

const MessagesAnnouncements = () => {
  const operatorId = localStorage.getItem('userId');
  const [activeTab, setActiveTab] = useState('conversations');
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedTour, setSelectedTour] = useState('');
  const [tours, setTours] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/operator/${operatorId}/dashboard`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTours(data.groupDepartures || []);
      // Fetch all messages for operator's tours
      let allConvs = [];
      for (const tour of data.groupDepartures || []) {
        const msgRes = await fetch(`/api/messages?tourId=${tour._id}`);
        const msgData = await msgRes.json();
        if (msgData.success && Array.isArray(msgData.messages)) {
          allConvs = allConvs.concat(msgData.messages.map(msg => ({
            tourId: tour._id,
            tourName: tour.packageId?.title || 'Tour',
            customerId: msg.recipientId?._id || msg.senderId?._id,
            customerName: msg.recipientId?.fullName || msg.senderId?.fullName || 'Unknown',
            lastMessage: msg.content,
            timestamp: new Date(msg.sentAt),
            unread: 0 // You can implement unread logic if needed
          })));
        }
      }
      // Group by customerId and tourId to get unique chatheads
      const uniqueConvs = [];
      const seen = new Set();
      for (const conv of allConvs) {
        const key = `${conv.customerId}-${conv.tourId}`;
        if (!seen.has(key)) {
          uniqueConvs.push(conv);
          seen.add(key);
        }
      }
      setConversations(uniqueConvs);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadConversation = async (conv) => {
    setSelectedConversation(conv);
    // Fetch messages from backend
    const res = await fetch(`/api/messages?tourId=${conv.tourId}&recipientId=${conv.customerId}`);
    const data = await res.json();
    setMessages((data.messages || []).map(msg => ({
      id: msg._id,
      sender: msg.senderId === operatorId ? 'operator' : 'customer',
      text: msg.content,
      timestamp: new Date(msg.sentAt)
    })));
    setConversations(conversations.map(c => c.id === conv.id ? { ...c, unread: 0 } : c));
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tourId: selectedConversation.tourId,
        senderId: operatorId,
        recipientId: selectedConversation.customerId,
        content: newMessage,
        isBroadcast: false
      })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        setMessages([...messages, {
          id: data.data._id,
          sender: 'operator',
          text: newMessage,
          timestamp: new Date(data.data.sentAt)
        }]);
        setNewMessage('');
        setConversations(conversations.map(c =>
          c.id === selectedConversation.id
            ? { ...c, lastMessage: newMessage, timestamp: new Date() }
            : c
        ));
      }
    });
  };

  const sendBroadcast = () => {
    if (!broadcastMessage.trim() || !selectedTour) {
      alert('Please select a tour and enter a message');
      return;
    }
    if (window.confirm(`Send this message to all travelers on ${tours.find(t => t._id === selectedTour)?.packageId?.title}?`)) {
      fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId: selectedTour,
          senderId: operatorId,
          content: broadcastMessage,
          isBroadcast: true
        })
      }).then(res => res.json()).then(data => {
        if (data.success) {
          alert('✅ Broadcast message sent successfully!');
          setBroadcastMessage('');
          setSelectedTour('');
        }
      });
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))} min ago`;
    } else if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <FaComments className="mr-3 text-orange-600" />
          Messages & Announcements
        </h1>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex items-center px-6 py-4 font-semibold border-b-2 transition-colors ${activeTab === 'conversations' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <FaUser className="mr-2" />
              1-on-1 Conversations
              {conversations.reduce((sum, c) => sum + c.unread, 0) > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {conversations.reduce((sum, c) => sum + c.unread, 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('broadcast')}
              className={`flex items-center px-6 py-4 font-semibold border-b-2 transition-colors ${activeTab === 'broadcast' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <FaBullhorn className="mr-2" />
              Broadcast to Tour
            </button>
          </div>
        </div>
        <div className="p-6">
          {/* Conversations Tab */}
          {activeTab === 'conversations' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Conversation List */}
              <div className="lg:col-span-1 space-y-2">
                <div className="relative mb-4">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                {conversations.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">No conversations yet</p>
                ) : (
                  conversations.map(conv => (
                    <button
                      key={conv.customerId + '-' + conv.tourId}
                      onClick={() => loadConversation(conv)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedConversation?.customerId === conv.customerId && selectedConversation?.tourId === conv.tourId ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-orange-300'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-gray-900 dark:text-white">{conv.customerName}</h4>
                        {conv.unread > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{conv.unread}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{conv.tourName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{conv.lastMessage}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatTime(conv.timestamp)}</p>
                    </button>
                  ))
                )}
              </div>
              {/* Chat Area */}
              <div className="lg:col-span-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                {!selectedConversation ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <FaComments className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">Select a conversation to start messaging</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Chat Header */}
                    <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-4">
                      <h3 className="font-bold text-lg">{selectedConversation.customerName}</h3>
                      <p className="text-sm text-orange-100">{selectedConversation.tourName}</p>
                    </div>
                    {/* Messages */}
                    <div className="h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                      <div className="space-y-3">
                        {messages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.sender === 'operator' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] px-4 py-2 rounded-lg ${msg.sender === 'operator' ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'}`}>
                              <p>{msg.text}</p>
                              <p className={`text-xs mt-1 ${msg.sender === 'operator' ? 'text-orange-100' : 'text-gray-500'}`}>{msg.timestamp.toLocaleTimeString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Input */}
                    <div className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                          onClick={sendMessage}
                          className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold flex items-center"
                        >
                          <FaPaperPlane className="mr-2" />
                          Send
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          {/* Broadcast Tab */}
          {activeTab === 'broadcast' && (
            <div className="max-w-3xl mx-auto">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Tour</label>
                  <select
                    value={selectedTour}
                    onChange={(e) => setSelectedTour(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Choose a tour...</option>
                    {tours.map(tour => (
                      <option key={tour._id} value={tour._id}>
                        {tour.packageId?.title} - {new Date(tour.startDate).toLocaleDateString()} ({tour.bookedSeats} travelers)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Broadcast Message</label>
                  <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Enter your message to all travelers on this tour..."
                    rows="6"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  ></textarea>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This message will be sent via SMS and email to all travelers.</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Examples of broadcast messages:</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                    <li>• "Weather update: Rain expected tomorrow. Please bring umbrellas."</li>
                    <li>• "Meeting point changed to Hotel Main Entrance at 9 AM."</li>
                    <li>• "Don't forget to bring your ID and booking confirmation."</li>
                    <li>• "Tour delayed by 1 hour due to traffic. New departure: 10 AM."</li>
                  </ul>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setBroadcastMessage('');
                      setSelectedTour('');
                    }}
                    className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold"
                  >
                    Clear
                  </button>
                  <button
                    onClick={sendBroadcast}
                    className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold flex items-center"
                  >
                    <FaBullhorn className="mr-2" />
                    Send Broadcast
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesAnnouncements;
