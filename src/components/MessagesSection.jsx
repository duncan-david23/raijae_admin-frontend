import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from "../lib/supabaseClient";

const MessagesSection = () => {
  // Sample messages data
  const initialMessages = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      message: 'Hello! I wanted to inquire about your premium newsletter subscription and what additional benefits it includes compared to the free version.',
      date: '2024-01-15T14:30:00',
      read: false,
      subject: 'Newsletter Subscription Inquiry'
    },
    {
      id: 2,
      name: 'Michael Chen',
      email: 'michael.chen@tech.com',
      message: 'I really enjoy your weekly newsletter! The content is always insightful and well-researched. Do you have any plans to include more case studies in future editions?',
      date: '2024-01-14T09:15:00',
      read: true,
      subject: 'Feedback on Newsletter Content'
    },
    {
      id: 3,
      name: 'Emma Rodriguez',
      email: 'emma.rodriguez@design.co',
      message: 'I encountered an issue while trying to update my email preferences. The settings page seems to be loading indefinitely. Could you please look into this?',
      date: '2024-01-13T16:45:00',
      read: false,
      subject: 'Technical Issue Report'
    },
    {
      id: 4,
      name: 'David Kim',
      email: 'david.kim@startup.io',
      message: 'Your newsletter has been incredibly valuable for our team. We would like to discuss potential partnership opportunities. Are you available for a call next week?',
      date: '2024-01-12T11:20:00',
      read: true,
      subject: 'Partnership Opportunity'
    },
    {
      id: 5,
      name: 'Lisa Thompson',
      email: 'lisa.t@consulting.com',
      message: 'I accidentally unsubscribed from your newsletter and would like to resubscribe. Could you help me with this process? The content has been very helpful for my research.',
      date: '2024-01-11T08:30:00',
      read: false,
      subject: 'Resubscription Request'
    }
  ];

  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const filteredMessages = messages?.filter(message => 
    message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadCount = messages?.filter(message => !message.read).length;

 const handleMessageClick = async (message) => {
  setSelectedMessage(message);

  if (message.read) return; // ✅ if already read, don't call API

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error("❌ No active session. User not logged in.");
      return;
    }

    // ✅ Send request to backend
    await axios.put(
      "http://192.168.100.126:3001/api/messages/read-message",
      { messageId: message.id }, // ✅ backend expects this in body
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    // ✅ Update UI without refetching
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === message.id ? { ...msg, read: true } : msg
      )
    );
  } catch (error) {
    console.error("❌ Error marking message as read:", error);
  }
};


  const handleBackToList = () => {
    setSelectedMessage(null);
  };

 const handleDeleteMessage = async (id, e) => {
  e.stopPropagation(); // Prevent opening the message when deleting

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error("❌ No active session. User not logged in.");
      return;
    }

    // ✅ Call backend DELETE endpoint
    await axios.delete(
      `http://192.168.100.126:3001/api/messages/delete-message/${id}`, // matches controller expecting req.params.messageId
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    // ✅ Remove from UI
    setMessages((prev) => prev.filter((msg) => msg.id !== id));

    // ✅ If the deleted message was open, clear it
    if (selectedMessage?.id === id) {
      setSelectedMessage(null);
    }

  } catch (error) {
    console.error("❌ Error deleting message:", error);
  }
};


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };


  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const {
              data: { session },
            } = await supabase.auth.getSession();
        
            if (!session) {
              console.error("❌ No active session. User is not logged in.");
              return;
            }

        const response = await axios.get(
          "http://192.168.100.126:3001/api/users/messages/get-messages", {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

       const formattedMessages = response.data.data.map(msg => ({
        ...msg,
        date: msg.created_at,   // ✅ map created_at to date
      }));
        setMessages(formattedMessages);
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);




  return (
    <div className="h-screen bg-gray-50 overflow-auto">
      {/* Luxury Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h1 className="text-xl font-light text-gray-900 tracking-widest">MESSAGES</h1>
            </div>
            
            {/* Unread Counter - Luxury Badge */}
            <div className="flex items-center space-x-6">
              {unreadCount > 0 && (
                <div className="relative">
                  <div className="px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full">
                    {unreadCount} UNREAD
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="text-3xl font-light text-gray-900 mb-2">{messages?.length}</div>
            <div className="text-gray-500 text-sm uppercase tracking-widest">Total Messages</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="text-3xl font-light text-gray-900 mb-2">{unreadCount}</div>
            <div className="text-gray-500 text-sm uppercase tracking-widest">Unread</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="text-3xl font-light text-gray-900 mb-2">{messages?.length - unreadCount}</div>
            <div className="text-gray-500 text-sm uppercase tracking-widest">Read</div>
          </div>
        </div>

        {/* Search Bar - Luxury Design */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search messages, names, or subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-2xl pl-12 pr-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 shadow-sm"
            />
          </div>
        </div>

        {/* Messages Container */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row" style={{ minHeight: '600px', maxHeight: '70vh' }}>
            {/* Messages List */}
            <div className={`lg:w-2/5 border-r border-gray-200 ${selectedMessage ? 'hidden lg:block' : 'block'}`}>
              <div className="h-full overflow-y-auto" style={{ maxHeight: 'calc(70vh - 80px)' }}>
                {filteredMessages?.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-gray-400 text-sm uppercase tracking-widest">
                      No messages found
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredMessages?.map((message) => (
                      <div
                        key={message.id}
                        onClick={() => handleMessageClick(message)}
                        className={`p-6 cursor-pointer transition-all duration-300 group ${
                          selectedMessage?.id === message.id 
                            ? 'bg-gray-50 border-r-2 border-gray-900' 
                            : 'hover:bg-gray-50'
                        } ${!message.read ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-light transition-all duration-300 ${
                              selectedMessage?.id === message.id 
                                ? 'bg-gray-900 text-white' 
                                : 'bg-gray-100 text-gray-700 group-hover:bg-gray-200'
                            }`}>
                              {getInitials(message.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate">
                                {message.name}
                              </h3>
                              <p className="text-sm text-gray-500 truncate">
                                {message.email}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteMessage(message.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-700 transition-all duration-300 p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        
                        <h4 className="font-semibold text-gray-900 mb-2 truncate">
                          {message.subject}
                        </h4>
                        
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                          {message.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 font-light">
                            {formatDate(message.date)}
                          </span>
                          <div className="flex items-center gap-2">
                            {!message.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Message Detail View */}
            <div className={`flex-1 ${selectedMessage ? 'block' : 'hidden lg:block'}`}>
              {selectedMessage ? (
                <div className="h-full flex flex-col">
                  {/* Mobile Back Button */}
                  <div className="lg:hidden border-b border-gray-200 p-4 bg-white sticky top-0 z-10">
                    <button
                      onClick={handleBackToList}
                      className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors text-sm group"
                    >
                      <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                      </svg>
                      BACK TO MESSAGES
                    </button>
                  </div>

                  {/* Message Header */}
                  <div className="border-b border-gray-200 p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center text-white text-lg font-light">
                          {getInitials(selectedMessage.name)}
                        </div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-light text-gray-900 mb-1">
                            {selectedMessage.name}
                          </h2>
                          <p className="text-gray-500 text-base">
                            {selectedMessage.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteMessage(selectedMessage.id, e)}
                        className="text-gray-400 hover:text-gray-700 transition-colors p-3 hover:bg-gray-100 rounded-xl"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div>
                      <h3 className="text-xl font-medium text-gray-900 mb-3">
                        {selectedMessage.subject}
                      </h3>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="font-light">{formatDate(selectedMessage.date)}</span>
                        {!selectedMessage.read && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium">NEW</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-3xl">
                      <div className="prose prose-gray max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg font-light">
                          {selectedMessage.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-light text-gray-900 mb-3 tracking-wide">
                      SELECT A MESSAGE
                    </h3>
                    <p className="text-gray-500 text-sm uppercase tracking-widest">
                      Choose a message to view its contents
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesSection;