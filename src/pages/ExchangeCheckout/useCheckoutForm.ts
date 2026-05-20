import { useCallback, useMemo, useReducer } from "react";

type CheckoutFormState = {
  nameError: string | null;
  usdtError: string | null;
  selectedAddress: string;
  lastName: string;
  firstName: string;
  middleName: string;
  rememberData: boolean;
};

type CheckoutFormAction =
  | { type: "initialize"; payload: { lastName: string; firstName: string; middleName: string; rememberData: boolean } }
  | { type: "set_remember"; payload: boolean }
  | { type: "set_name_part"; payload: { field: "lastName" | "firstName" | "middleName"; value: string } }
  | { type: "set_selected_address"; payload: string }
  | { type: "set_name_error"; payload: string | null }
  | { type: "set_usdt_error"; payload: string | null }
  | { type: "apply_validation_errors"; payload: { nameError?: string; usdtError?: string } }
  | { type: "clear_errors" };

const initialState: CheckoutFormState = {
  nameError: null,
  usdtError: null,
  selectedAddress: "",
  lastName: "",
  firstName: "",
  middleName: "",
  rememberData: false,
};

function reducer(state: CheckoutFormState, action: CheckoutFormAction): CheckoutFormState {
  switch (action.type) {
    case "initialize":
      return {
        ...state,
        lastName: action.payload.lastName,
        firstName: action.payload.firstName,
        middleName: action.payload.middleName,
        rememberData: action.payload.rememberData,
      };
    case "set_remember":
      return { ...state, rememberData: action.payload };
    case "set_name_part":
      return { ...state, [action.payload.field]: action.payload.value, nameError: null };
    case "set_selected_address":
      return { ...state, selectedAddress: action.payload, usdtError: null };
    case "set_name_error":
      return { ...state, nameError: action.payload };
    case "set_usdt_error":
      return { ...state, usdtError: action.payload };
    case "apply_validation_errors":
      return {
        ...state,
        nameError: action.payload.nameError ?? null,
        usdtError: action.payload.usdtError ?? null,
      };
    case "clear_errors":
      return { ...state, nameError: null, usdtError: null };
    default:
      return state;
  }
}

export function useCheckoutForm() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const initializeFromProfile = useCallback(
    (payload: { lastName: string; firstName: string; middleName: string; rememberData: boolean }) =>
      dispatch({ type: "initialize", payload }),
    []
  );
  const setRememberData = useCallback((value: boolean) => dispatch({ type: "set_remember", payload: value }), []);
  const setNamePart = useCallback(
    (field: "lastName" | "firstName" | "middleName", value: string) =>
      dispatch({ type: "set_name_part", payload: { field, value } }),
    []
  );
  const setSelectedAddress = useCallback((value: string) => dispatch({ type: "set_selected_address", payload: value }), []);
  const applyValidationErrors = useCallback(
    (payload: { nameError?: string; usdtError?: string }) =>
      dispatch({ type: "apply_validation_errors", payload }),
    []
  );
  const clearErrors = useCallback(() => dispatch({ type: "clear_errors" }), []);

  return useMemo(
    () => ({
      state,
      initializeFromProfile,
      setRememberData,
      setNamePart,
      setSelectedAddress,
      applyValidationErrors,
      clearErrors,
    }),
    [
      state,
      initializeFromProfile,
      setRememberData,
      setNamePart,
      setSelectedAddress,
      applyValidationErrors,
      clearErrors,
    ]
  );
}
