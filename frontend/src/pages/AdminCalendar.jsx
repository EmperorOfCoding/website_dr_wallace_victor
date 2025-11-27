import React, { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useAuth } from "../context/AuthContext";
import styles from "./AdminCalendar.module.css";

export default function AdminCalendar({ onNavigate }) {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const calendarRef = useRef(null);

  useEffect(() => {
    loadAppointments();
  }, [token]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/admin/appointments?limit=500", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data.appointments) {
        const calendarEvents = data.appointments.map((appt) => ({
          id: appt.id,
          title: `${appt.patientName || "Paciente"} - ${appt.typeName || "Consulta"}`,
          start: `${appt.date}T${appt.time}`,
          end: calculateEndTime(appt.date, appt.time, appt.durationMinutes || 30),
          backgroundColor: getStatusColor(appt.status),
          borderColor: getStatusColor(appt.status),
          extendedProps: {
            ...appt,
          },
        }));
        setEvents(calendarEvents);
      }
    } catch (err) {
      console.error("Erro ao carregar agenda:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = (date, time, durationMinutes) => {
    const [hours, minutes] = time.split(":").map(Number);
    const endMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${date}T${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: "#3b82f6",
      confirmed: "#10b981",
      completed: "#6b7280",
      cancelled: "#ef4444",
      no_show: "#f59e0b",
    };
    return colors[status] || "#3b82f6";
  };

  const handleEventClick = (info) => {
    setSelectedEvent(info.event.extendedProps);
    setModalOpen(true);
  };

  const handleDateClick = (info) => {
    // Navigate to create appointment for this date
    onNavigate(`agendar?date=${info.dateStr}`);
  };

  const handleCancelAppointment = async () => {
    if (!selectedEvent) return;
    
    try {
      const resp = await fetch(`/api/admin/appointments/${selectedEvent.id}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: "Cancelado pelo administrador" }),
      });
      
      if (resp.ok) {
        setModalOpen(false);
        loadAppointments();
      }
    } catch (err) {
      console.error("Erro ao cancelar:", err);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.badge}>Agenda Visual</p>
            <h1 className={styles.title}>Calendário de Consultas</h1>
            <p className={styles.subtitle}>
              Visualize e gerencie todas as consultas em formato de calendário.
            </p>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => onNavigate("painel-medico-agenda")}
            >
              Ver lista
            </button>
            <button
              type="button"
              className={styles.primary}
              onClick={() => onNavigate("agendar")}
            >
              Nova consulta
            </button>
          </div>
        </header>

        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.dot} style={{ backgroundColor: "#3b82f6" }}></span>
            Agendado
          </span>
          <span className={styles.legendItem}>
            <span className={styles.dot} style={{ backgroundColor: "#10b981" }}></span>
            Confirmado
          </span>
          <span className={styles.legendItem}>
            <span className={styles.dot} style={{ backgroundColor: "#6b7280" }}></span>
            Concluído
          </span>
          <span className={styles.legendItem}>
            <span className={styles.dot} style={{ backgroundColor: "#ef4444" }}></span>
            Cancelado
          </span>
        </div>

        {loading && <div className={styles.loading}>Carregando calendário...</div>}

        <div className={styles.calendarWrapper}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            locale="pt-br"
            events={events}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            slotMinTime="07:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={false}
            weekends={true}
            nowIndicator={true}
            height="auto"
            buttonText={{
              today: "Hoje",
              month: "Mês",
              week: "Semana",
              day: "Dia",
            }}
          />
        </div>

        {/* Modal de detalhes */}
        {modalOpen && selectedEvent && (
          <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <button
                className={styles.modalClose}
                onClick={() => setModalOpen(false)}
                aria-label="Fechar"
              >
                ×
              </button>
              <h2 className={styles.modalTitle}>Detalhes da Consulta</h2>
              <div className={styles.modalContent}>
                <div className={styles.modalRow}>
                  <span className={styles.modalLabel}>Paciente:</span>
                  <span>{selectedEvent.patientName || "N/A"}</span>
                </div>
                <div className={styles.modalRow}>
                  <span className={styles.modalLabel}>Data:</span>
                  <span>{formatDate(selectedEvent.date)}</span>
                </div>
                <div className={styles.modalRow}>
                  <span className={styles.modalLabel}>Horário:</span>
                  <span>{selectedEvent.time?.slice(0, 5)}</span>
                </div>
                <div className={styles.modalRow}>
                  <span className={styles.modalLabel}>Tipo:</span>
                  <span>{selectedEvent.typeName || "Consulta"}</span>
                </div>
                <div className={styles.modalRow}>
                  <span className={styles.modalLabel}>Status:</span>
                  <span className={`${styles.status} ${styles[selectedEvent.status]}`}>
                    {selectedEvent.status}
                  </span>
                </div>
                {selectedEvent.patientEmail && (
                  <div className={styles.modalRow}>
                    <span className={styles.modalLabel}>E-mail:</span>
                    <span>{selectedEvent.patientEmail}</span>
                  </div>
                )}
                {selectedEvent.patientPhone && (
                  <div className={styles.modalRow}>
                    <span className={styles.modalLabel}>Telefone:</span>
                    <span>{selectedEvent.patientPhone}</span>
                  </div>
                )}
              </div>
              <div className={styles.modalActions}>
                {selectedEvent.status !== "cancelled" &&
                  selectedEvent.status !== "completed" && (
                    <button
                      type="button"
                      className={styles.danger}
                      onClick={handleCancelAppointment}
                    >
                      Cancelar consulta
                    </button>
                  )}
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => setModalOpen(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


