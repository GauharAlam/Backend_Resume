const express = require("express");
const router = express.Router();
const aiController = require("../src/controllers/ai.controller");
const { verifyToken } = require("../middleware/auth");

// All AI routes require authentication
router.use(verifyToken);

router.post("/improve-text", aiController.improveText);
router.post("/suggest-skills", aiController.suggestSkills);
router.post("/analyze-resume", aiController.analyzeResume);
router.post("/analyze-ats", aiController.analyzeATS);
router.post("/generate-cover-letter", aiController.generateCoverLetter);
router.post("/jd-match", aiController.analyzeJDMatch);
router.post("/chatbot", aiController.getChatbotResponse);
router.post("/generate-full-resume", aiController.generateFullResume);
router.post("/generate-bullets", aiController.generateBullets);

module.exports = router;
