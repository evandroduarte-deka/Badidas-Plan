import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Servico } from '../types';

export default function Servicos() {
  const { state, setState, markPending } = useAppContext();
  const [filter, setFilter] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editSrv, setEditSrv] = useState<Servico | null>(null);
  const [editIdx, setEditIdx] = useState(-1);

  const list = filter === 'todos' ? state.servicos : state.servicos.filter(s => s.status_atual === filter);

  const stMap: Record<string, [string, string]> = {
    em_andamento: ['bg-brand-blue/10 text-brand-blue', 'andamento'],
    concluido: ['bg-brand-green/10 text-brand-green', 'concluído'],
    atencao: ['bg-brand-amber/10 text-brand-amber', 'atenção'],
    pendente: ['bg-s3 text-t3', 'pendente'],
    nao_iniciado: ['bg-s3 text-t3', 'não iniciado']
  };

  const isPending = (id_servico: string) => {
    return state.pendingChanges.some(p => p.table === 'servicos' && p.data.id_servico === id_servico);
  };

  const inlineEdit = (idx: number, field: keyof Servico, val: any) => {
    const newServicos = [...state.servicos];
    newServicos[idx] = { ...newServicos[idx], [field]: val };
    setState({ ...state, servicos: newServicos });
    markPending('servicos', newServicos[idx]);
  };

  const openEdit = (s: Servico, idx: number) => {
    setEditSrv({ ...s });
    setEditIdx(idx);
    setModalOpen(true);
  };

  const openNew = () => {
    setEditSrv({
      id_servico: `SRV-${String(state.servicos.length + 1).padStart(3, '0')}`,
      nome: '',
      categoria: '',
      avanco_atual: 0,
      status_atual: 'nao_iniciado'
    });
    setEditIdx(-1);
    setModalOpen(true);
  };

  const saveSrv = () => {
    if (!editSrv) return;
    const newServicos = [...state.servicos];
    if (editIdx >= 0) {
      newServicos[editIdx] = editSrv;
    } else {
      newServicos.push({ ...editSrv, id: crypto.randomUUID() });
    }
    setState({ ...state, servicos: newServicos });
    markPending('servicos', editIdx >= 0 ? newServicos[editIdx] : newServicos[newServicos.length - 1]);
    setModalOpen(false);
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <h2 className="text-[20px] font-bold text-t1">Serviços</h2>
          <p className="font-mono text-[11px] text-t3 mt-1">{new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openNew} className="px-2.5 py-1.5 rounded-md text-[11px] font-bold tracking-[0.05em] text-t2 border border-b2 hover:border-b3 hover:text-t1 transition-colors">+ Serviço</button>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-4">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'em_andamento', label: 'Andamento' },
          { id: 'atencao', label: 'Atenção' },
          { id: 'concluido', label: 'Concluídos' },
          { id: 'nao_iniciado', label: 'Não iniciado' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-[5px] border font-mono text-[10px] uppercase tracking-[0.08em] transition-colors ${
              filter === f.id ? 'border-brand-green text-brand-green bg-brand-green/5' : 'border-b1 bg-transparent text-t3 hover:border-b2 hover:text-t2'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-s1 border border-b1 rounded-[10px] overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="font-mono text-[9px] text-t3 uppercase tracking-[0.1em] text-left px-3.5 py-2.5 border-b border-b1 whitespace-nowrap w-[90px]">ID</th>
              <th className="font-mono text-[9px] text-t3 uppercase tracking-[0.1em] text-left px-3.5 py-2.5 border-b border-b1 whitespace-nowrap">Serviço</th>
              <th className="font-mono text-[9px] text-t3 uppercase tracking-[0.1em] text-left px-3.5 py-2.5 border-b border-b1 whitespace-nowrap w-[140px]">Categoria</th>
              <th className="font-mono text-[9px] text-t3 uppercase tracking-[0.1em] text-left px-3.5 py-2.5 border-b border-b1 whitespace-nowrap w-[190px]">Avanço</th>
              <th className="font-mono text-[9px] text-t3 uppercase tracking-[0.1em] text-left px-3.5 py-2.5 border-b border-b1 whitespace-nowrap w-[110px]">Status</th>
              <th className="font-mono text-[9px] text-t3 uppercase tracking-[0.1em] text-left px-3.5 py-2.5 border-b border-b1 whitespace-nowrap w-[70px]"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-t3 py-7 font-mono text-[11px]">Sem serviços. Carregue do Supabase ou adicione manualmente.</td>
              </tr>
            ) : list.map((s, idx) => {
              const realIdx = state.servicos.findIndex(x => x.id_servico === s.id_servico);
              const pct = Math.min(100, Math.max(0, s.avanco_atual || 0));
              const col = pct >= 80 ? 'bg-brand-green' : pct >= 40 ? 'bg-brand-amber' : 'bg-brand-red';
              const [bc, bl] = stMap[s.status_atual] || ['bg-s3 text-t3', s.status_atual || '—'];
              const pending = isPending(s.id_servico);
              
              return (
                <tr key={s.id_servico || idx} className={`hover:bg-white/5 transition-colors ${pending ? 'bg-brand-amber/5' : ''}`}>
                  <td className={`px-3.5 py-2.5 border-b text-[13px] align-middle ${pending ? 'border-brand-amber/30' : 'border-b1'}`}>
                    <span className={`font-mono text-[10px] ${pending ? 'text-brand-amber font-bold' : 'text-t3'}`}>{s.id_servico || '—'}</span>
                  </td>
                  <td className={`px-3.5 py-2.5 border-b text-[13px] align-middle ${pending ? 'border-brand-amber/30' : 'border-b1'}`}>
                    <input 
                      className="bg-transparent border-none text-t1 font-sans text-[13px] w-full px-1 py-0.5 rounded-[3px] outline-none transition-colors focus:bg-s3 focus:outline-b2" 
                      value={s.nome || ''} 
                      onChange={e => inlineEdit(realIdx, 'nome', e.target.value)} 
                    />
                  </td>
                  <td className={`px-3.5 py-2.5 border-b text-[13px] align-middle ${pending ? 'border-brand-amber/30' : 'border-b1'}`}>
                    <input 
                      className="bg-transparent border-none text-t2 font-sans text-[12px] w-full px-1 py-0.5 rounded-[3px] outline-none transition-colors focus:bg-s3 focus:outline-b2" 
                      value={s.categoria || ''} 
                      onChange={e => inlineEdit(realIdx, 'categoria', e.target.value)} 
                    />
                  </td>
                  <td className={`px-3.5 py-2.5 border-b text-[13px] align-middle ${pending ? 'border-brand-amber/30' : 'border-b1'}`}>
                    <div className="flex items-center gap-2 min-w-[150px]">
                      <div className="flex-1 h-[3px] bg-s4 rounded-[2px] overflow-hidden">
                        <div className={`h-full rounded-[2px] transition-all duration-400 ${col}`} style={{ width: `${pct}%` }}></div>
                      </div>
                      <input 
                        type="number" 
                        className="bg-transparent border-none text-t2 font-mono text-[11px] w-[46px] text-right px-1 py-0.5 rounded-[3px] outline-none transition-colors focus:bg-s3 focus:outline-b2" 
                        value={pct} 
                        min="0" max="100" 
                        onChange={e => inlineEdit(realIdx, 'avanco_atual', +e.target.value)} 
                      />
                      <span className="font-mono text-[10px] text-t3">%</span>
                    </div>
                  </td>
                  <td className={`px-3.5 py-2.5 border-b text-[13px] align-middle ${pending ? 'border-brand-amber/30' : 'border-b1'}`}>
                    <span className={`inline-flex items-center px-[7px] py-[2px] rounded-[3px] font-mono text-[9px] font-medium uppercase tracking-[0.06em] ${bc}`}>{bl}</span>
                  </td>
                  <td className={`px-3.5 py-2.5 border-b text-[13px] align-middle ${pending ? 'border-brand-amber/30' : 'border-b1'}`}>
                    <button onClick={() => openEdit(s, realIdx)} className="bg-transparent border border-b1 text-t3 px-2 py-1 rounded-[4px] cursor-pointer font-mono text-[10px] transition-colors hover:border-b3 hover:text-t1">editar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && editSrv && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="bg-s2 border border-b2 rounded-xl p-6 w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
            <div className="text-[15px] font-bold text-t1 mb-4.5">{editIdx >= 0 ? `Editar: ${editSrv.nome}` : 'Novo serviço'}</div>
            
            <div className="mb-3">
              <label className="block font-mono text-[9px] text-t3 uppercase tracking-[0.1em] mb-1.5">ID</label>
              <input value={editSrv.id_servico} onChange={e => setEditSrv({...editSrv, id_servico: e.target.value})} className="w-full bg-s1 border border-b1 rounded-md text-t1 font-mono text-[12px] px-3 py-2 outline-none transition-colors focus:border-b3" />
            </div>
            <div className="mb-3">
              <label className="block font-mono text-[9px] text-t3 uppercase tracking-[0.1em] mb-1.5">Nome</label>
              <input value={editSrv.nome} onChange={e => setEditSrv({...editSrv, nome: e.target.value})} className="w-full bg-s1 border border-b1 rounded-md text-t1 font-mono text-[12px] px-3 py-2 outline-none transition-colors focus:border-b3" />
            </div>
            <div className="mb-3">
              <label className="block font-mono text-[9px] text-t3 uppercase tracking-[0.1em] mb-1.5">Categoria</label>
              <input value={editSrv.categoria} onChange={e => setEditSrv({...editSrv, categoria: e.target.value})} className="w-full bg-s1 border border-b1 rounded-md text-t1 font-mono text-[12px] px-3 py-2 outline-none transition-colors focus:border-b3" />
            </div>
            <div className="mb-3">
              <label className="block font-mono text-[9px] text-t3 uppercase tracking-[0.1em] mb-1.5">Avanço (%)</label>
              <input type="number" value={editSrv.avanco_atual} onChange={e => setEditSrv({...editSrv, avanco_atual: +e.target.value})} min="0" max="100" className="w-full bg-s1 border border-b1 rounded-md text-t1 font-mono text-[12px] px-3 py-2 outline-none transition-colors focus:border-b3" />
            </div>
            <div className="mb-3">
              <label className="block font-mono text-[9px] text-t3 uppercase tracking-[0.1em] mb-1.5">Status</label>
              <select value={editSrv.status_atual} onChange={e => setEditSrv({...editSrv, status_atual: e.target.value})} className="w-full bg-s1 border border-b1 rounded-md text-t1 font-mono text-[12px] px-3 py-2 outline-none transition-colors focus:border-b3">
                <option value="em_andamento" className="bg-s2">Em andamento</option>
                <option value="concluido" className="bg-s2">Concluído</option>
                <option value="atencao" className="bg-s2">Atenção</option>
                <option value="pendente" className="bg-s2">Pendente</option>
                <option value="nao_iniciado" className="bg-s2">Não iniciado</option>
              </select>
            </div>
            
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setModalOpen(false)} className="px-3.5 py-[7px] rounded-md font-sans text-[11px] font-bold tracking-[0.05em] bg-transparent border border-b2 text-t2 hover:border-b3 hover:text-t1 transition-colors">Cancelar</button>
              <button onClick={saveSrv} className="px-3.5 py-[7px] rounded-md font-sans text-[11px] font-extrabold tracking-[0.05em] bg-brand-green text-[#0a0d0a] hover:bg-brand-green2 transition-colors">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
