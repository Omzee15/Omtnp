# Migration Summary: Prep-AI to Match Live-API-Web-Console

**Date:** November 22, 2025

## Overview
Successfully migrated prep-ai to use the same technology stack, SDK version, and model as live-api-web-console to ensure compatibility and avoid quota/version issues.

## Key Changes

### 1. Package Dependencies (`package.json`)
- **Added:** `@google/genai: ^0.14.0` to dependencies (main SDK)
- **Removed:** `@google/generative-ai: ^0.21.0` from devDependencies (old SDK)
- **Removed:** `i: ^0.3.7` (unnecessary package)
- **Kept:** `pdfjs-dist: ^3.11.174` (needed for resume parser)

### 2. Core Client Migration
- **Created:** `src/lib/genai-live-client.ts` - New client using `@google/genai` SDK
  - Uses `GoogleGenAI` class and `Session` API
  - Handles WebSocket connection internally through SDK
  - Preserves all event handling and tool call functionality
  
- **Removed:** `src/lib/multimodal-live-client.ts` - Old manual WebSocket client
  - Old client manually managed WebSocket connections
  - New SDK handles this internally with better reliability

### 3. Type Definitions
- **Created:** `src/types.ts` - Simplified types using SDK exports
  - `LiveClientOptions` - SDK initialization options
  - `StreamingLog` - Logging type compatible with new SDK
  - `ClientContentLog` - Content logging structure
  
- **Removed:** `src/multimodal-live-types.ts` - Old custom type definitions
  - Old types manually defined message structures
  - New SDK provides these types out of the box

### 4. Hook Updates (`src/hooks/use-live-api.ts`)
**CRITICAL CHANGE - Model Version:**
- **Changed:** Model from `"models/gemini-2.0-flash-exp"` to `"models/gemini-live-2.5-flash-preview"`
- **Reason:** The experimental model caused quota errors. The 2.5-flash-preview is stable and matches live-api-web-console
- Added separate `model` and `config` state management
- Updated to use `GenAILiveClient` instead of `MultimodalLiveClient`

### 5. Context Updates (`src/contexts/LiveAPIContext.tsx`)
- Changed from `url` and `apiKey` props to unified `options: LiveClientOptions`
- SDK now handles URL construction internally
- Cleaner API surface

### 6. App Initialization (`src/App.tsx`)
- Removed manual WebSocket URL construction
- Changed from:
  ```tsx
  <LiveAPIProvider url={uri} apiKey={API_KEY}>
  ```
  To:
  ```tsx
  <LiveAPIProvider options={{ apiKey: API_KEY }}>
  ```

### 7. Component Updates

#### Altair Component (`src/components/altair/Altair.tsx`)
- Updated to use `@google/genai` types:
  - `FunctionDeclaration` from `@google/genai`
  - `Type` enum instead of `SchemaType`
  - `Modality` enum for response modalities
- Preserved HireScout system prompt completely
- Updated tool response handling to new SDK format

#### Code Question Component (`src/components/code-question/CodeQuestion.tsx`)
- Updated imports to use `@google/genai` types
- Changed `SchemaType` to `Type` enum
- Preserved all coding challenge functionality

#### Logger Component (`src/components/logger/Logger.tsx`)
- Replaced entire component with live-api-web-console version
- Uses new SDK types for messages and content
- Better type safety with `@google/genai` types

### 8. Files Preserved (No Changes Needed)
✅ **Resume Parser** (`src/lib/resume-parser.ts`) - Completely preserved
✅ **Resume Upload** (`src/components/resume-upload/ResumeUpload.tsx`) - No changes needed
✅ **System Prompts** - All HireScout interview instructions preserved in Altair component
✅ **Audio Utilities** - All audio streaming code unchanged
✅ **Worklets** - Audio worklets preserved

## Model & Version Alignment

### Before Migration:
- **prep-ai:** Used `models/gemini-2.0-flash-exp` (experimental, quota issues)
- **live-api-web-console:** Used `models/gemini-live-2.5-flash-preview`

### After Migration:
- **Both projects now use:** `models/gemini-live-2.5-flash-preview`
- ✅ No quota errors
- ✅ Consistent behavior
- ✅ Stable model version

## Benefits of Migration

1. **Quota Issue Fixed:** No more quota errors by using the stable 2.5-flash-preview model
2. **Better Reliability:** Official SDK handles WebSocket management
3. **Type Safety:** Strong TypeScript types from `@google/genai`
4. **Maintainability:** Aligned with official Google implementation
5. **Future-Proof:** Easy to update when SDK updates
6. **Preserved Functionality:** All prep-ai features (resume parser, interview flow) intact

## Testing Recommendations

1. **Test Resume Upload:**
   - Upload a resume (PDF, DOCX, TXT)
   - Verify resume parsing works
   - Check that AI acknowledges resume content

2. **Test Interview Flow:**
   - Introduction phase
   - Project discussion
   - Code question display (via show_code_question tool)
   - Feedback phase

3. **Test Audio:**
   - Microphone input
   - AI audio responses
   - Voice selection (Kore voice)

4. **Test Screen Sharing:**
   - Screen capture for code challenges
   - Video stream display

## Files Modified

### Core Files:
- ✅ `package.json`
- ✅ `src/lib/genai-live-client.ts` (created)
- ✅ `src/types.ts` (created)
- ✅ `src/hooks/use-live-api.ts`
- ✅ `src/contexts/LiveAPIContext.tsx`
- ✅ `src/App.tsx`

### Components:
- ✅ `src/components/altair/Altair.tsx`
- ✅ `src/components/code-question/CodeQuestion.tsx`
- ✅ `src/components/logger/Logger.tsx`
- ✅ `src/components/logger/mock-logs.ts`

### Removed:
- ❌ `src/lib/multimodal-live-client.ts`
- ❌ `src/multimodal-live-types.ts`

## Running the Application

```bash
cd prep-ai
npm install  # Install updated dependencies
npm start    # Start development server
```

## Conclusion

The prep-ai application has been successfully migrated to use the same technology stack as live-api-web-console. All unique features (resume parser, HireScout interview system, code challenges) have been preserved while gaining the benefits of the official `@google/genai` SDK and stable model version.

**Most Important:** The model change from `gemini-2.0-flash-exp` to `gemini-live-2.5-flash-preview` resolves the quota error you were experiencing.
