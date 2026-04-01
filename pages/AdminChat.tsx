import React, { useState, useEffect, useRef } from 'react';
import { websocketClient } from '../services/websocketClient';
import { chatService, ChatConversation, ChatMessage } from '../services/chatService';

export const AdminChat: React.FC = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [attachments, setAttachments] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentConversationRef = useRef<string | null>(null);

  useEffect(() => {
    loadConversations();
    initWebSocket();

    return () => {
      websocketClient.disconnect();
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      currentConversationRef.current = selectedConversation.id;
      loadConversationMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const convs = await chatService.getAllConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const initWebSocket = async () => {
    try {
      // Connect to a general admin channel
      await websocketClient.connect('admin');
      setIsConnecting(false);

      // Listen for new messages
      websocketClient.on('message', (wsMsg) => {
        const msg = wsMsg.data?.message as ChatMessage | undefined;
        if (msg) {
          if (msg.conversationId === currentConversationRef.current) {
            setMessages(prev => [...prev, msg]);
          }
          loadConversations();
        }
      });

      // Listen for message history
      websocketClient.on('history', (wsMsg) => {
        if (wsMsg.messages) {
          setMessages(wsMsg.messages as unknown as ChatMessage[]);
          scrollToBottom();
        }
      });

      // Listen for typing indicator
      websocketClient.on('typing', (wsMsg) => {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setIsConnecting(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const conversation = await chatService.getConversationWithMessages(conversationId);
      setMessages(conversation.messages);
      await chatService.markMessagesAsRead(conversationId, 'admin');
      scrollToBottom();
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const attachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64.split(',')[1] || base64,
        };
        setAttachments(prev => [...prev, attachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || !selectedConversation) return;

    const messageText = input.trim() || '📎 ملف مرفق';
    setInput('');
    setAttachments([]);

    // Send via WebSocket
    websocketClient.sendMessage(messageText);

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    if (!selectedConversation) return;

    websocketClient.sendTyping('Admin');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      // Typing stopped - no explicit stop method in current websocketClient
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Conversations List */}
      <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">المحادثات</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {conversations.length} محادثة نشطة
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400">
              <p>لا توجد محادثات نشطة</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 text-right border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition ${
                  selectedConversation?.id === conv.id
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-r-4 border-r-yellow-500'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {conv.lastMessageAt
                      ? new Date(conv.lastMessageAt).toLocaleTimeString('ar', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  {conv.userId ? conv.userName || 'مستخدم متصل' : conv.userName || 'ضيف'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {conv.userEmail || (conv.userId ? '—' : 'بريد غير متوفر')}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    {selectedConversation.userId
                      ? selectedConversation.userName || 'مستخدم متصل'
                      : selectedConversation.userName || 'ضيف'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedConversation.userEmail || (selectedConversation.userId ? '—' : 'بريد غير متوفر')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    chatService.closeConversation(selectedConversation.id);
                    loadConversations();
                    setSelectedConversation(null);
                  }}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition"
                >
                  إغلاق المحادثة
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      msg.senderType === 'admin'
                        ? 'bg-yellow-400 text-slate-900'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{msg.message}</p>

                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.attachments.map((att: any) => (
                          <div
                            key={att.id}
                            className="flex items-center space-x-2 space-x-reverse bg-black/10 dark:bg-white/10 rounded-lg p-2"
                          >
                            {att.type?.startsWith('image/') ? (
                              <img
                                src={`data:${att.type};base64,${att.data}`}
                                alt={att.name}
                                className="max-w-[200px] max-h-[150px] rounded object-cover"
                              />
                            ) : (
                              <div className="flex items-center space-x-2 space-x-reverse w-full">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{att.name}</p>
                                  <p className="text-xs opacity-75">{(att.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <a
                                  href={`data:${att.type};base64,${att.data}`}
                                  download={att.name}
                                  className="text-xs bg-yellow-400 hover:bg-yellow-300 px-2 py-1 rounded transition"
                                >
                                  تحميل
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <p className={`text-xs mt-1 ${msg.senderType === 'admin' ? 'text-slate-700' : 'text-slate-500'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('ar', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl px-4 py-2 border border-slate-200 dark:border-slate-700">
                    <div className="flex space-x-1 space-x-reverse">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="px-4 pt-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center space-x-2 space-x-reverse bg-white dark:bg-slate-700 rounded-lg p-2 text-xs"
                    >
                      <span className="truncate max-w-[150px]">{att.name}</span>
                      <button onClick={() => removeAttachment(att.id)} className="text-red-500 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <div className="flex space-x-2 space-x-reverse">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="admin-chat-file-input"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <label
                  htmlFor="admin-chat-file-input"
                  className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-3 py-2 rounded-lg transition cursor-pointer flex items-center"
                  title="إرفاق ملف"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </label>
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="اكتب ردك..."
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  disabled={isConnecting}
                />
                <button
                  type="submit"
                  disabled={(!input.trim() && attachments.length === 0) || isConnecting}
                  className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 px-6 py-2 rounded-lg transition"
                >
                  إرسال
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-500 dark:text-slate-400">
              <p className="text-lg mb-2">اختر محادثة للبدء</p>
              <p className="text-sm">اختر محادثة من القائمة الجانبية للرد على المستخدمين</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};