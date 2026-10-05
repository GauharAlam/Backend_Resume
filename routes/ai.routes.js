const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const aiController = require("../src/controllers/ai.controller");
const { verifyToken } = require("../middleware/auth");
const {
  validateImproveText,
  validateSuggestSkills,
  validateResumePayload,
  validateCoverLetter,
  validateChatbot,
  validateGenerateFullResume,
  validateGenerateBullets,
  validateParseResume,
  validateLinkedInImport,
} = require("../src/validators/ai.validator");

// All AI routes require authentication
router.use(verifyToken);

// Per-user AI limiter (30 req / 10 min). Uses Mongo userId when available,
// falls back to IP. In-memory per instance; global /api limiter still applies.
// For multi-instance/serverless scale, replace with Redis store.
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.userId?.toString?.() || req.user?._id?.toString?.() || ipKeyGenerator(req.ip),
  message: "Too many AI requests, please try again in a few minutes",
});
router.use(aiLimiter);

router.post("/improve-text", validateImproveText, aiController.improveText);
router.post("/suggest-skills", validateSuggestSkills, aiController.suggestSkills);
router.post("/analyze-resume", validateResumePayload, aiController.analyzeResume);
router.post("/analyze-ats", validateResumePayload, aiController.analyzeATS);
router.post("/generate-cover-letter", validateCoverLetter, aiController.generateCoverLetter);
router.post("/jd-match", validateCoverLetter, aiController.analyzeJDMatch);
router.post("/chatbot", validateChatbot, aiController.getChatbotResponse);
router.post("/generate-full-resume", validateGenerateFullResume, aiController.generateFullResume);
router.post("/generate-bullets", validateGenerateBullets, aiController.generateBullets);

router.post("/parse-resume", validateParseResume, aiController.parseResume);
router.post("/import-linkedin", validateLinkedInImport, aiController.importLinkedIn);

module.exports = router;
