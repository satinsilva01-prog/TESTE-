/* TESTE — Relatório PDF do Histórico de Manutenção
   Não altera os registros. Lê os dados locais e abre uma versão pronta para imprimir/salvar como PDF. */
(function(){
  'use strict';
  const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const isMaintKey=k=>/manut|maintenance|revis|oleo|pneu|freio|filtro|peca|servic/.test(norm(k));
  function readLocal(){
    const out=[];
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i); if(!key||!isMaintKey(key)) continue;
      try{ const v=JSON.parse(localStorage.getItem(key)); out.push({key,value:v}); }catch{}
    }
    return out;
  }
  function flatten(v,prefix='',out=[]){
    if(v==null)return out;
    if(Array.isArray(v)){v.forEach((x,i)=>flatten(x,prefix+'['+i+']',out));return out;}
    if(typeof v==='object'){Object.entries(v).forEach(([k,x])=>flatten(x,prefix?(prefix+'.'+k):k,out));return out;}
    out.push([prefix,String(v)]); return out;
  }
  function esc(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\\':'&#39;'}[c]));}
  function collect(){
    const local=readLocal();
    const rows=[];
    local.forEach(item=>{
      const flat=flatten(item.value,item.key,[]);
      const groups={};
      flat.forEach(([p,v])=>{ const parts=p.split('.'); const idx=parts.find(x=>/^\\[\\d+\\]$/.test(x)); const base=idx?parts.slice(0,parts.indexOf(idx)+1).join('.') : item.key; (groups[base]??=[]).push([p.split('.').pop(),v]); });
      Object.values(groups).forEach(g=>{ if(g.length) rows.push(g); });
    });
    if(rows.length)return rows;
    // Fallback: usa os cartões visíveis do histórico de manutenção.
    const els=[...document.querySelectorAll('.maintenance-item,[class*="maintenance-item"],[class*="maintenance-card"]')];
    return els.map(e=>[["Registro",e.innerText.trim()]]);
  }
  function generate(){
    const rows=collect();
    const now=new Date().toLocaleString('pt-BR');
    const vehicle=(localStorage.getItem('selectedVehicle')||localStorage.getItem('veiculoAtual')||'').replace(/^"|"$/g,'');
    let html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Histórico de Manutenção</title><style>body{font-family:Arial,sans-serif;margin:28px;color:#17202a}h1{font-size:22px;margin:0 0 5px}h2{font-size:15px;font-weight:normal;margin:0 0 20px;color:#667085}.meta{border:1px solid #ddd;border-radius:8px;padding:10px;margin-bottom:16px}.reg{border:1px solid #ddd;border-radius:8px;padding:10px;margin:8px 0;break-inside:avoid}.reg b{display:inline-block;min-width:120px}.empty{padding:18px;border:1px dashed #aaa;border-radius:8px}@media print{button{display:none}}</style></head><body>`;
    html+=`<h1>Histórico de Manutenção do Veículo</h1><h2>Relatório para consulta e entrega ao proprietário</h2><div class="meta"><b>Veículo:</b> ${esc(vehicle||'Não informado')}<br><b>Gerado em:</b> ${esc(now)}</div>`;
    if(!rows.length) html+='<div class="empty">Nenhum registro de manutenção foi encontrado.</div>';
    else rows.forEach((g,i)=>{html+=`<div class="reg"><b>Registro ${i+1}</b><br>`+g.map(([k,v])=>`<div><b>${esc(k)}:</b> ${esc(v)}</div>`).join('')+'</div>';});
    html+='<p style="font-size:11px;color:#667085;margin-top:20px">Documento gerado pelo Assistente de Viagem.</p></body></html>';
    const w=window.open('','_blank'); if(!w){alert('Permita janelas pop-up para gerar o relatório.');return;}
    w.document.open();w.document.write(html);w.document.close();setTimeout(()=>{w.focus();w.print();},350);
  }
  function addButton(){
    if(document.getElementById('btnRelatorioManutencao'))return true;
    const candidates=[...document.querySelectorAll('button,summary,h3,h4,div')].filter(e=>/historico de manutencao|manutencao/i.test(e.textContent||''));
    const anchor=candidates.find(e=>/historico de manutencao/i.test(e.textContent||''))||candidates.find(e=>/manutencao/i.test(e.textContent||''));
    if(!anchor)return false;
    const b=document.createElement('button');b.id='btnRelatorioManutencao';b.type='button';b.className='primary';b.textContent='📄 Gerar relatório PDF';b.style.cssText='width:100%;margin:8px 0';b.onclick=generate;
    (anchor.parentElement||anchor).appendChild(b); return true;
  }
  let tries=0;const timer=setInterval(()=>{if(addButton()||++tries>40)clearInterval(timer)},500);
  new MutationObserver(()=>addButton()).observe(document.documentElement,{childList:true,subtree:true});
  window.gerarRelatorioManutencaoPDF=generate;
})();
