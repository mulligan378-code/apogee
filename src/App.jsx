import { useState, useEffect } from "react"
import { supabase } from "./supabase"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

function Auth({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignup, setIsSignup] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    setMessage("")
    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage("Check your email to confirm your account.")
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
    }
    setLoading(false)
  }

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div style={styles.logo}><span style={styles.logoA}>A</span>POGEE</div>
        <div style={styles.tagline}>TRAIN AT YOUR PEAK</div>
      </div>
      <div style={styles.authContainer}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>{isSignup ? "CREATE ACCOUNT" : "SIGN IN"}</span>
          </div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            style={{ ...styles.input, width: "100%", boxSizing: "border-box", marginBottom: 12 }}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            style={{ ...styles.input, width: "100%", boxSizing: "border-box", marginBottom: 16 }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          {message && <p style={styles.message}>{message}</p>}
          <button
            onClick={handleSubmit}
            style={loading ? styles.saveButtonDisabled : styles.saveButton}
            disabled={loading}
          >
            {loading ? "LOADING..." : isSignup ? "CREATE ACCOUNT" : "SIGN IN"}
          </button>
          <p
            onClick={() => { setIsSignup(!isSignup); setMessage("") }}
            style={styles.switchText}
          >
            {isSignup ? "Already have an account? Sign in" : "No account? Create one"}
          </p>
        </div>
      </div>
    </div>
  )
}

