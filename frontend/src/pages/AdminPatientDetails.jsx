import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ProtectedAdmin from "../components/ProtectedAdmin";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import styles from "./AdminDashboard.module.css";
import docStyles from "./DocumentUpload.module.css"; // Reuse document styles

export default function AdminPatientDetails({ onNavigate }) {
  const { id } = useParams();
  const { token } = useAuth();
  const [patient, setPatient] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadPatientData();
  }, [id, token]);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      // Fetch Patient Details
      const patientResp = await fetch(`${API_BASE_URL}/api/admin/patients/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const patientData = await patientResp.json();

      if (!patientResp.ok) throw new Error(patientData.message || "Erro ao carregar paciente");
      setPatient(patientData.patient);

      // Fetch Documents
      loadDocuments();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const docResp = await fetch(`${API_BASE_URL}/api/documents?patient_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const docData = await docResp.json();
      if (docResp.ok) {
        setDocuments(docData.documents || []);
      }
    } catch (err) {
      console.error("Erro ao carregar documentos", err);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    const formData = new FormData();
    // Support multiple files? The backend might only handle one at a time based on previous code, 
    // but DocumentUpload.jsx loop suggests one by one. Let's do one by one or loop here.
    // The backend `uploadDocument` handles `req.file` (singular).
    
    // Let's upload the first one for simplicity or loop if multiple selected
    // For now, let's just handle the first one or loop.
    
    let successCount = 0;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("patient_id", id); // Important for admin upload
        formData.append("description", "Enviado pelo médico");

        try {
            const resp = await fetch(`${API_BASE_URL}/api/documents/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            
            if (resp.ok) {
                successCount++;
            } else {
                const data = await resp.json();
                setUploadError(prev => `${prev} ${file.name}: ${data.message}; `);
            }
        } catch (err) {
            setUploadError(prev => `${prev} ${file.name}: Erro de rede; `);
        }
    }

    setUploading(false);
    if (successCount > 0) {
        setUploadSuccess(`${successCount} arquivo(s) enviado(s) com sucesso.`);
        loadDocuments();
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (docId, filename) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/documents/${docId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("Erro ao baixar");
      
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erro ao baixar documento.");
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Tem certeza que deseja excluir este documento?")) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/api/documents/${docId}?patient_id=${id}`, { // patient_id might be needed for check? No, backend handles it.
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        loadDocuments();
      } else {
        alert("Erro ao excluir documento");
      }
    } catch (err) {
      alert("Erro ao excluir documento");
    }
  };

  if (loading) return <div className={styles.loading}>Carregando...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!patient) return <div className={styles.error}>Paciente não encontrado</div>;

  return (
    <ProtectedAdmin onNavigate={onNavigate}>
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.hero}>
            <div>
                <button onClick={() => onNavigate("painel-medico-pacientes")} className={styles.backLink}>← Voltar</button>
                <p className={styles.badge}>Paciente</p>
                <h1 className={styles.title}>{patient.name}</h1>
                <p className={styles.lead}>{patient.email} • {patient.phone || "Sem telefone"}</p>
            </div>
          </header>

          <div className={styles.grid}>
            {/* Patient Info Card - Enhanced Design */}
            <section className={styles.card}>
                <div className={styles.cardHeader}>
                    <div>
                        <h2 className={styles.cardTitle}>📋 Informações Pessoais</h2>
                        <p className={styles.cardSubtitle}>Dados completos do paciente</p>
                    </div>
                </div>
                <div style={{ 
                    display: 'grid', 
                    gap: '1.5rem', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' 
                }}>
                    {/* Contact Info Group */}
                    <div style={{ 
                        padding: '1.25rem', 
                        background: 'var(--bg-primary)', 
                        borderRadius: '0.75rem',
                        border: '1px solid var(--border-color)'
                    }}>
                        <h3 style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: 'var(--text-muted)',
                            marginBottom: '1rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>📱 Contato</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Email</p>
                                <p style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                                    {patient.email || "Não informado"}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Telefone</p>
                                <p style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                                    {patient.phone || "Não informado"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Personal Info Group */}
                    <div style={{ 
                        padding: '1.25rem', 
                        background: 'var(--bg-primary)', 
                        borderRadius: '0.75rem',
                        border: '1px solid var(--border-color)'
                    }}>
                        <h3 style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: 'var(--text-muted)',
                            marginBottom: '1rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>👤 Dados Pessoais</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Data de Nascimento</p>
                                <p style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                                    {patient.birthdate ? new Date(patient.birthdate).toLocaleDateString('pt-BR') : "Não informado"}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Idade</p>
                                <p style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                                    {patient.birthdate ? `${Math.floor((new Date() - new Date(patient.birthdate)) / (365.25 * 24 * 60 * 60 * 1000))} anos` : "Não informado"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact Group */}
                    <div style={{ 
                        padding: '1.25rem', 
                        background: 'var(--bg-primary)', 
                        borderRadius: '0.75rem',
                        border: '1px solid var(--border-color)'
                    }}>
                        <h3 style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: 'var(--text-muted)',
                            marginBottom: '1rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>🚨 Emergência</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Nome</p>
                                <p style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                                    {patient.emergency_name || "Não informado"}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Telefone</p>
                                <p style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                                    {patient.emergency_phone || "Não informado"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Medical Info - Full Width */}
                <div style={{ 
                    marginTop: '1.5rem',
                    padding: '1.25rem', 
                    background: 'var(--bg-primary)', 
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: 'var(--text-muted)',
                        marginBottom: '1rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>⚕️ Informações Médicas</h3>
                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Alergias</p>
                            <p style={{ 
                                fontSize: '1rem', 
                                fontWeight: '500', 
                                color: patient.allergies ? 'var(--error)' : 'var(--text-primary)',
                                padding: '0.5rem',
                                background: patient.allergies ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                borderRadius: '0.5rem'
                            }}>
                                {patient.allergies || "Nenhuma registrada"}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Observações</p>
                            <p style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                                {patient.notes || "Nenhuma"}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Documents Section */}
            <section className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Documentos e Exames</h2>
                    <button 
                        className={styles.primaryButton}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading ? "Enviando..." : "Adicionar Documento"}
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{display: 'none'}} 
                        onChange={handleFileUpload} 
                        multiple 
                    />
                </div>

                {uploadError && <p className={styles.error}>{uploadError}</p>}
                {uploadSuccess && <p className={styles.success}>{uploadSuccess}</p>}

                <div className={docStyles.documentsList} style={{marginTop: '20px'}}>
                    {documents.length === 0 ? (
                        <p className={styles.muted}>Nenhum documento encontrado.</p>
                    ) : (
                        documents.map(doc => (
                            <div key={doc.id} className={docStyles.documentCard}>
                                <div className={docStyles.docIcon}>📄</div>
                                <div className={docStyles.docInfo}>
                                    <p className={docStyles.docName}>{doc.original_name}</p>
                                    <p className={docStyles.docMeta}>
                                        {new Date(doc.uploaded_at).toLocaleDateString()} • {(doc.size_bytes / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <div className={docStyles.docActions}>
                                    <button onClick={() => handleDownload(doc.id, doc.original_name)} className={docStyles.downloadBtn} title="Baixar">⬇️</button>
                                    <button onClick={() => handleDelete(doc.id)} className={docStyles.deleteBtn} title="Excluir">🗑️</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
          </div>
        </div>
      </div>
    </ProtectedAdmin>
  );
}
