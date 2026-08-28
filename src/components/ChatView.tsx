import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Smile, Paperclip, MoreVertical, 
  CheckCheck, Loader2, X, Trash2, Edit3, 
  Copy, Reply, AlertTriangle, Search, 
  FileText, Download, Eye, CornerDownRight,
  Sparkles, Dumbbell, Apple, Heart, Flame,
  Camera, File as FileIcon, ChevronDown, Check,
  Users
} from 'lucide-react';
import { 
  collection, addDoc, onSnapshot, query, 
  orderBy, serverTimestamp, updateDoc, 
  doc, deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../store/userStore';

export interface ChatMessage {
  id: string;
  fromId: string;
  toId?: string;
  senderName?: string;
  senderPhoto?: string;
  senderRole?: string;
  text: string;
  timestamp: any;
  reactions?: Record<string, string[]>;
  isEdited?: boolean;
  editedAt?: any;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  replyTo?: {
    id: string;
    text: string;
    senderName?: string;
  };
}

interface ChatViewProps {
  selectedProfessional?: any;
  onBack?: () => void;
}

// WhatsApp-style Emoji sets
const EMOJI_CATEGORIES = [
  {
    id: 'faces',
    label: 'Expressões',
    icon: '😀',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😜', '🤪', '😎', '🤩', '🥳', '🥺', '😴', '🤯', '🥵', '🥶', '🤠', '😈', '🤫', '🤔', '🤗', '🤭']
  },
  {
    id: 'fitness',
    label: 'Treino & Esportes',
    icon: '💪',
    emojis: ['💪', '🏋️‍♂️', '🏋️‍♀️', '🏃‍♂️', '🏃‍♀️', '🚴‍♂️', '🚴‍♀️', '🧘‍♂️', '🧘‍♀️', '🏊‍♂️', '🥊', '🥋', '🏆', '🥇', '🥈', '🥉', '⚡', '🔥', '💥', '💯', '🎯', '⏱️', '👟', '🩸', '💦', '📈']
  },
  {
    id: 'food',
    label: 'Dieta & Nutrição',
    icon: '🥗',
    emojis: ['🥗', '🥑', '🥦', '🥩', '🍗', '🍳', '🍌', '🍎', '🍓', '🍚', '🥛', '🥤', '🥪', '🥕', '🥜', '💧', '☕', '🍵', '🥝', '🫐', '🍇', '🍉', '🍠', '🥚']
  },
  {
    id: 'gestures',
    label: 'Gestos & Corações',
    icon: '❤️',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💖', '👍', '👎', '👏', '🙌', '🤝', '👊', '✌️', '🤞', '🙏', '✨', '⭐', '🔥', '✅', '❌', '🚀']
  }
];

export function ChatView({ selectedProfessional, onBack }: ChatViewProps) {
  const { user, profile, role } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [replyingMessage, setReplyingMessage] = useState<ChatMessage | null>(null);
  
  // UI Panels
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState('faces');
  const [emojiSearch, setEmojiSearch] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  
  // Attachments pending send
  const [pendingFile, setPendingFile] = useState<{
    dataUrl: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);

  // Lightbox / Media Viewer
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Delete modal
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [activeReactionPickerId, setActiveReactionPickerId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const isDirectChat = Boolean(selectedProfessional);
  const targetCollection = isDirectChat ? 'messages' : 'community_messages';

  // Real-time messages listener
  useEffect(() => {
    if (!user) return;

    let q = query(
      collection(db, targetCollection),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      
      if (isDirectChat && selectedProfessional) {
        // Filter messages between logged in user and selected professional
        const proId = selectedProfessional.id || selectedProfessional.uid;
        msgs = msgs.filter(m => 
          (m.fromId === user.uid && m.toId === proId) ||
          (m.fromId === proId && m.toId === user.uid)
        );
      }

      // Sort chronologically
      msgs.sort((a, b) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
        return timeA - timeB;
      });

      setMessages(msgs);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }, (err) => {
      console.warn(`Error onSnapshot for ${targetCollection}:`, err.message);
    });

    return () => unsubscribe();
  }, [user, isDirectChat, selectedProfessional?.id, selectedProfessional?.uid, targetCollection]);

  // Click outside listener for dropdowns & emoji
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.chat-dropdown-container') && !target.closest('.reaction-picker-container')) {
        setOpenDropdownId(null);
        setActiveReactionPickerId(null);
      }
      if (!target.closest('.emoji-picker-container') && !target.closest('.emoji-toggle-btn')) {
        setShowEmojiPicker(false);
      }
      if (!target.closest('.attach-menu-container') && !target.closest('.attach-toggle-btn')) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Format File Size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle File Selection with compression for images
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('O arquivo selecionado é maior que 8MB. Por favor escolha um arquivo menor.');
      return;
    }

    setShowAttachMenu(false);

    if (isImage) {
      // Compress/resize image to fit nicely within Firestore limits
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

          setPendingFile({
            dataUrl: compressedDataUrl,
            name: file.name,
            type: 'image/jpeg',
            size: Math.round(compressedDataUrl.length * 0.75)
          });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPendingFile({
          dataUrl: event.target?.result as string,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size
        });
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    e.target.value = '';
  };

  // Send or Update message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedText = newMessage.trim();
    if (!trimmedText && !pendingFile) return;

    setIsSending(true);
    try {
      if (editingMessage) {
        // EDIT MODE
        const msgRef = doc(db, targetCollection, editingMessage.id);
        await updateDoc(msgRef, {
          text: trimmedText,
          isEdited: true,
          editedAt: serverTimestamp()
        });
        setEditingMessage(null);
        setNewMessage('');
      } else {
        // NEW MESSAGE MODE
        const payload: Record<string, any> = {
          fromId: user.uid,
          senderName: profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Usuário',
          senderPhoto: profile?.photoURL || user.photoURL || null,
          senderRole: role || 'user',
          text: trimmedText,
          timestamp: serverTimestamp(),
          reactions: {}
        };

        if (isDirectChat && selectedProfessional) {
          const proId = selectedProfessional.id || selectedProfessional.uid;
          payload.toId = proId;
          payload.participants = [user.uid, proId];
        }

        if (pendingFile) {
          payload.fileUrl = pendingFile.dataUrl;
          payload.fileName = pendingFile.name;
          payload.fileType = pendingFile.type;
          payload.fileSize = pendingFile.size;
        }

        if (replyingMessage) {
          payload.replyTo = {
            id: replyingMessage.id,
            text: replyingMessage.text || (replyingMessage.fileName ? `[Arquivo] ${replyingMessage.fileName}` : ''),
            senderName: replyingMessage.senderName || 'Usuário'
          };
        }

        await addDoc(collection(db, targetCollection), payload);
        setNewMessage('');
        setPendingFile(null);
        setReplyingMessage(null);
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      alert("Não foi possível enviar a mensagem. Verifique sua conexão.");
    } finally {
      setIsSending(false);
    }
  };

  // Start Editing
  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessage(msg);
    setNewMessage(msg.text || '');
    setReplyingMessage(null);
    setPendingFile(null);
    setOpenDropdownId(null);
    textInputRef.current?.focus();
  };

  // Cancel Editing
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setNewMessage('');
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!messageToDelete || !user) return;
    try {
      await deleteDoc(doc(db, targetCollection, messageToDelete.id));
      setMessageToDelete(null);
    } catch (err) {
      console.error("Erro ao deletar mensagem:", err);
      alert("Não foi possível apagar a mensagem.");
    }
  };

  // Toggle Emoji Reaction
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    try {
      const msgRef = doc(db, targetCollection, messageId);
      const msg = messages.find(m => m.id === messageId);
      if (!msg) return;

      const currentReactions: Record<string, string[]> = { ...(msg.reactions || {}) };
      const usersForEmoji = currentReactions[emoji] || [];

      if (usersForEmoji.includes(user.uid)) {
        // Remove reaction
        const updated = usersForEmoji.filter(uid => uid !== user.uid);
        if (updated.length === 0) {
          delete currentReactions[emoji];
        } else {
          currentReactions[emoji] = updated;
        }
      } else {
        // Add reaction
        currentReactions[emoji] = [...usersForEmoji, user.uid];
      }

      await updateDoc(msgRef, { reactions: currentReactions });
      setActiveReactionPickerId(null);
      setOpenDropdownId(null);
    } catch (err) {
      console.error("Erro ao atualizar reação:", err);
    }
  };

  // Report message
  const handleReport = async (msg: ChatMessage) => {
    if (!user) return;
    setOpenDropdownId(null);
    try {
      await addDoc(collection(db, 'reports'), {
        messageId: msg.id,
        messageText: msg.text || '',
        reportedUserId: msg.fromId,
        reporterId: user.uid,
        reporterEmail: user.email,
        collection: targetCollection,
        timestamp: serverTimestamp()
      });
      alert('Mensagem denunciada aos moderadores. Obrigado por manter a comunidade segura!');
    } catch (err) {
      console.error("Erro ao denunciar:", err);
    }
  };

  // Copy text to clipboard
  const handleCopyText = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setOpenDropdownId(null);
  };

  // Filter messages by search query
  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => 
        (m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.fileName && m.fileName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.senderName && m.senderName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : messages;

  return (
    <div className="flex flex-col h-full bg-[#efeae2] dark:bg-[#0b141a] relative select-text overflow-hidden">
      
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={imageInputRef} 
        onChange={(e) => handleFileChange(e, true)} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={(e) => handleFileChange(e, false)} 
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" 
        className="hidden" 
      />

      {/* WhatsApp Header */}
      <div className="bg-[#008069] dark:bg-[#202c33] px-3 sm:px-4 py-2.5 flex items-center justify-between shadow-md z-20 text-white shrink-0 border-b border-black/10">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button onClick={onBack} className="md:hidden p-1 hover:bg-white/10 rounded-full">
              <ChevronDown className="w-6 h-6 rotate-90" />
            </button>
          )}

          <div className="relative shrink-0">
            {isDirectChat ? (
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 border-2 border-white/30 shadow-sm">
                <img 
                  src={selectedProfessional?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedProfessional?.name || 'Pro'}`} 
                  alt="avatar" 
                  className="w-full h-full object-cover" 
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center border-2 border-white/30 shadow-sm">
                <Users className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#008069] dark:border-[#202c33] rounded-full" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm sm:text-base leading-tight truncate">
              {isDirectChat ? (selectedProfessional?.name || selectedProfessional?.displayName || 'Profissional') : 'Comunidade FitAI'}
            </h3>
            <p className="text-[11px] text-emerald-100 dark:text-gray-300 font-medium truncate flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse shrink-0" />
              {isDirectChat ? 'Online • Atendimento' : 'Chat Geral da Comunidade'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-emerald-100 dark:text-gray-300">
          <button 
            onClick={() => setShowSearchBar(prev => !prev)}
            className={`p-2 rounded-full hover:bg-white/10 transition-colors ${showSearchBar ? 'bg-white/20 text-white' : ''}`}
            title="Pesquisar mensagens"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* WhatsApp Search Bar (collapsible) */}
      <AnimatePresence>
        {showSearchBar && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#f0f2f5] dark:bg-[#111b21] px-4 py-2 border-b border-gray-200 dark:border-white/10 flex items-center gap-2 shrink-0 z-10"
          >
            <div className="flex-1 flex items-center gap-2 bg-white dark:bg-[#202c33] rounded-lg px-3 py-1.5 shadow-sm">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar nesta conversa..."
                className="w-full bg-transparent text-sm text-black dark:text-white outline-none"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-0.5 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button 
              onClick={() => { setShowSearchBar(false); setSearchQuery(''); }}
              className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white px-2"
            >
              Fechar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Canvas with WhatsApp doodle wallpaper */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2 relative"
        style={{
          backgroundImage: `radial-gradient(#0000000a 1px, transparent 1px), radial-gradient(#0000000a 1px, #efeae2 1px)`,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px'
        }}
      >
        {/* Security & Guidance Pill */}
        <div className="flex justify-center my-3">
          <div className="bg-[#ffeecd] dark:bg-[#182229] border border-[#f5c378]/30 dark:border-white/5 px-4 py-1.5 rounded-xl shadow-xs max-w-md text-center">
            <p className="text-[11px] text-[#54656f] dark:text-[#8696a0] font-medium leading-relaxed flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              {isDirectChat ? 'Mensagens com seu profissional de saúde e treino.' : 'Comunidade FitAI: troque experiências, dúvidas e motivação!'}
            </p>
          </div>
        </div>

        {filteredMessages.length === 0 && (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Nenhuma mensagem encontrada para a busca.' : 'Nenhuma mensagem ainda. Envie um "Olá!" para começar.'}
            </p>
          </div>
        )}

        {filteredMessages.map((msg, idx) => {
          const isMine = msg.fromId === user?.uid;
          const showSender = !isDirectChat && (!isMine) && (idx === 0 || filteredMessages[idx - 1].fromId !== msg.fromId);
          const isDropdownOpen = openDropdownId === msg.id;
          const isReactionPickerOpen = activeReactionPickerId === msg.id;

          // Message time
          let timeFormatted = '';
          try {
            if (msg.timestamp?.toDate) {
              timeFormatted = msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (msg.timestamp) {
              timeFormatted = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
          } catch {
            timeFormatted = '';
          }

          return (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={msg.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'} group relative`}
            >
              <div 
                className={`relative max-w-[90%] sm:max-w-[75%] md:max-w-[65%] rounded-2xl p-2.5 sm:px-3.5 sm:py-2 shadow-xs transition-shadow ${
                  isMine 
                    ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-xs' 
                    : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-xs'
                } border border-black/[0.04] dark:border-white/[0.04]`}
              >
                {/* Sender Header (Community mode) */}
                {showSender && (
                  <div className="flex items-center gap-1.5 mb-1 px-0.5">
                    <span className={`text-[11px] font-black tracking-tight ${
                      msg.senderRole === 'trainer' ? 'text-purple-600 dark:text-purple-400' :
                      msg.senderRole === 'nutritionist' ? 'text-pink-600 dark:text-pink-400' :
                      msg.senderRole === 'admin' ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {msg.senderName || 'Usuário'}
                    </span>
                    {msg.senderRole && msg.senderRole !== 'user' && (
                      <span className="bg-black/5 dark:bg-white/10 px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider">
                        {msg.senderRole === 'trainer' ? 'Personal' : msg.senderRole}
                      </span>
                    )}
                  </div>
                )}

                {/* Quoted / Reply Preview */}
                {msg.replyTo && (
                  <div className="mb-2 p-2 rounded-lg bg-black/5 dark:bg-black/20 border-l-3 border-[#00a884] text-xs">
                    <p className="font-bold text-[10px] text-[#00a884] truncate">{msg.replyTo.senderName}</p>
                    <p className="text-gray-600 dark:text-gray-300 truncate text-[11px]">{msg.replyTo.text}</p>
                  </div>
                )}

                {/* Image Attachment */}
                {msg.fileUrl && msg.fileType?.startsWith('image/') && (
                  <div className="mb-2 rounded-xl overflow-hidden cursor-pointer group/img relative" onClick={() => setLightboxImage(msg.fileUrl || null)}>
                    <img 
                      src={msg.fileUrl} 
                      alt={msg.fileName || "Foto anexada"} 
                      className="max-h-72 w-full object-cover rounded-xl hover:opacity-95 transition-opacity" 
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="bg-black/60 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> Ampliar
                      </span>
                    </div>
                  </div>
                )}

                {/* Document Attachment */}
                {msg.fileUrl && !msg.fileType?.startsWith('image/') && (
                  <div className="mb-2 p-3 bg-black/5 dark:bg-black/30 rounded-xl border border-black/5 dark:border-white/5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-black dark:text-white truncate">{msg.fileName || 'Documento'}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{formatFileSize(msg.fileSize)}</p>
                      </div>
                    </div>
                    <a 
                      href={msg.fileUrl} 
                      download={msg.fileName || 'arquivo'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-[#00a884] hover:bg-[#008f6f] text-white transition-colors shrink-0"
                      title="Baixar arquivo"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {/* Message Body Text */}
                {msg.text && (
                  <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words px-0.5">
                    {msg.text}
                  </p>
                )}

                {/* Footer: timestamp, edited status, checks & dropdown trigger */}
                <div className="flex items-center justify-end gap-1.5 mt-1 select-none">
                  {msg.isEdited && (
                    <span className="text-[9px] italic text-[#54656f] dark:text-[#8696a0] font-medium">
                      (editada)
                    </span>
                  )}
                  <span className="text-[10px] text-[#54656f] dark:text-[#8696a0] font-normal">
                    {timeFormatted}
                  </span>
                  {isMine && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                </div>

                {/* Message Menu Trigger (Chevron arrow on hover) */}
                <div className="chat-dropdown-container absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(isDropdownOpen ? null : msg.id);
                      setActiveReactionPickerId(null);
                    }}
                    className="p-1 rounded-full bg-white/80 dark:bg-[#202c33]/90 shadow-xs hover:bg-white dark:hover:bg-[#2a3942] text-gray-600 dark:text-gray-300 transition-all"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Context Menu Dropdown */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-6 w-48 bg-white dark:bg-[#233138] rounded-xl shadow-2xl border border-black/10 dark:border-white/10 py-1.5 z-50 text-xs text-gray-700 dark:text-gray-200">
                      <button 
                        onClick={() => {
                          setActiveReactionPickerId(msg.id);
                          setOpenDropdownId(null);
                        }}
                        className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left"
                      >
                        <Smile className="w-4 h-4 text-amber-500" />
                        <span>Reagir</span>
                      </button>

                      <button 
                        onClick={() => {
                          setReplyingMessage(msg);
                          setEditingMessage(null);
                          setOpenDropdownId(null);
                          textInputRef.current?.focus();
                        }}
                        className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left"
                      >
                        <Reply className="w-4 h-4 text-blue-500" />
                        <span>Responder</span>
                      </button>

                      {msg.text && (
                        <button 
                          onClick={() => handleCopyText(msg.text)}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left"
                        >
                          <Copy className="w-4 h-4 text-gray-500" />
                          <span>Copiar texto</span>
                        </button>
                      )}

                      {/* EDIT OPTION - If author */}
                      {isMine && msg.text && (
                        <button 
                          onClick={() => handleStartEdit(msg)}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-semibold transition-colors text-left"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Editar mensagem</span>
                        </button>
                      )}

                      {/* DELETE OPTION - If author or admin */}
                      {(isMine || role === 'admin') && (
                        <button 
                          onClick={() => {
                            setMessageToDelete(msg);
                            setOpenDropdownId(null);
                          }}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 font-semibold transition-colors text-left"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Apagar mensagem</span>
                        </button>
                      )}

                      {!isMine && (
                        <button 
                          onClick={() => handleReport(msg)}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 transition-colors text-left"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span>Denunciar</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Reaction Picker Bar */}
                {isReactionPickerOpen && (
                  <div className="reaction-picker-container absolute -top-10 left-0 bg-white dark:bg-[#202c33] border border-black/10 dark:border-white/10 rounded-full px-2.5 py-1 shadow-xl z-40 flex items-center gap-1.5 animate-in fade-in zoom-in-95">
                    {['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '💪'].map(emoji => (
                      <button 
                        key={emoji}
                        onClick={() => toggleReaction(msg.id, emoji)}
                        className="text-lg hover:scale-130 transition-transform p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Reactions Pill under bubble */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="absolute -bottom-3.5 left-2 flex items-center gap-1 bg-white dark:bg-[#202c33] rounded-full px-2 py-0.5 shadow-md border border-black/5 dark:border-white/10 text-[11px] z-10">
                    {Object.entries(msg.reactions).map(([emoji, rawUsers]) => {
                      const userList = Array.isArray(rawUsers) ? (rawUsers as string[]) : [];
                      if (userList.length === 0) return null;
                      return (
                        <button 
                          key={emoji} 
                          onClick={() => toggleReaction(msg.id, emoji)}
                          className={`flex items-center gap-0.5 hover:scale-110 transition-transform ${
                            userList.includes(user?.uid || '') ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''
                          }`}
                          title={`${userList.length} reação(ões)`}
                        >
                          <span>{emoji}</span>
                          {userList.length > 1 && <span className="text-[9px] font-bold text-gray-500">{userList.length}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}

              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Editing Message Banner */}
      <AnimatePresence>
        {editingMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-emerald-50 dark:bg-emerald-950/40 border-t border-emerald-500/20 px-4 py-2.5 flex items-center justify-between z-10"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                <Edit3 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Editando mensagem</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-md">{editingMessage.text}</p>
              </div>
            </div>
            <button 
              onClick={handleCancelEdit}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-500"
              title="Cancelar edição"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply Banner */}
      <AnimatePresence>
        {replyingMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-[#f0f2f5] dark:bg-[#111b21] border-t border-gray-200 dark:border-white/10 px-4 py-2 flex items-center justify-between z-10"
          >
            <div className="flex items-center gap-2.5 min-w-0 border-l-4 border-[#00a884] pl-2.5 py-0.5">
              <CornerDownRight className="w-4 h-4 text-[#00a884] shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#00a884]">{replyingMessage.senderName || 'Usuário'}</p>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate max-w-md">{replyingMessage.text || replyingMessage.fileName}</p>
              </div>
            </div>
            <button 
              onClick={() => setReplyingMessage(null)}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending File Attachment Banner */}
      <AnimatePresence>
        {pendingFile && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-[#e9edef] dark:bg-[#202c33] border-t border-black/10 dark:border-white/10 p-3 flex items-center justify-between gap-3 z-10"
          >
            <div className="flex items-center gap-3 min-w-0">
              {pendingFile.type.startsWith('image/') ? (
                <img src={pendingFile.dataUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-black/10" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-black dark:text-white truncate">{pendingFile.name}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{formatFileSize(pendingFile.size)}</p>
              </div>
            </div>
            <button 
              onClick={() => setPendingFile(null)}
              className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-gray-600 dark:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji Picker Popover */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 260, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="emoji-picker-container bg-[#f0f2f5] dark:bg-[#111b21] border-t border-gray-200 dark:border-white/10 flex flex-col z-20 overflow-hidden"
          >
            {/* Category Tabs & Search */}
            <div className="p-2 border-b border-gray-200 dark:border-white/10 flex items-center justify-between gap-2 bg-white dark:bg-[#202c33]">
              <div className="flex items-center gap-1">
                {EMOJI_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveEmojiTab(cat.id); setEmojiSearch(''); }}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
                      activeEmojiTab === cat.id && !emojiSearch 
                        ? 'bg-[#00a884] text-white shadow-xs font-bold' 
                        : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="hidden sm:inline text-xs">{cat.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-black/30 rounded-lg px-2.5 py-1">
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <input 
                  type="text"
                  value={emojiSearch}
                  onChange={(e) => setEmojiSearch(e.target.value)}
                  placeholder="Buscar emoji..."
                  className="bg-transparent text-xs text-black dark:text-white outline-none w-28"
                />
              </div>
            </div>

            {/* Emojis Grid */}
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-8 sm:grid-cols-12 gap-2 text-2xl">
              {(() => {
                let emojisToShow: string[] = [];
                if (emojiSearch.trim()) {
                  emojisToShow = EMOJI_CATEGORIES.flatMap(c => c.emojis);
                } else {
                  emojisToShow = EMOJI_CATEGORIES.find(c => c.id === activeEmojiTab)?.emojis || [];
                }
                return emojisToShow.map((emoji, eIdx) => (
                  <button
                    key={`emoji-${eIdx}-${emoji}`}
                    type="button"
                    onClick={() => {
                      setNewMessage(prev => prev + emoji);
                      textInputRef.current?.focus();
                    }}
                    className="hover:scale-125 transition-transform p-1 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    {emoji}
                  </button>
                ));
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attach Menu Popover (WhatsApp Style) */}
      <AnimatePresence>
        {showAttachMenu && (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="attach-menu-container absolute bottom-16 left-3 sm:left-6 bg-white dark:bg-[#233138] rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 p-3 z-30 flex flex-col gap-2 min-w-[200px]"
          >
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-1">Anexar ao Chat</p>

            <button 
              type="button"
              onClick={() => {
                imageInputRef.current?.click();
                setShowAttachMenu(false);
              }}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-white/5 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-black dark:text-white">Fotos & Imagens</p>
                <p className="text-[10px] text-gray-400">JPG, PNG, WebP</p>
              </div>
            </button>

            <button 
              type="button"
              onClick={() => {
                fileInputRef.current?.click();
                setShowAttachMenu(false);
              }}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-white/5 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <FileIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-black dark:text-white">Documento</p>
                <p className="text-[10px] text-gray-400">PDF, DOCX, Planilhas</p>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp Input Bar */}
      <div className="bg-[#f0f2f5] dark:bg-[#202c33] p-2.5 sm:px-4 sm:py-3 flex items-center gap-2 border-t border-black/10 dark:border-white/5 shrink-0 z-20">
        
        {/* Emoji Button */}
        <button 
          type="button"
          onClick={() => {
            setShowEmojiPicker(prev => !prev);
            setShowAttachMenu(false);
          }}
          className={`emoji-toggle-btn p-2 rounded-full transition-colors ${
            showEmojiPicker ? 'bg-[#00a884]/20 text-[#00a884]' : 'text-[#54656f] dark:text-[#8696a0] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          title="Emojis"
        >
          <Smile className="w-6 h-6" />
        </button>

        {/* Paperclip / Attach Button */}
        <button 
          type="button"
          onClick={() => {
            setShowAttachMenu(prev => !prev);
            setShowEmojiPicker(false);
          }}
          className={`attach-toggle-btn p-2 rounded-full transition-colors ${
            showAttachMenu ? 'bg-[#00a884]/20 text-[#00a884]' : 'text-[#54656f] dark:text-[#8696a0] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          title="Anexar foto ou documento"
        >
          <Paperclip className="w-6 h-6" />
        </button>

        {/* Text Form */}
        <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
          <input 
            ref={textInputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={editingMessage ? "Edite sua mensagem..." : "Mensagem"}
            className="flex-1 bg-white dark:bg-[#2a3942] text-black dark:text-[#d1d7db] rounded-xl px-4 py-2.5 text-[14.5px] outline-none border-none shadow-xs placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#00a884]/40 transition-all"
          />

          <button 
            type="submit"
            disabled={(!newMessage.trim() && !pendingFile) || isSending}
            className={`p-2.5 sm:p-3 rounded-full transition-all shadow-md shrink-0 ${
              (!newMessage.trim() && !pendingFile)
                ? 'bg-gray-300 dark:bg-[#374248] text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                : editingMessage
                  ? 'bg-amber-500 hover:bg-amber-600 text-white active:scale-95'
                  : 'bg-[#00a884] hover:bg-[#008f6f] text-white active:scale-95'
            }`}
            title={editingMessage ? "Salvar Edição" : "Enviar Mensagem"}
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : editingMessage ? (
              <Check className="w-5 h-5" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {messageToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-[#222e35] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-black/10 dark:border-white/10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-1">
              <h4 className="font-black text-lg text-black dark:text-white">Apagar Mensagem?</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Esta ação removerá a mensagem para todos os participantes. Não é possível desfazer.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setMessageToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md transition-colors"
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Images */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <img 
            src={lightboxImage} 
            alt="Imagem ampliada" 
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

    </div>
  );
}
