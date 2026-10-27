
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://lesumehko-lang.github.io"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
  res.send("AI Персонажи: сервер работает!");
});

// Чат с Алексом
app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();

    if (!message || message.length > 4000) {
      return res.status(400).json({
        error: "Напиши сообщение до 4000 символов."
      });
    }

    if (!API_KEY) {
      return res.status(500).json({
        error: "Не настроен ключ Gemini в Render."
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: "Ты Алекс, дружелюбный виртуальный персонаж. Отвечай по-русски."
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
      console.error("Gemini chat error:", data.error?.message);
      return res.status(502).json({
        error: "Ошибка Gemini. Попробуй позже."
      });
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("") || "Попробуй написать ещё раз.";

    return res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error.message);
    return res.status(500).json({
      error: "Ошибка сервера."
    });
  }
});

// Генератор фурри-картинок
app.post("/api/image", async (req, res) => {
  try {
    const description = String(
      req.body?.description || ""
    ).trim();

    if (!description || description.length > 800) {
      return res.status(400).json({
        error: "Опиши персонажа (до 800 символов)."
      });
    }

    if (!API_KEY) {
      return res.status(500).json({
        error: "Не настроен ключ Gemini в Render."
      });
    }

    const prompt = [
      "Create one high-quality original furry character illustration.",
      "Anthropomorphic animal character, fully clothed, non-sexual,",
      "friendly fantasy art, expressive face, detailed fur,",
      "beautiful colors, polished digital illustration.",
      "Follow this character description:",
      description
    ].join(" ");

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseModalities: ["IMAGE"]
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Gemini image error:",
        data.error?.message || response.status
      );

      return res.status(502).json({
        error: "Не удалось создать картинку. Проверь Logs в Render."
      });
    }

    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(
      part => part.inlineData?.data || part.inline_data?.data
    );

    if (!imagePart) {
      console.error(
        "No image returned:",
        JSON.stringify(data).slice(0, 1000)
      );

      return res.status(502).json({
        error: "Модель не вернула изображение. Попробуй ещё раз."
      });
    }

    const imageData =
      imagePart.inlineData || imagePart.inline_data;

    return res.json({
      image: imageData.data,
      mimeType: imageData.mimeType || imageData.mime_type || "image/png"
    });
  } catch (error) {
    console.error("Image error:", error.message);

    return res.status(500).json({
      error: "Ошибка генератора."
    });
  }
});

app.listen(PORT, () => {
  console.log(`AI Персонажи запущен на порту ${PORT}`);
});
      
