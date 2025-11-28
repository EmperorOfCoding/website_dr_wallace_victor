import { useEffect, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import styles from "./AdminMetrics.module.css";

const COLORS = ["#3b5bfd", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AdminMetrics({ onNavigate }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalAppointments: 0,
    totalPatients: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    averageRating: 0,
    appointmentsByMonth: [],
    appointmentsByType: [],
    appointmentsByStatus: [],
    appointmentsByHour: [],
    topPatients: [],
  });
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    loadMetrics();
  }, [token, period]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/admin/metrics?period=${period}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error("Erro ao carregar métricas:", err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color }) => (
    <div className={styles.statCard} style={{ borderLeftColor: color }}>
      <div className={styles.statIcon} style={{ backgroundColor: `${color}20` }}>
        {icon}
      </div>
      <div className={styles.statContent}>
        <p className={styles.statTitle}>{title}</p>
        <p className={styles.statValue}>{value}</p>
        {subtitle && <p className={styles.statSubtitle}>{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.badge}>Análise de Dados</p>
            <h1 className={styles.title}>Dashboard de Métricas</h1>
            <p className={styles.subtitle}>
              Acompanhe o desempenho da clínica em tempo real.
            </p>
          </div>
          <div className={styles.actions}>
            <select
              className={styles.periodSelect}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="week">Última semana</option>
              <option value="month">Último mês</option>
              <option value="quarter">Último trimestre</option>
              <option value="year">Último ano</option>
            </select>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => onNavigate("painel-medico")}
            >
              Voltar ao painel
            </button>
          </div>
        </header>

        {loading && <div className={styles.loading}>Carregando métricas...</div>}

        {!loading && (
          <>
            {/* Stat Cards */}
            <div className={styles.statsGrid}>
              <StatCard
                title="Total de Consultas"
                value={metrics.totalAppointments || 0}
                subtitle="no período"
                icon="📅"
                color="#3b5bfd"
              />
              <StatCard
                title="Pacientes Atendidos"
                value={metrics.totalPatients || 0}
                subtitle="únicos"
                icon="👥"
                color="#10b981"
              />
              <StatCard
                title="Consultas Realizadas"
                value={metrics.completedAppointments || 0}
                subtitle={`${metrics.totalAppointments > 0 ? ((metrics.completedAppointments / metrics.totalAppointments) * 100).toFixed(1) : 0}% do total`}
                icon="✅"
                color="#8b5cf6"
              />
              <StatCard
                title="Taxa de Cancelamento"
                value={`${metrics.totalAppointments > 0 ? ((metrics.cancelledAppointments / metrics.totalAppointments) * 100).toFixed(1) : 0}%`}
                subtitle={`${metrics.cancelledAppointments || 0} canceladas`}
                icon="❌"
                color="#ef4444"
              />
              <StatCard
                title="Avaliação Média"
                value={typeof metrics.averageRating === 'number' && !isNaN(metrics.averageRating) ? metrics.averageRating.toFixed(1) : "N/A"}
                subtitle="de 5 estrelas"
                icon="⭐"
                color="#f59e0b"
              />
              <StatCard
                title="Taxa de Comparecimento"
                value={`${metrics.totalAppointments > 0 ? (100 - ((metrics.cancelledAppointments / metrics.totalAppointments) * 100)).toFixed(1) : 100}%`}
                subtitle="presença confirmada"
                icon="🎯"
                color="#ec4899"
              />
            </div>

            {/* Charts */}
            <div className={styles.chartsGrid}>
              {/* Appointments Over Time */}
              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>Consultas por Período</h3>
                <div className={styles.chartContainer}>
                  {Array.isArray(metrics.appointmentsByMonth) && metrics.appointmentsByMonth.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={metrics.appointmentsByMonth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--bg-card, white)",
                            border: "1px solid var(--border-color, #e2e8f0)",
                            borderRadius: "8px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#3b5bfd"
                          strokeWidth={3}
                          dot={{ fill: "#3b5bfd", strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className={styles.noData}>Sem dados para o período</div>
                  )}
                </div>
              </div>

              {/* Appointments by Type */}
              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>Por Tipo de Consulta</h3>
                <div className={styles.chartContainer}>
                  {Array.isArray(metrics.appointmentsByType) && metrics.appointmentsByType.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={metrics.appointmentsByType}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) =>
                            `${name} (${(percent * 100).toFixed(0)}%)`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {metrics.appointmentsByType.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className={styles.noData}>Sem dados para o período</div>
                  )}
                </div>
              </div>

              {/* Appointments by Hour */}
              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>Horários Mais Procurados</h3>
                <div className={styles.chartContainer}>
                  {Array.isArray(metrics.appointmentsByHour) && metrics.appointmentsByHour.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={metrics.appointmentsByHour}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="hour" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--bg-card, white)",
                            border: "1px solid var(--border-color, #e2e8f0)",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="count" fill="#3b5bfd" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className={styles.noData}>Sem dados para o período</div>
                  )}
                </div>
              </div>

              {/* Status Distribution */}
              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>Status das Consultas</h3>
                <div className={styles.chartContainer}>
                  {Array.isArray(metrics.appointmentsByStatus) && metrics.appointmentsByStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={metrics.appointmentsByStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {metrics.appointmentsByStatus.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className={styles.noData}>Sem dados para o período</div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Patients */}
            <div className={styles.tableCard}>
              <h3 className={styles.chartTitle}>Pacientes Mais Frequentes</h3>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Paciente</th>
                    <th>E-mail</th>
                    <th>Consultas</th>
                    <th>Última Visita</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topPatients?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={styles.empty}>
                        Nenhum dado disponível
                      </td>
                    </tr>
                  ) : (
                    metrics.topPatients?.map((patient, index) => (
                      <tr key={patient.id}>
                        <td>{index + 1}</td>
                        <td>{patient.name}</td>
                        <td>{patient.email}</td>
                        <td>{patient.appointmentCount}</td>
                        <td>
                          {patient.lastVisit
                            ? new Date(patient.lastVisit).toLocaleDateString("pt-BR")
                            : "N/A"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


