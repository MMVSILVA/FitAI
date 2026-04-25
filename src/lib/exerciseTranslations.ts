// Mapeamento de Tradução para o Banco de Exercícios e Busca
export const ptToEnExerciseMap: Record<string, string> = {
  'agachamento livre': 'squat',
  'agachamento barra': 'squat',
  'agachamento búlgaro': 'bulgarian split squat',
  'agachamento': 'squat',
  'supino reto': 'bench press',
  'supino inclinado': 'incline bench press',
  'supino declinado': 'decline bench press',
  'supino': 'bench press',
  'crucifixo': 'dumbbell fly',
  'crucifixo invertido': 'rear delt fly',
  'voador': 'pec deck machine',
  'peck deck': 'pec deck machine',
  'voador peito': 'pec deck machine',
  'flexão de braço': 'push-up',
  'crossover': 'cable crossover',
  'puxada aberta': 'lat pulldown',
  'pulley frente': 'lat pulldown',
  'remada baixa': 'seated row',
  'remada cavalinho': 't-bar row',
  'remada curvada': 'bent-over row',
  'remada unilateral': 'dumbbell row',
  'serrote': 'dumbbell row',
  'levantamento terra': 'deadlift',
  'terra': 'deadlift',
  'barra fixa': 'pull-up',
  'extensão lombar': 'back extension',
  'hiperestensão': 'back extension',
  'desenvolvimento de ombros': 'shoulder press',
  'desenvolvimento': 'shoulder press',
  'elevação lateral': 'lateral raise',
  'elevação frontal': 'front raise',
  'remada alta': 'upright row',
  'encolhimento': 'shrugs',
  'rosca direta': 'barbell curl',
  'rosca alternada': 'dumbbell curl',
  'rosca concentrada': 'concentration curl',
  'rosca scott': 'preacher curl',
  'tríceps pulley': 'triceps pushdown',
  'tríceps corda': 'cable triceps extension',
  'tríceps testa': 'skullcrusher',
  'tríceps francês': 'french press',
  'mergulho': 'dips',
  'paralelas': 'dips',
  'leg press': 'leg press machine',
  'cadeira extensora': 'leg extension',
  'mesa flexora': 'leg curl machine',
  'cadeira flexora': 'leg curl machine',
  'stiff': 'romanian deadlift',
  'agachamento romeno': 'romanian deadlift',
  'avanço': 'lunges',
  'passada': 'lunges',
  'elevação de panturrilha': 'calf raises',
  'gêmeos': 'calf raises',
  'abdominal crunch': 'crunch',
  'abdominal infra': 'leg raise',
  'abdominal supra': 'upper crunch',
  'rotação russa': 'russian twist',
  'prancha': 'plank',
  'esteira': 'treadmill',
  'bicicleta ergométrica': 'stationary bike',
  'elíptico': 'elliptical',
  'simulador de escada': 'stairclimber',
  'escada': 'stairclimber',
  'costas': 'back',
  'peito': 'chest',
  'ombro': 'shoulder',
  'perna': 'leg',
  'abdominal': 'abs',
  'braço': 'arm'
};

export const ptToEnSearch = (term: string): string => {
  if (!term) return 'fitness';
  const lowerTerm = term.toLowerCase().trim();
  
  // Try exact match first
  if (ptToEnExerciseMap[lowerTerm]) return ptToEnExerciseMap[lowerTerm];
  
  // Check if term starts with or contains keywords
  for (const [pt, en] of Object.entries(ptToEnExerciseMap)) {
    if (lowerTerm.includes(pt)) return en;
  }
  
  return term;
};

export const translations: Record<string, string> = {
  // Categorias / Partes do Corpo
  'back': 'Costas',
  'cardio': 'Cardio',
  'chest': 'Peito',
  'lower arms': 'Antebraço',
  'lower legs': 'Panturrilha',
  'neck': 'Pescoço',
  'shoulders': 'Ombros',
  'upper arms': 'Braço Superior',
  'upper legs': 'Coxas',
  'waist': 'Abdominal',
  
  // Equipamentos
  'body weight': 'Peso Corporal',
  'cable': 'Cabo',
  'dumbbell': 'Haltere',
  'barbell': 'Barra',
  'kettlebell': 'Kettlebell',
  'machine': 'Máquina',
  'medicine ball': 'Bola Medicinal',
  'resistance band': 'Faixa Elástica',
  'stability ball': 'Bola de Estabilidade',
  'ez barbell': 'Barra EZ',
  'assisted': 'Assistido',
  'band': 'Faixa Elástica',
  'weighted': 'Com Carga',
  'wheel roller': 'Roda Abdominal',
  'rope': 'Corda',
  'skierg machine': 'Máquina SkiErg',
  'smith machine': 'Máquina Smith',

  // Músculos
  'abs': 'Abdominais',
  'quads': 'Quadríceps',
  'lats': 'Dorsais',
  'triceps': 'Tríceps',
  'biceps': 'Bíceps',
  'glutes': 'Glúteos',
  'hamstrings': 'Isquiotibiais',
  'adductors': 'Adutores',
  'abductors': 'Abdutores',
  'delts': 'Deltoides',
  'traps': 'Trapézio',
  'pectorals': 'Peitorais',
  'calves': 'Panturrilhas',
  'forearms': 'Antebraços',
  'upper back': 'Parte Superior das Costas',
  'spine': 'Lombar'
};

export const translate = (text: string): string => {
  if (!text) return "";
  return translations[text.toLowerCase()] || text;
};

export const enToPtExerciseNameMap: Record<string, string> = {
  'standing': 'em pé',
  'seated': 'sentado',
  'lying': 'deitado',
  'incline': 'inclinado',
  'decline': 'declinado',
  'reverse': 'inverso',
  'barbell': 'barra',
  'dumbbell': 'halteres',
  'cable': 'cabo',
  'lever': 'máquina',
  'smith': 'no smith',
  'machine': 'na máquina',
  'bench': 'banco',
  'curls': 'rosca',
  'curl': 'rosca',
  'press': 'supino/desenvolvimento',
  'presses': 'supino/desenvolvimento',
  'pin': 'parcial (pin)',
  'bench press': 'supino',
  'chest press': 'supino na máquina',
  'shoulder press': 'desenvolvimento',
  'squat': 'agachamento',
  'deadlift': 'levantamento terra',
  'row': 'remada',
  'pulldown': 'puxada',
  'fly': 'crucifixo',
  'raise': 'elevação',
  'extension': 'extensão',
  'kickback': 'coice',
  'dip': 'mergulho',
  'pushup': 'flexão',
  'push up': 'flexão',
  'crunch': 'abdominal',
  'leg press': 'leg press',
  'leg curl': 'flexão de pernas',
  'leg extension': 'extensão de pernas',
  'calf raise': 'panturrilha',
  'upright': 'vertical',
  'bent over': 'curvado',
  'one arm': 'unilateral',
  'single arm': 'unilateral',
  'alternate': 'alternado',
  'hammer': 'martelo',
  'preacher': 'scott',
  'arnold': 'arnold',
  'overhead': 'sobre a cabeça',
  'triceps': 'tríceps',
  'biceps': 'bíceps',
  'military': 'militar',
  'lateral': 'lateral',
  'front': 'frontal',
  'rear': 'posterior',
  'delt': 'deltoide',
  'shrug': 'encolhimento',
  'lunge': 'afundo',
  'step-up': 'subida no banco',
  'plank': 'prancha',
  'burpee': 'burpee',
  'mountain climber': 'mountain climber',
  'jumping jack': 'polichinelo',
  'back': 'costas',
  'chest': 'peito',
  'legs': 'pernas',
  'arms': 'braços',
  'grip': 'pegada',
  'close': 'fechada',
  'wide': 'aberta',
  'narrow': 'estreita',
  'underhand': 'supinada',
  'overhand': 'pronada',
  'neutral': 'neutra',
  'high': 'alto',
  'low': 'baixo',
  'middle': 'médio',
  't-bar': 'barra t',
  'one-arm': 'unilateral',
  'two-arm': 'bilateral',
  'band': 'com elástico',
  'assisted': 'assistido',
  'weighted': 'com carga',
  'stability ball': 'na bola',
  'bosu': 'no bosu'
};

