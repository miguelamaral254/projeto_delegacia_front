import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Rectangle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../services/api.service';

const policeIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ZmZiIgd2lkdGg9IjM2cHgiIGhlaWdodD0iMzZweCI+PHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0xMiAyTDQgNWw4IDEzIDgtMTN6bTAgOGwtNCAyLjV2NS41aDh2LTUuNXoiIGZpbGw9IiMwMDc3YjUiLz48cGF0aCBkPSJNMTIgMkw0IDVsOCA1IDggNS04LTEzLTh6bTAgOGwtNCAyLjV2NS41aDh2LTUuNXoiIGZpbGw9IiMwMDc3YjUiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg==',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
});

const PatrolSimulation = () => {
    const [bairroOptions, setBairroOptions] = useState([]);
    const [selectedBairro, setSelectedBairro] = useState('');
    const [numPatrols, setNumPatrols] = useState(3);
    const [simulationData, setSimulationData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activePolicy, setActivePolicy] = useState('heuristic');
    
    const mapPosition = [-8.0578, -34.8829];

    useEffect(() => {
        apiClient.get('/statistics/unique-bairros')
            .then(res => {
                setBairroOptions(res.data);
                if (res.data.length > 0) setSelectedBairro(res.data[0]);
            })
            .catch(err => console.error("Falha ao carregar bairros", err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedBairro) return;
        setLoading(true);
        setError('');
        setSimulationData(null);
        
        try {
            const response = await apiClient.get('/analysis/patrol-simulation', {
                params: { bairro: selectedBairro, num_patrols: numPatrols }
            });
            if(response.data.error){
                setError(response.data.error);
                setLoading(false);
                return;
            }
            setSimulationData(response.data);
            setActivePolicy('rl_q_learning');
        } catch (err) {
            setError('Falha ao rodar a simulação.');
        } finally {
            setLoading(false);
        }
    };
    
    // Adiciona a nova política ao gráfico
    const chartData = simulationData ? [
        { name: 'Aleatória', "Redução de Risco (%)": simulationData.policies.random.risk_reduction_percent.toFixed(2) },
        { name: 'Heurística', "Redução de Risco (%)": simulationData.policies.heuristic.risk_reduction_percent.toFixed(2) },
        { name: 'Heurística+DBSCAN', "Redução de Risco (%)": simulationData.policies.heuristic_dbscan.risk_reduction_percent.toFixed(2) },
        { name: 'RL (Q-Learning)', "Redução de Risco (%)": simulationData.policies.rl_q_learning.risk_reduction_percent.toFixed(2) },
    ] : [];

    const getRiskColor = (risk, maxRisk) => {
        if (risk === 0 || !maxRisk) return 'transparent';
        const intensity = Math.min(risk / (maxRisk * 0.7 + 1), 1);
        return `rgba(255, 80, 80, ${intensity * 0.7})`;
    };
    
    const maxRisk = simulationData ? Math.max(...simulationData.grid.map(cell => cell.risk)) : 1;

    return (
        <div style={{ backgroundColor: '#1e1e1e', padding: '2rem', borderRadius: '8px', color: '#f0f0f0' }}>
            <h2 style={{color: '#f9f9f9', marginTop: 0}}>Simulação de Alocação de Patrulha</h2>
            <form onSubmit={handleSubmit} style={{display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap'}}>
                <label>Bairro:
                    <select value={selectedBairro} onChange={e => setSelectedBairro(e.target.value)}>
                        {bairroOptions.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </label>
                <label>Nº de Patrulhas:
                    <input type="number" value={numPatrols} onChange={e => setNumPatrols(parseInt(e.target.value))} min="1" max="10" />
                </label>
                <button type="submit" disabled={loading}>{loading ? 'Simulando...' : 'Rodar Simulação'}</button>
            </form>
            
            {loading && <p>Carregando simulação...</p>}
            {error && <p style={{color: 'red'}}>{error}</p>}

            {simulationData && (
                <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', height: '70vh'}}>
                    <div style={{borderRadius: '8px', overflow: 'hidden'}}>
                        <MapContainer center={mapPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            {simulationData.grid.map(cell => (
                                <Rectangle key={cell.id} bounds={cell.bounds} pathOptions={{ color: getRiskColor(cell.risk, maxRisk), weight: 1, fillOpacity: 0.5 }}>
                                    <Popup>Risco Histórico: {cell.risk} ocorrências</Popup>
                                </Rectangle>
                            ))}
                            {simulationData.policies[activePolicy]?.patrol_locations.map((pos, i) => (
                                <Marker key={i} position={pos} icon={policeIcon}>
                                    <Popup>Patrulha {i + 1} ({activePolicy})</Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                    <div>
                        <h3>Comparativo de Estratégias</h3>
                        <div style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap'}}>
                            <button onClick={() => setActivePolicy('random')} disabled={activePolicy === 'random'}>Aleatória</button>
                            <button onClick={() => setActivePolicy('heuristic')} disabled={activePolicy === 'heuristic'}>Heurística</button>
                            <button onClick={() => setActivePolicy('heuristic_dbscan')} disabled={activePolicy === 'heuristic_dbscan'}>Heurística+DBSCAN</button>
                            <button onClick={() => setActivePolicy('rl_q_learning')} disabled={activePolicy === 'rl_q_learning'}>RL</button>
                        </div>
                        <p>Total de Risco no Bairro: <strong>{simulationData.total_risk}</strong></p>
                        <p>Risco Coberto ({activePolicy}): <strong>{simulationData.policies[activePolicy]?.risk_covered.toFixed(0)}</strong></p>
                        <p>Redução de Risco: <strong>{simulationData.policies[activePolicy]?.risk_reduction_percent.toFixed(2)}%</strong></p>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                <XAxis dataKey="name" stroke="#aaa" />
                                <YAxis stroke="#aaa" />
                                <Tooltip contentStyle={{backgroundColor: '#2a2a2a', border: '1px solid #444'}} />
                                <Legend />
                                <Bar dataKey="Redução de Risco (%)" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatrolSimulation;