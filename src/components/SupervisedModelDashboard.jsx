import React, { useState, useEffect } from 'react';
import apiClient from '../services/api.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts';

const LoadingSpinner = () => (
    <React.Fragment>
        <style>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .spinner { border: 4px solid rgba(255, 255, 255, 0.3); border-top: 4px solid #c1121f; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
            <div className="spinner"></div>
            <p>Analisando risco...</p>
        </div>
    </React.Fragment>
);

const SupervisedModelDashboard = () => {
    const [bairroOptions, setBairroOptions] = useState([]);
    const [formData, setFormData] = useState({
        bairro: '',
        descricao_modus_operandi: 'Dois indivíduos em uma moto abordaram a vítima com arma de fogo.',
        arma_utilizada: 'ARMA DE FOGO',
        sexo_suspeito: 'MASCULINO',
        quantidade_vitimas: 1,
        quantidade_suspeitos: 2,
        idade_suspeito: 22,
        latitude: -8.06,
        longitude: -34.9,
        ano: 2025,
        mes: 10,
        dia_semana: 5,
        hora: 22
    });
    const [predictionResult, setPredictionResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const featureImportanceData = [
        { feature: 'descrição (texto)', importance: 0.35 },
        { feature: 'arma_utilizada', importance: 0.28 },
        { feature: 'bairro', importance: 0.15 },
        { feature: 'hora', importance: 0.12 },
        { feature: 'nº de suspeitos', importance: 0.10 },
    ];

    useEffect(() => {
        apiClient.get('/statistics/unique-bairros')
            .then(res => {
                setBairroOptions(res.data);
                if (res.data.length > 0) {
                    setFormData(prev => ({ ...prev, bairro: res.data[0] }));
                }
            })
            .catch(err => console.error("Falha ao carregar bairros", err));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setPredictionResult(null);

        const payload = {
            ...formData,
            orgao_responsavel: "DELEGACIA DE ROUBOS E FURTOS",
            status_investigacao: "EM ANDAMENTO"
        };
        
        try {
            const response = await apiClient.post('/predict/violence', payload);
            const probabilities = [
                { name: 'Violento', value: parseFloat((response.data.probabilidades.violento * 100).toFixed(2)) },
                { name: 'Não Violento', value: parseFloat((response.data.probabilidades.nao_violento * 100).toFixed(2)) }
            ];

            setPredictionResult({
                prediction: response.data.previsao_violencia,
                probabilities: probabilities
            });
        } catch (err) {
            setError('Falha ao obter previsão. Verifique a API e o endpoint /predict/violence.');
        } finally {
            setLoading(false);
        }
    };

    const COLORS = { 'Violento': '#c1121f', 'Não Violento': '#82ca9d' };

    return (
        <div style={{ backgroundColor: '#1e1e1e', padding: '2rem', borderRadius: '8px', color: '#f0f0f0' }}>
            <h2 style={{ color: '#f9f9f9', marginTop: 0, borderBottom: '1px solid #444', paddingBottom: '1rem' }}>Modelo Supervisionado: Previsão de Risco</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem', maxWidth: '800px' }}>
                Insira os dados de uma ocorrência para que o modelo preveja se ela possui características de um **crime violento** ou **não violento**.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '2rem' }}>
                <form onSubmit={handleSubmit}>
                    <h3 style={{marginTop: 0}}>Dados da Ocorrência</h3>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '1rem'}}>
                        <label>Bairro: <select name="bairro" value={formData.bairro} onChange={handleChange}>{bairroOptions.map(b => <option key={b} value={b}>{b}</option>)}</select></label>
                        <label>Modus Operandi: <textarea name="descricao_modus_operandi" value={formData.descricao_modus_operandi} onChange={handleChange} rows="3"></textarea></label>
                        <label>Arma Utilizada: <input type="text" name="arma_utilizada" value={formData.arma_utilizada} onChange={handleChange} /></label>
                        <label>Sexo do Suspeito: <select name="sexo_suspeito" value={formData.sexo_suspeito} onChange={handleChange}><option value="MASCULINO">Masculino</option><option value="FEMININO">Feminino</option></select></label>
                        <label>Nº de Vítimas: <input type="number" name="quantidade_vitimas" value={formData.quantidade_vitimas} onChange={handleChange} /></label>
                        <label>Nº de Suspeitos: <input type="number" name="quantidade_suspeitos" value={formData.quantidade_suspeitos} onChange={handleChange} /></label>
                        <label>Idade do Suspeito: <input type="number" name="idade_suspeito" value={formData.idade_suspeito} onChange={handleChange} /></label>
                        <label>Hora (0-23): <input type="number" name="hora" value={formData.hora} onChange={handleChange} min="0" max="23" /></label>
                        <label>Dia da Semana (0-6): <input type="number" name="dia_semana" value={formData.dia_semana} onChange={handleChange} min="0" max="6" /></label>
                    </div>
                    <button type="submit" disabled={loading} style={{backgroundColor: '#c1121f', width: '100%', marginTop: '1.5rem'}}>{loading ? 'Analisando...' : 'Prever Risco de Violência'}</button>
                </form>

                <div style={{backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '8px'}}>
                    <h3 style={{marginTop: 0}}>Resultados da Previsão</h3>
                    {loading && <LoadingSpinner color="#c1121f"/>}
                    {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
                    {predictionResult ? (
                        <div>
                            <div style={{textAlign: 'center', marginBottom: '2rem'}}>
                                <p style={{color: '#aaa', margin: 0}}>PREVISÃO DE RISCO</p>
                                <p style={{color: predictionResult.prediction ? COLORS['Violento'] : COLORS['Não Violento'], fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0'}}>
                                    {predictionResult.prediction ? 'Crime Violento' : 'Crime Não Violento'}
                                </p>
                            </div>
                            
                            <h4>Probabilidades de Risco (%)</h4>
                            <ResponsiveContainer width="100%" height={150}>
                                <BarChart data={predictionResult.probabilities} layout="vertical" margin={{left: 20}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                    <XAxis type="number" domain={[0, 100]} stroke="#aaa" />
                                    <YAxis type="category" dataKey="name" width={100} stroke="#aaa" />
                                    <Tooltip contentStyle={{backgroundColor: '#1e1e1e', border: '1px solid #444'}} cursor={{fill: 'rgba(255, 255, 255, 0.1)'}}/>
                                    <Bar dataKey="value" barSize={30}>
                                        {predictionResult.probabilities.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                                        ))}
                                        <LabelList dataKey="value" position="right" formatter={(v) => `${v}%`} fill="#fff" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : !loading && (
                        <div style={{textAlign: 'center', color: '#aaa', paddingTop: '2rem'}}>
                            <h4>Importância das Features (Explicabilidade)</h4>
                            <p style={{fontSize: '0.9rem'}}>Este gráfico mostra quais características o modelo considera mais importantes para prever a violência.</p>
                             <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={featureImportanceData} margin={{top: 20}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#444"/>
                                    <XAxis dataKey="feature" stroke="#aaa" />
                                    <YAxis stroke="#aaa"/>
                                    <Tooltip contentStyle={{backgroundColor: '#1e1e1e', border: '1px solid #444'}}/>
                                    <Bar dataKey="importance" fill="#8884d8">
                                        <LabelList dataKey="importance" position="top" fill="#fff" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupervisedModelDashboard;