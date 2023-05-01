import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

type Data = string;
interface ExtendedNextApiRequest extends NextApiRequest {
  body: {
    imageUrl: string;
  };
}

interface OCRResponse {
  ParsedResults: {
    TextOverlay: {
      Lines: {
        LineText: string;
      }[];
    };
  }[];
}

export default async function handler(
  req: ExtendedNextApiRequest,
  res: NextApiResponse<Data>
) {
  // Check if user is logged in
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(500).json("Login to upload.");
  }

  let restoredImage =
    "https://images.unsplash.com/photo-1580428354768-03a028646bc8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTR8fHRleHR8ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60";

  const text = await extractTextFromImage(req.body.imageUrl);
  console.log("text", text);
  res
    .status(200)
    .json(text);
}

async function extractTextFromImage(imageUrl: string): Promise<string> {
  const ocrApiKey = "K81633040388957";
  const ocrApiUrl = "https://api.ocr.space/parse/image";

  const response = await fetch(ocrApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `apikey=${ocrApiKey}&url=${imageUrl}&isOverlayRequired=true`,
  });

  if (!response.ok) {
    throw new Error("Failed to call OCR API");
  }

  const ocrResponse: OCRResponse = await response.json();
  console.log("ocrResponse", ocrResponse);
  return ocrResponse.ParsedResults[0].TextOverlay.Lines.reduce(
    (text, line) => text + line.LineText,
    ""
  );
}
