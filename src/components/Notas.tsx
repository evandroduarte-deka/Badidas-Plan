import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { MessageSquare, AlertTriangle, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function Notas() {
  const { state, setState, markPending } = useAppContext();
  const [tipo, setTipo] = useState('observacao');
  const [texto, setTexto] = useState('');

  const addNota = () => {
    if (!texto.trim()) return;
    const n = {
      id: crypto.randomUUID(),
      tipo,
      texto,
      data_nota: new Date().toISOString()
    };
    setState(prev => ({ ...prev, notas: [n, ...prev.notas] }));
    markPending('notas', n);
    setTexto('');
  };

  const getIcon = (t: string) => {
    switch(t) {
      case 'alerta': return <AlertTriangle className="w-4 h-4 text-brand-red" />;
      case 'decisao': return <CheckCircle className="w-4 h-4 text-brand-green" />;
      case 'lembrete': return <Clock className="w-4 h-4 text-brand-amber" />;
      default: return <MessageSquare className="w-4 h-4 text-brand-blue" />;
    }
  };

  const getBadgeClass = (t: string) => {
    switch(t) {
      case 'alerta': return 'bg-brand-red/10 text-brand-red border-brand-red/20';
      case 'decisao': return 'bg-brand-green/10 text-brand-green border-brand-green/20';
      case 'lembrete': return 'bg-brand-amber/10 text-brand-amber border-brand-amber/20';
      default: return 'bg-brand-blue/10 text-brand-blue border-brand-blue/20';
    }
  };

  const isPending = (id: string) => {
    return state.pendingChanges.some(p => p.table === 'notas' && p.data.id === id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-6 gap-3 shrink-0">
        <h2 className="text-[20px] font-bold text-t1">Histórico e Notas</h2>
      </div>

      <div className="bg-s1 border border-b1 rounded-xl p-4 mb-6 shrink-0">
        <div className="flex gap-3">
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="bg-s2 border border-b1 rounded-lg text-t1 font-mono text-[12px] px-3 py-2 outline-none focus:border-b3 w-[140px]">
            <option value="observacao">Observação</option>
            <option value="decisao">Decisão</option>
            <option value="alerta">Alerta</option>
            <option value="lembrete">Lembrete</option>
          </select>
          <input 
            value={texto} 
            onChange={e => setTexto(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && addNota()}
            placeholder="Registrar nova nota..." 
            className="flex-1 bg-s2 border border-b1 rounded-lg text-t1 font-sans text-[13px] px-3 py-2 outline-none focus:border-b3"
          />
          <button onClick={addNota} className="px-4 py-2 rounded-lg font-sans text-[12px] font-bold tracking-[0.05em] bg-brand-green text-[#0a0d0a] hover:bg-brand-green2 transition-colors">
            Adicionar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
        {state.notas.length === 0 ? (
          <div className="text-center text-t3 py-10 font-mono text-[11px]">Nenhuma nota registrada.</div>
        ) : state.notas.map(n => {
          const pending = isPending(n.id);
          return (
          <div key={n.id} className={`bg-s1 border rounded-xl p-4 flex gap-4 items-start transition-colors ${pending ? 'border-brand-amber/50 bg-brand-amber/5' : 'border-b1'}`}>
            <div className="mt-0.5">{getIcon(n.tipo)}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] border font-mono text-[9px] uppercase tracking-[0.08em] font-bold ${getBadgeClass(n.tipo)}`}>
                    {n.tipo}
                  </span>
                  {pending && <span className="font-mono text-[9px] text-brand-amber uppercase tracking-[0.05em] font-bold">Novo</span>}
                </div>
                <span className="font-mono text-[10px] text-t3">
                  {new Date(n.data_nota).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              <div className="text-[13px] text-t1 leading-[1.6]">{n.texto}</div>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}
