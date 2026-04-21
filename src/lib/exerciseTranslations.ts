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

export const translate = (text: string): string => translations[text.toLowerCase()] || text;

export const enToPtExerciseNameMap: Record<string, string> = {
  'standing': 'em pé',
  'seated': 'sentado',
  'lying': 'deitado',
  'incline': 'inclinado',
  'decline': 'declinado',
  'reverse': 'inverso',
  'barbell': 'com barra',
  'dumbbell': 'com haltere',
  'cable': 'no cabo',
  'lever': 'na máquina/alavanca',
  'smith': 'no smith',
  'machine': 'na máquina',
  'bench': 'banco',
  'curls': 'rosca',
  'curl': 'rosca',
  'press': 'supino/desenvolvimento',
  'bench press': 'supino',
  'shoulder press': 'desenvolvimento de ombros',
  'squat': 'agachamento',
  'deadlift': 'levantamento terra',
  'row': 'remada',
  'pulldown': 'puxada',
  'fly': 'crucifixo/voador',
  'raise': 'elevação',
  'extension': 'extensão',
  'kickback': 'coice',
  'dip': 'mergulho/paralela',
  'pushup': 'flexão',
  'push up': 'flexão',
  'crunch': 'abdominal',
  'leg press': 'leg press',
  'leg curl': 'mesa flexora',
  'leg extension': 'cadeira extensora',
  'calf raise': 'elevação de panturrilha',
  'upright': 'vertical',
  'bent over': 'curvado',
  'one arm': 'unilateral',
  'single arm': 'unilateral',
  'alternate': 'alternado',
  'hammer': 'martelo',
  'preacher': 'scott',
  'arnold': 'arnold',
  'overhead': 'por cima da cabeça',
  'triceps': 'tríceps',
  'biceps': 'bíceps',
  'military': 'militar',
  'lateral': 'lateral',
  'front': 'frontal',
  'rear': 'posterior',
  'delt': 'deltoide',
  'shrug': 'encolhimento',
  'lunge': 'afundo/avanço',
  'step-up': 'subida no banco',
  'plank': 'prancha',
  'burpee': 'burpee',
  'mountain climber': 'mountain climber',
  'jumping jack': 'polichinelo'
};

export const translateExerciseName = (name: string): string => {
  let lowerName = name.toLowerCase();
  
  // Tentar encontrar correspondência exata primeiro na lista inversa de busca se existir
  // Mas como a lista ptToEnExerciseMap é a base, vamos apenas traduzir termo a termo
  
  let parts = lowerName.split(' ');
  let translatedParts = parts.map(part => {
    // Tenta traduzir a palavra isolada ou combinações
    return enToPtExerciseNameMap[part] || part;
  });

  // Reconstrução inteligente básica para Gramática PT-BR (Nome vindo primeiro na maioria das vezes)
  // Ex: "Dumbbell Standing Reverse Curl" -> "Rosca inversa com haltere em pé"
  
  let result = translatedParts.join(' ');
  
  // Refinamentos específicos para ordens mais naturais
  if (result.includes('rosca') && result.includes('com haltere')) {
     result = result.replace('com haltere', '').trim() + ' com haltere';
  }
  
  return result.charAt(0).toUpperCase() + result.slice(1);
};
