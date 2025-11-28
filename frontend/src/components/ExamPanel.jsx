import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./ExamPanel.module.css";
import { API_BASE_URL } from "../config";

export default function ExamPanel({ patientId, onClose }) {
  const { token } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [examName, setExamName] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [uploading, setUploading] = useState(null); // ID of exam being uploaded
  const [file, setFile] = useState(null);

  useEffect(() => {
    loadExams();
  }, [patientId]);

  async function loadExams() {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/exams?patient_id=${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (resp.ok) {
        setExams(data.exams || []);
      }
    } catch (error) {
      console.error("Erro ao carregar exames:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestExam(e) {
    e.preventDefault();
    if (!examName.trim()) return;

    setRequesting(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_id: patientId,
          exam_name: examName,
        }),
      });
      
      if (resp.ok) {
        setExamName("");
        loadExams();
      } else {
        alert("Erro ao solicitar exame.");
      }
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setRequesting(false);
    }
  }

  async function handleUploadResult(examId) {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("patient_id", patientId);
    formData.append("exam_request_id", examId);
    formData.append("type", "exam_result");
    formData.append("description", "Resultado de Exame");

    try {
      const resp = await fetch(`${API_BASE_URL}/api/documents/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (resp.ok) {
        alert("Resultado anexado com sucesso!");
        setFile(null);
        setUploading(null);
        loadExams();
      } else {
        alert("Erro ao enviar resultado.");
      }
    } catch (error) {
      console.error("Erro:", error);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Painel de Exames</h2>
          <button onClick={onClose} className={styles.closeBtn}>&times;</button>
        </div>

        <div className={styles.content}>
          <form onSubmit={handleRequestExam} className={styles.requestForm}>
            <input
              type="text"
              placeholder="Nome do exame (ex: Hemograma)"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className={styles.input}
            />
            <button type="submit" disabled={requesting} className={styles.btnPrimary}>
              {requesting ? "Solicitando..." : "Solicitar Exame"}
            </button>
          </form>

          <div className={styles.list}>
            {loading ? (
              <p>Carregando...</p>
            ) : exams.length === 0 ? (
              <p className={styles.empty}>Nenhum exame solicitado.</p>
            ) : (
              exams.map((exam) => (
                <div key={exam.id} className={styles.examItem}>
                  <div className={styles.examInfo}>
                    <strong>{exam.exam_name}</strong>
                    <span className={styles.date}>
                      {new Date(exam.created_at).toLocaleDateString()}
                    </span>
                    <span className={`${styles.status} ${styles[exam.status]}`}>
                      {exam.status === 'requested' ? 'Solicitado' : 'Concluído'}
                    </span>
                  </div>
                  
                  <div className={styles.actions}>
                    {exam.document_id ? (
                      <a 
                        href={`${API_BASE_URL}/api/documents/${exam.document_id}/download`}
                        className={styles.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver Resultado
                      </a>
                    ) : (
                      <div className={styles.uploadBox}>
                        {uploading === exam.id ? (
                          <>
                            <input 
                              type="file" 
                              onChange={(e) => setFile(e.target.files[0])}
                              className={styles.fileInput}
                            />
                            <button 
                              onClick={() => handleUploadResult(exam.id)}
                              disabled={!file}
                              className={styles.btnSmall}
                            >
                              Enviar
                            </button>
                            <button 
                              onClick={() => { setUploading(null); setFile(null); }}
                              className={styles.btnGhost}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => setUploading(exam.id)}
                            className={styles.btnOutline}
                          >
                            Anexar Resultado
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
