import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Activity, 
  Wind, 
  Clock, 
  Target, 
  AlertTriangle,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Share2
} from 'lucide-react';

export interface ExercisePostureGuide {
  id: string;
  name: string;
  muscleGroup: 'Pernas & Glúteos' | 'Peito & Tríceps' | 'Costas & Bíceps' | 'Ombros' | 'Core & Abdômen';
  primaryMuscle: string;
  secondaryMuscle: string;
  cadence: string;
  breathing: string;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  checkpoints: {
    part: string;
    description: string;
    icon: string;
  }[];
  doList: string[];
  dontList: string[];
  visualCue: string;
  proTip: string;
}

export const EXERCISE_POSTURE_DATA: ExercisePostureGuide[] = [
  {
    id: 'squat',
    name: 'Agachamento Livre',
    muscleGroup: 'Pernas & Glúteos',
    primaryMuscle: 'Quadríceps & Glúteo Máximo',
    secondaryMuscle: 'Isquiotibiais, Adutores & Eretores da Espinha',
    cadence: '3:1:1 (3s descida, 1s base, 1s subida explosiva)',
    breathing: 'Inspire e trave o abdômen (Manobra de Valsalva) na descida; expire após passar o ponto crítico na subida.',
    difficulty: 'Intermediário',
    checkpoints: [
      { part: 'Pés', description: 'Largura dos ombros, pontas rodadas de 15° a 30° para fora.', icon: '🦶' },
      { part: 'Joelhos', description: 'Acompanham a linha da ponta dos pés, sem colapsar para dentro (valgo dinâmico).', icon: '🦵' },
      { part: 'Tronco & Core', description: 'Peito estufado, escápulas aduzidas com barra apoiada no trapézio.', icon: '🛡️' },
      { part: 'Quadril & Coluna', description: 'Flexione quadril e joelhos juntos, mantendo curvatura neutra da lombar.', icon: '📐' }
    ],
    doList: [
      'Empurre o chão com todo o pé (calcanhar e metatarso)',
      'Desça até as coxas ficarem paralelas ao chão ou abaixo (conforme mobilidade)',
      'Mantenha o olhar fixo em um ponto neutro à frente/chão',
      'Contraia os glúteos no topo sem hiperestender a pelve'
    ],
    dontList: [
      'Não deixe os joelhos caírem para dentro (valgo)',
      'Não tire os calcanhares do chão em nenhuma fase',
      'Evite arredondar a lombar na descida máxima ("butt wink")',
      'Não projete o tronco excessivamente para frente'
    ],
    visualCue: 'Imagine que você vai sentar em uma cadeira baixa atrás de você, mantendo o peito erguido.',
    proTip: 'Ative os glúteos e pense em "rasgar o chão para fora" com os pés para criar torque no quadril.'
  },
  {
    id: 'bench-press',
    name: 'Supino Reto com Barra',
    muscleGroup: 'Peito & Tríceps',
    primaryMuscle: 'Peitoral Maior (Fibras Esternais e Claviculares)',
    secondaryMuscle: 'Deltoide Anterior & Tríceps Braquial',
    cadence: '2:1:1 (2s descida controlada, 1s toque no peito, 1s empurrão)',
    breathing: 'Inspire profundamente expandindo a caixa torácica na descida; expire ao empurrar a barra para cima.',
    difficulty: 'Intermediário',
    checkpoints: [
      { part: 'Escápulas', description: 'Totalmente retratadas e deprimidas ("guardadas no bolso de trás") durante todo o movimento.', icon: '🦴' },
      { part: 'Pés', description: 'Firmes e plantados no solo, gerando pressão de pernas (Leg Drive).', icon: '🦶' },
      { part: 'Pegada', description: 'Punhos neutros sem dobrar para trás, barra apoiada na base da palma.', icon: '✊' },
      { part: 'Cotovelos', description: 'Angulados entre 45° e 70° em relação ao tronco (nunca a 90°).', icon: '📐' }
    ],
    doList: [
      'Crie um arco natural e firme com a lombar mantendo o glúteo colado no banco',
      'Toque a barra suavemente na linha inferior do peito (mamilos)',
      'Mantenha os olhos alinhados diretamente sob a barra antes de tirá-la do suporte',
      'Empurre a barra para cima e ligeiramente para trás em direção aos olhos'
    ],
    dontList: [
      'Não abra os cotovelos a 90° (risco grave para os tendões do ombro)',
      'Não deixe os punhos dobrarem para trás suportando o peso no pulso',
      'Não tire o glúteo do banco durante o esforço',
      'Não quique a barra contra o esterno para ganhar impulso'
    ],
    visualCue: 'Pense em "dobrar a barra ao meio" para ativar os dorsais e estabilizar os ombros.',
    proTip: 'Aduzir as escápulas reduz o curso da barra em até 20% e isola o peitoral protegendo o manguito rotador.'
  },
  {
    id: 'deadlift',
    name: 'Levantamento Terra Convencional',
    muscleGroup: 'Costas & Bíceps',
    primaryMuscle: 'Glúteos, Isquiotibiais & Eretores da Espinha',
    secondaryMuscle: 'Dorsais, Trapézio, Antebraços & Core',
    cadence: '1:0:2 (Subida potente de 1s, descida controlada em 2s)',
    breathing: 'Respire fundo na base, trave a pressão intra-abdominal e solte o ar apenas ao finalizar a extensão no topo.',
    difficulty: 'Avançado',
    checkpoints: [
      { part: 'Posição da Barra', description: 'Barra a 2-3 cm das canelas, alinhada com o meio do pé.', icon: '⚡' },
      { part: 'Coluna', description: '100% neutra, da cervical ao cóccix, sem flexão da lombar.', icon: '🛡️' },
      { part: 'Escápulas', description: 'Posicionadas diretamente acima da barra antes da puxada.', icon: '🎯' },
      { part: 'Dorsais', description: 'Ativados fortemente como se estivesse esmagando laranjas nas axilas.', icon: '💪' }
    ],
    doList: [
      'Puxe o "slack" (a folga) da barra antes de arrancá-la do chão',
      'Pense em empurrar o chão para longe, e não em "puxar com os braços"',
      'Mantenha a barra colada no corpo (canelas e coxas) durante todo o trajeto',
      'Estenda joelhos e quadril em perfeita sincronia'
    ],
    dontList: [
      'Nunca arredonde a coluna lombar ao erguer a carga',
      'Não dobre os braços na puxada (risco de ruptura do tendão do bíceps)',
      'Não hiperestenda as costas para trás no topo do movimento',
      'Não deixe a barra afastar-se das pernas durante a subida'
    ],
    visualCue: 'Você é um guindaste humano: as pernas produzem a força e a coluna é uma haste de aço rígida.',
    proTip: 'Se sentir a pegada falhar antes das costas, use a pegada mista ou straps em cargas de pico.'
  },
  {
    id: 'bent-over-row',
    name: 'Remada Curvada com Barra',
    muscleGroup: 'Costas & Bíceps',
    primaryMuscle: 'Latíssimo do Dorso & Romboides',
    secondaryMuscle: 'Trapézio Médio/Inferior, Deltoide Posterior & Bíceps',
    cadence: '2:1:1 (Puxada de 1s, pico de contração de 1s, descida de 2s)',
    breathing: 'Expire ao puxar a barra em direção ao abdômen inferior; inspire ao retornar controlando o peso.',
    difficulty: 'Intermediário',
    checkpoints: [
      { part: 'Inclinação', description: 'Tronco inclinado entre 45° e 60°, joelhos levemente destravados.', icon: '📐' },
      { part: 'Cabeça', description: 'Pescoço alinhado com a coluna, olhar a 1 metro à frente no chão.', icon: '👀' },
      { part: 'Cotovelos', description: 'Puxam rente ao corpo liderando o movimento para trás.', icon: '🏹' },
      { part: 'Lombar', description: 'Estável e travada em posição neutra por toda a série.', icon: '🛡️' }
    ],
    doList: [
      'Puxe a barra em direção à linha do umbigo / quadril',
      'Esmague as escápulas juntas no ponto mais alto do movimento',
      'Mantenha os joelhos firmes e o peso distribuído no meio dos pés',
      'Deixe os braços se estenderem completamente na fase excêntrica para alongar a dorsal'
    ],
    dontList: [
      'Não use impulso do tronco balançando para frente e para trás ("roubar")',
      'Não puxe a barra na direção do peito (sobrecarrega os ombros)',
      'Não deixe a lombar arredondar devido ao cansaço',
      'Não encolha os ombros em direção às orelhas'
    ],
    visualCue: 'Imagine que suas mãos são apenas ganchos e você está puxando com a ponta dos cotovelos.',
    proTip: 'A pegada pronada foca mais na parte alta das costas e deltoides; a pegada supinada recruta mais as fibras inferiores e bíceps.'
  },
  {
    id: 'overhead-press',
    name: 'Desenvolvimento Militar com Halteres',
    muscleGroup: 'Ombros',
    primaryMuscle: 'Deltoide Anterior & Deltoide Medial',
    secondaryMuscle: 'Tríceps Braquial & Serrátil Anterior',
    cadence: '2:0:1 (2s descida até 90° ou altura do queixo, 1s impulso firme)',
    breathing: 'Inspire ao descer os halteres controladamente; expire ao empurrar acima da cabeça.',
    difficulty: 'Iniciante',
    checkpoints: [
      { part: 'Cotovelos', description: 'Levemente apontados a 30° para frente (no plano escapular).', icon: '📐' },
      { part: 'Core & Glúteos', description: 'Fortemente contraídos para evitar hiperextensão da lombar.', icon: '🛡️' },
      { part: 'Punhos', description: 'Retos e empilhados diretamente acima dos cotovelos.', icon: '✊' },
      { part: 'Trajetória', description: 'Sobe em arco suave até os halteres ficarem sobre o topo da cabeça.', icon: '⭐' }
    ],
    doList: [
      'Mantenha os pés firmes no solo com apoio completo das costas no banco',
      'Desça os halteres pelo menos até a linha das orelhas / queixo para amplitude completa',
      'Mantenha o peito aberto e os ombros longe das orelhas',
      'Controle rigorosamente a descida sem deixar os halteres despencarem'
    ],
    dontList: [
      'Não bata os halteres com força no topo (dissipa a tensão mecânica)',
      'Não jogue os cotovelos totalmente para trás no plano lateral',
      'Não arqueie excessivamente a coluna tirando as costas do encosto',
      'Evite travar bruscamente a articulação dos cotovelos no topo'
    ],
    visualCue: 'Empurre o teto para longe enquanto mantém suas costelas fechadas e o abdômen firme.',
    proTip: 'Trabalhar no plano escapular (cotovelos ~30° à frente) previne o pinçamento do tendão supraespinhoso.'
  },
  {
    id: 'lunge',
    name: 'Afundo / Passada com Halteres',
    muscleGroup: 'Pernas & Glúteos',
    primaryMuscle: 'Glúteo Máximo & Quadríceps',
    secondaryMuscle: 'Isquiotibiais, Panturrilhas & Estabilizadores do Core',
    cadence: '2:1:1 (2s descida, 1s pausa rente ao chão, 1s subida)',
    breathing: 'Inspire na descida em direção ao solo; expire ao empurrar com a perna dianteira de volta ao topo.',
    difficulty: 'Iniciante',
    checkpoints: [
      { part: 'Passo', description: 'Distância suficiente para que ambos os joelhos formem 90° na base.', icon: '📐' },
      { part: 'Tronco', description: 'Levemente inclinado à frente (10-15°) para maior ativação de glúteo.', icon: '🧍' },
      { part: 'Joelho Dianteiro', description: 'Alinhado com o segundo dedo do pé, sem desviar para dentro.', icon: '🦵' },
      { part: 'Joelho Traseiro', description: 'Desce verticalmente até ficar a 2 cm do chão.', icon: '🎯' }
    ],
    doList: [
      'Empurre principalmente através do calcanhar do pé dianteiro',
      'Mantenha a pelve apontada para a frente, sem girar o quadril',
      'Mantenha o abdômen ativado para garantir o equilíbrio lateral',
      'Distribua 75% do peso na perna da frente e 25% na de trás'
    ],
    dontList: [
      'Não deixe o joelho dianteiro colapsar para dentro na descida',
      'Não bata o joelho traseiro no chão com impacto',
      'Não dê passos curtos demais que comprimam excessivamente a patela',
      'Não deixe os ombros caírem para frente relaxando a postura'
    ],
    visualCue: 'Pense em descer como um elevador em linha reta, e não como uma escada rolante para frente.',
    proTip: 'Uma ligeira inclinação do tronco à frente dobra o alongamento do glúteo máximo na base do afundo.'
  },
  {
    id: 'plank',
    name: 'Prancha Abdominal Isométrica',
    muscleGroup: 'Core & Abdômen',
    primaryMuscle: 'Transverso do Abdômen & Reto Abdominal',
    secondaryMuscle: 'Oblíquos, Glúteos & Serrátil Anterior',
    cadence: 'Isometria contínua (ex: 45s a 60s sob tensão máxima)',
    breathing: 'Respiração diafragmática curta e controlada, mantendo o abdômen travado como uma carcaça blindada.',
    difficulty: 'Iniciante',
    checkpoints: [
      { part: 'Cotovelos', description: 'Exatamente abaixo da linha dos ombros, antebraços paralelos no solo.', icon: '📐' },
      { part: 'Pelve & Lombar', description: 'Retroversão pélvica ("esconder o rabo"), glúteos apertados com força.', icon: '🛡️' },
      { part: 'Cabeça & Cervical', description: 'Olhar fixo entre as mãos, mantendo a nuca alinhada com as costas.', icon: '👀' },
      { part: 'Pés', description: 'Na largura dos quadris, pontas firmes cravadas no chão.', icon: '🦶' }
    ],
    doList: [
      'Puxe ativamente os cotovelos em direção aos pés para criar tensão máxima (prancha RKC)',
      'Mantenha uma linha reta contínua dos calcanhares até a cabeça',
      'Aperte os glúteos e coxas para estabilizar a pelve',
      'Empurre o chão com os antebraços para não "afundar" os ombros'
    ],
    dontList: [
      'Não deixe o quadril despencar criando hiperextensão na lombar',
      'Não eleve o quadril em formato de "V" invertido para aliviar a carga',
      'Não segure a respiração (evite apneia prolongada)',
      'Não deixe a cabeça pender para baixo relaxando o pescoço'
    ],
    visualCue: 'Imagine que alguém vai apoiar um copo d\'água nas suas costas e ele não pode derramar uma gota.',
    proTip: 'Uma prancha de 30 segundos com 100% de tensão muscular ativa mais fibras do que 2 minutos de prancha passiva e relaxada.'
  },
  {
    id: 'lat-pulldown',
    name: 'Puxada Alta na Polia (Lat Pulldown)',
    muscleGroup: 'Costas & Bíceps',
    primaryMuscle: 'Grande Dorsal',
    secondaryMuscle: 'Bíceps Braquial, Braquiorradial & Romboides',
    cadence: '2:1:1 (1s puxada até o queixo/peito, 1s pausa, 2s subida)',
    breathing: 'Expire ao puxar a barra para baixo; inspire ao estender os braços controlando o retorno dos pesos.',
    difficulty: 'Iniciante',
    checkpoints: [
      { part: 'Apoio das Coxas', description: 'Ajuste os roletes bem firmes sobre as coxas para travar o corpo.', icon: '🪑' },
      { part: 'Escápulas', description: 'Inicie o movimento deprimindo as escápulas antes de dobrar os braços.', icon: '🦴' },
      { part: 'Tronco', description: 'Leve inclinação de 10° a 15° para trás, peito estufado.', icon: '🧍' },
      { part: 'Barra', description: 'Desce suavemente na linha da clavícula / peito superior.', icon: '🎯' }
    ],
    doList: [
      'Puxe liderando pelos cotovelos em direção aos bolsos da calça',
      'Estufe o peito ao encontro da barra no ponto mais baixo',
      'Permita que os dorsais se alonguem totalmente no topo do movimento',
      'Mantenha a pegada um pouco mais larga que a largura dos ombros'
    ],
    dontList: [
      'Nunca puxe a barra por trás da nuca (risco extremo à articulação do ombro)',
      'Não balance o tronco violentamente para trás usando o peso do corpo',
      'Não curve os punhos para dentro ao puxar',
      'Não encolha o pescoço'
    ],
    visualCue: 'Pense em enfiar os cotovelos nos bolsos de trás do seu calção.',
    proTip: 'Iniciar a puxada pela depressão das escápulas garante que 80% do estímulo vá para a dorsal e não para os bíceps.'
  },
  {
    id: 'hip-thrust',
    name: 'Elevação Pélvica com Barra',
    muscleGroup: 'Pernas & Glúteos',
    primaryMuscle: 'Glúteo Máximo',
    secondaryMuscle: 'Isquiotibiais & Eretor da Espinha',
    cadence: '2:2:1 (1s subida potente, 2s esmagamento no topo, 2s descida)',
    breathing: 'Inspire na descida; expire no esforço de erguer a pelve até o alinhamento total.',
    difficulty: 'Intermediário',
    checkpoints: [
      { part: 'Apoio no Banco', description: 'Borda do banco posicionada logo abaixo das escápulas.', icon: '🪑' },
      { part: 'Queixo & Olhar', description: 'Queixo colado ao peito, olhar fixo sempre para a frente.', icon: '👀' },
      { part: 'Pés & Joelhos', description: 'Pés na largura do quadril, canelas 100% verticais no topo (90°).', icon: '📐' },
      { part: 'Topo', description: 'Retroversão pélvica total sem arquear a coluna lombar.', icon: '⚡' }
    ],
    doList: [
      'Empurre com força total através dos calcanhares',
      'Mantenha o queixo apontado para o peito durante todo o trajeto',
      'Segure 2 segundos contraindo os glúteos no topo máximo',
      'Use um acolchoado (pad) espesso na barra para proteger os ossos ilíacos'
    ],
    dontList: [
      'Não jogue a cabeça para trás olhando para o teto',
      'Não arqueie a lombar para subir mais alto do que a linha do quadril',
      'Não posicione os pés muito perto dos glúteos (sobrecarrega os quadríceps)',
      'Não posicione os pés longe demais (rouba o trabalho para os isquiotibiais)'
    ],
    visualCue: 'Seu corpo no topo deve formar uma mesa plana dos joelhos até os ombros.',
    proTip: 'Manter o queixo colado ao peito protege a lombar de hiperextensão e maximiza o recrutamento mecânico do glúteo.'
  },
  {
    id: 'bicep-curl',
    name: 'Rosca Direta com Barra W',
    muscleGroup: 'Costas & Bíceps',
    primaryMuscle: 'Bíceps Braquial & Braquial Anterior',
    secondaryMuscle: 'Braquiorradial & Flexores do Punho',
    cadence: '2:1:1 (1s subida concentrada, 1s pico de contração, 2s descida)',
    breathing: 'Expire ao flexionar os cotovelos trazendo a barra para cima; inspire na descida lenta.',
    difficulty: 'Iniciante',
    checkpoints: [
      { part: 'Cotovelos', description: 'Colados e fixos nas laterais das costelas, sem avançar para frente.', icon: '🔒' },
      { part: 'Punhos', description: 'Alinhados com o antebraço, sem dobrar para dentro.', icon: '✊' },
      { part: 'Postura Geral', description: 'Pés na largura dos ombros, joelhos semi-flexionados e core ativo.', icon: '🧍' },
      { part: 'Amplitude', description: 'Estenda quase totalmente na descida sem perder a tensão.', icon: '📐' }
    ],
    doList: [
      'Mantenha os cotovelos como um eixo fixo inamovível',
      'Aperte o bíceps no topo por 1 segundo sem encostar a barra no peito',
      'Desça o peso resistindo à gravidade em 2 a 3 segundos',
      'A barra W alivia a pressão nos punhos em comparação com a barra reta'
    ],
    dontList: [
      'Não jogue o tronco para trás criando embalo ("roubo")',
      'Não projete os cotovelos para frente para descansar no topo',
      'Não deixe a barra despencar na fase negativa',
      'Não flexione os punhos em direção ao corpo no pico'
    ],
    visualCue: 'Imagine que seus cotovelos estão parafusados nas laterais do seu corpo.',
    proTip: 'A fase excêntrica (descida de 2 a 3 segundos) é responsável por até 70% das microlesões que geram hipertrofia no bíceps.'
  }
];

