import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const Dashboard = ({ user, onLogout }) => {
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadDocuments();
    loadChatHistory();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/documents', getAuthHeader());
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const loadChatHistory = () => {
    const saved = localStorage.getItem(`chatHistory_${user.id}`);
    if (saved) {
      setChatHistory(JSON.parse(saved));
    }
  };

  const saveChatHistory = (history) => {
    localStorage.setItem(`chatHistory_${user.id}`, JSON.stringify(history));
  };

  const handleUpload = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF, TXT, and DOCX files are allowed');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('document', file);

    try {
      await axios.post('http://localhost:5000/api/documents/upload', formData, {
        ...getAuthHeader(),
        headers: { 
          ...getAuthHeader().headers,
          'Content-Type': 'multipart/form-data' 
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadDocuments();
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'success-message';
      successDiv.textContent = `✅ ${file.name} uploaded successfully!`;
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);
      
    } catch (error) {
      alert('Upload failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (docId, docName) => {
    if (!window.confirm(`Are you sure you want to delete "${docName}"?`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/documents/${docId}`, getAuthHeader());
      loadDocuments();
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'success-message';
      successDiv.textContent = `🗑️ ${docName} deleted successfully!`;
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);
      
    } catch (error) {
      alert('Delete failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = { 
      role: 'user', 
      content: chatMessage,
      timestamp: new Date().toISOString()
    };
    
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    saveChatHistory(newHistory);
    setChatLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/chat', 
        { question: chatMessage }, 
        getAuthHeader()
      );

      const aiMessage = { 
        role: 'ai', 
        content: response.data.answer,
        documentsUsed: response.data.documentsUsed,
        timestamp: new Date().toISOString()
      };
      
      const finalHistory = [...newHistory, aiMessage];
      setChatHistory(finalHistory);
      saveChatHistory(finalHistory);
      setChatMessage('');
    } catch (error) {
      const errorMessage = { 
        role: 'ai', 
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      
      const finalHistory = [...newHistory, errorMessage];
      setChatHistory(finalHistory);
      saveChatHistory(finalHistory);
    } finally {
      setChatLoading(false);
    }
  };

  const exportChat = () => {
    const chatText = chatHistory.map(msg => 
      `${msg.role.toUpperCase()}: ${msg.content}\n`
    ).join('\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setChatHistory([]);
      localStorage.removeItem(`chatHistory_${user.id}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Welcome, {user.name}! 🎉</h1>
          <p className="user-stats">
            📄 {documents.length} documents • 💬 {chatHistory.length} messages
          </p>
        </div>
        <div className="header-actions">
          <button onClick={clearChat} className="action-button clear-btn">
            🗑️ Clear Chat
          </button>
          <button onClick={exportChat} className="action-button export-btn">
            📤 Export Chat
          </button>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        
        {/* Enhanced Upload Section */}
        <div className="section upload-section">
          <h3>📄 Document Management</h3>
          <p>Upload PDF, TXT, or DOCX files to train your AI assistant</p>
          
          <div 
            className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.docx"
              onChange={(e) => {
                if (e.target.files[0]) {
                  handleUpload(e.target.files[0]);
                }
              }}
              className="file-input-hidden"
            />
            
            {uploading ? (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p>Uploading... {uploadProgress}%</p>
              </div>
            ) : (
              <div className="upload-prompt">
                <div className="upload-icon">📤</div>
                <p><strong>Drag & drop files here</strong></p>
                <p>or click to browse</p>
                <small>Supports PDF, TXT, DOCX (max 10MB)</small>
              </div>
            )}
          </div>
          
          <div className="documents-list">
            <div className="list-header">
              <h4>Your Documents ({documents.length})</h4>
            </div>
            
            {documents.length === 0 ? (
              <div className="no-documents">
                <p>📄 No documents uploaded yet</p>
                <p>Upload your first document above to get started!</p>
              </div>
            ) : (
              <div className="documents-grid">
                {documents.map(doc => (
                  <div key={doc._id} className="document-card">
                    <div className="document-icon">
                      {doc.fileType === 'pdf' ? '📕' : 
                       doc.fileType === 'docx' ? '📘' : '📄'}
                    </div>
                    <div className="document-info">
                      <strong className="document-name">{doc.originalName}</strong>
                      <div className="document-meta">
                        <span className="file-type">{doc.fileType.toUpperCase()}</span>
                        <span className="file-size">{Math.round(doc.fileSize / 1024)} KB</span>
                        <span className="upload-date">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(doc._id, doc.originalName)}
                      className="delete-button"
                      title="Delete document"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Chat Section */}
        <div className="section chat-section">
          <div className="chat-header">
            <h3>💬 AI Assistant</h3>
            <div className="chat-stats">
              {documents.length > 0 && (
                <span className="knowledge-indicator">
                  🧠 Trained on {documents.length} document{documents.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          
          <div className="chat-container">
            <div className="chat-history">
              {chatHistory.length === 0 ? (
                <div className="welcome-message">
                  <div className="welcome-icon">🤖</div>
                  <h4>Hi! I'm your AI assistant</h4>
                  <p>Upload some documents and I'll help you find information from them!</p>
                  {documents.length === 0 && (
                    <p className="hint">👈 Start by uploading a document on the left</p>
                  )}
                </div>
              ) : (
                <>
                  {chatHistory.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.role}`}>
                      <div className="message-content">
                        <div className="message-header">
                          <strong>
                            {msg.role === 'user' ? '👤 You' : '🤖 AI Assistant'}
                          </strong>
                          <small className="timestamp">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </small>
                        </div>
                        <p className="message-text">{msg.content}</p>
                        {msg.documentsUsed && (
                          <div className="message-footer">
                            <small className="documents-used">
                              📄 Referenced {msg.documentsUsed} document{msg.documentsUsed > 1 ? 's' : ''}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {chatLoading && (
                    <div className="chat-message ai loading">
                      <div className="message-content">
                        <div className="message-header">
                          <strong>🤖 AI Assistant</strong>
                        </div>
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="chat-input-container">
              <div className="input-wrapper">
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={documents.length > 0 ? 
                    "Ask me anything about your documents..." : 
                    "Upload a document first to start chatting..."
                  }
                  disabled={chatLoading || documents.length === 0}
                  className="chat-input"
                  rows="2"
                />
                <button 
                  onClick={handleChat}
                  disabled={chatLoading || !chatMessage.trim() || documents.length === 0}
                  className="chat-send-button"
                >
                  {chatLoading ? '⏳' : '📤'}
                </button>
              </div>
              {documents.length === 0 && (
                <p className="input-hint">Upload documents to enable chat</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;