import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import apiClient from '../services/api.service';

const FitBounds = ({ points }) => {
    const map = useMap();
    useEffect(() => {
        if (points && points.length > 0) {
            const latLngs = points.map(p => [p.latitude, p.longitude]);
            map.fitBounds(latLngs, { padding: [50, 50] });
        }
    }, [points, map]);
    return null;
};

const HeatmapLayer = ({ points }) => {
    const map = useMap();
    const heatLayerRef = React.useRef(null);

    useEffect(() => {
        if (!map) return;
        const heatData = points.map(p => [p.latitude, p.longitude, 0.5]);

        if (heatLayerRef.current) {
            heatLayerRef.current.setLatLngs(heatData);
        } else {
            heatLayerRef.current = L.heatLayer(heatData, {
                radius: 25,    
                blur: 15,       
                maxZoom: 17,    
                minOpacity: 0.5 
            }).addTo(map);
        }
        return () => {
            if (map && heatLayerRef.current) {
                map.removeLayer(heatLayerRef.current);
                heatLayerRef.current = null;
            }
        };
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
    const mapPosition = [-8.0578, -34.8829]; 

    useEffect(() => {
        Promise.all([
            apiClient.get('/statistics/unique-bairros'),
            apiClient.get('/statistics/unique-crime-types')
        ]).then(([bairrosRes, crimeTypesRes]) => {
            setBairroOptions(bairrosRes.data);
            setCrimeTypeOptions(crimeTypesRes.data);
        }).catch(err => console.error("Falha ao carregar opções de filtro", err));
    }, []);

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
                    <HeatmapLayer points={occurrences} />
                    <FitBounds points={occurrences} />
                </MapContainer>
            </div>
        </div>
    );
};

export default CrimeMap;