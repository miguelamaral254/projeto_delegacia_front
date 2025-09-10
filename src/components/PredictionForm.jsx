import React, { useState } from 'react';
import apiClient from '../services/api.service';

const PredictionForm = () => {
  const [formData, setFormData] = useState({
    bairro: 'Boa Viagem', arma_utilizada: 'Arma de Fogo', hora: 20,
    quantidade_vitimas: 1, sexo_suspeito: 'Masculino', quantidade_suspeitos: 2,
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPrediction(null);

    const payload = {
      ...formData,
      descricao_modus_operandi: "Simulado via Frontend React",
      orgao_responsavel: "Delegacia de Roubos e Furtos", status_investigacao: "Em Andamento",
      idade_suspeito: 25, latitude: -8.1299, longitude: -34.9035,
      ano: new Date().getFullYear(), mes: new Date().getMonth() + 1, dia_semana: new Date().getDay(),
    };

    try {
      const response = await apiClient.post('/predict', payload);
      setPrediction(response.data);
    } catch (err) {
      setError('Falha ao conectar com a API. Verifique se ela está rodando e o CORS está configurado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="component-container">
      <h2>Previsão de Tipo de Crime</h2>
      <p>Preencha os campos para simular uma ocorrência e obter uma previsão do modelo.</p>
      <form onSubmit={handleSubmit} className="prediction-form">
        <div className="form-grid">
          <label>Bairro: <input type="text" name="bairro" value={formData.bairro} onChange={handleInputChange} /></label>
          <label>Arma Utilizada:
            <select name="arma_utilizada" value={formData.arma_utilizada} onChange={handleInputChange}>
              <option>Arma de Fogo</option> <option>Arma Branca</option> <option>Nenhuma</option>
            </select>
          </label>
          <label>Hora: <input type="number" name="hora" value={formData.hora} onChange={handleInputChange} min="0" max="23" /></label>
          <label>Qtd. Vítimas: <input type="number" name="quantidade_vitimas" value={formData.quantidade_vitimas} onChange={handleInputChange} min="0" /></label>
          <label>Sexo Suspeito:
            <select name="sexo_suspeito" value={formData.sexo_suspeito} onChange={handleInputChange}>
              <option>Masculino</option> <option>Feminino</option> <option>Desconhecido</option>
            </select>
          </label>
          <label>Qtd. Suspeitos: <input type="number" name="quantidade_suspeitos" value={formData.quantidade_suspeitos} onChange={handleInputChange} min="0" /></label>
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Analisando...' : 'Fazer Previsão'}</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {prediction && (
        <div className="result-card">
          <h3>Resultado da Análise</h3>
          <p className="prediction-value">{prediction.tipo_crime_predito}</p>
        </div>
      )}
    </div>
  );
};

export default PredictionForm;