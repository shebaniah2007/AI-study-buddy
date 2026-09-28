import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000";

function App() {
  const [token, setToken] = useState(localStorage.getItem("learnmate_token") || "");
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [materials, setMaterials] = useState([]);
  const [resources, setResources] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [plan, setPlan] = useState({ topics: "", examDate: "", hoursPerDay: 2 });
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request sariyaa pogala");
    return data;
  }

  async function loadData() {
    try {
      const [materialData, resourceData] = await Promise.all([
        request("/api/materials"),
        request("/api/ai/resources"),
      ]);
      setMaterials(materialData.materials || []);
      setResources(resourceData.resources || []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  async function handleAuth(event) {
    event.preventDefault();
    setMessage("");

    try {
      const path = isRegister ? "/api/auth/register" : "/api/auth/login";
      const data = await request(path, {
        method: "POST",
        body: JSON.stringify(form),
      });
      localStorage.setItem("learnmate_token", data.token);
      setToken(data.token);
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function addMaterial(event) {
    event.preventDefault();
    try {
      await request("/api/materials", {
        method: "POST",
        body: JSON.stringify({ title, content }),
      });
      setTitle("");
      setContent("");
      setMessage("Study material save aayiduchu");
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function makeResource(materialId, type) {
    try {
      const data = await request(`/api/ai/${materialId}/${type}`, { method: "POST" });
      setResult(data.summary || data.flashcards || data.quiz || "");
      setMessage(data.message);
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function makePlan(event) {
    event.preventDefault();
    try {
      const data = await request("/api/ai/study-plan", {
        method: "POST",
        body: JSON.stringify(plan),
      });
      setResult(data.studyPlan);
      setMessage(data.message);
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function logout() {
    localStorage.removeItem("learnmate_token");
    setToken("");
    setMaterials([]);
    setResources([]);
    setResult("");
  }

  if (!token) {
    return (
      <main className="auth-page">
        <form className="card auth-card" onSubmit={handleAuth}>
          <h1>LearnMate</h1>
          <p>Your AI study buddy</p>
          {isRegister && (
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button type="submit">{isRegister ? "Create account" : "Login"}</button>
          <button type="button" className="text-button" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Already registered? Login" : "New here? Create account"}
          </button>
          {message && <p>{message}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="app-page">
      <header>
        <div>
          <h1>LearnMate</h1>
          <p>Study smarter, one step at a time.</p>
        </div>
        <button onClick={logout}>Logout</button>
      </header>

      {message && <p className="message">{message}</p>}

      <section className="grid">
        <form className="card" onSubmit={addMaterial}>
          <h2>Add study material</h2>
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea
            placeholder="Paste your study notes here"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          <button type="submit">Save notes</button>
        </form>

        <form className="card" onSubmit={makePlan}>
          <h2>Make a study plan</h2>
          <input
            placeholder="Topics"
            value={plan.topics}
            onChange={(e) => setPlan({ ...plan, topics: e.target.value })}
            required
          />
          <label>Exam date</label>
          <input
            type="date"
            value={plan.examDate}
            onChange={(e) => setPlan({ ...plan, examDate: e.target.value })}
            required
          />
          <label>Study hours per day</label>
          <input
            type="number"
            min="1"
            value={plan.hoursPerDay}
            onChange={(e) => setPlan({ ...plan, hoursPerDay: e.target.value })}
            required
          />
          <button type="submit">Create plan</button>
        </form>
      </section>

      <section className="card">
        <h2>My study materials</h2>
        {materials.map((item) => (
          <article className="material" key={item._id}>
            <h3>{item.title}</h3>
            <p>{item.content.slice(0, 180)}{item.content.length > 180 ? "..." : ""}</p>
            <div className="actions">
              <button onClick={() => makeResource(item._id, "summarize")}>Summary</button>
              <button onClick={() => makeResource(item._id, "flashcards")}>Flashcards</button>
              <button onClick={() => makeResource(item._id, "quiz")}>Quiz</button>
            </div>
          </article>
        ))}
      </section>

      {result && <section className="card"><h2>AI result</h2><pre>{result}</pre></section>}

      <section className="card">
        <h2>Saved AI resources</h2>
        {resources.map((item) => (
          <article className="material" key={item._id}>
            <strong>{item.type}</strong>
            <pre>{item.content}</pre>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;