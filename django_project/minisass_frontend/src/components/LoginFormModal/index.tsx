import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import Modal from 'react-modal';
import { Button ,Img } from "../../components";
import { useNavigate } from 'react-router-dom';
import { globalVariables } from '../../utils';
import axios from 'axios';
import LinearProgress from '@mui/material/LinearProgress/LinearProgress';
import ReactGA from "react-ga4";

interface LoginFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { email: string; password: string; usernameForEmailRetrieval: string }) => void;
  error_response: string | null;
  isAuthenticating: boolean;
  openRegisterModal: () => void;
}

const LoginFormModal: React.FC<LoginFormModalProps> = ({ isOpen, onClose, onSubmit, error_response, isAuthenticating, openRegisterModal }) => {
  const [formData, setFormData] = useState<{ email: string; password: string; usernameForEmailRetrieval: string }>({
    email: '',
    password: '',
    usernameForEmailRetrieval: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const navigate = useNavigate();
  const isMapPage = window.location.href.includes('/map')

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (error_response === null) {
      // Close the modal if login is successful
      onClose();
      
    }
  }, [error_response]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
    return emailRegex.test(email);
  };

  const RETRIEVE_EMAIL_API = globalVariables.baseUrl + '/authentication/api/retrieve-email-by-username/';

  const [responseMessage, setResponseMessage] = useState(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if(formData.usernameForEmailRetrieval && !formData.email){
      try{
        const user_email = await axios.get(
          `${globalVariables.baseUrl}/authentication/api/retrieve-email-by-username/${formData.usernameForEmailRetrieval}`
        );
    
        if (user_email.status === 200) {
          console.log('email ',user_email.data)
          formData.email = user_email.data.email
          setFormData({ email: user_email.data.email, password: '' ,usernameForEmailRetrieval: null});
        }

      }catch(exception){
        console.log(exception.message)
        setResponseMessage('email not found. Make sure you are registered')
      }
      

    }else {
      if (validateEmail(formData.email) && formData.password) {
        setError(null);
        onSubmit(formData);
        setFormData({ email: '', password: '' ,usernameForEmailRetrieval: ''});
        setResponseMessage(null)
      } else {
        setError('Please enter both valid email and password.');
      }
    }
    
  };

  function handleEmailRetrieval(): void {
    ReactGA.event("retrieve_email_address", {
      category: "User Engagement",
      label: "Retrieve Email Address",
    });
    throw new Error('Function not implemented.');
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={{
        overlay: { zIndex: 50, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
        content: isMobile
          ? {
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              background: 'white',
              border: 'none',
              borderRadius: 0,
              padding: 0,
              overflow: 'auto',
            }
          : {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              maxWidth: '400px',
              background: 'white',
              border: 'none',
              borderRadius: '0px 25px 25px 25px',
            },
      }}
    >
  {isOpen && (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: isMobile ? '24px 16px' : '32px',
        gap: '18px',
      }}
    >
      {isAuthenticating ? (
        <div style={{ width: '190px' }}>
          <LinearProgress color="success" />
        </div>
      ):(
        <><div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'Raleway',
                    fontStyle: 'normal',
                    fontWeight: 700,
                    fontSize: '24px',
                    lineHeight: '136.4%',
                    color: '#539987',
                    flex: 1,
                    textAlign: 'center',
                  }}
                >
                  Login
                </h3>

                <Img
                  className="h-6 w-6 common-pointer"
                  src={`${globalVariables.staticPath}img_icbaselineclose.svg`}
                  alt="close"
                  onClick={onClose} />
              </div><form
                onSubmit={handleSubmit}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                }}
              >
                  <input
                    type="text"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    style={{
                      width: '100%',
                      maxWidth: isMobile ? '100%' : '300px',
                      height: '44px',
                      border: '1px solid rgba(0, 0, 0, 0.23)',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      fontSize: '16px',
                    }} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Password"
                    style={{
                      width: '100%',
                      maxWidth: isMobile ? '100%' : '300px',
                      height: '44px',
                      border: '1px solid rgba(0, 0, 0, 0.23)',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      fontSize: '16px',
                    }} />
                  {error && (
                    <div style={{ color: 'red' }}>{error}</div>
                  )}
                  {error_response && (
                    <div style={{ color: 'red' }}>{error_response}</div>
                  )}
                  <Button
                    className={`cursor-pointer rounded-bl-[10px] rounded-br-[10px] rounded-tr-[10px] text-center text-lg tracking-[0.81px] ${isMobile ? 'w-full' : 'w-[156px]'}`}
                    color="blue_gray_500"
                    size="xs"
                    variant="fill"
                    onClick={handleSubmit}
                  >
                    Login
                  </Button>
                  <p style={{ textAlign: 'center' }}>
                    <span style={{ color: 'gray' }}>
                      Forgot your password?{' '}
                    </span>
                    <span className="common-pointer" style={{ color: '#539987' }} onClick={() => navigate("/password-reset")}>
                      Click here
                    </span>
                  </p>
                  {isMapPage && <p style={{ textAlign: 'center' }}>
                    <span style={{ color: 'gray' }}>
                      No login?{' '}
                    </span>
                    <span className="common-pointer" style={{ color: '#539987' }} onClick={() => openRegisterModal()}>
                      Register here
                    </span>
                  </p>}

                  <p style={{ textAlign: 'center' }}>
                    <span style={{ color: 'gray' }}>
                      Or
                    </span>
                    <span> </span>
                    <span className="common-pointer" style={{ color: '#539987' }} onClick={() => {window.location.href= YOMA_AUTH_URL}}>
                      login with YOMA.WORLD
                    </span>
                  </p>
                  {responseMessage && (<div>{responseMessage}</div>)}
                </form></>
      )}
      
    </div>
  )}
</Modal>

  );
};

export default LoginFormModal;
