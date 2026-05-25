import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, RefreshCw, LogOut, User as UserIcon, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAccessToken, googleSignIn, logout, initAuth } from '../lib/auth';
import type { User } from 'firebase/auth';

interface Space {
  name: string;
  displayName: string;
  type: string;
}

interface Message {
  name: string;
  text: string;
  createTime: string;
  sender: {
    displayName: string;
  };
}

export default function GoogleChatScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u, t) => {
        setUser(u);
        setToken(t);
        fetchSpaces(t);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        fetchSpaces(result.accessToken);
      }
    } catch (err: any) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setSpaces([]);
    setSelectedSpace(null);
    setMessages([]);
  };

  const fetchSpaces = async (accessToken: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('https://chat.googleapis.com/v1/spaces', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to fetch spaces');
      const data = await res.json();
      setSpaces(data.spaces || []);
    } catch (err: any) {
      setError('Failed to load chat spaces.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedSpace || !newMessage.trim() || !token) return;

    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${selectedSpace.name}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newMessage }),
      });

      if (!res.ok) throw new Error('Failed to send message');
      
      setNewMessage('');
      // In a real app, we'd poll or use webhooks, but for now we'll just confirm it sent
      alert('Message sent successfully to Google Chat!');
    } catch (err: any) {
      setError('Failed to send message.');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full">
        <div className="w-20 h-20 bg-neon-blue/10 rounded-full flex items-center justify-center mb-6">
          <MessageCircle className="w-10 h-10 text-neon-blue" />
        </div>
        <h2 className="text-2xl font-display font-bold text-white mb-2 uppercase tracking-tight">Connect Google Chat</h2>
        <p className="text-sm text-gray-400 font-mono mb-8 max-w-sm">
          Integrate your hardware telemetry diagnostic reports directly into your workplace chat spaces for collaborative debugging.
        </p>
        
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-xl font-bold transition-all hover:bg-gray-200 disabled:opacity-50"
        >
          {isLoggingIn ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.87-2.6 3.3-4.51 6.16-4.51z" />
            </svg>
          )}
          <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-neon-blue/30 overflow-hidden">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" />
            ) : (
              <UserIcon className="w-full h-full p-2 text-gray-500" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase">{user.displayName}</h3>
            <p className="text-[10px] font-mono text-neon-blue uppercase">G-Chat Node Active</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-gray-500 hover:text-neon-red transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1">
        {/* Spaces Sidebar */}
        <div className="md:col-span-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 overflow-y-auto max-h-[500px]">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Active Spaces</span>
            <button onClick={() => token && fetchSpaces(token)} className="hover:text-neon-blue transition-colors">
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {spaces.length === 0 && !isLoading && (
            <div className="text-[10px] text-gray-600 font-mono text-center py-8">
              No spaces detected.
            </div>
          )}

          {spaces.map(space => (
            <button
              key={space.name}
              onClick={() => setSelectedSpace(space)}
              className={`text-left p-3 rounded-xl transition-all border ${
                selectedSpace?.name === space.name 
                  ? 'bg-neon-blue/10 border-neon-blue text-white shadow-[0_0_10px_rgba(0,240,255,0.1)]' 
                  : 'border-transparent text-gray-500 hover:bg-slate-800/50'
              }`}
            >
              <div className="text-[11px] font-bold uppercase truncate">{space.displayName || 'Direct Message'}</div>
              <div className="text-[9px] font-mono opacity-60 uppercase">{space.type === 'ROOM' ? '# Space' : '@ Direct'}</div>
            </button>
          ))}
        </div>

        {/* Messaging Area */}
        <div className="md:col-span-3 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3">
             <div className="text-[9px] font-mono text-gray-600 uppercase">Secure Link #4412</div>
          </div>

          {!selectedSpace ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
              <MessageSquare className="w-12 h-12 mb-4" />
              <p className="text-xs font-mono uppercase">Select a space to transmit telemetry</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">{selectedSpace.displayName}</h4>
                <p className="text-[10px] text-neon-blue font-mono uppercase mt-1">Status: Open Frequency</p>
              </div>

              <div className="flex-1 mb-6 bg-[#03070d]/50 rounded-xl border border-slate-850 p-4 font-mono text-[11px] text-gray-400 overflow-y-auto">
                <div className="space-y-4">
                  <div className="border-l-2 border-neon-blue/30 pl-3">
                    <span className="text-neon-blue">[SYSTEM]</span> Ready to broadcast diagnostic data. Use the input below to send manual reports or status updates to this space.
                  </div>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type telemetry report or message..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-white placeholder-gray-600 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all outline-none resize-none"
                  rows={4}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="absolute bottom-4 right-4 bg-neon-blue text-black p-2 rounded-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-neon-red/10 border border-neon-red/30 p-3 rounded-lg text-neon-red text-[10px] font-mono text-center">
          ERROR: {error}
        </div>
      )}
    </div>
  );
}
