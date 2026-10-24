export const MAX_AUDIO_BYTES=30*1024*1024;
export const validId=value=>typeof value==='string'&&/^(builtin|custom):[a-z0-9][a-z0-9-]{0,119}$/.test(value);
export const validColor=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
export const cleanName=value=>typeof value==='string'?value.trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,60):'';
export function checkAudioFile(blob) {
  if(!(blob instanceof Blob)||blob.size===0)throw Error('Selecione um arquivo de áudio válido.');
  if(blob.size>MAX_AUDIO_BYTES)throw Error('O áudio ultrapassa 30 MB. Escolha um trecho menor.');
}
export async function validateAudioFile(blob,decode) {
  checkAudioFile(blob);
  const bytes=new Uint8Array(await blob.slice(0,64).arrayBuffer());
  const text=String.fromCharCode(...bytes);
  const known=(text.startsWith('RIFF')&&text.slice(8,12)==='WAVE')||text.startsWith('OggS')||text.startsWith('ID3')||text.startsWith('fLaC')||text.slice(4,8)==='ftyp'||(bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0)||(bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3);
  if(!known)throw Error('O conteúdo não corresponde a um áudio MP3, WAV, M4A, AAC, OGG, FLAC ou WebM.');
  try{return await decode(blob);}catch(error){throw Error(error?.message?.includes('64 MB')?error.message:'Não foi possível decodificar o áudio. Use MP3 ou WAV compatível e íntegro.');}
}
// Lista fechada; o resultado é usado SOMENTE como imagem Blob, nunca inserido no DOM.
export function sanitizeSvg(source) {
  if(typeof source!=='string'||source.length>128*1024||/<!DOCTYPE|<!ENTITY|<\?/i.test(source))throw Error('SVG inválido ou acima de 128 KB. Exporte um SVG simples, sem scripts.');
  const parsed=new DOMParser().parseFromString(source,'image/svg+xml');
  const root=parsed.documentElement;
  if(parsed.querySelector('parsererror')||root.localName!=='svg'||root.namespaceURI!=='http://www.w3.org/2000/svg')throw Error('Arquivo SVG inválido.');
  const elements=new Set(['svg','g','path','rect','circle','ellipse','line','polyline','polygon','defs','linearGradient','radialGradient','stop','title','desc']);
  const attributes=new Set(['xmlns','viewBox','width','height','x','y','x1','x2','y1','y2','cx','cy','r','rx','ry','d','points','fill','fill-rule','fill-opacity','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-miterlimit','stroke-dasharray','stroke-dashoffset','stroke-opacity','opacity','transform','id','offset','stop-color','stop-opacity','gradientUnits','gradientTransform','spreadMethod','fx','fy','fr','preserveAspectRatio','role','aria-hidden']);
  const nodes=[root,...root.querySelectorAll('*')];if(nodes.length>1000)throw Error('SVG complexo demais. Use até 1.000 elementos.');
  for(const node of nodes){
    if(!elements.has(node.localName)||node.namespaceURI!==root.namespaceURI)throw Error('SVG contém elementos não permitidos.');
    for(const attr of [...node.attributes]){
      if(!attributes.has(attr.name)||/javascript:|data:|https?:|file:|expression|@import/i.test(attr.value)&&attr.name!=='xmlns')throw Error('SVG contém atributos ou referências não permitidos.');
      if(/url\s*\(/i.test(attr.value)&&!/^url\(#[a-zA-Z][\w-]*\)$/.test(attr.value))throw Error('SVG só pode referenciar gradientes internos.');
      if(attr.name==='id'&&!/^[a-zA-Z][\w-]*$/.test(attr.value))throw Error('Identificador SVG inválido.');
    }
  }
  if(!root.getAttribute('viewBox'))root.setAttribute('viewBox','0 0 64 64');
  root.setAttribute('width','64');root.setAttribute('height','64');
  return new XMLSerializer().serializeToString(root);
}
export async function digest(blob) {
  const hash=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());
  return [...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
