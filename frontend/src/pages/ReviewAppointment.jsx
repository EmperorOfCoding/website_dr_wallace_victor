import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import styles from "./ReviewAppointment.module.css";

export default function ReviewAppointment({ onNavigate }) {
  const { appointmentId } = useParams();
  const { patient, token } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [existingReview, setExistingReview] = useState(null);

  useEffect(() => {
    loadAppointment();
  }, [appointmentId, token]);

  const loadAppointment = async () => {
    if (!appointmentId) return;
    setLoading(true);
    try {
      const resp = await fetch(`/api/appointments/${appointmentId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data.appointment) {
        setAppointment(data.appointment);
        if (data.review) {
          setExistingReview(data.review);
          setRating(data.review.rating);
          setComment(data.review.comment || "");
        }
      } else {
        setError("Consulta não encontrada.");
      }
    } catch (err) {
      setError("Erro ao carregar consulta.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Por favor, selecione uma avaliação.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const resp = await fetch(`/api/appointments/${appointmentId}/review`, {
        method: existingReview ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok) {
        setSuccess(true);
        setTimeout(() => onNavigate("minha-agenda"), 2000);
      } else {
        setError(data.message || "Erro ao enviar avaliação.");
      }
    } catch (err) {
      setError("Erro ao enviar avaliação.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  const StarIcon = ({ filled, onClick, onMouseEnter, onMouseLeave }) => (
    <motion.button
      type="button"
      className={`${styles.star} ${filled ? styles.filled : ""}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      aria-label={`${filled ? "Remover" : "Dar"} estrela`}
    >
      ★
    </motion.button>
  );

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loading}>Carregando...</div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <motion.div
            className={styles.successCard}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.successIcon}>✓</div>
            <h2>Avaliação enviada!</h2>
            <p>Obrigado pelo seu feedback. Redirecionando...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.badge}>Feedback</p>
          <h1 className={styles.title}>Avalie sua Consulta</h1>
          <p className={styles.subtitle}>
            Sua opinião nos ajuda a melhorar o atendimento.
          </p>
        </header>

        {error && <div className={styles.error}>{error}</div>}

        {appointment && (
          <div className={styles.appointmentInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Data:</span>
              <span>{formatDate(appointment.date)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Horário:</span>
              <span>{appointment.time?.slice(0, 5)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Tipo:</span>
              <span>{appointment.typeName || "Consulta"}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Médico:</span>
              <span>{appointment.doctorName || "Dr. Wallace Victor"}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.ratingSection}>
            <label className={styles.ratingLabel}>
              Como você avalia seu atendimento?
            </label>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  filled={star <= (hoverRating || rating)}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                />
              ))}
            </div>
            <p className={styles.ratingText}>
              {rating === 0 && "Selecione uma nota"}
              {rating === 1 && "Muito insatisfeito"}
              {rating === 2 && "Insatisfeito"}
              {rating === 3 && "Regular"}
              {rating === 4 && "Satisfeito"}
              {rating === 5 && "Muito satisfeito"}
            </p>
          </div>

          <div className={styles.commentSection}>
            <label htmlFor="comment" className={styles.commentLabel}>
              Deixe um comentário (opcional)
            </label>
            <textarea
              id="comment"
              className={styles.textarea}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte-nos mais sobre sua experiência..."
              rows={4}
              maxLength={500}
            />
            <p className={styles.charCount}>{comment.length}/500</p>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => onNavigate("minha-agenda")}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.primary}
              disabled={submitting || rating === 0}
            >
              {submitting ? "Enviando..." : existingReview ? "Atualizar avaliação" : "Enviar avaliação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


