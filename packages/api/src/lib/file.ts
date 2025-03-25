import { TextDecoder } from "util";
import mammoth from "mammoth";
import PDFParser from "pdf2json";

export async function parsePdf(buffer: Buffer): Promise<string> {
  const pdfParser = new PDFParser(null, true);
  let parsedText = "";

  const parsePdfPromise = new Promise<void>((resolve, reject) => {
    pdfParser.on("pdfParser_dataError", (errData) => {
      console.error(errData.parserError);
      reject(errData.parserError);
    });
    pdfParser.on("pdfParser_dataReady", () => {
      parsedText = pdfParser.getRawTextContent();
      resolve();
    });

    pdfParser.parseBuffer(buffer);
  });

  await parsePdfPromise;
  return parsedText;
}

export async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const result = await mammoth.extractRawText({ buffer });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return result.value;
  } catch (error) {
    console.error("Error parsing DOCX file:", error);
    throw new Error("Failed to parse DOCX file");
  }
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function parseTxt(buffer: Buffer): Promise<string> {
  try {
    // Use TextDecoder to convert the buffer to a string
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(buffer);
  } catch (error) {
    console.error("Error parsing TXT file:", error);
    throw new Error("Failed to parse TXT file");
  }
}
