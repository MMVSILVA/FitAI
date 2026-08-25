import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, FileDown, X, Dumbbell, CheckSquare, Calendar, User, Target, Info } from 'lucide-react';
import { WorkoutPlan, UserProfile } from '../types';

interface PrintWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: WorkoutPlan;
  profile?: UserProfile | null;
}

export const PrintWorkoutModal: React.FC<PrintWorkoutModalProps> = ({
  isOpen,
  onClose,
  plan,
  profile
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | 'all'>('all');

  if (!isOpen) return null;

  const daysToPrint = selectedDayIndex === 'all' 
    ? plan.days 
    : [plan.days[selectedDayIndex]].filter(Boolean);

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
        
        {/* Printable Gym Sheet Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white text-zinc-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Top Controls (Hidden during print) */}
          <div className="no-print bg-zinc-900 text-white p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Ficha de Treino para Academia</h3>
                <p className="text-xs text-zinc-400">Imprima ou salve em PDF para levar aos seus treinos</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Day filter */}
              <select
                value={selectedDayIndex}
                onChange={(e) => setSelectedDayIndex(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-zinc-800 border border-zinc-700 text-white text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-purple-500"
              >
                <option value="all">Imprimir Todos os Dias ({plan.days.length})</option>
                {plan.days.map((d, i) => (
                  <option key={i} value={i}>Apenas {d.day} ({d.focus})</option>
                ))}
              </select>

              <button
                onClick={handlePrint}
                className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
              >
                <Printer className="w-4 h-4" />
                Imprimir / PDF
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Document Body */}
          <div id="printable-workout-sheet" className="p-6 sm:p-10 overflow-y-auto space-y-8 bg-white text-black font-sans">
            
            {/* Gym Sheet Header */}
            <div className="border-b-2 border-zinc-900 pb-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-black text-white font-black text-xs px-2.5 py-1 rounded tracking-widest uppercase">
                      FitAI • Protocolo Pro
                    </span>
                    <span className="text-xs text-zinc-500 font-bold">Ficha de Treinamento Físico</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
                    {plan.title || 'Programa de Treino Personalizado'}
                  </h1>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Data de Emissão</p>
                  <p className="text-sm font-black text-zinc-900">{todayStr}</p>
                </div>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-zinc-200 text-xs">
                <div>
                  <span className="text-zinc-500 font-bold block uppercase tracking-wider text-[10px]">Aluno(a)</span>
                  <span className="font-black text-zinc-900 text-sm">{profile?.displayName || 'Atleta FitAI'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-bold block uppercase tracking-wider text-[10px]">Objetivo</span>
                  <span className="font-black text-zinc-900 text-sm">{plan.objective || profile?.objective?.join(', ') || 'Hipertrofia & Força'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-bold block uppercase tracking-wider text-[10px]">Estrutura</span>
                  <span className="font-black text-zinc-900 text-sm">{plan.structure || `${plan.days.length} Dias / Semana`}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-bold block uppercase tracking-wider text-[10px]">Frequência</span>
                  <span className="font-black text-zinc-900 text-sm">{plan.frequency || 'Semanal'}</span>
                </div>
              </div>
            </div>

            {/* General Coach Instructions / Progression */}
            {(plan.progression || (plan.recommendations && plan.recommendations.length > 0)) && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-xs space-y-2">
                <p className="font-black uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-purple-600" /> Recomendações e Progressão de Carga
                </p>
                {plan.progression && (
                  <p className="text-zinc-600 font-medium">{plan.progression}</p>
                )}
                {plan.recommendations && plan.recommendations.length > 0 && (
                  <ul className="list-disc list-inside text-zinc-600 space-y-1">
                    {plan.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Workout Days Tables */}
            <div className="space-y-8">
              {daysToPrint.map((day, dIdx) => (
                <div key={dIdx} className="border border-zinc-300 rounded-2xl overflow-hidden shadow-sm page-break-inside-avoid">
                  
                  {/* Day Header */}
                  <div className="bg-zinc-900 text-white px-6 py-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-base uppercase tracking-wider">{day.day}</span>
                      <span className="text-zinc-400 font-medium text-sm">• {day.focus}</span>
                    </div>
                    <span className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md font-bold">
                      {day.exercises.length} Exercícios
                    </span>
                  </div>

                  {/* Exercises Table */}
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-600 font-black uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-4 w-8 text-center">#</th>
                        <th className="py-2.5 px-4">Exercício</th>
                        <th className="py-2.5 px-3 text-center w-20">Séries</th>
                        <th className="py-2.5 px-3 text-center w-24">Reps</th>
                        <th className="py-2.5 px-3 text-center w-20">Descanso</th>
                        <th className="py-2.5 px-3 text-center w-28">Carga do Dia</th>
                        <th className="py-2.5 px-3 text-center w-14">Feito</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {day.exercises.map((ex, exIdx) => (
                        <tr key={exIdx} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="py-3 px-4 text-center font-black text-zinc-400 text-[11px]">
                            {exIdx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-zinc-900 text-sm block">{ex.name}</span>
                            {ex.technicalDescription && (
                              <span className="text-[11px] text-zinc-500 block leading-tight mt-0.5">
                                {ex.technicalDescription}
                              </span>
                            )}
                            {ex.tips && (
                              <span className="text-[10px] text-purple-700 italic block mt-0.5">
                                Dica: {ex.tips}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-black text-zinc-900 text-sm">
                            {ex.sets}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-zinc-800">
                            {ex.reps}
                          </td>
                          <td className="py-3 px-3 text-center font-medium text-zinc-600">
                            {ex.rest}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="border-b-2 border-dashed border-zinc-300 py-1 text-center font-bold text-zinc-400 text-[11px]">
                              {ex.weight ? ex.weight : '____ kg'}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="w-5 h-5 border-2 border-zinc-400 rounded mx-auto" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Notes space for the gym */}
                  <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-[11px] text-zinc-500 flex justify-between items-center">
                    <span>Anotações do treino / Feedback: __________________________________________________________________________</span>
                    <span className="font-bold">Tempo: ____ min</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Gym Sheet Footer */}
            <div className="pt-6 border-t border-zinc-200 text-center text-zinc-400 text-[10px] space-y-1">
              <p className="font-bold text-zinc-600 uppercase tracking-widest">FitAI • Inteligência Artificial em Saúde e Performance</p>
              <p>Mantenha a postura correta, hidrate-se durante o treino e respeite os intervalos de descanso prescritos.</p>
            </div>

          </div>
        </motion.div>
      </div>

      {/* Global Print Styles Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-workout-sheet, #printable-workout-sheet * {
            visibility: visible;
          }
          #printable-workout-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}} />
    </AnimatePresence>
  );
};
