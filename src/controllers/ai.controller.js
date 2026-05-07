const OpenAI = require('openai');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS } = require('../utils/constants');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
});

const AI_MODEL = process.env.AI_MODEL || 'deepseek-ai/deepseek-v3.1-terminus';

/**
 * Helper to parse JSON from AI response
 */
const parseJSON = (text) => {
    try {
        return JSON.parse(text);
    } catch (e) {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
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
                message: 'Text is required'
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
                { role: "system", content: "You are an expert career coach and resume writer." },
                { role: "user", content: prompt }
            ],
            temperature: 0.2,
            top_p: 0.7,
            max_tokens: 8192,
            chat_template_kwargs: { thinking: true }
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: completion.choices[0]?.message?.content?.trim() || text
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
                { role: "system", content: "You are an AI assistant that suggests relevant skills for resumes." },
                { role: "user", content: prompt }
            ],
            temperature: 0.2,
            top_p: 0.7,
            max_tokens: 8192,
            chat_template_kwargs: { thinking: true }
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: completion.choices[0]?.message?.content?.trim() || ''
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
                { role: "system", content: "You are a professional resume reviewer. Always return valid JSON." },
                { role: "user", content: prompt }
            ],
            temperature: 0.2,
            top_p: 0.7,
            max_tokens: 8192,
            response_format: { type: "json_object" },
            chat_template_kwargs: { thinking: true }
        });

        const content = completion.choices[0]?.message?.content || "";
        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: parseJSON(content)
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
                { role: "system", content: "You are an ATS optimization expert. Always return valid JSON." },
                { role: "user", content: prompt }
            ],
            temperature: 0.2,
            top_p: 0.7,
            max_tokens: 8192,
            response_format: { type: "json_object" },
            chat_template_kwargs: { thinking: true }
        });

        const content = completion.choices[0]?.message?.content || "";
        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: parseJSON(content)
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
                { role: "system", content: "You are an expert career coach specializing in cover letters." },
                { role: "user", content: prompt }
            ],
            temperature: 0.2,
            top_p: 0.7,
            max_tokens: 8192,
            chat_template_kwargs: { thinking: true }
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: completion.choices[0]?.message?.content?.trim() || ''
        });
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
                { role: "user", content: `${resumeContext}\n\nUser's question: "${message}"` }
            ],
            temperature: 0.2,
            top_p: 0.7,
            max_tokens: 8192,
            chat_template_kwargs: { thinking: true }
        });

        console.log(`✅ Chatbot request completed successfully`);
        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: completion.choices[0]?.message?.content?.trim() || ''
        });
    } catch (error) {
        console.error(`❌ Chatbot request failed:`, error);
        next(error);
    }
};
