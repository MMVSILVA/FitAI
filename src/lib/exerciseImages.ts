export function getExerciseImage(keyword: string): string {
  // Limpa a palavra-chave para o prompt
  const cleanKeyword = keyword.replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
  
  // Prompt em inglês focado no estilo anatômico 3D (como na imagem de referência)
  const prompt = `3D anatomical render of a muscular person performing ${cleanKeyword} exercise, highlighting the engaged muscles in red, dark grey studio background, highly detailed, fitness illustration`;
  
  // Usa a API gratuita do Pollinations.ai para gerar a imagem via IA baseada no prompt
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=300&nologo=true`;
}
