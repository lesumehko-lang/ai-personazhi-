
import express from "express";

const app = express();
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://lesumehko-lang.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: "10kb" }));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

app.get("/", (req, res) => {
  res.send("AI Персонажи: сервер работает!");
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({ error: "Напиши сообщение." });
    }

    if (message.length > 4000) {
      return res.status(400).json({ error: "Сообщение слишком длинное." });
    }

    if (!API_KEY) {
      return res.status(500).json({ error: "Не настроен ключ Gemini в Render." });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: "Ты Алекс, дружелюбный виртуальный персонаж. Общайся на русском языке, естественно и доброжелательно."
            }]
          },
          contents: [{
            role: "user",
            parts: [{ text: message }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data.error?.message || response.status);
      return res.status(502).json({
        error: "Gemini не ответил. Проверь ключ и доступность модели."
      });
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("") || "Попробуй написать ещё раз.";

    res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(500).json({ error: "Ошибка сервера. Попробуй позже." });
  }
});

app.listen(PORT, () => {
  console.log(`AI Персонажи запущен на порту ${PORT}`);
});
