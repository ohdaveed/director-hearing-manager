import { useCallback, useEffect, useMemo, useReducer } from "react";
import type {
  PacketWithRelations,
  EnforcementFlags,
  ChecklistCompletion,
} from "@/types/packet";

type PacketFormState = {
  status: string;
  notes: string;
  caseNumber: string;
  programCode: string;
  hearingTime: string;
  hearingLocation: string;
  proposedActions: string[];
  adminFee: string;
  enforcementFlags: EnforcementFlags;
  checklistCompletion: ChecklistCompletion;
};

type PacketFormAction =
  | { type: "SET_FIELD"; key: keyof PacketFormState; value: any }
  | { type: "RESET"; packet: PacketWithRelations | undefined }
  | { type: "TOGGLE_ACTION"; action: string }
  | { type: "TOGGLE_FLAG"; flag: keyof EnforcementFlags }
  | { type: "TOGGLE_CHECKLIST"; milestoneId: number };

const initialState: PacketFormState = {
  status: "Not Started",
  notes: "",
  caseNumber: "",
  programCode: "",
  hearingTime: "",
  hearingLocation: "",
  proposedActions: [],
  adminFee: "",
  enforcementFlags: {
    nuisanceAbatement: false,
    costRecovery: false,
    appealHealthPermit: false,
    appealNonPermitted: false,
  },
  checklistCompletion: {},
};

function packetFormReducer(
  state: PacketFormState,
  action: PacketFormAction,
): PacketFormState {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        [action.key]: action.value,
      };
    case "RESET":
      if (!action.packet) {
        return initialState;
      }
      return {
        status: action.packet.packet_status ?? "Not Started",
        notes: action.packet.notes ?? "",
        caseNumber: action.packet.case_number ?? "",
        programCode: action.packet.program_code ?? "",
        hearingTime: action.packet.hearing_time ?? "",
        hearingLocation: action.packet.hearing_location ?? "",
        proposedActions: (action.packet as any).proposed_actions ?? [],
        adminFee: action.packet.admin_fee ?? "",
        enforcementFlags: action.packet.enforcement_flags
          ? JSON.parse(action.packet.enforcement_flags)
          : initialState.enforcementFlags,
        checklistCompletion: action.packet.checklist_data
          ? JSON.parse(action.packet.checklist_data)
          : {},
      };
    case "TOGGLE_ACTION":
      return {
        ...state,
        proposedActions: state.proposedActions.includes(action.action)
          ? state.proposedActions.filter((a) => a !== action.action)
          : [...state.proposedActions, action.action],
      };
    case "TOGGLE_FLAG":
      return {
        ...state,
        enforcementFlags: {
          ...state.enforcementFlags,
          [action.flag]: !state.enforcementFlags[action.flag],
        },
      };
    case "TOGGLE_CHECKLIST":
      return {
        ...state,
        checklistCompletion: {
          ...state.checklistCompletion,
          [action.milestoneId]: !state.checklistCompletion[action.milestoneId],
        },
      };
    default:
      return state;
  }
}

export function usePacketForm(packet: PacketWithRelations | undefined) {
  const [state, dispatch] = useReducer(packetFormReducer, initialState);

  // Reset form when packet changes
  useEffect(() => {
    dispatch({ type: "RESET", packet });
  }, [packet]);

  const updateField = useCallback(
    <K extends keyof PacketFormState>(key: K, value: PacketFormState[K]) => {
      dispatch({ type: "SET_FIELD", key, value });
    },
    [],
  );

  const toggleAction = useCallback((action: string) => {
    dispatch({ type: "TOGGLE_ACTION", action });
  }, []);

  const toggleFlag = useCallback((flag: keyof EnforcementFlags) => {
    dispatch({ type: "TOGGLE_FLAG", flag });
  }, []);

  const toggleChecklist = useCallback((milestoneId: number) => {
    dispatch({ type: "TOGGLE_CHECKLIST", milestoneId });
  }, []);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      formState: state,
      updateField,
      toggleAction,
      toggleFlag,
      toggleChecklist,
      resetForm: (p: PacketWithRelations | undefined) =>
        dispatch({ type: "RESET", packet: p }),
    }),
    [
      state.status,
      state.notes,
      state.caseNumber,
      state.programCode,
      state.hearingTime,
      state.hearingLocation,
      state.proposedActions,
      state.adminFee,
      state.enforcementFlags,
      state.checklistCompletion,
      updateField,
      toggleAction,
      toggleFlag,
      toggleChecklist,
    ],
  );
}
