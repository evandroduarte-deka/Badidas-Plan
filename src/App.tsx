import React, { useState } from 'react';
import { AppProvider, useAppContext } from './AppContext';
import { Book, CheckSquare, FileText, Image as ImageIcon, FileBarChart, Settings, CloudDownload, CloudUpload, Calendar } from 'lucide-react';
import Diario from './components/Diario';
import Servicos from './components/Servicos';
import Notas from './components/Notas';
import Fotos from './components/Fotos';
import Relatorios from './components/Relatorios';
import ConfigPage from './components/ConfigPage';
import Cronograma from './components/Cronograma';
import { sbFetch } from './lib/api';

function Main() {
  const [activeTab, setActiveTab] = useState('diario');
  const { state, setState, config, toast } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadFromSupabase = async () => {
    if (!config.url || !config.key) {
      setActiveTab('config');
      toast('Configure Supabase primeiro.', 'error');
      return;
    }
    if (!config.obraId) {
      setActiveTab('config');
      toast('Informe o ID da obra.', 'error');
      return;
    }
    setLoading(true);
    try {
      const [srvs, pends, diarios, notasDb] = await Promise.all([
        sbFetch(`servicos?obra_id=eq.${config.obraId}&select=id,id_servico,nome,categoria,avanco_atual,status_atual,data_inicio,data_fim,equipe&order=id_servico`, {}, config),
        sbFetch(`pendencias?obra_id=eq.${config.obraId}&status=eq.ABERTA&order=created_at.desc`, {}, config),
        sbFetch(`diario_obra?obra_id=eq.${config.obraId}&order=created_at.desc&limit=30`, {}, config),
        sbFetch(`notas?obra_id=eq.${config.obraId}&order=data_nota.desc`, {}, config),
      ]);
      
      const newDiario = { ...state.diario };
      (diarios || []).forEach((d: any) => {
        const day = (d.created_at || '').split('T')[0];
        if (!newDiario[day]) newDiario[day] = {};
        newDiario[day].texto = d.transcricao;
        newDiario[day].db_id = d.id;
      });

      setState(prev => ({
        ...prev,
        servicos: srvs || [],
        pendencias: pends || [],
        diario: newDiario,
        notas: notasDb || [],
        pendingChanges: []
      }));
      toast('Dados carregados com sucesso!', 'success');
    } catch (e: any) {
      toast('Erro ao carregar: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const syncToSupabase = async () => {
    if (!config.url || !config.key) {
      setActiveTab('config');
      toast('Configure Supabase primeiro.', 'error');
      return;
    }
    if (!state.pendingChanges.length) {
      toast('Nada a sincronizar.', 'info');
      return;
    }
    setSyncing(true);
    let ok = 0, fail = 0;
    for (const ch of state.pendingChanges) {
      try {
        if (ch.table === 'servicos') {
          if (ch.data.id && !ch.data.id.startsWith('SRV-')) {
            await sbFetch(`servicos?id=eq.${ch.data.id}`, { method: 'PATCH', body: JSON.stringify({ avanco_atual: ch.data.avanco_atual, status_atual: ch.data.status_atual, data_inicio: ch.data.data_inicio, data_fim: ch.data.data_fim, equipe: ch.data.equipe }), prefer: 'return=minimal' }, config);
          } else {
             await sbFetch('servicos', { method: 'POST', body: JSON.stringify({ ...ch.data, obra_id: config.obraId }) }, config);
          }
        }
        if (ch.table === 'pendencias') {
          await sbFetch('pendencias', { method: 'POST', body: JSON.stringify({ ...ch.data, obra_id: config.obraId }) }, config);
        }
        if (ch.table === 'diario_obra') {
          if (ch.data.db_id) {
            await sbFetch(`diario_obra?id=eq.${ch.data.db_id}`, { method: 'PATCH', body: JSON.stringify({ transcricao: ch.data.transcricao }), prefer: 'return=minimal' }, config);
          } else {
            const ins = await sbFetch('diario_obra', { method: 'POST', body: JSON.stringify({ obra_id: config.obraId, transcricao: ch.data.transcricao }) }, config);
            if (ins?.[0]?.id && ch.data.day) {
              setState(prev => {
                const nd = { ...prev.diario };
                if (!nd[ch.data.day]) nd[ch.data.day] = {};
                nd[ch.data.day].db_id = ins[0].id;
                return { ...prev, diario: nd };
              });
            }
          }
        }
        if (ch.table === 'brain_narrativas') {
          await sbFetch('brain_narrativas', { method: 'POST', body: JSON.stringify({ obra_id: config.obraId, entrada: ch.data.entrada, resposta_ia: ch.data.resposta_ia, confirmado: true }) }, config);
        }
        if (ch.table === 'equipes_presenca') {
          await sbFetch('equipes_presenca', { method: 'POST', body: JSON.stringify({ obra_id: config.obraId, nome_equipe: ch.data.equipe, quantidade: 1, data_presenca: ch.data.dia }) }, config);
        }
        if (ch.table === 'notas') {
          await sbFetch('notas', { method: 'POST', body: JSON.stringify({ ...ch.data, obra_id: config.obraId }) }, config);
        }
        ok++;
      } catch (e) {
        fail++;
        console.error(ch.table, e);
      }
    }
    setState(prev => ({ ...prev, pendingChanges: [] }));
    setSyncing(false);
    toast(`Sync concluído: ${ok} enviado(s).${fail ? ' Falhas: ' + fail : ''}`, fail ? 'error' : 'success');
  };

  const tabs = [
    { id: 'diario', label: 'Diário', icon: Book },
    { id: 'servicos', label: 'Serviços', icon: CheckSquare },
    { id: 'cronograma', label: 'Cronograma', icon: Calendar },
    { id: 'notas', label: 'Notas', icon: FileText },
    { id: 'fotos', label: 'Fotos', icon: ImageIcon },
    { id: 'relatorios', label: 'Relatórios', icon: FileBarChart },
    { id: 'config', label: 'Config', icon: Settings },
  ];

  const pendingCount = state.pendingChanges?.length || 0;

  return (
    <div className="flex flex-col h-screen bg-bg text-t1 font-sans overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center bg-s1 border-b border-b1 h-[52px] shrink-0">
        <div className="px-5 border-r border-b1 h-full flex flex-col justify-center min-w-[200px]">
          <div className="font-mono text-[9px] text-brand-green tracking-[0.15em] uppercase">Obra ativa</div>
          <div className="text-[13px] font-bold text-t1">Restaurante Badida</div>
        </div>
        <div className="flex h-full flex-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-[7px] px-4 h-full cursor-pointer text-[11px] font-bold tracking-[0.08em] uppercase border-b-2 whitespace-nowrap transition-all ${
                activeTab === t.id 
                  ? 'text-brand-green border-brand-green bg-brand-green/5' 
                  : 'text-t3 border-transparent hover:text-t2 hover:bg-s2'
              }`}
            >
              <t.icon className={`w-[13px] h-[13px] shrink-0 ${activeTab === t.id ? 'opacity-100' : 'opacity-60'}`} />
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2.5 px-3.5 border-l border-b1 h-full shrink-0">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-t3">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${pendingCount > 0 ? 'bg-brand-amber animate-pulse' : 'bg-brand-green'}`}></div>
            <span>{pendingCount > 0 ? `${pendingCount} pendente${pendingCount > 1 ? 's' : ''}` : 'sincronizado'}</span>
          </div>
          <button 
            onClick={loadFromSupabase} 
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-md cursor-pointer font-sans text-[11px] font-bold tracking-[0.05em] whitespace-nowrap transition-all bg-transparent border border-b2 text-t2 hover:border-b3 hover:text-t1 disabled:opacity-40"
          >
            <CloudDownload className="w-3.5 h-3.5" /> {loading ? '...' : 'Carregar'}
          </button>
          <button 
            onClick={syncToSupabase}
            disabled={syncing || pendingCount === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-md cursor-pointer font-sans text-[11px] font-extrabold tracking-[0.05em] whitespace-nowrap transition-all bg-brand-green text-[#0a0d0a] hover:bg-brand-green2 disabled:opacity-40"
          >
            <CloudUpload className="w-3.5 h-3.5" /> {syncing ? '...' : 'Sync'}
          </button>
        </div>
      </div>

      {/* Pages */}
      <div className="overflow-y-auto p-7 flex-1">
        {activeTab === 'diario' && <Diario />}
        {activeTab === 'servicos' && <Servicos />}
        {activeTab === 'cronograma' && <Cronograma />}
        {activeTab === 'notas' && <Notas />}
        {activeTab === 'fotos' && <Fotos />}
        {activeTab === 'relatorios' && <Relatorios />}
        {activeTab === 'config' && <ConfigPage />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  );
}
