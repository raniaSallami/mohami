import React, { useState, useEffect, useRef } from 'react';
import { websocketClient } from '../services/websocketClient';
import { chatService, ChatMessage } from '../services/chatService';
import { storageService } from '../services/storageService';

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const user = storageService.getCurrentUser();

        // Get or create conversation first to get the ID
        const conversation = await chatService.getOrCreateConversation(
          user?.id,
          user?.name,
          user?.email
        );
        setConversationId(conversation.id);

        // Connect WebSocket using conversation ID
        const connectPromise = websocketClient.connect(conversation.id);
        const timeoutPromise = new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        );

        await Promise.race([connectPromise, timeoutPromise]);
        setIsConnecting(false);

        // Load existing messages
        const existingMessages = await chatService.getMessages(conversation.id);

        if (existingMessages.length === 0) {
          const welcomeMessage = await chatService.addMessage(
            conversation.id,
            'admin',
            undefined,
            window.__t("مركز المساعدة"),
            window.__t("مرحباً بك! 👋\n\nنحن هنا لمساعدتك في أي استفسار لديك حول منصة المحامي. لا تتردد في طرح أي سؤال أو إرسال أي ملف تحتاج إلى مراجعته.\n\nكيف يمكننا مساعدتك اليوم؟"),
            []
          );
          setMessages([welcomeMessage]);
        } else {
          setMessages(existingMessages);
        }

        // Listen for new messages
        websocketClient.on('message', (wsMsg) => {
          const msg = wsMsg.data?.message as ChatMessage | undefined;
          if (msg) {
            setMessages(prev => [...prev, msg]);
            scrollToBottom();
          }
        });

        // Listen for history
        websocketClient.on('history', (wsMsg) => {
          if (wsMsg.messages) {
            setMessages(wsMsg.messages as unknown as ChatMessage[]);
            scrollToBottom();
          }
        });

        // Listen for typing
        websocketClient.on('typing', (_wsMsg) => {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        });

      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setIsConnecting(false);
      }
    };

    if (isOpen) {
      initChat();
    }

    return () => {
      websocketClient.disconnect();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    if ((!input.trim() && attachments.length === 0) || !conversationId) return;

    const messageText = input.trim() || window.__t("📎 ملف مرفق");
    setInput('');
    setAttachments([]);

    websocketClient.sendMessage(messageText);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    const user = storageService.getCurrentUser();
    websocketClient.sendTyping(user?.name || 'Guest');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      // typing stopped
    }, 2000);
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 start-6 z-50 w-14 h-14 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
          aria-label="Open chat"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 start-6 z-50 w-96 h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-700">
          {/* Header */}
          <div className="bg-yellow-400 text-slate-900 px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
                <span className="text-yellow-400 font-bold text-lg">{window.__t("م")}</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">{window.__t("مركز المساعدة")}</h3>
                <p className="text-xs text-slate-700">
                  {isConnecting ? window.__t("جاري الاتصال...") : window.__t("دعم المنصة — نحن هنا لمساعدتك")}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-900 hover:text-slate-700 transition"
              aria-label="Close chat"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
            {messages.length === 0 && !isConnecting && (
              <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                <p>{window.__t("مرحباً! كيف يمكننا مساعدتك اليوم؟")}</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    msg.senderType === 'user'
                      ? 'bg-yellow-400 text-slate-900'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{msg.message}</p>

                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.attachments.map((att: any) => (
                        <div key={att.id} className="flex items-center space-x-2 space-x-reverse bg-black/10 dark:bg-white/10 rounded-lg p-2">
                          {att.type?.startsWith('image/') ? (
                            <img
                              src={`data:${att.type};base64,${att.data}`}
                              alt={att.name}
                              className="max-w-[200px] max-h-[150px] rounded object-cover"
                            />
                          ) : (
                            <div className="flex items-center space-x-2 space-x-reverse">
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
                                {window.__t("تحميل")}
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <p className={`text-xs mt-1 ${msg.senderType === 'user' ? 'text-slate-700' : 'text-slate-500'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
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
                  <div key={att.id} className="flex items-center space-x-2 space-x-reverse bg-white dark:bg-slate-700 rounded-lg p-2 text-xs">
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
          <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="flex space-x-2 space-x-reverse">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="chat-file-input"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <label
                htmlFor="chat-file-input"
                className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-3 py-2 rounded-lg transition cursor-pointer flex items-center"
                title={window.__t("إرفاق ملف")}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </label>
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder={window.__t("اكتب رسالتك...")}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                disabled={isConnecting}
              />
              <button
                type="submit"
                disabled={(!input.trim() && attachments.length === 0) || isConnecting}
                className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 px-4 py-2 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};