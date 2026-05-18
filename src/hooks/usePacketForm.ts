import { useEffect, useMemo, useState } from "react";
import { PacketStatus } from "@/services/packetService";

export interface PacketFormState {
  status: PacketStatus;
  notes: string;
  caseNumber: string;
  programCode: string;
  hearingTime: string;
  hearingLocation: string;
  adminFee: string;
  proposedActions: string[];
}

const DEFAULT_PACKET_FORM: PacketFormState = {
  status: "Not Started",
  notes: "",
  caseNumber: "",
  programCode: "",
  hearingTime: "",
  hearingLocation: "",
  adminFee: "",
  proposedActions: [],
};

function normalizeActions(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function fromPacket(packet: any): PacketFormState {
  if (!packet) return DEFAULT_PACKET_FORM;
  return {
    status: packet.packet_status ?? "Not Started",
    notes: packet.notes ?? "",
    caseNumber: packet.case_number ?? "",
    programCode: packet.program_code ?? "",
    hearingTime: packet.hearing_time ?? "",
    hearingLocation: packet.hearing_location ?? "",
    adminFee: packet.admin_fee ?? "",
    proposedActions: normalizeActions(packet.proposed_actions),
  };
}

function buildPayload(form: PacketFormState) {
  return {
    packet_status: form.status,
    notes: form.notes,
    case_number: form.caseNumber,
    program_code: form.programCode || null,
    proposed_actions: form.proposedActions,
    hearing_time: form.hearingTime,
    hearing_location: form.hearingLocation,
    admin_fee: form.adminFee,
  };
}

export function usePacketForm(packet: any) {
  const initialForm = useMemo(() => fromPacket(packet), [packet]);
  const [form, setForm] = useState<PacketFormState>(initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const setField = <K extends keyof PacketFormState>(
    field: K,
    value: PacketFormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleProposedAction = (value: string) => {
    setForm((current) => ({
      ...current,
      proposedActions: current.proposedActions.includes(value)
        ? current.proposedActions.filter((item) => item !== value)
        : [...current.proposedActions, value],
    }));
  };

  const reset = () => setForm(initialForm);

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  return {
    form,
    setField,
    toggleProposedAction,
    reset,
    isDirty,
    buildUpdatePayload: () => buildPayload(form),
  };
}
