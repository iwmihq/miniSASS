import React, { useEffect, useState } from 'react';
import axios from 'axios';

import { Button } from '../../components';
import LoginFormModal from '../../components/LoginFormModal';
import UserMenu from '../../components/UserMenu';
import RegistrationFormModal from '../../components/RegistrationFormModal/index';
import UserFormModal from '../../components/UserForm/index';
import EnforcePasswordChange from '../../components/EnforcePasswordChange';
import PrivacyConsentModal from '../../components/PrivacyConsentModal';
import {usePrivacyConsent, OPEN_PRIVACY_MODAL, CLOSE_PRIVACY_MODAL} from '../../PrivacyConsentContext';

import { logout, OPEN_LOGIN_MODAL, useAuth } from '../../AuthContext';
import { globalVariables } from '../../utils';


function AuthenticationButtons(props) {
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isEnforcePasswordOpen, setIsEnforcePasswordOpen] = useState(false);
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [Registrationloading, setLoading] = useState(false);
  const [registrationInProgress, setRegistrationInProgress] = useState(false);
  const [updatePassword, setUpdatePassword] = useState(false);
  const [updateProfileLoading, setUpdateProfileLoading] = useState(false);
  const [updateProfileInProgress, setUpdateProfileInProgress] = useState(false);
  const { dispatch, state } = useAuth();
  const { state: privacyState, dispatch: privacyDispatch } = usePrivacyConsent();

  /** Open login modal based on context ***/
  useEffect(() => {
    setLoginModalOpen(state.openLoginModal)
  }, [state.openLoginModal]);

  /** Update context based on login modal open/not. ***/
  useEffect(() => {
    dispatch({ type: OPEN_LOGIN_MODAL, payload: isLoginModalOpen });
  }, [isLoginModalOpen]);

  const openLoginModal = () => {
    setLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setLoginModalOpen(false);
  };

  const openRegisterModal = () => {
    setRegisterModalOpen(true);
  };

  const closeRegisterModal = () => {
    setRegisterModalOpen(false);
    setError(null);
  };

  const closeProfileModal = () => {
    setProfileModalOpen(false);
    setUpdateProfileInProgress(false);
    setUpdateProfileLoading(false);
    setUpdatePassword(false);
  }

  const [error, setError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const LOGIN_API = globalVariables.baseUrl + '/authentication/api/login/';
  const REGISTER_API = globalVariables.baseUrl + '/authentication/api/register/'
  
  const handleEnforcePassword = () => {
    setIsEnforcePasswordOpen(false)
    setProfileModalOpen(true);
    setUpdatePassword(true)
  }

  const handleLogin = async (loginData: any) => {
    try {
      setIsAuthenticating(true)
      const response = await axios.post(`${LOGIN_API}`, loginData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        const userData = response.data;
        dispatch({ type: 'LOGIN', payload: userData });
        localStorage.setItem('authState', JSON.stringify({ userData }));
        axios.defaults.headers.common['Authorization'] = `Bearer ${userData.access_token}`;
        if (!userData.is_profile_updated) {
          setIsEnforcePasswordOpen(true)
        }

        if (userData.is_agreed_to_privacy_policy === false) {
          privacyDispatch({ type: OPEN_PRIVACY_MODAL });
        }
        setError(null);
        setLoginModalOpen(false)
        setIsAuthenticating(false)
      } else {
        if(!response.data.is_authenticated){
          setError('Please complete registration to continue.');
        }
        else setError('Invalid credentials. Please try again.');
        setIsAuthenticating(false)
      }
    } catch (error) {
      setError('Invalid credentials. Please try again.');
      setIsAuthenticating(false)
    }
  };

  const handleRegistration = async (registrationData) => {

    try {
      setLoading(true)
      const response = await axios.post(REGISTER_API, registrationData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (response.status === 201) {
        // Simulate 2-second delay for registration process
        setTimeout(() => {
          setLoading(false);
          setRegistrationInProgress(true);
        }, 1100);
      } else {
        setLoading(false)
        if (response.data && response.data.error) {
          setError(response.data.error);
        } else {
          setError('An unexpected error occurred. Please contact us.');
        }
      }
    } catch (error) {
      setLoading(false);
      if (error.response.data && error.response.data.error) {
          setError(error.response.data.error);
        } else {
          setError(error.message);
        }
    }
  };


  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        { state.isAuthenticated ? (
          <UserMenu setUpdateProfileOpen={setProfileModalOpen} isDisableNavigations={props.isDisableNavigations} />
        ) : (
          <>
            <Button
              onClick={openLoginModal}
              className="cursor-pointer rounded-tr-xl rounded-bl-xl rounded-br-xl bg-primary px-4 py-2 text-body-sm font-semibold text-text-inverse transition-colors hover:bg-primary-dark"
              shape="square"
              color="blue_900"
              size="xs"
              variant="fill"
            >
              Login
            </Button>
            <Button
              onClick={openRegisterModal}
              className="cursor-pointer rounded-tr-xl rounded-bl-xl rounded-br-xl border border-primary px-4 py-2 text-body-sm font-semibold text-primary transition-colors hover:bg-surface-muted"
              shape="square"
              size="xs"
            >
              Register
            </Button>
          </>
        )}
      </div>
      <LoginFormModal 
        isOpen={isLoginModalOpen} 
        onClose={closeLoginModal} 
        onSubmit={handleLogin}  
        error_response={error}
        isAuthenticating={isAuthenticating}
        openRegisterModal={openRegisterModal}
      />
      <RegistrationFormModal
        isOpen={isRegisterModalOpen} 
        onClose={closeRegisterModal} 
        onSubmit={handleRegistration} 
        error_response={error}
        Registrationloading={Registrationloading}
        registrationInProgress={registrationInProgress}
        />
      <UserFormModal
        isOpen={isProfileModalOpen}
        onClose={closeProfileModal}
        defaultTab={updatePassword ? 1 : 0}
        loading={updateProfileLoading}
        inProgress={updateProfileInProgress}
        />
      <EnforcePasswordChange
        isOpen={isEnforcePasswordOpen}
        onClose={handleEnforcePassword}
      />
      <PrivacyConsentModal
        open={privacyState.isPrivacyModalOpen}
        onClose={() => privacyDispatch({ type: CLOSE_PRIVACY_MODAL })}
      />
    </div>
  );
}

export default AuthenticationButtons;
