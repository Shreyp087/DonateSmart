"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ConversationProvider,
  useConversation,
  useConversationClientTool,
  useConversationStatus
} from "@elevenlabs/react";
import { useDonationVoiceContext } from "@/components/voice/donation-voice-context";
import { cn, toTitleCase } from "@/lib/utils";

export function ElevenLabsAssistantRuntime({
  isOpen,
  onToggle
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <ConversationProvider
      onError={(error) => {
        console.error("ElevenLabs conversation error:", error);
      }}
    >
      <AssistantPanel isOpen={isOpen} onToggle={onToggle} />
    </ConversationProvider>
  );
}

function AssistantPanel({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { state, actions } = useDonationVoiceContext();
  const [isMuted, setIsMuted] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const { status, message } = useConversationStatus();
  const conversation = useConversation({
    micMuted: isMuted,
    onConnect: () => {
      setLocalError("");
    },
    onDisconnect: (details) => {
      if (details.reason === "user") {
        setLocalError("");
        return;
      }

      setLocalError(toDisconnectMessage(details));
    },
    onError: (errorMessage) => {
      setLocalError(errorMessage || "Unable to keep the voice session connected.");
    }
  });
  const onDonatePage = pathname === "/donate" && state && actions;

  useDonationTools(state, actions);

  async function handleStart() {
    setIsBusy(true);
    setLocalError("");

    try {
      const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      permissionStream.getTracks().forEach((track) => track.stop());

      const response = await fetch("/api/elevenlabs/signed-url", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as { signedUrl?: string; error?: string };

      if (!response.ok || !payload.signedUrl) {
        throw new Error(payload.error || "Unable to start the voice assistant.");
      }

      conversation.startSession({
        signedUrl: payload.signedUrl,
        connectionType: "websocket"
      });
    } catch (error) {
      console.error("Unable to start ElevenLabs session:", error);
      setLocalError(error instanceof Error ? error.message : "Unable to start the voice assistant.");
    } finally {
      setIsBusy(false);
    }
  }

  function handleStop() {
    conversation.endSession();
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-30 flex flex-col items-end gap-3 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:max-w-sm">
      {isOpen ? (
        <div className="w-full rounded-[1.75rem] border border-white/80 bg-white/95 p-4 shadow-card backdrop-blur sm:w-[min(92vw,24rem)] sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sage-700">Voice Assistant</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Talk to DonateSmart</h2>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <div className="mt-4 rounded-[1.25rem] bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  status === "connected"
                    ? "bg-emerald-500"
                    : status === "connecting"
                      ? "bg-amber-400"
                      : status === "error"
                        ? "bg-rose-500"
                        : "bg-slate-300"
                )}
              />
              <p className="text-sm font-semibold text-slate-900">Status: {toStatusLabel(status)}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {localError ||
                message ||
                (onDonatePage
                  ? "You can now use this assistant to fill the donation form by voice, guide the donor to the image step, and submit once the image is added."
                  : "Use voice to ask about donation categories, bulk clothing submissions, QR codes, approvals, or inventory steps.")}
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleStart}
              disabled={isBusy || status === "connecting" || status === "connected"}
              className="rounded-full bg-sage-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:bg-sage-300"
            >
              {isBusy || status === "connecting" ? "Starting..." : "Start voice chat"}
            </button>
            <button
              type="button"
              onClick={handleStop}
              disabled={status !== "connected"}
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              End conversation
            </button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setIsMuted((current) => !current)}
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {isMuted ? "Unmute microphone" : "Mute microphone"}
            </button>
            <p className="rounded-full bg-slate-50 px-5 py-3 text-center text-sm font-semibold text-slate-500">
              {conversation.mode === "speaking" ? "Assistant is speaking" : "Assistant is listening"}
            </p>
          </div>

          {onDonatePage ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Snapshot label="Donor mode" value={state.isAnonymous ? "Anonymous" : "Named donor"} />
              <Snapshot label="Item photo" value={state.hasImage ? "Image added" : "Waiting for image"} />
              <Snapshot label="Category" value={state.category ? toTitleCase(state.category) : "Not selected"} />
              <Snapshot label="Condition" value={state.condition ? toTitleCase(state.condition) : "Not selected"} />
            </div>
          ) : null}

          <p className="mt-4 text-xs leading-5 text-slate-400">
            {onDonatePage
              ? "On the donate page, this assistant can control the same form fields. The donor still uses the page buttons for image upload or camera capture."
              : "Your browser will ask for microphone access before the conversation starts. This app now uses a server-side ElevenLabs signed URL for the connection."}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function toStatusLabel(status: ReturnType<typeof useConversationStatus>["status"]) {
  if (status === "connected") return "Connected";
  if (status === "connecting") return "Connecting";
  if (status === "error") return "Error";
  return "Disconnected";
}

function toDisconnectMessage(details: {
  reason?: string;
  message?: string;
  context?: Event | CloseEvent;
}) {
  if (details.message) {
    return details.message;
  }

  if (details.context instanceof CloseEvent && details.context.reason) {
    return details.context.reason;
  }

  if (details.reason === "agent") {
    return "The voice agent ended the conversation. Please start it again to continue.";
  }

  if (details.reason === "error") {
    return "The voice session disconnected unexpectedly. Please start it again.";
  }

  return "The voice session ended. Please start it again when you are ready.";
}

function useDonationTools(
  state: ReturnType<typeof useDonationVoiceContext>["state"],
  actions: ReturnType<typeof useDonationVoiceContext>["actions"]
) {
  useConversationClientTool("get_donation_state", () =>
    state
      ? JSON.stringify({
          step: state.step,
          isAnonymous: state.isAnonymous,
          donorName: state.donorName,
          donorEmail: state.donorEmail,
          donorPhone: state.donorPhone,
          itemName: state.itemName,
          category: state.category,
          isBulkClothing: state.isBulkClothing,
          bulkClothingRange: state.bulkClothingRange,
          condition: state.condition,
          brand: state.brand,
          size: state.size,
          description: state.description,
          hasImage: state.hasImage
        })
      : JSON.stringify({ available: false, message: "Donation form is not active on this page." })
  );

  useConversationClientTool("set_anonymous", (params) =>
    actions ? actions.setAnonymous(Boolean(params.anonymous)) : "Donation form is not active on this page."
  );
  useConversationClientTool("set_donor_name", (params) =>
    actions ? actions.setDonorName(asString(params.name)) : "Donation form is not active on this page."
  );
  useConversationClientTool("set_donor_email", (params) =>
    actions ? actions.setDonorEmail(asString(params.email)) : "Donation form is not active on this page."
  );
  useConversationClientTool("set_donor_phone", (params) =>
    actions ? actions.setDonorPhone(asString(params.phone)) : "Donation form is not active on this page."
  );
  useConversationClientTool("continue_to_item_step", () =>
    actions ? actions.continueToItemStep() : "Donation form is not active on this page."
  );
  useConversationClientTool("go_to_donor_step", () =>
    actions ? actions.goToDonorStep() : "Donation form is not active on this page."
  );
  useConversationClientTool("set_item_name", (params) =>
    actions ? actions.setItemName(asString(params.itemName)) : "Donation form is not active on this page."
  );
  useConversationClientTool("set_category", (params) =>
    actions ? actions.setCategory(asString(params.category)) : "Donation form is not active on this page."
  );
  useConversationClientTool("set_bulk_clothing", (params) =>
    actions ? actions.setBulkClothing(Boolean(params.isBulk)) : "Donation form is not active on this page."
  );
  useConversationClientTool("set_bulk_clothing_range", (params) =>
    actions ? actions.setBulkClothingRange(asString(params.range)) : "Donation form is not active on this page."
  );
  useConversationClientTool("set_condition", (params) =>
    actions ? actions.setCondition(asString(params.condition)) : "Donation form is not active on this page."
  );
  useConversationClientTool("set_brand", (params) =>
    actions ? actions.setBrand(asString(params.brand)) : "Donation form is not active on this page."
  );
  useConversationClientTool("set_size", (params) =>
    actions ? actions.setSize(asString(params.size)) : "Donation form is not active on this page."
  );
  useConversationClientTool("set_description", (params) =>
    actions ? actions.setDescription(asString(params.description)) : "Donation form is not active on this page."
  );
  useConversationClientTool("prompt_image_upload", (params) =>
    actions ? actions.promptImageUpload(asUploadMode(params.mode)) : Promise.resolve("Donation form is not active on this page.")
  );
  useConversationClientTool("submit_donation", () =>
    actions ? actions.submitDonation() : Promise.resolve("Donation form is not active on this page.")
  );
}

function Snapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asUploadMode(value: unknown): "camera" | "files" | undefined {
  return value === "camera" || value === "files" ? value : undefined;
}
