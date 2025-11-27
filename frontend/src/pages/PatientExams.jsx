import { useEffect, useState } from "react";
import ProtectedPage from "../components/ProtectedPage";
import { useAuth } from "../context/AuthContext";
import styles from "./PatientExams.module.css";

export default function PatientExams({ onNavigate }) {
  const { token, patient } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadExams = async () => {
    if (!patient?.id) return;
    setLoading(true);
    try {
      const resp = await fetch(`/api/exams?patient_id=${patient.id}`, {
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
  };

  useEffect(() => {
    loadExams();
  }, [patient, token]);

  return (
    <ProtectedPage onNavigate={onNavigate}>
      <div className={styles.page}>
        <div className={styles.container}>
          <header className={styles.hero}>
            <p className={styles.badge}>Saúde</p>
            <h1 className={styles.title}>Resultados de Exames</h1>
            <p className={styles.lead}>Acompanhe suas solicitações e baixe os resultados.</p>
          </header>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Meus Exames</h2>
              <button 
                type="button" 
                className={styles.refreshBtn} 
                onClick={loadExams}
                disabled={loading}
                title="Atualizar lista de exames"
              >
                {loading ? "🔄 Atualizando..." : "🔄 Atualizar"}
              </button>
            </div>

            {loading ? (
              <p className={styles.info}>Carregando exames...</p>
            ) : exams.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>🔬</div>
                <h3 className={styles.emptyTitle}>Nenhum exame disponível</h3>
                <p className={styles.emptyText}>
                  Você ainda não possui exames solicitados. Quando seu médico solicitar um exame, 
                  ele aparecerá aqui e você poderá baixar o resultado assim que estiver disponível.
                </p>
                <button 
                  type="button" 
                  className={styles.refreshBtnLarge} 
                  onClick={loadExams}
                >
                  🔄 Verificar novamente
                </button>
              </div>
            ) : (
              <div className={styles.list}>
                {exams.map((exam) => (
                  <div key={exam.id} className={styles.examItem}>
                    <div className={styles.examInfo}>
                      <strong className={styles.examName}>{exam.exam_name}</strong>
                      <div className={styles.meta}>
                        <span className={styles.date}>
                          Solicitado em: {new Date(exam.created_at).toLocaleDateString()}
                        </span>
                        <span className={styles.doctor}>
                          Dr(a). {exam.doctor_name}
                        </span>
                      </div>
                      <span className={`${styles.status} ${styles[exam.status]}`}>
                        {exam.status === 'requested' ? 'Aguardando Resultado' : 'Resultado Disponível'}
                      </span>
                    </div>
                    
                    <div className={styles.actions}>
                      {exam.document_id ? (
                        <a 
                          href={`/api/documents/${exam.document_id}/download`}
                          className={styles.downloadBtn}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Baixar Resultado
                        </a>
                      ) : (
                        <span className={styles.pending}>Pendente</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </ProtectedPage>
  );
}
