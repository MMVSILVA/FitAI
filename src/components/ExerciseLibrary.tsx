import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, Dumbbell, Info, X, ChevronRight, Activity, Heart, Filter, Star } from 'lucide-react';
import { useUser } from '../store/userStore';
import { ExerciseImage } from './ExerciseImage';

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

  const fetchExercises = async (isNewSearch = false, searchTermOverride?: string) => {
    setLoading(true);
    setError(null);
    try {
      const currentCursor = isNewSearch ? '' : cursor || '';
      const apiSearchTerm = ptToEnSearch(searchTermOverride !== undefined ? searchTermOverride : search);
      const origin = window.location.origin;
      const url = `${origin}/api/exercises/search?limit=20&name=${encodeURIComponent(apiSearchTerm)}&cursor=${currentCursor}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Erro na API: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.success) {
        if (isNewSearch) {
          setExercises(data.data);
        } else {
          setExercises(prev => [...prev, ...data.data]);
        }
        setCursor(data.meta.nextCursor);
        setHasNextPage(data.meta.hasNextPage);
      } else {
        throw new Error(data.error || 'Erro desconhecido na busca');
      }
    } catch (error: any) {
      console.error("Error fetching library:", error);
      setError(error.message);
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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Dumbbell className="text-purple-500" />
            Banco de Exercícios
          </h2>
          <p className="text-gray-400 text-sm">Explore nossa base de dados profissional.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
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
          placeholder="Buscar exemplo: agachamento, supino, rosca, pernas..."
          className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-purple-500 outline-none transition-all placeholder:text-gray-600"
        />
        <button 
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all"
        >
          Pesquisar
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
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
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
          <button onClick={() => fetchExercises(true)} className="text-xs font-bold uppercase tracking-widest hover:underline">
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {displayExercises.map((ex) => (
              <motion.div
                key={ex.exerciseId}
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
                  <div className="absolute top-3 right-3 z-10">
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
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/20">
                      {translate(ex.bodyParts[0])}
                    </span>
                  </div>
                </div>
                <div onClick={() => setSelectedExercise(ex)} className="p-4 flex-1 flex flex-col justify-between">
                  <div className="mb-2">
                    <h3 className="font-bold text-white capitalize truncate group-hover:text-purple-400 transition-colors uppercase tracking-tight text-sm">
                      {translateExerciseName(ex.name)}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter truncate">{translate(ex.equipments[0])}</p>
                    <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
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
                <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 aspect-video flex items-center justify-center">
                  <ExerciseImage 
                    src={selectedExercise.gifUrl} 
                    alt={selectedExercise.name}
                    className="w-full h-full object-contain"
                  />
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
    </div>
  );
};
