import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/api.service';

const DatasetManager = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    
    const pollingIntervalRef = useRef(null);

    const checkTrainingStatus = async () => {
        try {
            const response = await apiClient.get('/dataset/training-status');
            const statusData = response.data;
            setUploadStatus(`Status do Treinamento: ${statusData.status}...`);

            if (statusData.status === 'complete' || statusData.status === 'failed') {
                clearInterval(pollingIntervalRef.current);
                setIsPolling(false);
                setUploadStatus(`Treinamento finalizado com status: ${statusData.status}.`);
                if(statusData.status === 'failed') {
                    setError(statusData.message);
                }
            }
        } catch (err) {
            console.error("Erro ao verificar status do treino", err);
            clearInterval(pollingIntervalRef.current);
            setIsPolling(false);
            setError('Falha ao comunicar com a API para verificar o status.');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Por favor, selecione um arquivo .csv para enviar.');
            return;
        }
        setLoading(true);
        setError('');
        setUploadStatus('Enviando arquivo...');

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await apiClient.post('/dataset/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUploadStatus(response.data.message);
            setIsPolling(true);
            pollingIntervalRef.current = setInterval(checkTrainingStatus, 5000); // Verifica a cada 5 segundos
        } catch (err) {
            setError(err.response?.data?.detail || 'Ocorreu um erro no upload.');
            setUploadStatus('');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);


    return (
        <div style={{ backgroundColor: '#1e1e1e', padding: '2rem', borderRadius: '8px', color: '#f0f0f0', maxWidth: '700px', margin: 'auto' }}>
            <h2 style={{ color: '#f9f9f9', marginTop: 0, borderBottom: '1px solid #444', paddingBottom: '1rem' }}>Gerenciador de Dataset</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
                Faça o upload de um novo arquivo .csv. O sistema irá substituir o dataset atual, atualizar as análises e iniciar o retreinamento dos modelos em segundo plano.
            </p>

            <div style={{ marginTop: '2rem' }}>
                <input type="file" accept=".csv" onChange={(e) => setSelectedFile(e.target.files[0])} disabled={isPolling} />
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <button onClick={handleUpload} disabled={loading || !selectedFile || isPolling}>
                    {loading ? 'Enviando...' : (isPolling ? 'Treinamento em Andamento...' : 'Fazer Upload e Iniciar Treino')}
                </button>
            </div>
            
            {uploadStatus && <p style={{ color: '#2ecc71', textAlign: 'center', marginTop: '1rem' }}>{uploadStatus}</p>}
            {error && <p style={{ color: '#e74c3c', textAlign: 'center', marginTop: '1rem' }}>{error}</p>}
        </div>
    );
};

export default DatasetManager;