export const translateExerciseName = (name: string): string => {
  if (!name) return "Exercício";
  
  let lowerName = name.toLowerCase();
  
  // Substituições de frases completas comuns primeiro
  const commonFullNames: Record<string, string> = {
    'bench press': 'Supino Reto',
    'barbell bench press': 'Supino Reto',
    'dumbbell bench press': 'Supino Reto',
    'incline bench press': 'Supino Inclinado',
    'decline bench press': 'Supino Declinado',
    'dumbbell fly': 'Crucifixo',
    'pec deck machine': 'Voador / Peck Deck',
    'fly machine': 'Voador / Peck Deck',
    'push-up': 'Flexão de Braço',
    'cable crossover': 'Crossover',
    'lat pulldown': 'Puxada Aberta',
    'seated row': 'Remada Baixa',
    't-bar row': 'Remada Cavalinho',
    'bent-over row': 'Remada Curvada',
    'barbell row': 'Remada Curvada',
    'deadlift': 'Levantamento Terra',
    'dumbbell row': 'Remada Unilateral',
    'pull-up': 'Barra Fixa',
    'back extension': 'Extensão Lombar',
    'shoulder press': 'Desenvolvimento de Ombros',
    'overhead press': 'Desenvolvimento de Ombros',
    'lateral raise': 'Elevação Lateral',
    'front raise': 'Elevação Frontal',
    'rear delt fly': 'Crucifixo Invertido',
    'upright row': 'Remada Alta',
    'shrugs': 'Encolhimento',
    'barbell curl': 'Rosca Direta',
    'dumbbell curl': 'Rosca Alternada',
    'concentration curl': 'Rosca Concentrada',
    'preacher curl': 'Rosca Scott',
    'triceps pushdown': 'Tríceps Pulley / Corda',
    'cable triceps extension': 'Tríceps Pulley / Corda',
    'skullcrusher': 'Tríceps Testa',
    'overhead triceps extension': 'Tríceps Francês',
    'dips': 'Mergulho / Paralelas',
    'squat': 'Agachamento',
    'barbell squat': 'Agachamento',
    'leg press machine': 'Leg Press',
    'leg extension': 'Cadeira Extensora',
    'leg curl machine': 'Mesa Flexora',
    'romanian deadlift': 'Stiff',
    'lunges': 'Avanço / Passada',
    'calf raises': 'Elevação de Panturrilha',
    'bulgarian split squat': 'Agachamento Búlgaro',
    'crunch': 'Abdominal Crunch',
    'plank': 'Prancha',
    'leg raise': 'Abdominal Infra',
    'upper crunch': 'Abdominal Supra',
    'russian twist': 'Rotação Russa',
    'treadmill': 'Esteira',
    'stationary bike': 'Bicicleta Ergométrica',
    'elliptical': 'Elíptico',
    'stairclimber': 'Simulador de Escada'
  };

  if (commonFullNames[lowerName]) return commonFullNames[lowerName];

  // Se não for uma frase comum, traduzir por partes com inteligência de ordem
  let parts = lowerName.split(' ');
  
  // Palavras que indicam o exercício principal e devem vir primeiro em PT-BR
  const mainExercises = ['curl', 'press', 'squat', 'deadlift', 'row', 'pulldown', 'fly', 'raise', 'extension', 'kickback', 'dip', 'pushup', 'crunch', 'lunge', 'shrug', 'curls', 'presses'];
  let mainWord = parts.find(p => mainExercises.includes(p));
  let otherParts = parts.filter(p => p !== mainWord);
  
  let translatedMain = mainWord ? (enToPtExerciseNameMap[mainWord] || mainWord) : "";
  let translatedOthers = otherParts.map(p => enToPtExerciseNameMap[p] || p);
  
  // Reordenar: [Exercício] + [Outras Partes]
  let result = "";
  if (translatedMain) {
    result = translatedMain;
    if (translatedOthers.length > 0) {
      result += " " + translatedOthers.join(' ');
    }
  } else {
    result = translatedOthers.join(' ');
  }

  // Refinamentos finais de gramática
  result = result
    .replace('supino/desenvolvimento cabo', 'Supino no cabo')
    .replace('supino/desenvolvimento barra', 'Supino com barra')
    .replace('supino/desenvolvimento banco', 'Supino no banco')
    .replace('cabo banco', 'no cabo no banco')
    .replace('barra parcial (pin)', 'Pin Press com barra')
    .replace('rosca barra', 'Rosca com Barra')
    .replace('rosca halteres', 'Rosca com Halteres')
    .replace('supino barra', 'Supino com Barra')
    .replace('supino halteres', 'Supino com Halteres')
    .replace('agachamento barra', 'Agachamento com Barra')
    .replace('remada barra', 'Remada com Barra')
    .replace('remada halteres', 'Remada com Halteres')
    .replace('unilateral unilateral', 'unilateral')
    .replace('máquina máquina', 'na máquina')
    .replace('cabo cabo', 'no cabo');

  return result.charAt(0).toUpperCase() + result.slice(1);
};
