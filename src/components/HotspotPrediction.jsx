import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import apiClient from '../services/api.service';
import axios from 'axios';

// Componente para a animação de carregamento
const LoadingSpinner = () => (
    <>
        <style>{`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .spinner {
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top: 4px solid #c1121f;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
            }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
            <div className="spinner"></div>
            <p>Analisando e buscando endereços...</p>
        </div>
    </>
);


const HotspotPrediction = () => {
    const [bairroOptions, setBairroOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [selectedBairro, setSelectedBairro] = useState('');
    const [selectedHour, setSelectedHour] = useState(20);
    const [numHotspots, setNumHotspots] = useState(3);

    const [predictionResult, setPredictionResult] = useState(null);
    const [hotspotAddresses, setHotspotAddresses] = useState({});
    
    // Novo estado para rastrear o botão "aceso"
    const [activeIndex, setActiveIndex] = useState(null);

    const mapPosition = [-8.0578, -34.8829];
    const mapRef = useRef(null);

    useEffect(() => {
        apiClient.get('/statistics/unique-bairros')
            .then(res => {
                setBairroOptions(res.data);
                if (res.data.length > 0) {
                    setSelectedBairro(res.data[0]);
                }
            })
            .catch(err => console.error("Falha ao carregar bairros", err));
    }, []);

    const fetchAddressForHotspot = async (lat, lon) => {
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
            const { address } = response.data;
            if (address) {
                const mainLocation = address.road || address.pedestrian || address.tourism || address.amenity || address.suburb || '';
                const postcode = address.postcode || '';
                const addressParts = [mainLocation, postcode].filter(part => part);
                return addressParts.join(', ') || 'Endereço não encontrado';
            }
            return 'Endereço não encontrado';
        } catch (error) {
            console.error("Erro na geocodificação reversa:", error);
            return 'Não foi possível buscar o endereço';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedBairro) {
            setError('Por favor, selecione um bairro.');
            return;
        }
        setLoading(true);
        setError('');
        setPredictionResult(null);
        setHotspotAddresses({});
        setActiveIndex(null);

        const payload = {
            bairro: selectedBairro,
            hora: selectedHour,
            n_hotspots: numHotspots,
        };

        try {
            const response = await apiClient.post('/predict/hotspots', payload);
            const result = response.data;

            if (result.hotspots && result.hotspots.length > 0) {
                const addressPromises = result.hotspots.map(spot => fetchAddressForHotspot(spot.lat, spot.lon));
                const addresses = await Promise.all(addressPromises);
                
                const addressesMap = {};
                addresses.forEach((address, index) => {
                    addressesMap[index] = address;
                });
                setHotspotAddresses(addressesMap);
            }
            // Só define o resultado final depois que os endereços foram buscados
            setPredictionResult(result);
        } catch (err) {
            setError('Falha ao obter previsão. Verifique a API.');
        } finally {
            setLoading(false);
        }
    };

    const handleHotspotClick = (spot, index) => {
        setActiveIndex(index); // Define o botão como "aceso"
        if (mapRef.current && spot) {
            mapRef.current.flyTo([spot.lat, spot.lon], 17);
        }
    };

    return (
        <div style={{ backgroundColor: '#1e1e1e', padding: '2rem', borderRadius: '8px', color: '#f0f0f0' }}>
            <h2 style={{ color: '#f9f9f9', marginTop: 0, borderBottom: '1px solid #444', paddingBottom: '1rem' }}>Previsão de Hotspots de Crime</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem', maxWidth: '800px' }}>Selecione um bairro e uma hora para prever as áreas com maior probabilidade de ocorrências futuras, com base em padrões históricos.</p>
            
            <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    {/* Inputs do Formulário */}
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>Bairro: <select value={selectedBairro} onChange={(e) => setSelectedBairro(e.target.value)} style={{ padding: '0.75rem', backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '4px', color: '#f0f0f0', fontSize: '1rem' }}><option value="" disabled>Selecione...</option>{bairroOptions.map(b => <option key={b} value={b}>{b}</option>)}</select></label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>Hora: <input type="number" value={selectedHour} onChange={(e) => setSelectedHour(parseInt(e.target.value))} min="0" max="23" style={{ padding: '0.75rem', backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '4px', color: '#f0f0f0', fontSize: '1rem' }} /></label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>Nº de Hotspots: <input type="number" value={numHotspots} onChange={(e) => setNumHotspots(parseInt(e.target.value))} min="1" max="10" style={{ padding: '0.75rem', backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '4px', color: '#f0f0f0', fontSize: '1rem' }} /></label>
                </div>
                <button type="submit" disabled={loading} style={{ backgroundColor: loading ? '#555' : '#c1121f', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>{loading ? 'Calculando...' : 'Prever Hotspots'}</button>
            </form>

            {error && <p style={{ color: '#ff6b6b', marginTop: '1rem' }}>{error}</p>}
            
            {/* Lógica de Carregamento e Exibição de Resultados */}
            {loading ? <LoadingSpinner /> : (
                predictionResult && (
                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', height: '60vh' }}>
                        <div style={{ flex: 1, backgroundColor: '#2a2a2a', padding: '1.5rem', borderRadius: '8px', maxHeight: '100%', overflowY: 'auto' }}>
                            <h3 style={{ marginTop: 0, color: '#c1121f', fontSize: '1.1rem' }}>{predictionResult.message}</h3>
                            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                                {predictionResult.hotspots.map((spot, index) => (
                                    <li key={index} style={{ borderBottom: '1px solid #444' }}>
                                        <button 
                                            onClick={() => handleHotspotClick(spot, index)}
                                            style={{
                                                width: '100%',
                                                background: activeIndex === index ? '#444' : 'transparent', // Botão fica "aceso"
                                                border: 'none', borderRadius: '4px', padding: '12px', margin: 0,
                                                textAlign: 'left', cursor: 'pointer', color: '#f0f0f0',
                                                display: 'flex', flexDirection: 'column',
                                            }}
                                        >
                                            <strong style={{ fontSize: '1rem', marginBottom: '4px' }}>Hotspot {index + 1}</strong>
                                            <span style={{ fontSize: '0.85rem', color: '#aaa', whiteSpace: 'normal' }}>{hotspotAddresses[index] || `Buscando endereço...`}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div style={{ flex: 2.5, height: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #444' }}>
                            <MapContainer ref={mapRef} center={mapPosition} zoom={14} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                                {predictionResult.hotspots.map((spot, index) => (
                                    <CircleMarker key={index} center={[spot.lat, spot.lon]} radius={15} pathOptions={{ color: 'red', fillColor: '#f03', fillOpacity: 0.5 }}>
                                        <Popup>{hotspotAddresses[index] || `Hotspot Previsto ${index + 1}`}</Popup>
                                    </CircleMarker>
                                ))}
                            </MapContainer>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default HotspotPrediction;