/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { useEffect, useState, memo } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { ToolCall } from "../../multimodal-live-types";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 as dark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import "./code-question.scss";

// Function Declaration for Code Question display
export const declaration: FunctionDeclaration = {
  name: "show_code_question",
  description: "Displays a coding question for the interview candidate to solve.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      title: {
        type: SchemaType.STRING,
        description: "Title of the coding question",
      },
      description: {
        type: SchemaType.STRING,
        description: "Detailed description of the problem to solve",
      },
      starter_code: {
        type: SchemaType.STRING,
        description: "Optional starter code to help the candidate begin",
      },
      language: {
        type: SchemaType.STRING,
        description: "Programming language for the code (e.g., 'python', 'javascript')",
      },
      test_cases: {
        type: SchemaType.ARRAY,
        description: "Example test cases to demonstrate the expected behavior",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            input: {
              type: SchemaType.STRING,
              description: "Input for the test case"
            },
            output: {
              type: SchemaType.STRING,
              description: "Expected output for the test case"
            }
          }
        }
      }
    },
    required: ["title", "description", "language"],
  },
};

function CodeQuestionComponent() {
  const [question, setQuestion] = useState<{
    title: string;
    description: string;
    starterCode?: string;
    language: string;
    testCases?: {input: string, output: string}[];
  } | null>(null);
  
  const { client } = useLiveAPIContext();

  // Listen for tool calls
  useEffect(() => {
    const onToolCall = async (toolCall: ToolCall) => {
      for (const fc of toolCall.functionCalls) {
        if (fc.name === "show_code_question") {
          const args = fc.args as any;
          setQuestion({
            title: args.title,
            description: args.description,
            starterCode: args.starter_code || "",
            language: args.language,
            testCases: args.test_cases || []
          });
          
          // Send tool response with acknowledgment text
          // This ensures the AI won't verbalize the whole question
          client.sendToolResponse({
            functionResponses: [{
              response: { 
                success: true,
                message: "Coding challenge displayed on screen. The candidate can now see the problem details."
              },
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

  if (!question) return null;

  return (
    <div className="code-question-container">
      <div className="code-question">
        <h2>{question.title}</h2>
        <div className="description">
          {question.description.split("\n").map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
        
        {question.starterCode && (
          <div className="starter-code">
            <h3>Starter Code:</h3>
            <SyntaxHighlighter language={question.language} style={dark}>
              {question.starterCode}
            </SyntaxHighlighter>
          </div>
        )}
        
        {question.testCases && question.testCases.length > 0 && (
          <div className="test-cases">
            <h3>Test Cases:</h3>
            <ul>
              {question.testCases.map((testCase, idx) => (
                <li key={idx}>
                  <strong>Input:</strong> <code>{testCase.input}</code>
                  <br />
                  <strong>Output:</strong> <code>{testCase.output}</code>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="instructions">
        <p>Please share your screen to show your solution. When you're done, let the interviewer know.</p>
      </div>
    </div>
  );
}

export const CodeQuestion = memo(CodeQuestionComponent);
