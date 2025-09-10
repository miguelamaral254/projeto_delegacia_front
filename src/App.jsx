import React, { useState } from 'react';
import PredictionForm from './components/PredictionForm';
import TopBairrosChart from './components/TopBairrosChart';
import SeasonalityChart from './components/SeasonalityChart';
import CrimeHeatmapTable from './components/CrimeHeatmapTable';
import CrimeMap from './components/CrimeMap'; 
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('predict');

  const renderContent = () => {
    switch (activeTab) {
      case 'predict': return <PredictionForm />;
      case 'top-bairros': return <TopBairrosChart />;
      case 'seasonality': return <SeasonalityChart />;
      case 'heatmap': return <CrimeHeatmapTable />;
      case 'map': return <CrimeMap />; 
      default: return <PredictionForm />;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Delegacia 5.0 - Dashboard Preditivo</h1>
      </header>
      <nav className="App-nav">
        <button onClick={() => setActiveTab('predict')} className={activeTab === 'predict' ? 'active' : ''}>Previsão</button>
        <button onClick={() => setActiveTab('map')} className={activeTab === 'map' ? 'active' : ''}>Mapa de Ocorrências</button> {/* <-- ADICIONE O BOTÃO */}
        <button onClick={() => setActiveTab('top-bairros')} className={activeTab === 'top-bairros' ? 'active' : ''}>Top Bairros</button>
        <button onClick={() => setActiveTab('seasonality')} className={activeTab === 'seasonality' ? 'active' : ''}>Sazonalidade</button>
        <button onClick={() => setActiveTab('heatmap')} className={activeTab === 'heatmap' ? 'active' : ''}>Hotspots</button>
      </nav>
      <main className="App-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;