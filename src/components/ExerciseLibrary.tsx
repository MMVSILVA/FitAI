import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Dumbbell, Info, X, ChevronRight, Activity } from 'lucide-react';

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

  // Efeito para traduzir instruções quando selecionar um exercício
  useEffect(() => {
    if (selectedExercise) {
      setTranslatedInstructions(null);
      translateSteps(selectedExercise.instructions);
    }
  }, [selectedExercise]);

  const fetchExercises = async (isNewSearch = false) => {
    setLoading(true);
    try {
      const currentCursor = isNewSearch ? '' : cursor || '';
      const apiSearchTerm = ptToEnSearch(search);
      const url = `/api/exercises/search?limit=20&name=${encodeURIComponent(apiSearchTerm)}&cursor=${currentCursor}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        if (isNewSearch) {
          setExercises(data.data);
        } else {
          setExercises(prev => [...prev, ...data.data]);
        }
        setCursor(data.meta.nextCursor);
        setHasNextPage(data.meta.hasNextPage);
      }
    } catch (error) {
      console.error("Error fetching library:", error);
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
        
        {apiStatus && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
              API Online: {apiStatus.status}
            </span>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
        <input 
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar exemplo: agachamento, supino, rosca, pernas..."
          className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-purple-500 outline-none transition-all"
        />
        <button 
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
        >
          Pesquisar
        </button>
      </form>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises.map((ex) => (
          <motion.div
            key={ex.exerciseId}
            layoutId={ex.exerciseId}
            onClick={() => setSelectedExercise(ex)}
            className="group bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-purple-500/50 transition-all"
          >
            <div className="aspect-square relative overflow-hidden bg-white/5">
              <img 
                src={ex.gifUrl} 
                alt={ex.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-3 left-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
                  {translate(ex.bodyParts[0])}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-white capitalize truncate group-hover:text-purple-400 transition-colors uppercase tracking-tight">
                {translateExerciseName(ex.name)}
              </h3>
              <p className="text-xs text-gray-500 font-medium">Equipamento: {translate(ex.equipments[0])}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      )}

      {!loading && hasNextPage && (
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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-950 border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-zinc-950 p-6 border-b border-white/5 flex items-center justify-between z-10">
                <h3 className="text-xl font-bold capitalize">{translateExerciseName(selectedExercise.name)}</h3>
                <button 
                  onClick={() => setSelectedExercise(null)}
                  className="p-2 bg-white/5 rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="rounded-2xl overflow-hidden bg-white/5 border border-white/5">
                  <img 
                    src={selectedExercise.gifUrl} 
                    alt={selectedExercise.name}
                    className="w-full aspect-video object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-1">Músculo Alvo</p>
                    <p className="text-sm font-medium capitalize">{selectedExercise.targetMuscles.map(translate).join(', ')}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-1">Equipamento</p>
                    <p className="text-sm font-medium capitalize">{selectedExercise.equipments.map(translate).join(', ')}</p>
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
                      <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Traduzindo instruções profissionais...
                      </div>
                    ) : (translatedInstructions || selectedExercise.instructions).map((step, i) => (
                      <div key={i} className="flex gap-3 text-sm text-gray-400">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                          {i + 1}
                        </span>
                        <p>{step.replace(/^Step:\d+\s+/, '')}</p>
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
