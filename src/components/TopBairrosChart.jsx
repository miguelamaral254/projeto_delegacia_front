import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../services/api.service';

const TopBairrosChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/statistics/top-bairros')
      .then(response => { setData(response.data); setLoading(false); })
      .catch(err => console.error(err));
  }, []);

  if (loading) return <div className="loading">Carregando dados...</div>;

  return (
    <div className="component-container">
      <h2>Top 10 Bairros com Mais Ocorrências</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="bairro" type="category" width={120} />
          <Tooltip cursor={{fill: '#444'}} contentStyle={{backgroundColor: '#333'}}/>
          <Legend />
          <Bar dataKey="ocorrencias" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopBairrosChart;