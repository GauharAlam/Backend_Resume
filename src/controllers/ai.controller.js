const OpenAI = require("openai");
const ApiError = require("../utils/ApiError");
const { HTTP_STATUS } = require("../utils/constants");

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
});

const AI_MODEL = process.env.AI_MODEL || "deepseek-ai/deepseek-v3.1-terminus";

/**
 * Helper to parse JSON from AI response
 */
const parseJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch =
      text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (innerE) {
        console.error("Failed to parse matched JSON block:", innerE);
      }
    }
    throw new Error("Could not parse JSON from AI response");
  }
};

/**
 * Improve text for a resume section
 */
exports.improveText = async (req, res, next) => {
  try {
    const { text, section, jobTitle } = req.body;

    if (!text) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Text is required",
      });
    }

    const prompt = `As an expert resume writer, rewrite the following text for a resume's "${section}" section, targeting a "${jobTitle}" position.

**Original Text:**
"${text}"

**Instructions:**
1. Provide the single best professionally rewritten version.
2. Use strong action verbs and focus on achievements.
3. Your response MUST be PLAIN TEXT.
4. DO NOT use any HTML tags like <ul>, <li>, <p>, or <html>.
5. If you provide multiple points, start each line with a bullet point character (•).
6. DO NOT include "Option 1" or any introductory text. Just return the content.`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert career coach and resume writer.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 8192,
      chat_template_kwargs: { thinking: true },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: completion.choices[0]?.message?.content?.trim() || text,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Suggest skills based on job title and experience
 */
exports.suggestSkills = async (req, res, next) => {
  try {
    const { jobTitle, experience } = req.body;

    const prompt = `Based on the job title "${jobTitle}" and the experience described below, suggest a comma-separated list of 10-15 relevant hard and soft skills for this resume. Only return the list, no other text.\n\nExperience:\n${experience}`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that suggests relevant skills for resumes.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 8192,
      chat_template_kwargs: { thinking: true },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: completion.choices[0]?.message?.content?.trim() || "",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Analyze resume for score and feedback
 */
exports.analyzeResume = async (req, res, next) => {
  try {
    const { resumeData } = req.body;

    const prompt = `Analyze the following resume for a "${resumeData.personalDetails.jobTitle}" position. Provide a score out of 100 and a list of 3-5 specific, actionable feedback points for improvement.

        RETURN THE RESPONSE IN VALID JSON FORMAT with the following structure:
        {
          "score": number,
          "feedback": string[]
        }

        Resume Content:
        ${JSON.stringify(resumeData)}`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a professional resume reviewer. Always return valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 8192,
      response_format: { type: "json_object" },
      chat_template_kwargs: { thinking: true },
    });

    const content = completion.choices[0]?.message?.content || "";
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: parseJSON(content),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ATS Analysis against a job description
 */
exports.analyzeATS = async (req, res, next) => {
  try {
    const { resumeData, jobDescription } = req.body;

    const prompt = `You are an expert ATS resume analyzer. Compare the provided resume against the job description.
        1. Calculate a match score from 0-100.
        2. Identify top 5-10 missing keywords.
        3. Provide 3-5 specific suggestions.

        RETURN THE RESPONSE IN VALID JSON FORMAT with the following structure:
        {
          "matchScore": number,
          "missingKeywords": string[],
          "suggestions": string[]
        }

        **Resume:**
        ${JSON.stringify(resumeData)}

        **Job Description:**
        ${jobDescription}`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an ATS optimization expert. Always return valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 8192,
      response_format: { type: "json_object" },
      chat_template_kwargs: { thinking: true },
    });

    const content = completion.choices[0]?.message?.content || "";
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: parseJSON(content),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a cover letter
 */
exports.generateCoverLetter = async (req, res, next) => {
  try {
    const { resumeData, jobDescription } = req.body;

    const prompt = `Write a professional and compelling cover letter based on the following resume and job description.

        **Resume Data:**
        ${JSON.stringify(resumeData)}

        **Job Description:**
        ${jobDescription}

        **Instructions:**
        1. Return the cover letter as PLAIN TEXT only.
        2. Use clear spacing and newlines between paragraphs.
        3. DO NOT use any HTML tags or markdown.`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert career coach specializing in cover letters.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 8192,
      chat_template_kwargs: { thinking: true },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: completion.choices[0]?.message?.content?.trim() || "",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * JD Match — compare resume against a job description, return structured analysis
 */
exports.analyzeJDMatch = async (req, res, next) => {
  try {
    const { resumeData, jobDescription } = req.body;

    if (!jobDescription || !jobDescription.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Job description is required" });
    }

    if (!resumeData) {
      return res
        .status(400)
        .json({ success: false, message: "Resume data is required" });
    }

    // Format resume as readable text for the AI (not raw JSON)
    const stripHtml = (html) => {
      if (!html) return "";
      return html
        .replace(/<\/li>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]*>?/gm, "")
        .replace(/\n\s*\n/g, "\n")
        .replace(/&nbsp;/g, " ")
        .trim();
    };

    const pd = resumeData.personalDetails || {};
    const lines = [];

    lines.push(`CANDIDATE: ${pd.fullName || "Unknown"}`);
    if (pd.jobTitle) lines.push(`TARGET ROLE: ${pd.jobTitle}`);
    if (pd.email || pd.phone || pd.location) {
      lines.push(
        `CONTACT: ${[pd.email, pd.phone, pd.location].filter(Boolean).join(" | ")}`,
      );
    }

    if (resumeData.summary) {
      lines.push("\nSUMMARY:");
      lines.push(stripHtml(resumeData.summary));
    }

    if (resumeData.experience?.length > 0) {
      lines.push("\nWORK EXPERIENCE:");
      resumeData.experience.forEach((exp) => {
        lines.push(
          `${exp.jobTitle || ""} at ${exp.company || ""} (${exp.startDate || ""} – ${exp.endDate || "Present"})`,
        );
        const bullets = stripHtml(exp.description)
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        bullets.forEach((b) => lines.push(`  • ${b}`));
      });
    }

    if (resumeData.projects?.length > 0) {
      lines.push("\nPROJECTS:");
      resumeData.projects.forEach((proj) => {
        lines.push(`${proj.name || "Project"}: ${stripHtml(proj.description)}`);
        if (proj.url) lines.push(`  URL: ${proj.url}`);
      });
    }

    if (resumeData.education?.length > 0) {
      lines.push("\nEDUCATION:");
      resumeData.education.forEach((edu) => {
        lines.push(
          `${edu.degree || ""} from ${edu.institution || ""} (${edu.startDate || ""} – ${edu.endDate || ""})`,
        );
      });
    }

    if (resumeData.skills) {
      lines.push("\nSKILLS:");
      lines.push(stripHtml(resumeData.skills));
    }

    if (resumeData.accomplishments?.length > 0) {
      lines.push("\nACCOMPLISHMENTS:");
      resumeData.accomplishments.forEach((a) => {
        lines.push(`  • ${stripHtml(a.description)}`);
      });
    }

    const resumeText = lines.join("\n");

    const prompt = `You are an expert technical recruiter and resume coach. Carefully analyze the candidate's resume against the job description below.

Your task:
1. Calculate a match score from 0–100 based on skills, experience, and keyword alignment.
2. Write a one-line verdict (e.g. "Strong match — well-aligned skills and experience", "Decent match, a few gaps to close", "Significant gaps — key requirements are missing").
3. List 3–8 specific missing skills or keywords from the job description that are absent from the resume. Be precise — only list genuinely absent items.
4. Write 3–5 short, actionable improvement suggestions. Where possible, reference a specific resume section or project by name (e.g. "Add a CI/CD pipeline detail to your E-commerce Platform project bullet").

RULES:
- Base suggestions ONLY on the actual resume content provided. Do NOT invent experience the candidate doesn't have.
- Keep suggestions constructive and specific, not generic.
- Return STRICT JSON ONLY — no markdown, no explanation outside the JSON.

REQUIRED JSON STRUCTURE:
{
  "matchScore": <number 0-100>,
  "verdict": "<one-line verdict string>",
  "missingSkills": ["<skill1>", "<skill2>", "..."],
  "suggestions": ["<suggestion1>", "<suggestion2>", "..."]
}

--- RESUME ---
${resumeText}

--- JOB DESCRIPTION ---
${jobDescription}`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert recruiter and resume coach. Always return strict valid JSON with no markdown fences.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 8192,
      response_format: { type: "json_object" },
      chat_template_kwargs: { thinking: true },
    });

    const content = completion.choices[0]?.message?.content || "";
    const parsed = parseJSON(content);

    // Defensive validation of required fields
    if (
      typeof parsed.matchScore !== "number" ||
      !parsed.verdict ||
      !Array.isArray(parsed.missingSkills) ||
      !Array.isArray(parsed.suggestions)
    ) {
      throw new Error("AI returned an unexpected response format");
    }

    res.status(200).json({ success: true, data: parsed });
  } catch (error) {
    next(error);
  }
};

/**
 * Chatbot response
 */
exports.getChatbotResponse = async (req, res, next) => {
  try {
    const { message, resumeContext, systemInstruction } = req.body;
    console.log(`🤖 Chatbot request started: "${message.substring(0, 50)}..."`);

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        {
          role: "user",
          content: `${resumeContext}\n\nUser's question: "${message}"`,
        },
      ],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 8192,
      chat_template_kwargs: { thinking: true },
    });

    console.log(`✅ Chatbot request completed successfully`);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: completion.choices[0]?.message?.content?.trim() || "",
    });
  } catch (error) {
    console.error(`❌ Chatbot request failed:`, error);
    next(error);
  }
};

/**
 * Generate a full resume from a job title
 */
exports.generateFullResume = async (req, res, next) => {
  try {
    const { jobTitle, experienceLevel } = req.body;

    if (!jobTitle) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ success: false, message: "Job title is required" });
    }

    const level = experienceLevel || "mid-level";

    const prompt = `Generate a complete, professional resume for a "${jobTitle}" position at the "${level}" experience level.

RETURN STRICT VALID JSON with this exact structure:
{
  "personalDetails": {
    "fullName": "John Doe",
    "jobTitle": "${jobTitle}",
    "email": "john.doe@email.com",
    "phone": "+1 555 123 4567",
    "location": "San Francisco, CA"
  },
  "summary": "A compelling 2-3 sentence professional summary...",
  "experience": [
    {
      "jobTitle": "...",
      "company": "...",
      "startDate": "Jan 2022",
      "endDate": "Present",
      "description": "• Achievement-focused bullet 1\\n• Achievement-focused bullet 2\\n• Achievement-focused bullet 3"
    }
  ],
  "education": [
    {
      "degree": "...",
      "institution": "...",
      "startDate": "2014",
      "endDate": "2018"
    }
  ],
  "skills": "Comma-separated list of 12-18 relevant skills",
  "projects": [
    {
      "name": "...",
      "url": "",
      "description": "• What you built\\n• Technologies used\\n• Impact/results"
    }
  ],
  "accomplishments": [
    {
      "description": "Notable achievement or award..."
    }
  ]
}

RULES:
- Generate 2-3 realistic experience entries with strong action verbs and quantified results.
- Generate 1-2 relevant projects.
- Generate 1-2 accomplishments.
- Make the content realistic but impressive.
- Use metrics and numbers where possible (e.g., "Improved performance by 40%").
- Skills should be a single comma-separated string.
- All descriptions should use bullet points starting with •.
- Return ONLY valid JSON, no markdown fences.`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume writer who creates impressive, ATS-optimized resumes. Always return strict valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      top_p: 0.7,
      max_tokens: 8192,
      response_format: { type: "json_object" },
      chat_template_kwargs: { thinking: true },
    });

    const content = completion.choices[0]?.message?.content || "";
    const parsed = parseJSON(content);

    res.status(HTTP_STATUS.OK).json({ success: true, data: parsed });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate bullet points for a section
 */
exports.generateBullets = async (req, res, next) => {
  try {
    const { jobTitle, company, section, context } = req.body;

    if (!jobTitle && !section) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({
          success: false,
          message: "Job title or section context is required",
        });
    }

    const sectionType = section || "experience";
    const contextInfo = company
      ? `for the role of "${jobTitle}" at "${company}"`
      : context
        ? `for a project: "${context}"`
        : `for a "${jobTitle}" position`;

    const prompt = `Generate 4-5 strong, achievement-focused bullet points ${contextInfo} for a resume's ${sectionType} section.

RULES:
1. Start each bullet with a strong action verb (e.g., Spearheaded, Engineered, Orchestrated, Optimized).
2. Include quantified results where possible (%, $, numbers).
3. Focus on impact and achievements, not just responsibilities.
4. Each bullet should be 1-2 lines.
5. Return ONLY the bullet points as plain text, each starting with "•".
6. DO NOT use any HTML tags or markdown formatting.
7. Separate each bullet point with a newline.`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume writer. Generate concise, impactful bullet points with metrics.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      top_p: 0.7,
      max_tokens: 4096,
      chat_template_kwargs: { thinking: true },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: completion.choices[0]?.message?.content?.trim() || "",
    });
  } catch (error) {
    next(error);
  }
};

