import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../services/api.service';

const SeasonalityChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewBy, setViewBy] = useState('month');

  useEffect(() => {
    setLoading(true);
    apiClient.get(`/statistics/seasonality?by=${viewBy}`)
      .then(response => {
        if (viewBy === 'month') {
            const formattedData = response.data.map(item => ({...item, name: `${item.ano}/${String(item.mes).padStart(2, '0')}`}));
            setData(formattedData);
        } else {
            setData(response.data);
        }
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, [viewBy]);

  return (
    <div className="component-container">
      <h2>Sazonalidade das Ocorrências</h2>
       <div className="filters">
            <button onClick={() => setViewBy('month')} className={viewBy === 'month' ? 'active' : ''}>Por Mês</button>
            <button onClick={() => setViewBy('day_of_week')} className={viewBy === 'day_of_week' ? 'active' : ''}>Por Dia da Semana</button>
        </div>
      {loading ? <div className="loading">Carregando dados...</div> : (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={viewBy === 'month' ? 'name' : 'dia_semana'} />
                <YAxis />
                <Tooltip contentStyle={{backgroundColor: '#333'}} />
                <Legend />
                <Line type="monotone" dataKey="ocorrencias" stroke="#82ca9d" />
            </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default SeasonalityChart;