function Tracker({ user }) {
  const [exercises, setExercises] = useState([])
  const [sessions, setSessions] = useState([])
  const [name, setName] = useState("")
  const [sets, setSets] = useState("")
  const [reps, setReps] = useState("")
  const [weight, setWeight] = useState("")
  const [date, setDate] = useState("")

  useEffect(() => {
    async function loadSessions() {
      const { data, error } = await supabase
        .from("sessions")
        .select("date, exercises, totalVolume")
        .order("date", { ascending: true })
      if (error) { console.error(error); return }
      if (data) setSessions(data)
    }
    loadSessions()
  }, [])

  function addExercise() {
    if (name === "") return
    const newExercise = {
      name,
      sets: Number(sets),
      reps: Number(reps),
      weight: Number(weight),
      volume: Number(sets) * Number(reps) * Number(weight)
    }
    setExercises([...exercises, newExercise])
    setName(""); setSets(""); setReps(""); setWeight("")
  }

  async function saveSession() {
    if (exercises.length === 0 || date === "") return
    const row = {
      date,
      exercises,
      totalVolume: exercises.reduce((total, ex) => total + ex.volume, 0),
      user_id: user.id
    }
    const { data, error } = await supabase
      .from("sessions").insert(row).select().single()
    if (error) { console.error(error); return }
    setSessions((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)))
    setExercises([])
    setDate("")
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const chartData = sessions.map((s) => ({ date: s.date, volume: s.totalVolume }))
  const totalVolume = exercises.reduce((t, ex) => t + ex.volume, 0)

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div style={styles.logo}><span style={styles.logoA}>A</span>POGEE</div>
        <div style={styles.headerRight}>
          <span style={styles.userEmail}>{user.email}</span>
          <button onClick={signOut} style={styles.signOutButton}>SIGN OUT</button>
        </div>
      </div>

      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>VOLUME PROGRESSION</span>
            {sessions.length > 0 && (
              <span style={styles.badge}>{sessions.length} SESSIONS</span>
            )}
          </div>
          {sessions.length < 2 ? (
            <div style={styles.emptyGraph}>
              <div style={styles.emptyIcon}>📈</div>
              <p style={styles.emptyText}>Log 2 sessions to see your progression graph</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a1e" />
                <XAxis dataKey="date" stroke="#4a5a4a" tick={{ fill: "#8a9a8a", fontSize: 11 }} />
                <YAxis stroke="#4a5a4a" tick={{ fill: "#8a9a8a", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#0d1a0d", border: "1px solid #00ff88", borderRadius: 8 }}
                  labelStyle={{ color: "#00ff88" }}
                  itemStyle={{ color: "#ffffff" }}
                />
                <Line type="monotone" dataKey="volume" stroke="#00ff88" strokeWidth={3}
                  dot={{ fill: "#00ff88", r: 5 }} activeDot={{ r: 8, fill: "#00ff88" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>LOG SESSION</span>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={styles.dateInput}
          />
          <div style={styles.inputRow}>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Exercise" style={{ ...styles.input, flex: 2 }}
              onKeyDown={(e) => e.key === "Enter" && addExercise()} />
            <input value={sets} onChange={(e) => setSets(e.target.value)}
              placeholder="Sets" type="number" style={styles.input} />
            <input value={reps} onChange={(e) => setReps(e.target.value)}
              placeholder="Reps" type="number" style={styles.input} />
            <input value={weight} onChange={(e) => setWeight(e.target.value)}
              placeholder="lbs" type="number" style={styles.input} />
            <button onClick={addExercise} style={styles.addButton}>+</button>
          </div>

          {exercises.length > 0 && (
            <div style={styles.exerciseList}>
              {exercises.map((ex, i) => (
                <div key={i} style={styles.exerciseRow}>
                  <span style={styles.exerciseName}>{ex.name}</span>
                  <span style={styles.exerciseDetail}>{ex.sets}x{ex.reps}</span>
                  <span style={styles.exerciseDetail}>{ex.weight}lbs</span>
                  <span style={styles.exerciseVolume}>{ex.volume.toLocaleString()}lbs vol</span>
                </div>
              ))}
              <div style={styles.volumeBar}>
                <span style={styles.volumeLabel}>SESSION VOLUME</span>
                <span style={styles.volumeNumber}>{totalVolume.toLocaleString()} lbs</span>
              </div>
            </div>
          )}

          <button
            onClick={saveSession}
            style={exercises.length === 0 || date === "" ? styles.saveButtonDisabled : styles.saveButton}
          >
            SAVE SESSION
          </button>
        </div>

        {sessions.length > 0 && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>SESSION HISTORY</span>
            </div>
            <div style={styles.historyList}>
              {[...sessions].reverse().map((session, i) => (
                <div key={i} style={styles.historyRow}>
                  <div style={styles.historyLeft}>
                    <span style={styles.historyDate}>{session.date}</span>
                    <span style={styles.historyExCount}>{session.exercises.length} exercises</span>
                  </div>
                  <div style={styles.historyVolume}>
                    {session.totalVolume.toLocaleString()}
                    <span style={styles.historyUnit}> lbs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{ ...styles.root, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#00ff88", letterSpacing: 4, fontSize: 13 }}>LOADING...</div>
    </div>
  )

  return user ? <Tracker user={user} /> : <Auth />
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#060d06",
    fontFamily: "'Trebuchet MS', sans-serif",
    color: "#ffffff",
  },
  header: {
    background: "linear-gradient(135deg, #060d06 0%, #0d1a0d 100%)",
    borderBottom: "2px solid #00ff88",
    padding: "24px 40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: 8,
    color: "#ffffff",
  },
  logoA: {
    color: "#00ff88",
  },
  tagline: {
    fontSize: 11,
    letterSpacing: 4,
    color: "#4a6a4a",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  userEmail: {
    fontSize: 12,
    color: "#4a6a4a",
    letterSpacing: 1,
  },
  signOutButton: {
    background: "transparent",
    border: "1px solid #1a2e1a",
    color: "#4a6a4a",
    borderRadius: 6,
    padding: "6px 14px",
    fontSize: 11,
    letterSpacing: 2,
    cursor: "pointer",
  },
  authContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "80vh",
    padding: 24,
  },
  container: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  card: {
    background: "#0d1a0d",
    border: "1px solid #1a2e1a",
    borderRadius: 16,
    padding: 28,
    width: "100%",
    boxSizing: "border-box",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 4,
    color: "#00ff88",
  },
  badge: {
    background: "#00ff8820",
    border: "1px solid #00ff8840",
    color: "#00ff88",
    fontSize: 10,
    letterSpacing: 2,
    padding: "4px 10px",
    borderRadius: 20,
  },
  emptyGraph: {
    height: 200,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyIcon: { fontSize: 40 },
  emptyText: {
    color: "#4a6a4a",
    fontSize: 13,
    letterSpacing: 1,
  },
  dateInput: {
    background: "#060d06",
    border: "1px solid #1a2e1a",
    borderRadius: 8,
    color: "#ffffff",
    padding: "10px 14px",
    fontSize: 14,
    marginBottom: 16,
    width: "100%",
    boxSizing: "border-box",
    colorScheme: "dark",
  },
  inputRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  input: {
    flex: 1,
    minWidth: 70,
    background: "#060d06",
    border: "1px solid #1a2e1a",
    borderRadius: 8,
    color: "#ffffff",
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
  },
  addButton: {
    background: "#00ff88",
    color: "#060d06",
    border: "none",
    borderRadius: 8,
    width: 42,
    height: 42,
    fontSize: 22,
    fontWeight: 900,
    cursor: "pointer",
    flexShrink: 0,
  },
  exerciseList: {
    marginTop: 20,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  exerciseRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#060d06",
    border: "1px solid #1a2e1a",
    borderRadius: 8,
    padding: "10px 16px",
  },
  exerciseName: {
    flex: 2,
    fontWeight: 600,
    fontSize: 14,
  },
  exerciseDetail: {
    color: "#8a9a8a",
    fontSize: 13,
    minWidth: 50,
    textAlign: "center",
  },
  exerciseVolume: {
    color: "#00ff88",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
    marginLeft: "auto",
  },
  volumeBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #1a2e1a",
    marginTop: 8,
    paddingTop: 12,
  },
  volumeLabel: {
    fontSize: 11,
    letterSpacing: 3,
    color: "#4a6a4a",
  },
  volumeNumber: {
    fontSize: 22,
    fontWeight: 900,
    color: "#00ff88",
    letterSpacing: 2,
  },
  saveButton: {
    marginTop: 20,
    width: "100%",
    background: "#00ff88",
    color: "#060d06",
    border: "none",
    borderRadius: 8,
    padding: "14px",
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 4,
    cursor: "pointer",
  },
  saveButtonDisabled: {
    marginTop: 20,
    width: "100%",
    background: "#1a2e1a",
    color: "#4a6a4a",
    border: "none",
    borderRadius: 8,
    padding: "14px",
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 4,
    cursor: "not-allowed",
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  historyRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#060d06",
    border: "1px solid #1a2e1a",
    borderRadius: 8,
    padding: "12px 16px",
  },
  historyLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: 600,
  },
  historyExCount: {
    fontSize: 11,
    color: "#4a6a4a",
    letterSpacing: 1,
  },
  historyVolume: {
    fontSize: 20,
    fontWeight: 900,
    color: "#00ff88",
  },
  historyUnit: {
    fontSize: 12,
    color: "#4a6a4a",
  },
  message: {
    color: "#00ff88",
    fontSize: 13,
    marginBottom: 12,
    letterSpacing: 1,
  },
  switchText: {
    color: "#4a6a4a",
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
    cursor: "pointer",
    letterSpacing: 1,
  },
}