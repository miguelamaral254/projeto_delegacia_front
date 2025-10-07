import React, { useState, useEffect } from 'react';
import apiClient from '../services/api.service';

const AnomalyModal = ({ item, onClose }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('pt-BR');
    };
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)'}} onClick={onClose}>
            <div style={{ background: '#1e1e1e', padding: '1.5rem 2rem', borderRadius: '8px', maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #444', position: 'relative' }} onClick={e => e.stopPropagation()}>
                <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#aaa', fontSize: '1.5rem', cursor: 'pointer' }} onClick={onClose}>&times;</button>
                <h3 style={{marginTop: 0, color: '#f0f0f0'}}>Detalhes da Anomalia: <span style={{color: '#e74c3c'}}>{item.tipo_crime} #{item.id_ocorrencia}</span></h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', fontSize: '0.9rem', marginTop: '1rem' }}>
                    <div style={{backgroundColor: '#2a2a2a', padding: '10px', borderRadius: '4px'}}>
                        <strong style={{color: '#e74c3c', display: 'block', marginBottom: '4px', fontSize: '0.8rem'}}>SCORE DE ANOMALIA</strong>
                        {item.anomaly_score.toFixed(4)}
                    </div>
                    <div style={{backgroundColor: '#2a2a2a', padding: '10px', borderRadius: '4px'}}>
                        <strong style={{color: '#e74c3c', display: 'block', marginBottom: '4px', fontSize: '0.8rem'}}>DATA</strong>
                        {formatDate(item.data_ocorrencia)}
                    </div>
                    <div style={{backgroundColor: '#2a2a2a', padding: '10px', borderRadius: '4px'}}>
                        <strong style={{color: '#e74c3c', display: 'block', marginBottom: '4px', fontSize: '0.8rem'}}>BAIRRO</strong>
                        {item.bairro || 'N/A'}
                    </div>
                    <div style={{backgroundColor: '#2a2a2a', padding: '10px', borderRadius: '4px'}}>
                        <strong style={{color: '#e74c3c', display: 'block', marginBottom: '4px', fontSize: '0.8rem'}}>ARMA UTILIZADA</strong>
                        {item.arma_utilizada || 'N/A'}
                    </div>
                    <div style={{backgroundColor: '#2a2a2a', padding: '10px', borderRadius: '4px'}}>
                        <strong style={{color: '#e74c3c', display: 'block', marginBottom: '4px', fontSize: '0.8rem'}}>Nº DE VÍTIMAS</strong>
                        {item.quantidade_vitimas ?? 'N/A'}
                    </div>
                    <div style={{backgroundColor: '#2a2a2a', padding: '10px', borderRadius: '4px'}}>
                        <strong style={{color: '#e74c3c', display: 'block', marginBottom: '4px', fontSize: '0.8rem'}}>Nº DE SUSPEITOS</strong>
                        {item.quantidade_suspeitos ?? 'N/A'}
                    </div>
                    <div style={{gridColumn: '1 / -1', backgroundColor: '#2a2a2a', padding: '10px', borderRadius: '4px'}}>
                        <strong style={{color: '#e74c3c', display: 'block', marginBottom: '4px', fontSize: '0.8rem'}}>MODUS OPERANDI</strong>
                        {item.descricao_modus_operandi || 'N/A'}
                    </div>
                </div>
            </div>
        </div>
    );
};

const LoadingSpinner = () => (
    <React.Fragment>
        <style>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .spinner { border: 4px solid rgba(255, 255, 255, 0.3); border-top: 4px solid #e74c3c; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
            <div className="spinner"></div>
            <p>Buscando ocorrências anômalas...</p>
        </div>
    </React.Fragment>
);

const AnomaliesDashboard = () => {
    const [anomalies, setAnomalies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [numResults, setNumResults] = useState(20);
    const [selectedAnomaly, setSelectedAnomaly] = useState(null);

    useEffect(() => {
        fetchAnomalies();
    }, []);

    const fetchAnomalies = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.get('/predict/anomalies', {
                params: { n_results: numResults }
            });
            setAnomalies(response.data.anomalies);
        } catch (err) {
            setError('Falha ao buscar anomalias. Verifique a API.');
        } finally {
            setLoading(false);
        }
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('pt-BR');
    };

    return (
        <div style={{ backgroundColor: '#1e1e1e', padding: '2rem', borderRadius: '8px', color: '#f0f0f0' }}>
            {selectedAnomaly && <AnomalyModal item={selectedAnomaly} onClose={() => setSelectedAnomaly(null)} />}
            
            <h2 style={{ color: '#f9f9f9', marginTop: 0, borderBottom: '1px solid #444', paddingBottom: '1rem' }}>Detecção de Ocorrências Anômalas</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem', maxWidth: '800px' }}>
                Utilizando Isolation Forest, o sistema identifica as ocorrências mais raras e improváveis. Clique em um item para ver os detalhes.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', margin: '2rem 0', flexWrap: 'wrap' }}>
                <label style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    Mostrar as <strong>{numResults}</strong> principais anomalias:
                    <input 
                        type="range" 
                        min="5" 
                        max="50" 
                        step="5"
                        value={numResults} 
                        onChange={(e) => setNumResults(parseInt(e.target.value))}
                    />
                </label>
                <button onClick={fetchAnomalies} disabled={loading} style={{backgroundColor: '#e74c3c'}}>
                    {loading ? 'Buscando...' : 'Atualizar Busca'}
                </button>
            </div>

            {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
            {loading && <LoadingSpinner />}

            {!loading && anomalies.length > 0 && (
                <div style={{maxHeight: '60vh', overflowY: 'auto'}}>
                    <ul style={{listStyle: 'none', padding: 0}}>
                        {anomalies.map(item => (
                            <li key={item.id_ocorrencia} onClick={() => setSelectedAnomaly(item)} style={{background: '#2a2a2a', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', cursor: 'pointer', transition: 'background-color 0.2s'}} onMouseOver={e => e.currentTarget.style.backgroundColor = '#3c3c3c'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#2a2a2a'}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <strong style={{fontSize: '1.1rem', color: '#f0f0f0'}}>{item.tipo_crime} (#{item.id_ocorrencia})</strong>
                                    <span style={{backgroundColor: '#e74c3c', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem'}}>
                                        Score: {item.anomaly_score.toFixed(4)}
                                    </span>
                                </div>
                                <p style={{margin: '8px 0', color: '#aaa', fontSize: '0.9rem'}}>
                                    <strong>Bairro:</strong> {item.bairro || 'N/A'} | <strong>Data:</strong> {formatDate(item.data_ocorrencia)}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AnomaliesDashboard;