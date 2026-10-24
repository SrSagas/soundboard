import {audioLibrary} from './audio-library.js';
export const definitions=[
 ['humor','Dinâmicas e humor',['Campainha','Sino','Rebobinar','Acertou','Errou','Risadas','Aplausos','Vaia','Grilos','Trombone triste','Censura (bip)','Record scratch','Rufar de tambores','Suspense','Revelação','Contagem regressiva']],
 ['objects','Objetos e cotidiano',['Telefone','Desligar telefone','Porta abrindo','Porta fechando','Batidas na porta','Interruptor','Torneira abrindo','Torneira fechando','Descarga','Vidro quebrando','Martelada','Objeto caindo','Passos','Chaves']],
 ['action','Ação e acidentes',['Pancada','Soco cômico','Madeira quebrando','Buzina','Carro arrancando','Freada','Derrapagem','Explosão','Choque elétrico','Mergulho','Água espirrando','Queda cômica']],
 ['ambient','Ambientes',['Fogo','Floresta','Vento','Chuva','Tempestade','Escritório','Escola','Restaurante','Trânsito','Praia','Multidão','Terror']],
 ['school','Escola e temas',['Sinal escolar','Crianças conversando','Giz no quadro','Relógio','Sirene','Música de escolinha','Música de elevador','Música romântica']],
 ['music','Trilhas e transições',['Vitória','Derrota','Perseguição','Mistério','Abertura de programa','Encerramento','Transição cômica','Tensão dramática','Momento épico','Silêncio dramático']]
];
export const categories=[...definitions.map(([id,name])=>({id,name})),{id:'memes',name:'Memes e TV'},{id:'other',name:'Outros'}];
export const slug=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const categoryColors={humor:'#C1AE7E',objects:'#8EADC5',action:'#C0907B',ambient:'#99B5A0',school:'#82AEB4',music:'#AAA1C2',memes:'#BC97A5',other:'#A4AFBC'};
export const palette=Object.values(categoryColors);
const ambient=new Set(['Fogo','Floresta','Vento','Chuva','Tempestade','Escritório','Escola','Restaurante','Trânsito','Praia','Multidão','Terror','Crianças conversando']);
export const initial=definitions.flatMap(([category,,names],c)=>names.map((sourceName,index)=>{
 const key=slug(sourceName),audio=audioLibrary.find(row=>row.slug===key||row.id==='builtin:'+key);
 const file=audio?.file||audio?.path||'sons/'+key+'.mp3';
 return {id:'builtin:'+key,name:sourceName==='Record scratch'?'Disco arranhando':audio?.name||sourceName,previousNames:audio?.previousNames||[],category,icon:key,color:categoryColors[category],builtin:true,
  loop:audio?.loop??ambient.has(sourceName),available:!!audio?.available,file:audio?.available?file+(audio.sha256?'?v='+audio.sha256.slice(0,12):''):'',
  duration:audio?.duration,sha256:audio?.sha256,action:key==='silencio-dramatico'?'stop':undefined,credit:audio};
}));
export const defaultFavorites=['campainha','sino','rebobinar','telefone','pancada','risadas','vidro-quebrando','suspense','fogo','buzina','aplausos','grilos'].map(s=>'builtin:'+s);
