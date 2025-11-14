import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ===== TEST =====
app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Ilex Bridge",
    timestamp: new Date().toISOString(),
  });
});

// ===== ENDPOINT QUE EL ESP32 LLAMA =====
app.post("/api/reading", (req, res) => {
  console.log("📥 Datos recibidos:", req.body);

  return res.json({
    status: "success",
    message: "Reading stored",
    data: req.body
  });
});

// ===== PORT =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Ilex Bridge escuchando en puerto ${PORT}`);
});
