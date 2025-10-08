import { useEffect, useRef, useCallback, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Link,
} from "@mui/material";
import axios from "axios";
import { globalVariables } from "../../utils";
import { useAuth } from "../../AuthContext";
import { usePrivacyConsent, CLOSE_PRIVACY_MODAL, OPEN_PRIVACY_MODAL } from '../../PrivacyConsentContext';

const PRIVACY_CONSENT_API = globalVariables.baseUrl + "/privacy-policy/consent/";
const PRIVACY_CONSENT_CHECK = globalVariables.baseUrl + "/privacy-policy/check/";

export interface PrivacyConsentModalProps {
  open?: boolean;
  onClose?: () => void;
}

export default function PrivacyConsentModal({
  open,
  onClose,
}: PrivacyConsentModalProps) {
  const { dispatch } = usePrivacyConsent();
  const { state } = useAuth();

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

   // Track ongoing request instead of completed requests
  const isRequestInProgress = useRef(false);

  const checkPrivacyConsent = useCallback(async () => {
    // If user is not available or request is already in progress, skip
    if (!state.user?.access_token || isRequestInProgress.current) {
      return;
    }

    // Mark request as in progress
    isRequestInProgress.current = true;

    try {
      axios.defaults.headers.common["Authorization"] = `Bearer ${state.user.access_token}`;
      const response = await axios.get(PRIVACY_CONSENT_CHECK);
      if (!response.data.is_agreed_to_privacy_policy) {
        // User has already consented to the privacy policy
        dispatch({type: OPEN_PRIVACY_MODAL});
      }
    } catch (error) {
      console.error("Error checking privacy consent:", error);
    } finally {
      // Always reset the flag when request completes (success or error)
      isRequestInProgress.current = false;
    }
  }, [state.user?.access_token]);

  // Run on every render when user is available
  useEffect(() => {
    if (state.user?.access_token) {
      checkPrivacyConsent();
    }
  });

  const sendConsent = async (agree: boolean) => {
    try {
      axios.defaults.headers.common["Authorization"] = `Bearer ${state.user.access_token}`;
      const response = await axios.post(
        PRIVACY_CONSENT_API,
        { agree },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.status === 201 && onClose) {
        // localStorage.setItem("acceptedPrivacyPolicyVersion", PRIVACY_POLICY_VERSION);
        onClose();
      }
    } catch (error) {
      console.error("Error sending consent:", error);
    }
  };

  const handleAccept = async () => {
    await sendConsent(true);
    dispatch({ type: CLOSE_PRIVACY_MODAL });
    if (onClose) onClose();
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth className='privacy-modal'>
      <DialogTitle>We've updated our Privacy Policy</DialogTitle>
      <DialogContent>
        <Typography>
          We encourage you to review our updated {" "}
          <Link href="/#/privacy-policy" target="_blank" rel="noopener">
            Privacy Policy
          </Link>.
          By continuing, you agree to the updated terms listed there.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, display: 'block' }}>
        <Button
          variant="contained"
          onClick={handleAccept}
          color="primary"
          sx={{ backgroundColor: '#0e4981' }}
          fullWidth
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
