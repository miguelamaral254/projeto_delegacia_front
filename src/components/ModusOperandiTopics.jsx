import React, { useState, useEffect } from 'react';
import apiClient from '../services/api.service';

const Modal = ({ topic, examples, onClose, loading }) => (
    <React.Fragment>
        <style>{`
            .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
            .modal-content { background: #1e1e1e; padding: 1.5rem 2rem; border-radius: 8px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; border: 1px solid #444; position: relative; }
            .modal-close { position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: #aaa; font-size: 1.5rem; cursor: pointer; }
            .modal-list { list-style: none; padding: 0; margin-top: 1rem; }
            .modal-list li { padding: 1rem; border-radius: 6px; background: #2a2a2a; margin-bottom: 1rem; }
        `}</style>
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>&times;</button>
                <h3 style={{marginTop: 0}}>Exemplos para o Tópico {topic.topic_id + 1}</h3>
                <p><strong>Palavras-chave:</strong> {topic.keywords.join(', ')}</p>
                <hr style={{borderColor: '#444'}}/>
                {loading ? <p>Buscando exemplos...</p> : (
                    <ul className="modal-list">
                        {examples.length > 0 ? examples.map(ex => (
                            <li key={ex.id_ocorrencia}>
                                <strong>{ex.tipo_crime} (#{ex.id_ocorrencia})</strong>
                                <p style={{fontSize: '0.9rem', margin: '8px 0', color: '#ccc'}}>{ex.descricao_modus_operandi}</p>
                            </li>
                        )) : <p>Nenhum exemplo encontrado.</p>}
                    </ul>
                )}
            </div>
        </div>
    </React.Fragment>
);


const LoadingSpinner = () => (
    <React.Fragment>
        <style>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .spinner { border: 4px solid rgba(255, 255, 255, 0.3); border-top: 4px solid #8884d8; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
            <div className="spinner"></div>
            <p>Analisando textos...</p>
        </div>
    </React.Fragment>
);

const ModusOperandiTopics = () => {
    const [bairroOptions, setBairroOptions] = useState([]);
    const [topicsResult, setTopicsResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedBairro, setSelectedBairro] = useState('');
    const [numTopics, setNumTopics] = useState(5);
    
    const [modalData, setModalData] = useState({ isOpen: false, topic: null, examples: [], loading: false });

    useEffect(() => {
        apiClient.get('/statistics/unique-bairros')
            .then(res => setBairroOptions(res.data))
            .catch(err => console.error("Falha ao carregar bairros", err));
    }, []);

    const handleTopicClick = async (topic) => {
        setModalData({ isOpen: true, topic, examples: [], loading: true });
        try {
            const payload = { keywords: topic.keywords, bairro: selectedBairro || null };
            const response = await apiClient.post('/statistics/modus-operandi-examples', payload);
            setModalData({ isOpen: true, topic, examples: response.data, loading: false });
        } catch (err) {
            console.error("Falha ao buscar exemplos", err);
            setModalData({ isOpen: true, topic, examples: [], loading: false });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setTopicsResult(null);

        const params = { n_topics: numTopics };
        if (selectedBairro) {
            params.bairro = selectedBairro;
        }

        try {
            const response = await apiClient.get('/statistics/modus-operandi-topics', { params });
            setTopicsResult(response.data);
        } catch (err) {
            setError('Falha ao obter tópicos. Verifique a API.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#1e1e1e', padding: '2rem', borderRadius: '8px', color: '#f0f0f0' }}>
            {modalData.isOpen && <Modal {...modalData} onClose={() => setModalData({ isOpen: false, topic: null, examples: [], loading: false })} />}

            <h2 style={{ color: '#f9f9f9', marginTop: 0, borderBottom: '1px solid #444', paddingBottom: '1rem' }}>Análise de Tópicos do Modus Operandi</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem', maxWidth: '800px' }}>Descubra os padrões textuais recorrentes nas descrições das ocorrências. Clique em um tópico para ver exemplos reais.</p>

            <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: '#ccc', flexGrow: 1 }}>
                    Filtrar por Bairro (Opcional):
                    <select value={selectedBairro} onChange={(e) => setSelectedBairro(e.target.value)} style={{ padding: '0.75rem', backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '4px', color: '#f0f0f0', fontSize: '1rem' }}>
                        <option value="">Todos os Bairros</option>
                        {bairroOptions.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>
                    Nº de Tópicos:
                    <input type="number" value={numTopics} onChange={(e) => setNumTopics(parseInt(e.target.value))} min="2" max="15" style={{ padding: '0.75rem', backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '4px', color: '#f0f0f0', fontSize: '1rem', width: '80px' }} />
                </label>
                <button type="submit" disabled={loading} style={{ backgroundColor: loading ? '#555' : '#8884d8', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>
                    {loading ? 'Analisando...' : 'Analisar Tópicos'}
                </button>
            </form>

            {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
            {loading && <LoadingSpinner />}

            {topicsResult && (
                <div>
                    <h3 style={{color: '#f0f0f0'}}>{topicsResult.message}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                        {topicsResult.topics.map(topic => (
                            <div key={topic.topic_id} onClick={() => handleTopicClick(topic)} style={{ backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #444', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                                <h4 style={{ marginTop: 0, color: '#8884d8' }}>Tópico {topic.topic_id + 1}</h4>
                                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                    {topic.keywords.map(word => <li key={word} style={{ marginBottom: '0.5rem' }}>{word}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModusOperandiTopics;