import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Sparkles, X, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/Sheet';
import { getWatsonResponse } from '../lib/services/watsonService';
import { useChatHistory, useAddChatMessage } from '../hooks/useChatHistory';

// Simple display message type (without database fields)
interface DisplayMessage {
  role: 'user' | 'ai';
  content: string;
}

export default function ChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Use Supabase hooks for chat history
  const { messages: dbMessages, loading: loadingHistory, error: historyError } = useChatHistory();
  const { addMessage, error: addError } = useAddChatMessage();
  
  // Local messages state for display (combines DB messages with default greeting if empty)
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  
  // Initialize messages from database
  useEffect(() => {
    if (!loadingHistory) {
      if (dbMessages.length === 0) {
        // Show default greeting if no history
        setMessages([
          { role: 'ai', content: "Hi there! I'm your FinSmart AI powered by IBM Watson. I can help you with planning your finance" }
        ]);
      } else {
        // Load messages from database
        setMessages(dbMessages.map(msg => ({ role: msg.role, content: msg.content })));
      }
    }
  }, [dbMessages, loadingHistory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageContent = input;
    const currentHistory = [...messages]; 
    
    // Optimistically add user message to UI
    const userMessage: DisplayMessage = { role: 'user', content: userMessageContent };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Persist user message to database
      await addMessage('user', userMessageContent);
      
      // Get AI response from Watson
      const responseText = await getWatsonResponse(userMessageContent, currentHistory);
      
      // Add AI response to UI
      setMessages((prev) => [...prev, { role: 'ai', content: responseText }]);
      
      // Persist AI response to database
      await addMessage('ai', responseText);
    } catch (error) {
      console.error('Error in chat:', error);
      const errorMessage = "Sorry, I encountered an error. Please try again.";
      setMessages((prev) => [...prev, { role: 'ai', content: errorMessage }]);
      
      // Try to persist error message to database (best effort)
      try {
        await addMessage('ai', errorMessage);
      } catch (persistError) {
        console.error('Failed to persist error message:', persistError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Manual Trigger Button */}
      <Button 
        className="h-14 w-14 rounded-full shadow-xl shadow-indigo-500/20" 
        size="icon"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="h-7 w-7" />
      </Button>

      {/* Chat Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-[400px]">
          <SheetHeader className="relative border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="text-left">
                <SheetTitle>FinSmart Assistant</SheetTitle>
                <p className="text-xs text-slate-500">Powered by IBM Watson</p>
              </div>
            </div>
            <Button 
              className="absolute right-4 top-4 h-8 w-8 text-slate-500 hover:text-slate-900" 
              size="icon" 
              variant="ghost"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
            {/* Error display */}
            {(historyError || addError) && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-xs">{historyError || addError}</p>
                </div>
              </div>
            )}
            
            {/* Loading state */}
            {loadingHistory && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  <span>Loading chat history...</span>
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex w-max max-w-[85%] flex-col gap-1 ${
                    m.role === 'user' ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm ${
                      m.role === 'user'
                        ? 'bg-slate-900 text-slate-50'
                        : 'bg-white text-slate-700 shadow-sm'
                    }`}
                  >
                    {m.content}
                  </div>
                  <span className="px-1 text-[10px] text-slate-400">
                    {m.role === 'user' ? 'You' : 'AI Coach'}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div className="flex w-max max-w-[85%] items-start gap-2 self-start">
                   <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
                    <Sparkles className="h-4 w-4 animate-pulse text-indigo-500" />
                   </div>
                   <div className="flex items-center gap-1 rounded-2xl bg-white px-4 py-3 shadow-sm">
                     <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></span>
                     <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></span>
                     <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></span>
                   </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </div>

          <div className="border-t bg-white p-4">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                placeholder="Ask about your spending..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="rounded-full border-slate-200 focus-visible:ring-slate-900"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="rounded-full h-10 w-10 shrink-0"
                disabled={isLoading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
