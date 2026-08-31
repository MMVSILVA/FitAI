import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, Dumbbell, Info, X, ChevronRight, Activity, Heart, Filter, Star, Play, ExternalLink } from 'lucide-react';
import { useUser } from '../store/userStore';
import { ExerciseImage } from './ExerciseImage';
import { Toast } from './Toast';

interface ExerciseDBItem {
  exerciseId: string;
  name: string;
  gifUrl: string;
  bodyParts: string[];
  equipments: string[];
  targetMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

import { translate, ptToEnSearch, translateExerciseName } from '../lib/exerciseTranslations';
import { translateInstructions } from '../services/aiService';

export const ExerciseLibrary = () => {
  const { toggleFavorite, favorites } = useUser();
  const [search, setSearch] = useState('');
  const [exercises, setExercises] = useState<ExerciseDBItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDBItem | null>(null);
  const [apiStatus, setApiStatus] = useState<{ status: string; environment: string } | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translatedInstructions, setTranslatedInstructions] = useState<string[] | null>(null);
  const [translationError, setTranslationError] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<ExerciseDBItem | null>(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' as 'info' | 'success' | 'error' });

  const translateSteps = async (instructions: string[]) => {
    setTranslating(true);
    setTranslationError(false);
    try {
      const lines = await translateInstructions(instructions);
      setTranslatedInstructions(lines);
    } catch (e) {
      console.error("Erro na tradução das instruções:", e);
      setTranslationError(true);
    } finally {
      setTranslating(false);
    }
  };

  useEffect(() => {
    if (selectedExercise) {
      setTranslatedInstructions(null);
      translateSteps(selectedExercise.instructions);
    }
  }, [selectedExercise]);

  const [error, setError] = useState<string | null>(null);

  // Client-side cache of the full database for offline or direct fallback
  const clientDbRef = React.useRef<any[] | null>(null);

  const fetchDirectFallback = async (searchTerm: string, cursorIndex: number, limit = 20) => {
    try {
      if (!clientDbRef.current) {
        const urls = [
          'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json',
          'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
        ];
        for (const u of urls) {
          try {
            const resp = await fetch(u, { signal: AbortSignal.timeout(6000) });
            if (resp.ok) {
              const parsed = await resp.json();
              if (Array.isArray(parsed) && parsed.length > 0) {
                clientDbRef.current = parsed;
                break;
              }
            }
          } catch (err) {}
        }
      }

      if (clientDbRef.current && clientDbRef.current.length > 0) {
        const query = searchTerm.toLowerCase().trim();
        let filtered = clientDbRef.current;
        if (query && query !== 'all') {
          filtered = clientDbRef.current.filter((ex: any) => {
            const name = (ex.name || '').toLowerCase();
            const bodyPart = (ex.bodyPart || '').toLowerCase();
            const target = (ex.target || '').toLowerCase();
            const category = (ex.category || '').toLowerCase();
            const muscles = Array.isArray(ex.primaryMuscles) ? ex.primaryMuscles.join(' ').toLowerCase() : '';
            return name.includes(query) || bodyPart.includes(query) || target.includes(query) || category.includes(query) || muscles.includes(query);
          });
        }

        const page = filtered.slice(cursorIndex, cursorIndex + limit);
        const mapped: ExerciseDBItem[] = page.map((item: any) => ({
          exerciseId: item.id || item.exerciseId || `ex-${Math.random().toString(36).substr(2, 9)}`,
          name: item.name,
          gifUrl: item.gifUrl || (item.images && item.images.length > 0 ? `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${item.images[0]}` : ''),
          bodyParts: Array.isArray(item.bodyParts) ? item.bodyParts : (item.primaryMuscles || [item.bodyPart || 'other']),
          equipments: Array.isArray(item.equipments) ? item.equipments : [item.equipment || 'none'],
          targetMuscles: Array.isArray(item.targetMuscles) ? item.targetMuscles : (item.primaryMuscles || [item.target || 'various']),
          secondaryMuscles: item.secondaryMuscles || [],
          instructions: item.instructions || []
        }));

        return {
          success: true,
          data: mapped,
          meta: {
            hasNextPage: cursorIndex + limit < filtered.length,
            nextCursor: cursorIndex + limit < filtered.length ? String(cursorIndex + limit) : null
          }
        };
      }
    } catch (e) {
      console.warn("Direct fallback error:", e);
    }
    return null;
  };

  const fetchExercises = async (isNewSearch = false, searchTermOverride?: string) => {
    setLoading(true);
    setError(null);
    try {
      const currentCursor = isNewSearch ? '' : cursor || '';
      const termToSearch = searchTermOverride !== undefined ? searchTermOverride : search;
      const apiSearchTerm = ptToEnSearch(termToSearch);
      const url = `/api/exercises/search?limit=20&name=${encodeURIComponent(apiSearchTerm)}&cursor=${currentCursor}`;
      
      let data: any = null;

      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          data = await res.json();
        }
      } catch (networkError) {
        console.warn("Primary API search route unavailable, using direct repository fallback...", networkError);
      }

      // If API returned empty or failed (404/500/timeout), use high-speed client-side repository fallback
      if (!data || !data.success || !Array.isArray(data.data) || (isNewSearch && data.data.length === 0 && termToSearch)) {
        const cursorNum = currentCursor ? parseInt(currentCursor) || 0 : 0;
        const fallbackRes = await fetchDirectFallback(apiSearchTerm || termToSearch, cursorNum);
        if (fallbackRes && fallbackRes.data.length > 0) {
          data = fallbackRes;
        }
      }
      
      if (data && data.success && Array.isArray(data.data)) {
        if (isNewSearch) {
          setExercises(data.data);
        } else {
          setExercises(prev => {
            const existingIds = new Set(prev.map(ex => ex.exerciseId));
            const newExercises = data.data.filter((ex: ExerciseDBItem) => !existingIds.has(ex.exerciseId));
            return [...prev, ...newExercises];
          });
        }
        setCursor(data.meta?.nextCursor || null);
        setHasNextPage(Boolean(data.meta?.hasNextPage));
      } else {
        // Safe empty state rather than breaking UI
        if (isNewSearch) {
          setExercises([]);
        }
        setHasNextPage(false);
      }
    } catch (error: any) {
      console.error("Error fetching library:", error);
      // Try direct fallback one last time
      try {
        const termToSearch = searchTermOverride !== undefined ? searchTermOverride : search;
        const fallbackRes = await fetchDirectFallback(termToSearch, 0);
        if (fallbackRes && fallbackRes.data.length > 0) {
          setExercises(fallbackRes.data);
          setCursor(fallbackRes.meta.nextCursor);
          setHasNextPage(fallbackRes.meta.hasNextPage);
          setError(null);
          return;
        }
      } catch (e) {}
      setError("Não foi possível carregar os exercícios no momento. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const checkLiveness = async () => {
    try {
      const res = await fetch('/api/exercises/liveness');
      const data = await res.json();
      setApiStatus(data);
    } catch (e) {
      console.error("Liveness check failed");
    }
  };

  useEffect(() => {
    checkLiveness();
    fetchExercises(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExercises(true);
  };

  const displayExercises = showFavorites 
    ? exercises.filter(ex => favorites.includes(ex.exerciseId)) 
    : exercises;

  return (
    <div className="space-y-6">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-2">
            <Dumbbell className="text-purple-500" />
            Banco de Exercícios
          </h2>
          <p className="text-gray-500 text-base font-medium">Explore nossa base de dados profissional.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-base font-black transition-all border ${
              showFavorites 
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Star className={`w-4 h-4 ${showFavorites ? 'fill-white' : ''}`} />
            Favoritos ({favorites.length})
          </button>

          {apiStatus && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
                API Online
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
        <input 
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar: agachamento, pernas..."
          className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-4 sm:py-5 pl-11 sm:pl-12 pr-12 sm:pr-36 text-lg sm:text-xl text-white focus:border-purple-500 outline-none transition-all placeholder:text-gray-600"
        />
        <button 
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-500 text-white px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-black transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center min-w-[44px]"
        >
          <span className="hidden sm:inline">Pesquisar</span>
          <Search className="w-5 h-5 sm:hidden" />
        </button>
      </form>

      {/* Filters (Quick body parts) */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { label: 'Todos', value: '' },
          { label: 'Peito', value: 'Peito' },
          { label: 'Costas', value: 'Costas' },
          { label: 'Pernas', value: 'Pernas' },
          { label: 'Ombros', value: 'Ombros' },
          { label: 'Braços', value: 'Braços' },
          { label: 'Abs', value: 'Abdominal' }
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => {
              setSearch(item.value);
              fetchExercises(true, item.value);
            }}
            className={`px-5 py-2.5 rounded-full text-sm font-black whitespace-nowrap transition-all border ${
              search === item.value || (item.value === '' && search === '')
                ? 'bg-white text-black border-white' 
                : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10 hover:text-gray-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button 
            onClick={() => fetchExercises(true)} 
            className="text-[10px] bg-red-600 text-white px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-lg shadow-red-600/30 active:scale-95"
          >
            Tentar Novamente
          </button>
        </motion.div>
      )}

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        {displayExercises.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {displayExercises.map((ex, idx) => (
              <motion.div
                key={`lib-ex-${ex.exerciseId}-${idx}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-purple-500/50 transition-all flex flex-col"
              >
                <div onClick={() => setSelectedExercise(ex)} className="aspect-square relative overflow-hidden bg-white/5">
                  <ExerciseImage 
                    src={ex.gifUrl} 
                    alt={ex.name} 
                    className="w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(ex.exerciseId);
                      }}
                      className={`p-2 rounded-full transition-all ${
                        favorites.includes(ex.exerciseId)
                          ? 'bg-purple-600 text-white scale-110 shadow-lg shadow-purple-600/30'
                          : 'bg-black/40 text-gray-400 hover:text-white backdrop-blur-md'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(ex.exerciseId) ? 'fill-white' : ''}`} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayingVideo(ex);
                      }}
                      className="p-2 bg-purple-600 text-white rounded-full transition-all shadow-lg shadow-purple-600/30 hover:scale-110"
                      title="Ver Vídeo"
                    >
                      <Play className="w-4 h-4 fill-white" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/20">
                      {translate(ex.bodyParts[0])}
                    </span>
                  </div>
                </div>
                <div onClick={() => setSelectedExercise(ex)} className="p-4 flex-1 flex flex-col justify-between">
                  <div className="mb-2">
                    <h3 className="font-extrabold text-white capitalize truncate group-hover:text-purple-400 transition-colors uppercase tracking-tight text-base">
                      {translateExerciseName(ex.name)}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter truncate">{translate(ex.equipments[0])}</p>
                    <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-dashed border-white/10"
          >
            <Dumbbell className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-gray-400">
              {showFavorites ? 'Nenhum favorito ainda' : 'Nenhum exercício encontrado'}
            </h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              {showFavorites 
                ? 'Toque no coração nos exercícios da biblioteca para salvá-los aqui.' 
                : 'Tente buscar por termos mais genéricos como "costas", "peito" ou "pernas".'}
            </p>
            {showFavorites && (
              <button 
                onClick={() => setShowFavorites(false)}
                className="mt-6 text-purple-500 font-bold hover:underline"
              >
                Ver todos os exercícios
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      )}

      {!loading && hasNextPage && !showFavorites && (
        <div className="flex justify-center">
          <button 
            onClick={() => fetchExercises()}
            className="bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-xl font-bold transition-all border border-white/10"
          >
            Carregar Mais
          </button>
        </div>
      )}

      {/* Modal Detalhes */}
      <AnimatePresence>
        {selectedExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-zinc-950/80 backdrop-blur-md p-6 border-b border-white/5 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold capitalize">{translateExerciseName(selectedExercise.name)}</h3>
                  <button 
                    onClick={() => toggleFavorite(selectedExercise.exerciseId)}
                    className={`p-2 rounded-full transition-all ${
                      favorites.includes(selectedExercise.exerciseId)
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${favorites.includes(selectedExercise.exerciseId) ? 'fill-white' : ''}`} />
                  </button>
                </div>
                <button 
                  onClick={() => setSelectedExercise(null)}
                  className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="relative rounded-[32px] overflow-hidden bg-black aspect-video flex items-center justify-center group/video shadow-2xl border border-white/10">
                  <ExerciseImage 
                    src={selectedExercise.gifUrl} 
                    alt={selectedExercise.name}
                    className="w-full h-full"
                    proxy={true}
                  />
                  
                  {/* Pro UI Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />
                  
                  <div className="absolute top-5 left-5 flex items-center gap-2 pointer-events-none">
                    <div className="px-2.5 py-1 bg-red-600 rounded-md flex items-center gap-1.5 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white">REC • LIVE 4K</span>
                    </div>
                    <div className="px-2 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-md shadow-lg">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white tracking-[0.2em]">ULTRA HD</span>
                    </div>
                  </div>

                  <div className="absolute top-5 right-5 pointer-events-none">
                    <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-md bg-black/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-600/20 backdrop-blur-xl flex items-center justify-center border border-purple-500/30">
                        <Activity className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white leading-none mb-1">Demonstração Pro</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-green-400 uppercase">Estabilidade Ativa</span>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span className="text-[9px] font-bold text-white/40 uppercase">Ai Analysis</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="hidden sm:flex items-center gap-4">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className={`w-1 h-3 rounded-full ${i <= 4 ? 'bg-purple-500' : 'bg-white/10'}`} />
                          ))}
                        </div>
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Signal</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-all duration-500 bg-black/20 backdrop-blur-[2px]">
                    <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-3xl flex items-center justify-center border border-white/20 shadow-2xl transform scale-90 group-hover/video:scale-100 transition-transform duration-500">
                      <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-2" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-bold text-purple-500 uppercase tracking-[0.2em] mb-1.5 opacity-60">Músculo Alvo</p>
                    <p className="text-sm font-bold capitalize">{selectedExercise.targetMuscles.map(translate).join(', ')}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-bold text-purple-500 uppercase tracking-[0.2em] mb-1.5 opacity-60">Equipamento</p>
                    <p className="text-sm font-bold capitalize">{selectedExercise.equipments.map(translate).join(', ')}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold flex items-center gap-2">
                      <Info className="w-4 h-4 text-purple-400" />
                      Instruções de Execução
                    </h4>
                    {translationError && (
                      <button 
                        onClick={() => selectedExercise && translateSteps(selectedExercise.instructions)}
                        className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded hover:bg-red-500/20 transition-colors"
                      >
                        Falha na tradução. Tentar novamente?
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {translating ? (
                      <div className="flex items-center gap-2 text-gray-500 text-sm py-8 justify-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                        Trabalhando na tradução profissional...
                      </div>
                    ) : (translatedInstructions || selectedExercise.instructions).map((step, i) => (
                      <div key={i} className="flex gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors group">
                        <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-black text-xs border border-purple-500/20 group-hover:bg-purple-600 group-hover:text-white transition-all">
                          {i + 1}
                        </span>
                        <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-200 transition-colors">{step.replace(/^Step:\d+\s+/, '')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Video Player Modal */}
      <AnimatePresence>
        {playingVideo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/95 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-7xl aspect-video bg-black rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(147,51,234,0.3)] border border-white/10"
            >
              {/* Close Button */}
              <button 
                onClick={() => setPlayingVideo(null)}
                className="absolute top-4 sm:top-8 right-4 sm:right-8 z-[110] p-3 sm:p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all border border-white/10 shadow-2xl"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Video Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <ExerciseImage 
                  src={playingVideo.gifUrl} 
                  alt={playingVideo.name}
                  className="w-full h-full object-contain"
                  proxy={true}
                />
              </div>

              {/* Cinematic Overlays */}
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-12 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-purple-600 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-600/20">
                      LIVE DEMO
                    </span>
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                      ULTRA HD
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter leading-none mb-2 text-left">
                      {translateExerciseName(playingVideo.name)}
                    </h2>
                    <div className="flex items-center gap-4 text-gray-400">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-bold uppercase tracking-widest">{translate(playingVideo.bodyParts[0])}</span>
                      </div>
                      <div className="w-1 h-1 bg-white/20 rounded-full" />
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-bold uppercase tracking-widest">{translate(playingVideo.equipments[0])}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a 
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(playingVideo.name + ' exercise tutorial')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-red-600/20 text-sm"
                  >
                    <ExternalLink className="w-5 h-5" />
                    PESQUISAR NO YOUTUBE
                  </a>
                  <button 
                    onClick={() => {
                      setSelectedExercise(playingVideo);
                      setPlayingVideo(null);
                    }}
                    className="flex items-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-black transition-all text-sm"
                  >
                    <Info className="w-5 h-5" />
                    DETALHES
                  </button>
                </div>
              </div>

              {/* Decorative Scanline */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-[length:100%_4px,3px_100%] z-10 opacity-20" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Toast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </div>
  );
};
