/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useRef, useState } from "react";
import "./App.scss";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import SidePanel from "./components/side-panel/SidePanel";
import { Altair } from "./components/altair/Altair";
import { CodeQuestion } from "./components/code-question/CodeQuestion";
import ControlTray from "./components/control-tray/ControlTray";
import ResumeUpload from "./components/resume-upload/ResumeUpload";
import cn from "classnames";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

function App() {
  // this video reference is used for displaying the active stream, whether that is the webcam or screen capture
  // feel free to style as you see fit
  const videoRef = useRef<HTMLVideoElement>(null);
  // either the screen capture, the video or null, if null we hide it
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  // State for resume upload modal
  const [showResumeModal, setShowResumeModal] = useState<boolean>(false);

  return (
    <div className="App">
      <LiveAPIProvider url={uri} apiKey={API_KEY}>
        <div className="streaming-console">
          <SidePanel />
          <main>
            <div className="main-app-area">
              <div
                style={{
                  color: "white",
                  position: videoStream ? "absolute" : "static",
                  top: videoStream ? "5rem" : "auto",
                  left: videoStream ? "50%" : "auto",
                  transform: videoStream ? "translateX(-50%)" : "none",
                  textAlign: "center",
                  zIndex: 10,
                  padding: "20px",
                  background: "rgba(0,0,0,0.5)",
                  borderRadius: "8px",
                  maxWidth: "80%",
                  fontWeight: "bold",
                  textShadow: "1px 1px 3px rgba(0,0,0,0.8)"
                }}
              >
                 Hi! I'm HireScout, I will be taking your technical interview today.
                 <br />
                 Upload your resume to discuss your projects in-depth, then press the Play button to begin.
              </div>
              <Altair />
              <CodeQuestion />
              <video
                className={cn("stream", {
                  hidden: !videoRef.current || !videoStream,
                })}
                ref={videoRef}
                autoPlay
                playsInline
                style={{ marginBottom: "80px" }} // Add bottom margin to prevent video from being covered by controls
              />
            </div>
            
            {/* The ControlTray will be positioned at the bottom via CSS */}
            <ControlTray
              videoRef={videoRef}
              supportsVideo={true}
              onVideoStreamChange={setVideoStream}
              onResumeClick={() => setShowResumeModal(true)}
            >
              {/* put your own buttons here */}
            </ControlTray>
          </main>
          
          {showResumeModal && (
            <ResumeUpload onClose={() => setShowResumeModal(false)} />
          )}
        </div>
      </LiveAPIProvider>
    </div>
  );
}

export default App;
