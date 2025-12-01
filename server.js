import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Fix __dirname untuk ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// ===============================
// Serve Frontend (Vite build)
// ===============================
const distPath = path.join(__dirname, "dist");

app.use(express.static(distPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// SPA fallback untuk React
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ===============================
// HEALTH CHECK
// ===============================
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ===============================
// API Chat (Groq / Anthropic)
// ===============================
app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("API key missing");

    const isGroq = apiKey.startsWith("gsk_");
    const isAnthropic = apiKey.startsWith("sk-ant-");

    let response;

    if (isGroq) {
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: req.body.messages,
        }),
      });
    } else if (isAnthropic) {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(req.body),
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// IMAGE GENERATOR
// ===============================
app.post("/api/image", async (req, res) => {
  try {
    const prompt = encodeURIComponent(req.body.inputs);
    const imgURL = `https://image.pollinations.ai/prompt/${prompt}`;

    const img = await fetch(imgURL);
    const buf = Buffer.from(await img.arrayBuffer());

    res.set("Content-Type", "image/png");
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// RUN SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Server running at port ${PORT}`);
});
