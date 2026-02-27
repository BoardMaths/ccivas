"use server";

import OpenAI from "openai";
import { DocumentType } from "@prisma/client";

interface AnalyzedData {
    extractedName?: string;
    extractedDate?: string;
    confidence: number;
    warnings: string[];
    rawText?: string;
    extractedData?: Record<string, any>;
}

export async function analyzeDocument(
    imageUrl: string,
    documentType: DocumentType
): Promise<AnalyzedData> {
    console.log("[analyzeDocument] ==> STARTING ANALYSIS");
    console.log("[analyzeDocument] Image URL:", imageUrl);
    console.log("[analyzeDocument] Document Type:", documentType);

    const reductoKey = process.env.REDUCTO_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // 1. Try Reducto AI Primary
    if (reductoKey) {
        console.log("[analyzeDocument] Attempting Reducto AI extraction...");

        // Define dynamic schema based on document type
        const schema = {
            name: "Full name of the person on the document",
            date: "The most relevant date (DOB for birth cert, effective date for letters, issue date for certificates) in YYYY-MM-DD format",
            nin: "NIN (National Identification Number) if present",
            summary: "Short summary of document contents and key details",
            warnings: "List of any anomalies, mismatches, or concerns (array of strings)",
            // Add dynamic fields
            rank: "Rank, Grade Level, or Step mentioned (e.g., GL 08, Constable, Sgt)",
            salary: "Salary Structure or Scale mentioned (e.g., CONPSS, CONUASS, N-Power)",
            institution: "The institution or authority that issued the document",
            document_id: "Reference number or certificate number if visible"
        };

        try {
            const response = await fetch("https://platform.reducto.ai/extract", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${reductoKey}`
                },
                body: JSON.stringify({
                    input: imageUrl,
                    instructions: {
                        schema: schema,
                        custom_instructions: documentType === "OTHER"
                            ? "This is an unknown document. Intelligently extract ANY information that helps verify the worker's identity, age, employment history, or financial status. Focus on names, dates, amounts, and official titles."
                            : `Focus on extracting details for a ${documentType.replace(/_/g, " ")}. Ensure dates are in YYYY-MM-DD format.`
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log("[analyzeDocument] Reducto SUCCESS. Data:", JSON.stringify(data, null, 2));
                const result = data.result || data;

                const analysisResult = {
                    extractedName: result.name || result.full_name,
                    extractedDate: result.date || result.dob || result.issue_date,
                    confidence: 0.95,
                    warnings: result.warnings || [],
                    rawText: result.summary || JSON.stringify(result).substring(0, 200),
                    extractedData: {
                        nin: result.nin,
                        rank: result.rank,
                        salary: result.salary,
                        institution: result.institution,
                        document_id: result.document_id
                    }
                };
                return analysisResult;
            } else {
                const err = await response.text();
                console.error("[analyzeDocument] Reducto Error Status:", response.status, "Body:", err);
            }
        } catch (error) {
            console.error("[analyzeDocument] Reducto request failed:", error);
        }
    }

    // 2. Fallback to OpenAI Vision
    const warnings: string[] = [];
    if (reductoKey) warnings.push("Reducto AI failed/declined. Using OpenAI fallback.");
    if (!openaiKey) {
        console.error("[analyzeDocument] ❌ OpenAI API key is missing (fallback unavailable)!");
        return {
            confidence: 0,
            warnings: ["Extraction failed. Please verify manually."],
        };
    }

    try {
        const openai = new OpenAI({ apiKey: openaiKey });
        const prompt = getPromptForDocumentType(documentType);

        console.log("[analyzeDocument] Starting OpenAI fallback analysis...");

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: { url: imageUrl }
                        }
                    ]
                }
            ],
            max_tokens: 500,
        });

        const text = response.choices[0]?.message?.content || "";
        console.log("[analyzeDocument] OpenAI response received");

        let parsedResult;
        try {
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
            const jsonText = jsonMatch ? jsonMatch[1] : text;
            parsedResult = JSON.parse(jsonText);
        } catch (parseError) {
            parsedResult = extractInfoFromText(text);
        }

        const finalResult = {
            extractedName: parsedResult.name || parsedResult.fullName,
            extractedDate: parsedResult.date || parsedResult.dob || parsedResult.appointmentDate || parsedResult.issueDate,
            confidence: parsedResult.confidence || 0.8,
            warnings: [...warnings, ...(parsedResult.warnings || [])],
            rawText: parsedResult.summary || text.substring(0, 200),
            extractedData: {
                nin: parsedResult.nin,
                rank: parsedResult.rank,
                salary: parsedResult.salary,
                institution: parsedResult.institution
            }
        };
        return finalResult;
    } catch (error) {
        console.error("[analyzeDocument] OpenAI Analysis failed:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            confidence: 0,
            warnings: [`AI analysis failed: ${errorMessage}. Please verify manually.`],
        };
    }
}

function extractInfoFromText(text: string): any {
    const nameMatch = text.match(/name[:\s]+([^\n]+)/i);
    const dateMatch = text.match(/date[:\s]+([^\n]+)/i);
    const ninMatch = text.match(/nin[:\s]+([0-9]+)/i);

    return {
        name: nameMatch ? nameMatch[1].trim() : undefined,
        date: dateMatch ? dateMatch[1].trim() : undefined,
        nin: ninMatch ? ninMatch[1].trim() : undefined,
        confidence: 0.7,
        warnings: [],
        summary: text.substring(0, 200),
    };
}

function getPromptForDocumentType(type: DocumentType): string {
    const baseInstruction = `Analyze this document image and extract information. Return your response as a JSON object with the following structure:
{
  "name": "Full name of the person",
  "date": "Most relevant date in YYYY-MM-DD format (DOB, Appointment Date, Issue Date, etc.)",
  "nin": "NIN number if present",
  "rank": "Rank or Grade Level if present",
  "salary": "Salary Scale or Amount if present",
  "institution": "Issuing authority",
  "confidence": 0.85,
  "warnings": ["Any warnings about legibility or issues"],
  "summary": "Brief summary of why this document is relevant to employee auditing"
}

`;

    switch (type) {
        case "BIRTH_CERTIFICATE_AGE_DECLARATION":
            return baseInstruction + `This is a Birth Certificate or Age Declaration. Focus on Name and Date of Birth.`;
        case "NOTIFICATION_OF_APPOINTMENT":
        case "CONVERSION_TO_PERMANENT_APPOINTMENT":
        case "CONFIRMATION_OF_APPOINTMENT":
            return baseInstruction + `This is an Appointment related document. Focus on Name, Effective Date of Appointment, Rank/Grade, and Salary Scale.`;
        case "NOTIFICATION_OF_PROMOTION":
            return baseInstruction + `This is a Promotion Letter. Focus on Name, Effective Date of Promotion, THE NEW Rank/Grade, and THE NEW Salary Scale.`;
        case "NIN_SLIP":
            return baseInstruction + `This is a NIN Slip. Focus on Name and the 11-digit National Identification Number (NIN).`;
        case "FIRST_SCHOOL_LEAVING_CERTIFICATE":
        case "SCHOOL_CERTIFICATE":
            return baseInstruction + `This is an Educational Certificate. Focus on Name, Date of issue, and Institution name.`;
        case "OTHER":
            return baseInstruction + `This is an unclassified document. Intelligently extract ANY data points that could be used to verify a civil servant's eligibility, seniority, or payment status. Look for names, dates, ranks, salary info, or government seals.`;
        default:
            return baseInstruction + `Analyze this document and extract Name and most relevant Date.`;
    }
}
