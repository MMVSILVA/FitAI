// Mapeamento de Tradução para o Banco de Exercícios e Busca
export const ptToEnExerciseMap: Record<string, string> = {
  'agachamento livre': 'barbell squat',
  'agachamento barra': 'barbell squat',
  'agachamento': 'squat',
  'supino reto': 'barbell bench press',
  'supino inclinado': 'incline barbell bench press',
  'supino declinado': 'decline barbell bench press',
  'supino': 'bench press',
  'levante terra': 'deadlift',
  'terra': 'deadlift',
  'rosca bíceps': 'bicep curl',
  'rosca martelo': 'hammer curl',
  'rosca': 'curl',
  'puxada frente': 'lat pulldown',
  'puxada': 'pulldown',
  'remada curvada': 'barbell row',
  'remada cavalinho': 't-bar row',
  'remada': 'row',
  'elevação lateral': 'lateral raise',
  'elevação frontal': 'front raise',
  'elevação': 'raise',
  'extensão de pernas': 'leg extension',
  'cadeira extensora': 'leg extension',
  'extensão': 'extension',
  'flexão de braços': 'push up',
  'flexão de pernas': 'leg curl',
  'mesa flexora': 'leg curl',
  'flexão': 'push up',
  'abdominal': 'crunch',
  'prancha': 'plank',
  'voador': 'chest fly',
  'peck deck': 'chest fly',
  'desenvolvimento': 'shoulder press',
  'militar': 'military press',
  'mergulho': 'dip',
  'paralelas': 'dip',
  'costas': 'back',
  'peito': 'chest',
  'ombro': 'shoulder',
  'perna': 'leg',
  'braço': 'arm',
  'panturrilha': 'calf'
};

export const ptToEnSearch = (term: string): string => {
  let translated = term.toLowerCase().trim();
  
  // Tentar encontrar correspondência exata primeiro
  if (ptToEnExerciseMap[translated]) return ptToEnExerciseMap[translated];
  
  // Se não, substituir palavras-chave de forma iterativa
  let result = translated;
  Object.keys(ptToEnExerciseMap).forEach(pt => {
    if (result.includes(pt)) {
      result = result.replace(new RegExp(pt, 'g'), ptToEnExerciseMap[pt]);
    }
  });
  
  return result;
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
    'barbell bench press': 'Supino Reto com Barra',
    'dumbbell bench press': 'Supino Reto com Halteres',
    'incline barbell bench press': 'Supino Inclinado com Barra',
    'incline dumbbell bench press': 'Supino Inclinado com Halteres',
    'decline barbell bench press': 'Supino Declinado com Barra',
    'barbell squat': 'Agachamento Livre com Barra',
    'barbell deadlift': 'Levantamento Terra com Barra',
    'barbell bicep curl': 'Rosca Bíceps com Barra',
    'dumbbell bicep curl': 'Rosca Bíceps com Halteres',
    'hammer curl': 'Rosca Martelo',
    'lat pulldown': 'Puxada Aberta na Polia',
    'triceps pushdown': 'Tríceps Pulley',
    'seated row': 'Remada Baixa Sentada',
    'one arm dumbbell row': 'Remada Unilateral com Haltere (Serrote)',
    'lateral raise': 'Elevação Lateral',
    'front raise': 'Elevação Frontal',
    'leg press': 'Leg Press 45',
    'leg extension': 'Cadeira Extensora',
    'leg curl': 'Mesa Flexora',
    'calf raise': 'Gêmeos em Pé',
    'seated calf raise': 'Gêmeos Sentado',
    'military press': 'Desenvolvimento Militar',
    'arnold press': 'Desenvolvimento Arnold',
    'push up': 'Flexão de Braços',
    'dips': 'Paralelas',
    'pull up': 'Barra Fixa',
    'chin up': 'Barra Fixa Supinada',
    'plank': 'Prancha Abdominal',
    'crunch': 'Abdominal',
    'bicep curl': 'Rosca Bíceps',
    'cable bench press': 'Supino no Cabo',
    'barbell pin press': 'Supino Parcial com Barra (Pin Press)',
    'pin press': 'Supino Parcial (Pin Press)'
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
