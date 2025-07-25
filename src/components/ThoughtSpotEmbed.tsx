"use client";

import { useState, useRef, useEffect } from "react";

import { ThoughtSpotContent } from "../types/thoughtspot";

interface ThoughtSpotEmbedProps {
  content: ThoughtSpotContent;
  width?: string;
  height?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export default function ThoughtSpotEmbed({
  content,
  width = "100%",
  height = "600px",
  onLoad,
  onError,
}: ThoughtSpotEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const embedRef = useRef<HTMLDivElement>(null);
  const embedInstanceRef = useRef<{ destroy?: () => void } | null>(null);

  useEffect(() => {
    const initEmbed = async () => {
      if (!embedRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        console.log("Initializing ThoughtSpot embed for content:", content);

        const { LiveboardEmbed, SearchEmbed } = await import(
          "@thoughtspot/visual-embed-sdk"
        );

        let embedInstance;

        if (content.type === "liveboard") {
          console.log("Creating LiveboardEmbed with ID:", content.id);
          embedInstance = new LiveboardEmbed(embedRef.current, {
            liveboardId: content.id,
            frameParams: {
              width,
              height,
            },
          });
        } else if (content.type === "answer") {
          console.log("Creating SearchEmbed with answerId:", content.id);
          embedInstance = new SearchEmbed(embedRef.current, {
            answerId: content.id,
            frameParams: {
              width,
              height,
            },
          });
        } else if (content.type === "model") {
          // For models, use SearchEmbed with dataSource
          console.log("Creating SearchEmbed with dataSource:", content.id);
          embedInstance = new SearchEmbed(embedRef.current, {
            dataSource: content.id,
            frameParams: {
              width,
              height,
            },
          });
        }

        if (embedInstance) {
          embedInstanceRef.current = embedInstance;
          console.log("Rendering embed instance...");
          await embedInstance.render();
          console.log("Embed rendered successfully");
          setIsLoading(false);
          onLoad?.();
        }
      } catch (error) {
        console.error("Failed to initialize ThoughtSpot embed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load content";
        setError(errorMessage);
        setIsLoading(false);
        onError?.(errorMessage);
      }
    };

    initEmbed();

    // Cleanup function
    return () => {
      if (
        embedInstanceRef.current &&
        typeof embedInstanceRef.current.destroy === "function"
      ) {
        embedInstanceRef.current.destroy();
      }
    };
  }, [content.id, content.type, width, height, onLoad, onError]);

  if (error) {
    return (
      <div
        style={{
          padding: "20px",
          backgroundColor: "#fed7d7",
          border: "1px solid #feb2b2",
          borderRadius: "8px",
          color: "#c53030",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>⚠️ Embedding Error</h3>
        <p style={{ margin: 0 }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#f7fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <div style={{ color: "#4a5568" }}>Loading content...</div>
        </div>
      )}
      <div
        ref={embedRef}
        style={{
          width: "100%",
          height: "100%",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      />
    </div>
  );
}