interface WorkoutPostureCarouselProps {
  onSelectExercise?: (exerciseName: string) => void;
}

export const WorkoutPostureCarousel: React.FC<WorkoutPostureCarouselProps> = ({ onSelectExercise }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<string>('Todos');
  const [showFullModal, setShowFullModal] = useState(false);
  const [savedGuides, setSavedGuides] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('fitai_saved_posture_guides');
      return stored ? JSON.parse(stored) : ['squat', 'bench-press'];
    } catch {
      return ['squat', 'bench-press'];
    }
  });

  const categories = ['Todos', 'Pernas & Glúteos', 'Peito & Tríceps', 'Costas & Bíceps', 'Ombros', 'Core & Abdômen'];

  const filteredGuides = selectedFilter === 'Todos' 
    ? EXERCISE_POSTURE_DATA 
    : EXERCISE_POSTURE_DATA.filter(g => g.muscleGroup === selectedFilter);

  // Garantir que currentIndex fique dentro do alcance
  const safeIndex = Math.min(currentIndex, Math.max(0, filteredGuides.length - 1));
  const currentGuide = filteredGuides[safeIndex] || EXERCISE_POSTURE_DATA[0];

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? filteredGuides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === filteredGuides.length - 1 ? 0 : prev + 1));
  };

  const toggleSaveGuide = (id: string) => {
    setSavedGuides(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      localStorage.setItem('fitai_saved_posture_guides', JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 blur-[90px] rounded-full pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 blur-[90px] rounded-full pointer-events-none -ml-20 -mb-20" />

      {/* Header Section */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
              Biomecânica & Performance
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
            Guia de Postura & Execução Perfeita
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            Aprenda a ativar as fibras certas, proteger suas articulações e extrair o máximo estímulo de cada repetição.
          </p>
        </div>

        {/* Carousel Navigation Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrev}
            aria-label="Exercício Anterior"
            className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white transition-all shadow-sm active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="text-xs font-bold font-mono px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400">
            {safeIndex + 1} / {filteredGuides.length}
          </span>

          <button
            onClick={handleNext}
            aria-label="Próximo Exercício"
            className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white transition-all shadow-sm active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter Badges */}
      <div className="relative z-10 flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => {
              setSelectedFilter(cat);
              setCurrentIndex(0);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              selectedFilter === cat
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20'
                : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Active Card with Slide Animation */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentGuide.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8"
          >
            {/* Top Bar of Active Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-white/10">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    {currentGuide.muscleGroup}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    currentGuide.difficulty === 'Iniciante' 
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' 
                      : currentGuide.difficulty === 'Intermediário'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                  }`}>
                    Nível {currentGuide.difficulty}
                  </span>
                </div>
                <h4 className="text-2xl sm:text-3xl font-black text-black dark:text-white">
                  {currentGuide.name}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSaveGuide(currentGuide.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    savedGuides.includes(currentGuide.id)
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${savedGuides.includes(currentGuide.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                  {savedGuides.includes(currentGuide.id) ? 'Salvo' : 'Salvar Dica'}
                </button>

                {onSelectExercise && (
                  <button
                    onClick={() => onSelectExercise(currentGuide.name)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25 transition-all active:scale-95"
                  >
                    <Target className="w-4 h-4" />
                    Adicionar ao Treino
                  </button>
                )}
              </div>
            </div>

            {/* Visual Mental Cue Banner */}
            <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-purple-900/20 via-blue-900/10 to-transparent border border-purple-500/20 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Gatilho Mental (Visual Cue)
                </p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5 leading-relaxed">
                  "{currentGuide.visualCue}"
                </p>
              </div>
            </div>

            {/* Posture Checkpoints Grid */}
            <div className="mb-6">
              <h5 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-500" />
                Pontos de Alinhamento Articular (Checkpoints)
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {currentGuide.checkpoints.map((cp, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-2xl bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-white/5 flex flex-col justify-between hover:border-purple-500/30 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{cp.icon}</span>
                        <span className="text-xs font-black text-black dark:text-white uppercase tracking-tight">
                          {cp.part}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        {cp.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dos & Don'ts Comparison Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Green Box: O que fazer */}
              <div className="p-5 rounded-2xl bg-green-500/5 dark:bg-green-950/20 border border-green-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                  <h6 className="text-xs font-black uppercase tracking-wider text-green-700 dark:text-green-400">
                    O que fazer (Postura Correta)
                  </h6>
                </div>
                <ul className="space-y-2.5">
                  {currentGuide.doList.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Red Box: Erros comuns a evitar */}
              <div className="p-5 rounded-2xl bg-red-500/5 dark:bg-red-950/20 border border-red-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                  <h6 className="text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-400">
                    Erros comuns a evitar
                  </h6>
                </div>
                <ul className="space-y-2.5">
                  {currentGuide.dontList.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Technical Specs Footer (Cadence, Breathing & Pro Tip) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-white/10">
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-500 mb-1">
                  <Clock className="w-3.5 h-3.5 text-purple-500" />
                  Cadência Recomendada
                </div>
                <p className="text-xs font-bold text-black dark:text-white">
                  {currentGuide.cadence}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-500 mb-1">
                  <Wind className="w-3.5 h-3.5 text-blue-500" />
                  Padrão de Respiração
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">
                  {currentGuide.breathing}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-600/10 border border-purple-500/20">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Dica Pro de Treinador
                </div>
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-snug">
                  {currentGuide.proTip}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mini Dot Indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-6">
        {filteredGuides.map((guide, idx) => (
          <button
            key={guide.id}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Ir para exercício ${guide.name}`}
            className={`h-2 rounded-full transition-all ${
              idx === safeIndex
                ? 'w-8 bg-purple-600'
                : 'w-2 bg-gray-300 dark:bg-zinc-700 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
