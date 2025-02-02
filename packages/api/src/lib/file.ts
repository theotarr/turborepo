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
