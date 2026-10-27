
import express from "express";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

app.get("/", (req, res) => {
  res.send("AI Персонажи: сервер работает!");
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();

    if (!message) {
      return res.status(400).json({ error: "Напиши сообщение." });
    }

    if (message.length > 4000) {
      return res.status(400).json({ error: "Сообщение слишком длинное." });
    }

    if (!API_KEY) {
      return res.status(500).json({
        error: "Добавь GEMINI_API_KEY в настройках Render."
      });
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
              text: "Ты Алекс, дружелюбный виртуальный персонаж. Общайся естественно на русском языке."
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
        error: "Gemini не смог ответить. Проверь ключ и доступность модели."
      });
    }

    const reply =
      data.candidates?.[0]?.content?.parts
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
