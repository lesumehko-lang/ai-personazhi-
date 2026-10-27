
import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const client = new OpenAI({
  apiKey: process.env.AI_API_KEY
});

app.get("/", (req, res) => {
  res.send("AI Персонажи: сервер работает!");
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();

    if (!message) {
      return res.status(400).json({
        error: "Напиши сообщение."
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        error: "Сообщение слишком длинное."
      });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Ты Алекс, дружелюбный виртуальный персонаж. Общайся на русском языке, естественно, доброжелательно и безопасно."
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    res.json({
      reply: response.choices[0].message.content
    });
  } catch (error) {
    console.error("Ошибка ИИ:", error.message);
    res.status(500).json({
      error: "Не удалось получить ответ от ИИ. Проверь настройки сервера."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
