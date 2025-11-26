/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

import { type FunctionDeclaration, Type, LiveServerToolCall, Modality } from "@google/genai";
import { useEffect, useRef, useState, memo } from "react";
import vegaEmbed from "vega-embed";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { declaration as codeQuestionDeclaration } from "../code-question/CodeQuestion";

// Function Declaration for Vega Graph Rendering
const declaration: FunctionDeclaration = {
  name: "render_altair",
  description: "Displays an Altair graph in JSON format.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      json_graph: {
        type: Type.STRING,
        description: "JSON STRING representation of the graph to render. Must be a string, not a JSON object.",
      },
    },
    required: ["json_graph"],
  },
};

function AltairComponent() {
  const [jsonString, setJSONString] = useState<string>("");
  const embedRef = useRef<HTMLDivElement>(null);
  const { client, setConfig } = useLiveAPIContext();

  // Set system config
  useEffect(() => {
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
      },
      systemInstruction: {
        parts: [
          {
            text: `You are HireScout, a professional technical interviewer. Follow this interview flow:

1. Introduction Phase:
   - Start by asking the candidate to introduce themselves
   - If they've uploaded a resume, acknowledge it and identify 2-3 interesting projects from their resume
   - Ask them which project they would like to discuss in detail or what technologies they're most comfortable with

2. Project Discussion Phase (maximum 2 projects):
   - Conduct an in-depth technical discussion about their chosen project
   - Ask specific questions about architecture, design decisions, challenges faced, and technologies used
   - If you feel the technical depth is insufficient after discussing one project, suggest discussing another project
   - Be persistent with technical follow-up questions to truly assess their understanding

3. Technical Assessment Phase:
   - Based on their background from the resume or project discussions, use the show_code_question function to give them a coding problem related to their domain
   - Do NOT verbally describe the entire coding problem - just mention you're showing a coding challenge on screen
   - Ask them to share their screen to solve the challenge
   - The coding problem details will be shown visually via the show_code_question function

4. Feedback Phase:
   - After they've answered your questions and completed the coding task, provide constructive feedback
   - Score their performance out of 10
   - Give specific points on what they did well and areas for improvement

Be conversational but professional. Listen carefully to their responses and ask relevant follow-up questions. If they upload their resume during the interview, read it carefully and adjust your questions based on their background. Always maintain a supportive and encouraging tone while providing honest assessment.`
          },
        ],
      },
      tools: [{ 
        functionDeclarations: [declaration, codeQuestionDeclaration] 
      }],
    });
  }, [setConfig]);

  // Listen for tool calls
  useEffect(() => {
      const onToolCall = async (toolCall: LiveServerToolCall) => {
        const functionCalls = toolCall.functionCalls || [];
        for (const fc of functionCalls) {
          if (fc.name === "render_altair") {
            const str = (fc.args as any).json_graph;
            setJSONString(str);
            // Send tool response
            client.sendToolResponse({
              functionResponses: [{
                response: { success: true },
                id: fc.id
              }]
            });
          }
        }
      };
  
      client.on("toolcall", onToolCall);
      return () => {
        client.off("toolcall", onToolCall);
      };
    }, [client]);

  // Render Vega graph when JSON changes
  useEffect(() => {
    if (embedRef.current && jsonString) {
      try {
        const parsedJSON = JSON.parse(jsonString);
        vegaEmbed(embedRef.current, parsedJSON).catch((err) => {
          console.error("Vega embed error:", err);
        });
      } catch (e) {
        console.error("Invalid JSON string provided to Vega embed:", e);
      }
    }
  }, [jsonString]);

  return <div className="vega-embed" ref={embedRef} />;
}

export const Altair = memo(AltairComponent);