import React, { useState } from 'react';
import apiClient from '../services/api.service';

const DatasetManager = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (event) => {
        setUploadStatus('');
        setError('');
        setSelectedFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Por favor, selecione um arquivo .csv para enviar.');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        setLoading(true);
        setError('');
        setUploadStatus('Enviando arquivo...');

        try {
            const response = await apiClient.post('/dataset/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setUploadStatus(response.data.message);
        } catch (err) {
            setError(err.response?.data?.detail || 'Ocorreu um erro no upload.');
            setUploadStatus('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#1e1e1e', padding: '2rem', borderRadius: '8px', color: '#f0f0f0', maxWidth: '700px', margin: 'auto' }}>
            <h2 style={{ color: '#f9f9f9', marginTop: 0, borderBottom: '1px solid #444', paddingBottom: '1rem' }}>Gerenciador de Dataset</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
                Faça o upload de um novo arquivo de ocorrências (.csv). O sistema irá substituir o dataset atual e todas as análises passarão a usar os novos dados.
            </p>

            <div style={{ marginTop: '2rem' }}>
                <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileChange}
                    style={{ 
                        color: '#ccc',
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #444',
                        padding: '1rem',
                        borderRadius: '4px',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <button onClick={handleUpload} disabled={loading || !selectedFile} style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                    {loading ? 'Enviando...' : 'Fazer Upload e Atualizar Análises'}
                </button>
            </div>
            
            {uploadStatus && <p style={{ color: '#2ecc71', textAlign: 'center', marginTop: '1rem' }}>{uploadStatus}</p>}
            {error && <p style={{ color: '#e74c3c', textAlign: 'center', marginTop: '1rem' }}>{error}</p>}
        </div>
    );
};

export default DatasetManager;