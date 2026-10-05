/**
 * AI Validators - input caps to prevent bill abuse / OOM.
 * All AI routes already require auth (verifyToken); these caps bound prompt size.
 */
const { HTTP_STATUS } = require('../utils/constants');

const MAX = {
  text: 8000,
  section: 100,
  jobTitle: 200,
  experience: 8000,
  jobDescription: 15000,
  resumeJson: 60000,
  message: 4000,
  resumeContext: 20000,
  experienceLevel: 50,
  company: 200,
  context: 2000,
  instruction: 6000,
};

const str = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));

const fail = (res, message) =>
  res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message });

const checkLen = (res, field, value, max) => {
  if (str(value).length > max) {
    fail(res, `${field} exceeds maximum length of ${max} characters`);
    return false;
  }
  return true;
};

const validateImproveText = (req, res, next) => {
  const { text, section, jobTitle, instruction } = req.body || {};
  if (!str(text).trim()) return fail(res, 'Text is required');
  if (!checkLen(res, 'instruction', instruction, MAX.instruction)) return;
  if (!checkLen(res, 'text', text, MAX.text)) return;
  if (!checkLen(res, 'section', section, MAX.section)) return;
  if (!checkLen(res, 'jobTitle', jobTitle, MAX.jobTitle)) return;
  next();
};

const validateSuggestSkills = (req, res, next) => {
  const { jobTitle, experience } = req.body || {};
  if (!str(jobTitle).trim()) return fail(res, 'Job title is required');
  if (!checkLen(res, 'jobTitle', jobTitle, MAX.jobTitle)) return;
  if (!checkLen(res, 'experience', experience, MAX.experience)) return;
  next();
};

const validateResumePayload = (req, res, next) => {
  const { resumeData, jobDescription } = req.body || {};
  if (!resumeData || typeof resumeData !== 'object') return fail(res, 'resumeData object is required');
  let size = 0;
  try {
    size = JSON.stringify(resumeData).length;
  } catch {
    return fail(res, 'resumeData is not serializable');
  }
  if (size > MAX.resumeJson) return fail(res, `resumeData exceeds maximum size of ${MAX.resumeJson} characters`);
  if (jobDescription !== undefined && !checkLen(res, 'jobDescription', jobDescription, MAX.jobDescription)) return;
  next();
};

const validateCoverLetter = (req, res, next) => {
  const { resumeData, jobDescription } = req.body || {};
  if (!resumeData || typeof resumeData !== 'object') return fail(res, 'resumeData object is required');
  if (!str(jobDescription).trim()) return fail(res, 'Job description is required');
  let size = 0;
  try {
    size = JSON.stringify(resumeData).length;
  } catch {
    return fail(res, 'resumeData is not serializable');
  }
  if (size > MAX.resumeJson) return fail(res, `resumeData exceeds maximum size of ${MAX.resumeJson} characters`);
  if (!checkLen(res, 'jobDescription', jobDescription, MAX.jobDescription)) return;
  next();
};

const validateChatbot = (req, res, next) => {
  const { message, resumeContext } = req.body || {};
  if (!str(message).trim()) return fail(res, 'Message is required');
  if (!checkLen(res, 'message', message, MAX.message)) return;
  if (resumeContext !== undefined && !checkLen(res, 'resumeContext', resumeContext, MAX.resumeContext)) return;
  // NOTE: client-supplied systemInstruction is intentionally ignored (server prompt used).
  next();
};

const validateGenerateFullResume = (req, res, next) => {
  const { jobTitle, experienceLevel } = req.body || {};
  if (!str(jobTitle).trim()) return fail(res, 'Job title is required');
  if (!checkLen(res, 'jobTitle', jobTitle, MAX.jobTitle)) return;
  if (!checkLen(res, 'experienceLevel', experienceLevel, MAX.experienceLevel)) return;
  next();
};

const validateGenerateBullets = (req, res, next) => {
  const { jobTitle, company, section, context } = req.body || {};
  if (!str(jobTitle).trim() && !str(section).trim()) return fail(res, 'Job title or section context is required');
  if (!checkLen(res, 'jobTitle', jobTitle, MAX.jobTitle)) return;
  if (!checkLen(res, 'company', company, MAX.company)) return;
  if (!checkLen(res, 'section', section, MAX.section)) return;
  if (!checkLen(res, 'context', context, MAX.context)) return;
  next();
};

module.exports = {
  validateImproveText,
  validateSuggestSkills,
  validateResumePayload,
  validateCoverLetter,
  validateChatbot,
  validateGenerateFullResume,
  validateGenerateBullets,
};
