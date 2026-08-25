import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, 
  FileDown, 
  X, 
  Dumbbell, 
  Utensils, 
  Activity, 
  Scale, 
  Calendar, 
  CheckSquare, 
  User, 
  Flame, 
  Droplet,
  Sparkles,
  Info,
  ShieldCheck
} from 'lucide-react';
import { WorkoutPlan, UserProfile } from '../types';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: WorkoutPlan;
  profile?: UserProfile | null;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  plan,
  profile
}) => {
  const [sectionFilter, setSectionFilter] = useState<'all' | 'workout' | 'diet'>('all');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Calculate BMI / IMC
  const heightInMeters = profile?.height ? profile.height / 100 : null;
  const bmi = profile?.weight && heightInMeters ? (profile.weight / (heightInMeters * heightInMeters)).toFixed(1) : null;

  const getBmiCategory = (val: number) => {
    if (val < 18.5) return 'Abaixo do Peso';
    if (val < 24.9) return 'Peso Normal';
    if (val < 29.9) return 'Sobrepeso';
    return 'Obesidade';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
        
        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-white text-zinc-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Control Bar (Hidden on print) */}
          <div className="no-print bg-zinc-900 text-white p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                <FileDown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                  Relatório Completo de Treino & Dieta
                  <span className="bg-purple-500/20 text-purple-400 text-[10px] uppercase px-2 py-0.5 rounded font-black">
                    PDF Pro
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">Exportação em alta resolução para seus registros ou impressão</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Section Filter */}
              <div className="flex bg-zinc-800 p-1 rounded-xl border border-zinc-700">
                <button
                  onClick={() => setSectionFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sectionFilter === 'all' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Completo
                </button>
                <button
                  onClick={() => setSectionFilter('workout')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sectionFilter === 'workout' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Treino
                </button>
                <button
                  onClick={() => setSectionFilter('diet')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sectionFilter === 'diet' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Dieta
                </button>
              </div>

              <button
                onClick={handlePrint}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Baixar PDF / Imprimir
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
          <div id="printable-full-report" className="p-6 sm:p-12 overflow-y-auto space-y-10 bg-white text-zinc-900 font-sans">
            
            {/* Document Header */}
            <div className="border-b-2 border-zinc-900 pb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="bg-black text-white font-black text-[11px] px-2.5 py-1 rounded tracking-widest uppercase">
                      FitAI • Protocolo Integrado
                    </span>
                    <span className="text-xs text-zinc-500 font-black tracking-wider uppercase">
                      Prontuário & Planejamento Físico-Nutricional
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900">
                    {plan.title || 'Plano de Alta Performance'}
                  </h1>
                </div>

                <div className="text-left sm:text-right bg-zinc-50 border border-zinc-200 p-3 rounded-2xl">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Data de Emissão</p>
                  <p className="text-sm font-black text-zinc-900">{todayFormatted}</p>
                  <p className="text-[10px] text-zinc-500 font-bold">FitAI Intelligence Engine</p>
                </div>
              </div>

              {/* Patient / Athlete Information Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-6 pt-5 border-t border-zinc-200 text-xs">
                <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                  <span className="text-zinc-500 font-bold block uppercase text-[9px]">Aluno(a)</span>
                  <span className="font-black text-zinc-900 truncate block text-sm">{profile?.displayName || 'Atleta'}</span>
                </div>
                <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                  <span className="text-zinc-500 font-bold block uppercase text-[9px]">Objetivo</span>
                  <span className="font-black text-zinc-900 truncate block text-sm">{plan.objective || 'Hipertrofia'}</span>
                </div>
                <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                  <span className="text-zinc-500 font-bold block uppercase text-[9px]">Peso Atual</span>
                  <span className="font-black text-zinc-900 block text-sm">{profile?.weight ? `${profile.weight} kg` : '--'}</span>
                </div>
                <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                  <span className="text-zinc-500 font-bold block uppercase text-[9px]">Meta de Peso</span>
                  <span className="font-black text-purple-700 block text-sm">{profile?.targetWeight ? `${profile.targetWeight} kg` : '--'}</span>
                </div>
                <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                  <span className="text-zinc-500 font-bold block uppercase text-[9px]">Estatura / IMC</span>
                  <span className="font-black text-zinc-900 block text-sm">
                    {profile?.height ? `${profile.height} cm` : '--'} {bmi ? `(${bmi})` : ''}
                  </span>
                </div>
                <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                  <span className="text-zinc-500 font-bold block uppercase text-[9px]">Frequência</span>
                  <span className="font-black text-zinc-900 block text-sm">{plan.days.length}x na semana</span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 1: WORKOUT PROTOCOL */}
            {/* ========================================================================= */}
            {(sectionFilter === 'all' || sectionFilter === 'workout') && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b-2 border-purple-600 pb-2">
                  <Dumbbell className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900">
                    1. Protocolo de Treinamento Físico
                  </h2>
                </div>

                {/* Coach notes / progression */}
                {(plan.progression || (plan.recommendations && plan.recommendations.length > 0)) && (
                  <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 text-xs space-y-2">
                    <p className="font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" /> Diretrizes de Progressão & Carga
                    </p>
                    {plan.progression && <p className="text-zinc-700 leading-relaxed font-medium">{plan.progression}</p>}
                    {plan.recommendations && plan.recommendations.length > 0 && (
                      <ul className="list-disc list-inside text-zinc-700 space-y-1">
                        {plan.recommendations.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Workout Days Tables */}
                <div className="space-y-6">
                  {plan.days.map((day, dIdx) => (
                    <div key={dIdx} className="border border-zinc-300 rounded-2xl overflow-hidden shadow-sm page-break-inside-avoid">
                      
                      {/* Day Header */}
                      <div className="bg-zinc-900 text-white px-5 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <span className="font-black text-sm uppercase tracking-wider">{day.day}</span>
                          <span className="text-zinc-400 font-medium text-xs">• {day.focus}</span>
                        </div>
                        <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-bold">
                          {day.exercises.length} Exercícios
                        </span>
                      </div>

                      {/* Exercises Table */}
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-600 font-black uppercase text-[10px] tracking-wider">
                            <th className="py-2.5 px-3 w-8 text-center">#</th>
                            <th className="py-2.5 px-3">Exercício & Instruções</th>
                            <th className="py-2.5 px-2 text-center w-16">Séries</th>
                            <th className="py-2.5 px-2 text-center w-20">Reps</th>
                            <th className="py-2.5 px-2 text-center w-20">Descanso</th>
                            <th className="py-2.5 px-2 text-center w-24">Carga Atual</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {day.exercises.map((ex, exIdx) => (
                            <tr key={exIdx} className="hover:bg-zinc-50">
                              <td className="py-2.5 px-3 text-center font-black text-zinc-400 text-[11px]">
                                {exIdx + 1}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-black text-zinc-900 text-sm block">{ex.name}</span>
                                {ex.technicalDescription && (
                                  <span className="text-[11px] text-zinc-600 block leading-tight mt-0.5">
                                    {ex.technicalDescription}
                                  </span>
                                )}
                                {ex.tips && (
                                  <span className="text-[10px] text-purple-700 italic block mt-0.5">
                                    Dica: {ex.tips}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-center font-black text-zinc-900 text-sm">
                                {ex.sets}
                              </td>
                              <td className="py-2.5 px-2 text-center font-bold text-zinc-800">
                                {ex.reps}
                              </td>
                              <td className="py-2.5 px-2 text-center font-medium text-zinc-600">
                                {ex.rest}
                              </td>
                              <td className="py-2.5 px-2 text-center font-black text-purple-700">
                                {ex.weight ? ex.weight : '____ kg'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 2: DIET & NUTRITION PROTOCOL */}
            {/* ========================================================================= */}
            {(sectionFilter === 'all' || sectionFilter === 'diet') && plan.diet && (
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-2 border-b-2 border-emerald-600 pb-2">
                  <Utensils className="w-6 h-6 text-emerald-600" />
                  <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900">
                    2. Protocolo de Nutrição & Macronutrientes
                  </h2>
                </div>

                {/* Macros Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm text-center">
                    <span className="text-zinc-500 font-black uppercase text-[10px] block">Meta Calórica</span>
                    <span className="text-xl font-black text-emerald-700">{plan.diet.calories}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm text-center">
                    <span className="text-zinc-500 font-black uppercase text-[10px] block">Proteínas</span>
                    <span className="text-xl font-black text-blue-600">{plan.diet.macros.protein}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm text-center">
                    <span className="text-zinc-500 font-black uppercase text-[10px] block">Carboidratos</span>
                    <span className="text-xl font-black text-amber-600">{plan.diet.macros.carbs}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm text-center">
                    <span className="text-zinc-500 font-black uppercase text-[10px] block">Gorduras</span>
                    <span className="text-xl font-black text-rose-600">{plan.diet.macros.fat}</span>
                  </div>
                </div>

                {/* Meals Breakdown */}
                <div className="space-y-4">
                  <h4 className="font-black text-sm uppercase tracking-wider text-zinc-800">
                    Cronograma de Refeições Diárias ({plan.diet.meals.length} Refeições)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plan.diet.meals.map((meal, mIdx) => (
                      <div key={mIdx} className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/60 shadow-sm page-break-inside-avoid">
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-200">
                          <span className="font-black text-zinc-900 text-sm">{meal.name}</span>
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2 py-0.5 rounded">
                            {meal.time}
                          </span>
                        </div>
                        <ul className="space-y-1 text-xs text-zinc-700">
                          {meal.foods.map((food, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold">•</span>
                              <span>{food}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                {plan.diet.recommendations && plan.diet.recommendations.length > 0 && (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-xs space-y-1.5">
                    <p className="font-black uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Orientações Nutricionais Complementares
                    </p>
                    <ul className="list-disc list-inside text-zinc-600 space-y-1">
                      {plan.diet.recommendations.map((rec, rIdx) => (
                        <li key={rIdx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Document Footer */}
            <div className="pt-8 border-t-2 border-zinc-900 text-center text-zinc-400 text-xs space-y-1.5">
              <p className="font-black text-zinc-800 uppercase tracking-widest">
                FitAI • Inteligência Artificial e Ciência em Saúde & Performance
              </p>
              <p className="text-[11px]">
                Este documento é de uso pessoal do atleta. Siga sempre as orientações do seu profissional de saúde e respeite os limites fisiológicos.
              </p>
            </div>

          </div>
        </motion.div>
      </div>

      {/* Print Specific CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-full-report, #printable-full-report * {
            visibility: visible;
          }
          #printable-full-report {
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
