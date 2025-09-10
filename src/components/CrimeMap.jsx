import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import apiClient from '../services/api.service';

// Componente auxiliar para ajustar os limites do mapa
const FitBounds = ({ points }) => {
    const map = useMap();
    useEffect(() => {
        if (points && points.length > 0) {
            const bounds = points.map(p => [p.latitude, p.longitude]);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [points, map]);
    return null;
};

const CrimeMap = () => {
    const [occurrences, setOccurrences] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [bairroOptions, setBairroOptions] = useState([]);
    const [crimeTypeOptions, setCrimeTypeOptions] = useState([]);
    
    const [bairroFilter, setBairroFilter] = useState('');
    const [crimeTypeFilter, setCrimeTypeFilter] = useState('');
    
    const mapPosition = [-8.0578, -34.8829]; // Centro de Recife

    // Busca as opções dos filtros
    useEffect(() => {
        Promise.all([
            apiClient.get('/statistics/unique-bairros'),
            apiClient.get('/statistics/unique-crime-types')
        ]).then(([bairrosRes, crimeTypesRes]) => {
            setBairroOptions(bairrosRes.data);
            setCrimeTypeOptions(crimeTypesRes.data);
        }).catch(err => console.error("Falha ao carregar opções de filtro", err));
    }, []);

    // Busca as ocorrências quando um filtro muda
    useEffect(() => {
        setLoading(true);
        const params = {};
        if (bairroFilter) params.bairro = bairroFilter;
        if (crimeTypeFilter) params.tipo_crime = crimeTypeFilter;

        apiClient.get('/occurrences', { params })
            .then(response => {
                setOccurrences(response.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [bairroFilter, crimeTypeFilter]);

    return (
        <div className="map-view-layout">
            <aside className="map-sidebar">
                <h3>Filtros do Mapa</h3>
                <div className="filters">
                    <label>
                        Bairro:
                        <select value={bairroFilter} onChange={(e) => setBairroFilter(e.target.value)}>
                            <option value="">Todos os Bairros</option>
                            {bairroOptions.map(bairro => (
                                <option key={bairro} value={bairro}>{bairro}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Tipo de Crime:
                        <select value={crimeTypeFilter} onChange={(e) => setCrimeTypeFilter(e.target.value)}>
                            <option value="">Todos os Tipos</option>
                            {crimeTypeOptions.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="occurrences-list">
                    <h4>{loading ? 'Carregando...' : `${occurrences.length} Ocorrências Exibidas`}</h4>
                    <ul>
                        {occurrences.map(occ => (
                            <li key={occ.id_ocorrencia}>
                                <strong>{occ.tipo_crime}</strong>
                                <span>{occ.bairro} - {new Date(occ.data_ocorrencia).toLocaleDateString()}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>

            <div className="map-container">
                <MapContainer center={mapPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {occurrences.map(occ => (
                        <Marker key={occ.id_ocorrencia} position={[occ.latitude, occ.longitude]}>
                            <Popup>
                                <b>{occ.tipo_crime}</b><br />
                                Bairro: {occ.bairro}<br />
                                Data: {new Date(occ.data_ocorrencia).toLocaleDateString()}<br/>
                                {/* --- MUDANÇA AQUI --- */}
                                Lat: {occ.latitude}<br/>
                                Lon: {occ.longitude}
                            </Popup>
                        </Marker>
                    ))}
                    <FitBounds points={occurrences} />
                </MapContainer>
            </div>
        </div>
    );
};

export default CrimeMap;