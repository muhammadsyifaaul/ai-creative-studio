import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Chat API Proxy - Support both Anthropic and Groq
app.post("/api/chat", async (req, res) => {
  console.log("📨 Chat request received");

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error("API key not found in environment variables");
    }

    // Detect which API to use based on key prefix
    const isGroq = apiKey.startsWith("gsk_");
    const isAnthropic = apiKey.startsWith("sk-ant-");

    if (isGroq) {
      // Use Groq API (FREE)
      console.log("Using Groq API...");

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: req.body.messages,
            max_tokens: req.body.max_tokens || 1024,
            temperature: 0.7,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Groq API error:", response.status, errorText);
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Convert Groq response to Anthropic format
      const anthropicFormat = {
        content: [
          {
            type: "text",
            text: data.choices[0].message.content,
          },
        ],
        model: data.model,
        role: "assistant",
      };

      console.log("✅ Chat response received from Groq");
      res.json(anthropicFormat);
    } else if (isAnthropic) {
      // Use Anthropic API
      console.log("Using Anthropic API...");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Anthropic API error:", response.status, errorText);
        throw new Error(
          `Anthropic API error: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("✅ Chat response received from Anthropic");
      res.json(data);
    } else {
      throw new Error(
        "Invalid API key format. Please use Groq (gsk_) or Anthropic (sk-ant-) API key"
      );
    }
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({
      error: {
        message: error.message,
        type: "server_error",
      },
    });
  }
});

app.post("/api/image", async (req, res) => {
  console.log("🎨 Image generation (Pollinations):", req.body.inputs);

  try {
    const prompt = encodeURIComponent(req.body.inputs);
    const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=768&height=768&nologo=true&seed=${Date.now()}`;

    console.log("🔗 Fetching from:", imageUrl);

    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Pollinations error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("✅ Image generated! Size:", buffer.length, "bytes");

    res.set("Content-Type", "image/png");
    res.send(buffer);
  } catch (error) {
    console.error("❌ Pollinations error:", error);
    res.status(500).json({
      error: {
        message: error.message,
        type: "server_error",
      },
    });
  }
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(express.static(path.join(__dirname, "dist")));

// Catch-all untuk route selain API → frontend
app.get(/.*/, (req, res) => {
  // Jangan override route API
  if (req.path.startsWith('/api')) return;

  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Proxy server running on port ${PORT}\n`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    if (apiKey.startsWith("gsk_")) {
      console.log(`   ✓ Groq API Key found (FREE unlimited)`);
    } else if (apiKey.startsWith("sk-ant-")) {
      console.log(`   ✓ Anthropic API Key found`);
    } else {
      console.log(`   ✗ Invalid API key format`);
    }
  } else {
    console.log(`   ✗ Chat API Key missing`);
  }

  console.log(
    `   ${process.env.HUGGINGFACE_API_KEY ? "✓" : "✗"} Hugging Face API Key ${
      process.env.HUGGINGFACE_API_KEY ? "found" : "missing"
    }`
  );
  console.log("");
});
