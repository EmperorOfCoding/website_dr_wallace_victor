import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./DocumentUpload.module.css";

export default function DocumentUpload({ onNavigate }) {
  const { appointmentId } = useParams();
  const { patient, token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadDocuments();
  }, [patient?.id, appointmentId, token]);

  const loadDocuments = async (showLoading = true) => {
    if (!patient?.id) return;
    if (showLoading) setLoading(true);
    try {
      const url = appointmentId
        ? `/api/documents?appointment_id=${appointmentId}`
        : `/api/documents?patient_id=${patient.id}`;
      const resp = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok) {
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Erro ao carregar documentos:", err);
    } finally {
      if (showLoading) setLoading(false);
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
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    // Collect validation errors for invalid files
    const validationErrors = [];
    const validFiles = Array.from(files).filter((file) => {
      if (file.size > maxSize) {
        validationErrors.push(`${file.name}: Arquivo muito grande (máx. 10MB)`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        validationErrors.push(`${file.name}: Tipo de arquivo não permitido`);
        return false;
      }
      return true;
    });

    // Show validation errors if any
    if (validationErrors.length > 0) {
      setError(validationErrors.join("; "));
    }

    // If no valid files, stop here (errors already shown)
    if (validFiles.length === 0) {
      return;
    }

    // Clear previous success message, but keep validation errors visible
    setSuccess("");
    setUploading(true);

    const uploadedDocs = [];
    const uploadErrors = [];
    const successMessages = [];

    for (const file of validFiles) {
      const formData = new FormData();
      formData.append("file", file);
      if (appointmentId) {
        formData.append("appointment_id", appointmentId);
      }

      try {
        const resp = await fetch("/api/documents/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          uploadErrors.push(data.message || `Erro ao enviar ${file.name}`);
        } else {
          // Add uploaded document to the list immediately
          if (data.document) {
            uploadedDocs.push(data.document);
          }
          successMessages.push(file.name);
        }
      } catch (err) {
        uploadErrors.push(`Erro ao enviar ${file.name}`);
      }
    }

    // Combine validation errors with upload errors
    const allErrors = [...validationErrors, ...uploadErrors];
    if (allErrors.length > 0) {
      setError(allErrors.join("; "));
      // Clear success if there are errors
      setSuccess("");
    } else if (successMessages.length > 0) {
      // Only show success if all uploads succeeded and there were no validation errors
      setError("");
      setSuccess(
        successMessages.length === 1
          ? `${successMessages[0]} enviado com sucesso!`
          : `${successMessages.length} arquivos enviados com sucesso!`
      );
    }

    setUploading(false);

    // Update documents list with newly uploaded documents immediately
    if (uploadedDocs.length > 0) {
      setDocuments((prev) => [...uploadedDocs, ...prev]);
    }

    // Reload documents to ensure sync with backend (without showing loading)
    if (uploadedDocs.length > 0 || uploadErrors.length === 0) {
      // Reload in background without blocking UI
      loadDocuments(false).catch((err) => {
        console.error("Erro ao recarregar documentos:", err);
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (docId, filename) => {
    try {
      const resp = await fetch(`/api/documents/${docId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        setError(data.message || "Erro ao baixar documento.");
        return;
      }

      // Get the blob from response
      const blob = await resp.blob();

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "documento";
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao baixar documento:", err);
      setError("Erro ao baixar documento.");
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Deseja realmente excluir este documento?")) return;

    try {
      const resp = await fetch(`/api/documents/${docId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok) {
        setSuccess(data.message || "Documento excluído.");
        setError(""); // Clear any previous errors
        loadDocuments();
      } else {
        setError(data.message || "Erro ao excluir documento.");
        setSuccess(""); // Clear any previous success messages
      }
    } catch (err) {
      console.error("Erro ao excluir documento:", err);
      setError("Erro ao excluir documento.");
      setSuccess(""); // Clear any previous success messages
    }
  };

  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith("image/")) return "🖼️";
    if (mimetype === "application/pdf") return "📄";
    if (mimetype.includes("word")) return "📝";
    return "📎";
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.badge}>Documentos</p>
            <h1 className={styles.title}>
              {appointmentId ? "Documentos da Consulta" : "Meus Documentos"}
            </h1>
            <p className={styles.subtitle}>
              Envie exames, receitas e outros documentos relevantes para o atendimento.
            </p>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => onNavigate("minha-agenda")}
            >
              Voltar
            </button>
          </div>
        </header>

        {error && (
          <motion.div
            className={styles.error}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            className={styles.success}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {success}
          </motion.div>
        )}

        {/* Upload Area */}
        <div
          className={`${styles.uploadArea} ${dragActive ? styles.dragActive : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className={styles.fileInput}
            onChange={handleFileChange}
            multiple
            accept="image/*,.pdf,.doc,.docx"
          />
          <div className={styles.uploadIcon}>📤</div>
          <h3 className={styles.uploadTitle}>
            {uploading ? "Enviando..." : "Arraste arquivos aqui"}
          </h3>
          <p className={styles.uploadText}>
            ou clique para selecionar
          </p>
          <p className={styles.uploadHint}>
            Formatos: JPG, PNG, GIF, PDF, DOC • Máx. 10MB
          </p>
        </div>

        {/* Documents List */}
        <div className={styles.documentsSection}>
          <h2 className={styles.sectionTitle}>Arquivos enviados</h2>

          {loading && <p className={styles.loading}>Carregando documentos...</p>}

          {!loading && documents.length === 0 && (
            <p className={styles.empty}>Nenhum documento enviado ainda.</p>
          )}

          <AnimatePresence>
            <div className={styles.documentsList}>
              {documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  className={styles.documentCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  layout
                >
                  <div className={styles.docIcon}>{getFileIcon(doc.mimetype)}</div>
                  <div className={styles.docInfo}>
                    <p className={styles.docName}>{doc.original_name}</p>
                    <p className={styles.docMeta}>
                      {formatFileSize(doc.size_bytes)} • {formatDate(doc.uploaded_at)}
                    </p>
                    {doc.description && (
                      <p className={styles.docDescription}>{doc.description}</p>
                    )}
                  </div>
                  <div className={styles.docActions}>
                    <button
                      type="button"
                      className={styles.downloadBtn}
                      onClick={() => handleDownload(doc.id, doc.original_name)}
                      title="Baixar"
                    >
                      ⬇️
                    </button>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(doc.id)}
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}


