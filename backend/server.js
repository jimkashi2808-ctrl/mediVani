"use strict";

const path = require("path");
const express = require("express");
const cors = require("cors");
const config = require("./config/config");
const translateRoutes = require("./routes/translateRoutes");
const transcribeRoutes = require("./routes/transcribeRoutes");
const { ASR_SUPPORTED } = require("./utils/languages");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json({ limit: "100kb" }));

// API
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
// Tells the frontend which engines are ready (no secrets are ever sent)
app.get("/api/config", (req, res) =>
  res.json({
    asr: {
      enabled: !!config.asrServiceUrl,
      engine: "AI4Bharat IndicConformer",
      languages: ASR_SUPPORTED,
    },
    translation: config.translationProvider,
  }),
);
app.use("/api/translate", translateRoutes);
app.use("/api/transcribe", transcribeRoutes);
app.use("/api", notFound);

// Serve the frontend so you can simply open http://localhost:3000
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`MediVaani is running at http://localhost:${config.port}`);
});
