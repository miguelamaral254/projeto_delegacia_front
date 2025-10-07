import React, { useState } from 'react';
import { FiTarget, FiMap, FiBarChart2, FiCalendar, FiArchive, FiMessageSquare, FiShare2, FiShield, FiUpload, FiAlertTriangle, FiCpu, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import TopBairrosChart from './components/TopBairrosChart';
import SeasonalityChart from './components/SeasonalityChart';
import CrimeHeatmapTable from './components/CrimeHeatmapTable';
import CrimeMap from './components/CrimeMap';
import HotspotPrediction from './components/HotspotPrediction';
import ModusOperandiTopics from './components/ModusOperandiTopics';
import SimilarityNetwork from './components/SimilarityNetwork';
import PatrolSimulation from './components/PatrolSimulation';
import DatasetManager from './components/DatasetManager';
import AnomaliesDashboard from './components/AnomaliesDashboard';
import SupervisedModelDashboard from './components/SupervisedModelDashboard';
import './App.css';

function App() {
    const [activeTab, setActiveTab] = useState('hotspot-prediction');
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const toggleSidebar = () => {
        setSidebarCollapsed(!isSidebarCollapsed);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'hotspot-prediction': return <HotspotPrediction />;
            case 'topics': return <ModusOperandiTopics />;
            case 'network': return <SimilarityNetwork />;
            case 'patrol-simulation': return <PatrolSimulation />;
            case 'anomalies': return <AnomaliesDashboard />;
            case 'supervised-model': return <SupervisedModelDashboard />;
            case 'map': return <CrimeMap />;
            case 'top-bairros': return <TopBairrosChart />;
            case 'seasonality': return <SeasonalityChart />;
            case 'heatmap': return <CrimeHeatmapTable />;
            case 'dataset-manager': return <DatasetManager />;
            default: return <HotspotPrediction />;
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Delegacia 5.0 - Dashboard Preditivo</h1>
            </header>

            <div className={`App-body ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <nav className="App-sidebar">
                    <button onClick={toggleSidebar} className="sidebar-toggle">
                        {isSidebarCollapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
                        <span className="button-text">Recolher</span>
                    </button>
                    
                    <button onClick={() => setActiveTab('supervised-model')} className={activeTab === 'supervised-model' ? 'active' : ''}>
                        <FiCpu size={20} />
                        <span className="button-text">Modelo Supervisionado</span>
                    </button>
                    <button onClick={() => setActiveTab('anomalies')} className={activeTab === 'anomalies' ? 'active' : ''}>
                        <FiAlertTriangle size={20} />
                        <span className="button-text">Detecção de Anomalias</span>
                    </button>
                    <button onClick={() => setActiveTab('patrol-simulation')} className={activeTab === 'patrol-simulation' ? 'active' : ''}>
                        <FiShield size={20} />
                        <span className="button-text">Simulação de Patrulha</span>
                    </button>
                    <button onClick={() => setActiveTab('hotspot-prediction')} className={activeTab === 'hotspot-prediction' ? 'active' : ''}>
                        <FiTarget size={20} />
                        <span className="button-text">Previsão de Hotspots</span>
                    </button>
                    <button onClick={() => setActiveTab('topics')} className={activeTab === 'topics' ? 'active' : ''}>
                        <FiMessageSquare size={20} />
                        <span className="button-text">Tópicos de M.O.</span>
                    </button>
                    <button onClick={() => setActiveTab('network')} className={activeTab === 'network' ? 'active' : ''}>
                        <FiShare2 size={20} />
                        <span className="button-text">Rede de Similaridade</span>
                    </button>
                    <button onClick={() => setActiveTab('map')} className={activeTab === 'map' ? 'active' : ''}>
                        <FiMap size={20} />
                        <span className="button-text">Mapa de Ocorrências</span>
                    </button>
                    <button onClick={() => setActiveTab('top-bairros')} className={activeTab === 'top-bairros' ? 'active' : ''}>
                        <FiBarChart2 size={20} />
                        <span className="button-text">Top Bairros</span>
                    </button>
                    <button onClick={() => setActiveTab('seasonality')} className={activeTab === 'seasonality' ? 'active' : ''}>
                        <FiCalendar size={20} />
                        <span className="button-text">Sazonalidade</span>
                    </button>
                    <button onClick={() => setActiveTab('heatmap')} className={activeTab === 'heatmap' ? 'active' : ''}>
                        <FiArchive size={20} />
                        <span className="button-text">Hotspots Históricos</span>
                    </button>
                    <button onClick={() => setActiveTab('dataset-manager')} className={activeTab === 'dataset-manager' ? 'active' : ''}>
                        <FiUpload size={20} />
                        <span className="button-text">Gerenciar Dataset</span>
                    </button>
                </nav>

                <main className="App-content">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}

export default App;

