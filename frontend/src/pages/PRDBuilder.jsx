import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePRDStore } from '../store/prdStore';
import ReactMarkdown from 'react-markdown';

const stageTitles = [
  'Contexto', 'Problema', 'Usuarios', 'Solución', 'Features',
  'Casos de Uso', 'Req. Funcionales', 'No Funcionales', 'Métricas', 'Roadmap'
];

export default function PRDBuilder() {
  const { id } = useParams(); // sessionId
  const navigate = useNavigate();
  const { currentSession, loadSession, sendMessage, advanceStage, generateDocument, loading, error, clearSession } = usePRDStore();
  
  const [chatMessage, setChatMessage] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (id) {
      loadSession(id);
    }
    return () => clearSession();
  }, [id, loadSession, clearSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.contextHistory]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const msg = chatMessage;
    setChatMessage('');
    await sendMessage(currentSession.id, msg);
  };

  const handleAdvanceStage = async (e) => {
    e.preventDefault();
    if (!summaryText.trim()) return;
    await advanceStage(currentSession.id, summaryText);
    setShowSummaryModal(false);
    setSummaryText('');
  };

  const handleGeneratePRD = async () => {
    await generateDocument(currentSession.id);
  };

  if (loading && !currentSession) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !currentSession) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 min-h-screen">
        <p className="text-destructive font-medium mb-4">{error || 'No se encontró la sesión.'}</p>
        <button onClick={() => navigate('/dashboard')} className="text-primary hover:underline">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  const isCompleted = currentSession.stage > 10;
  const currentStageIndex = isCompleted ? 9 : (currentSession.stage - 1);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden flex-1">
      {/* Sidebar with Steps */}
      <div className="w-full md:w-64 bg-card border-r border-border shrink-0 p-4 overflow-y-auto">
        <div className="mb-6 flex items-center gap-2 text-primary cursor-pointer hover:underline" onClick={() => navigate(-1)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver
        </div>
        
        <h2 className="font-semibold text-lg text-foreground mb-4">Etapas del PRD</h2>
        <div className="space-y-2">
          {stageTitles.map((title, index) => {
            const isActive = index === currentStageIndex;
            const isDone = index < currentStageIndex || isCompleted;
            return (
              <div 
                key={index} 
                className={`flex gap-3 items-center p-2 rounded-lg transition-colors
                  ${isActive ? 'bg-primary/10 text-primary font-medium' : isDone ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}
              >
                <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs shrink-0
                  ${isActive ? 'bg-primary text-primary-foreground' : isDone ? 'bg-green-500/20 text-green-600' : 'bg-muted'}`}
                >
                  {isDone && !isActive ? '✓' : index + 1}
                </div>
                <span className="text-sm truncate">{title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-[500px]">
        
        {isCompleted ? (
          <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
            <h1 className="text-2xl font-bold mb-6 text-foreground">Documento Finalizado</h1>
            
            {currentSession.finalDocument ? (
              <div className="bg-card border border-border rounded-xl p-8 shadow-sm prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                <ReactMarkdown>{currentSession.finalDocument}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 gap-4 bg-card rounded-xl border border-dashed border-border p-6 shadow-sm">
                 <p className="text-muted-foreground text-center">¡Todas las etapas completadas! Ahora la IA puede estructurar todo el contenido recolectado y generar tu PRD final.</p>
                 <button 
                  onClick={handleGeneratePRD}
                  disabled={loading}
                  className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-base disabled:opacity-50"
                 >
                   {loading ? 'Generando PRD Mágico...' : 'Generar PRD Final'}
                 </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Header Stage Info */}
            <div className="bg-card border-b border-border p-4 flex justify-between items-center shrink-0">
               <div>
                 <h2 className="text-lg font-semibold text-foreground">
                   Paso {currentSession.stage}: {stageTitles[currentStageIndex]}
                 </h2>
                 <p className="text-xs text-muted-foreground mt-0.5">La IA actuará como PM hasta obtener la información necesaria.</p>
               </div>
               <button 
                  onClick={() => setShowSummaryModal(true)}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
               >
                 Avanzar Etapa
               </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-muted/20 pb-20">
               <div className="max-w-3xl mx-auto space-y-4">
                  {currentSession.contextHistory?.map((msg, i) => {
                     // Filter out the system prompt part usually hidden from user if possible (The first User message containing instructions)
                     if (msg.role === 'user' && msg.text.includes('Here are my guidelines based on your system instructions')) {
                       return null;
                     }

                     const isAi = msg.role === 'ai';
                     return (
                       <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}
                       >
                         <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                           isAi ? 'bg-card border border-border/50 text-foreground' 
                                : 'bg-primary text-primary-foreground'
                         }`}>
                            {isAi && <div className="text-xs font-semibold text-primary mb-1">AI PM Analyst</div>}
                            <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                              <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                         </div>
                       </motion.div>
                     );
                  })}
                  {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                       <div className="bg-card border border-border/50 text-foreground rounded-2xl p-4 shadow-sm">
                         <div className="flex gap-1 items-center h-4">
                           <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                           <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                           <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce [animation-delay:0.4s]" />
                         </div>
                       </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
               </div>
            </div>

            {/* Chat Input */}
            <div className="bg-card border-t border-border p-4 shrink-0 fixed bottom-0 md:relative w-full md:w-auto z-10">
               <form onSubmit={handleSendChat} className="max-w-3xl mx-auto flex gap-2 relative">
                 <textarea 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChat(e);
                      }
                    }}
                    placeholder="Escribe tu respuesta a la IA..."
                    className="flex-1 resize-none overflow-y-auto max-h-32 min-h-[50px] bg-background text-foreground border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm scrollbar-thin"
                    rows="1"
                 />
                 <button 
                  type="submit" 
                  disabled={loading || !chatMessage.trim()}
                  className="p-3 bg-primary text-primary-foreground rounded-xl shrink-0 hover:bg-primary/90 disabled:opacity-50 transition-base h-full flex items-center justify-center aspect-square"
                 >
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                   </svg>
                 </button>
               </form>
            </div>
          </>
        )}
      </div>

      {/* Summary / Advance Modal */}
      <AnimatePresence>
        {showSummaryModal && (
          <motion.div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
             <motion.div 
                className="bg-card rounded-2xl w-full max-w-xl border border-border/60 shadow-xl"
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: -20 }}
             >
                <div className="p-6">
                   <h3 className="text-xl font-semibold mb-2 text-foreground">Cerrar Etapa: {stageTitles[currentStageIndex]}</h3>
                   <p className="text-sm text-muted-foreground mb-4">
                     Redacta un resumen final de lo acordado con la IA para este paso. Esta información será el pilar del PRD final.
                   </p>
                   
                   <form onSubmit={handleAdvanceStage} className="space-y-4">
                     <textarea 
                        value={summaryText}
                        onChange={(e) => setSummaryText(e.target.value)}
                        placeholder="Ej. El producto es una app móvil para dueños de mascotas..."
                        className="w-full h-40 bg-background text-foreground border border-border rounded-lg p-3 resize-none focus:outline-none focus:border-primary text-sm"
                        required
                     />
                     <div className="flex gap-3 pt-2">
                       <button 
                        type="button" 
                        onClick={() => setShowSummaryModal(false)}
                        className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted font-medium text-foreground transition"
                       >
                         Cancelar
                       </button>
                       <button 
                        type="submit"
                        disabled={loading || !summaryText.trim()}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition disabled:opacity-50"
                       >
                         {loading ? 'Guardando...' : 'Confirmar Etapa'}
                       </button>
                     </div>
                   </form>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
