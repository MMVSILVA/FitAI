import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Smile, ImageIcon, Paperclip, MoreVertical, 
  Heart as HeartIcon, CheckCheck, Loader2, X,
  Mic, Camera, Phone, Video, Users, Search
} from 'lucide-react';
import { collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../store/userStore';

interface Message {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  timestamp: any;
  reactions?: Record<string, string[]>;
  fileUrl?: string;
  fileType?: string;
}

export function ChatView({ selectedProfessional: _unused }: { selectedProfessional?: any }) {
  const { user, profile, role } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fixed community chat room
    const q = query(
      collection(db, 'community_messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setMessages(msgs);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!newMessage.trim())) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, 'community_messages'), {
        fromId: user.uid,
        senderName: profile?.displayName || user.email,
        senderPhoto: profile?.photoURL,
        senderRole: role,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        reactions: {}
      });
      setNewMessage('');
    } catch (err) {
      console.error("Error sending community message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    const msgRef = doc(db, 'community_messages', messageId);
    const msg = messages.find(m => (m as any).id === messageId);
    if (!msg) return;

    const reactions = msg.reactions || {};
    const users = reactions[emoji] || [];
    
    if (users.includes(user.uid)) {
      reactions[emoji] = users.filter(id => id !== user.uid);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji] = [...users, user.uid];
    }
    
    await updateDoc(msgRef, { reactions });
  };

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-zinc-950 relative">
      {/* WhatsApp-style Header for Community */}
      <div className="bg-[#075e54] dark:bg-emerald-950 px-4 py-3 flex items-center justify-between shadow-lg z-10 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center border-2 border-white/20">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base leading-tight">Comunidade FitAI</h3>
            <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" /> {messages.length > 0 ? 'Conversando agora' : 'Online'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-emerald-100">
          <Search className="w-5 h-5 cursor-not-allowed opacity-30" />
          <MoreVertical className="w-5 h-5 cursor-pointer" />
        </div>
      </div>

      {/* Messages area with WhatsApp-style background */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 relative"
        style={{
          backgroundImage: `url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-dark-pattern.jpg")`,
          backgroundSize: '400px',
          backgroundBlendMode: 'overlay',
        }}
      >
        <div className="flex justify-center mb-6">
          <span className="bg-[#e1f3fb] dark:bg-zinc-800/80 backdrop-blur px-3 py-1 rounded-lg text-[9px] font-black text-[#54656f] dark:text-gray-400 uppercase tracking-widest shadow-sm border border-[#cce5f0] dark:border-white/5">
            Comunidade aberta: Compartilhe resultados e dicas!
          </span>
        </div>

        {messages.map((msg: any, i) => {
          const isMine = msg.fromId === user?.uid;
          const showSenderInfo = i === 0 || messages[i-1].fromId !== msg.fromId;

          return (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={msg.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}
            >
              <div className={`relative max-w-[85%] sm:max-w-[65%] ${isMine ? 'bg-[#dcf8c6] dark:bg-emerald-900/60' : 'bg-white dark:bg-zinc-800'} p-2 rounded-xl shadow-sm border border-black/5 dark:border-white/5`}>
                {!isMine && showSenderInfo && (
                   <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className={`text-[10px] font-black uppercase tracking-tighter ${
                        msg.senderRole === 'trainer' ? 'text-purple-600' : 
                        msg.senderRole === 'nutritionist' ? 'text-pink-600' : 
                        msg.senderRole === 'admin' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {msg.senderName || 'Usuário'}
                      </span>
                      {msg.senderRole !== 'user' && (
                        <span className="bg-gray-100 dark:bg-zinc-700 px-1 py-0.5 rounded text-[8px] font-bold text-gray-500 uppercase">
                          {msg.senderRole === 'trainer' ? 'PRO' : msg.senderRole}
                        </span>
                      )}
                   </div>
                )}
                
                <p className="text-[13px] px-1 pt-0.5 text-black dark:text-white leading-relaxed font-medium">
                  {msg.text}
                </p>
                
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[9px] text-gray-400 font-bold">
                    {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}
                  </span>
                  {isMine && <CheckCheck className="w-3 h-3 text-blue-500" />}
                </div>

                {/* Actions (Reaction Button) */}
                <div className={`absolute top-0 ${isMine ? '-left-10' : '-right-10'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
                  <button 
                    onClick={() => {
                      const picker = document.getElementById(`reaction-picker-${msg.id}`);
                      if (picker) picker.classList.toggle('hidden');
                    }}
                    className="p-1.5 bg-white dark:bg-zinc-800 rounded-full shadow-sm border border-black/5 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    title="Reagir"
                  >
                    <Smile className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  
                  {/* Reaction Picker Popover */}
                  <div 
                    id={`reaction-picker-${msg.id}`}
                    className="hidden absolute top-8 left-0 bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/10 rounded-2xl p-2 shadow-2xl z-50 flex items-center gap-2"
                  >
                    {['❤️', '👍', '🔥', '💪', '👏'].map(emoji => (
                      <button 
                        key={emoji}
                        onClick={() => {
                          addReaction(msg.id, emoji);
                          document.getElementById(`reaction-picker-${msg.id}`)?.classList.add('hidden');
                        }}
                        className="text-lg hover:scale-125 transition-transform p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reactions UI */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="absolute -bottom-3 left-1 flex items-center gap-1 bg-white dark:bg-zinc-700 rounded-full px-1.5 py-0.5 shadow-sm border border-gray-100 dark:border-white/10 text-[10px]">
                    {Object.entries(msg.reactions as Record<string, string[]>).map(([emoji, users]) => (
                      <span key={emoji}>{emoji} {users.length > 1 ? users.length : ''}</span>
                    ))}
                  </div>
                )}

              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input area */}
      <div className="bg-[#f0f2f5] dark:bg-zinc-900 p-2 sm:p-4 flex items-end gap-2 sm:gap-4 border-t border-black/5">
        <div className="flex items-center gap-1 sm:gap-3 text-[#54656f] dark:text-gray-400 mb-2">
          <Smile 
            className="w-6 h-6 cursor-not-allowed opacity-50"
          />
          <Paperclip className="w-6 h-6 cursor-not-allowed opacity-50" />
        </div>

        <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Mensagem"
            className="flex-1 bg-white dark:bg-black rounded-full px-5 py-2.5 text-[14px] outline-none border-none shadow-sm focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className={`p-3 rounded-full transition-all shadow-md ${
              !newMessage.trim() 
                ? 'bg-gray-400 dark:bg-zinc-800' 
                : 'bg-[#00a884] hover:bg-[#008f6f] active:scale-95'
            } text-white`}
          >
            {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>
        </form>
      </div>
    </div>
  );
}
