import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import Modal from 'react-modal';
import { HashLink } from 'react-router-hash-link';
import { Button , Img} from "../../components";
import Select from "react-select";
import CountrySelector from "../../components/Countries/selector";
import { COUNTRIES } from "../../components/Countries/countries";
import { SelectMenuOption } from "../../components/Countries/types";
import { globalVariables } from '../../utils';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import ReactGA from "react-ga4";


interface RegistrationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RegistrationFormData) => void;
  error_response: string | null | boolean;
  Registrationloading: boolean;
  registrationInProgress: boolean;
}

interface RegistrationFormData {
  username: string;
  name: string;
  surname: string;
  email: string;
  organizationType: string;
  organizationName: string;
  country: string;
  password: string;
  confirmPassword: string;
}

const RegistrationFormModal: React.FC<RegistrationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  error_response,
  Registrationloading,
  registrationInProgress
 }) => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    username: '',
    name: '',
    surname: '',
    email: '',
    organizationType: '',
    organizationName: '',
    country: 'ZA',
    password: '',
    confirmPassword: '',
    agree: true,
  });
  const [agreed, setAgreed] = useState(false);

  const [formErrors, setFormErrors] = useState<Partial<RegistrationFormData>>({});
  const [isCountrySelectorOpen, setIsCountrySelectorOpen] = useState(false);
  // Default this to a country's code to preselect it
  const [country, setCountry] = useState<SelectMenuOption["value"]>("ZA");

  useEffect(() => {
    ReactGA.event("open_registration_form", {
      category: "User Engagement",
      label: "Open Registration Form",
    });
  }, []);

  useEffect(() => {
    if (error_response === false) {
      // Reset form data and close the registration modal
      setFormErrors({});
      setFormData({
        username: '',
        name: '',
        surname: '',
        email: '',
        organizationType: '',
        organizationName: '',
        country: 'ZA',
        password: '',
        confirmPassword: '',
      });
      onClose();
    }
  }, [error_response]);

  // TODO fetch from db and populate variable with results
  const organisationOptions = [
    { value: 'School', label: 'School' },
    { value: 'NGO', label: 'NGO' },
    { value: 'Conservancy', label: 'Conservancy' },
    { value: 'Private Individual', label: 'Private Individual' },
    { value: 'Government Department', label: 'Government Department' },
    { value: 'Consultancy', label: 'Consultancy' },
    { value: 'University', label: 'University' },
    { value: 'Other', label: 'Other' },
  ]

  const customStyles = {
    control: (styles, { isFocused }) => ({
      ...styles,
      borderRadius: '4px',
      minWidth: '11.5vw',
      borderColor: isFocused ? '#539987' : 'rgba(0, 0, 0, 0.23)',

    }),
    option: (styles, { isFocused }) => ({
      ...styles,
      backgroundColor: isFocused ? '#539987' : 'transparent',
      color: isFocused ? 'white' : 'black',
    }),
    menu: (styles) => ({
      ...styles,
      minWidth: '11.5vw',
    }),
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    const newPassword = { ...formData, [name]: value };

    const remaining = validatePassword(newPassword.password, newPassword.confirmPassword);
    setRemainingRequirements(remaining);

    setFormErrors({ ...formErrors, [name]: '' });
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
    return emailRegex.test(email);
  };

  const [remainingRequirements, setRemainingRequirements] = useState({
    uppercase: true,
    lowercase: true,
    digit: true,
    specialCharacter: true,
    length: true,
  });

  const validatePassword = (password, confirmPassword) => {
    const requirements = {
      uppercase: /^(?=.*[A-Z])/,
      lowercase: /^(?=.*[a-z])/,
      digit: /^(?=.*\d)/,
      specialCharacter: /^(?=.*[@$!%*?&])/,
      length: /^.{6,}$/,
    };

    const remainingRequirements = {
      uppercase: !requirements.uppercase.test(password),
      lowercase: !requirements.lowercase.test(password),
      digit: !requirements.digit.test(password),
      specialCharacter: !requirements.specialCharacter.test(password),
      length: !requirements.length.test(password),
    };

    return remainingRequirements;
  };


  const handleEmailBlur = () => {
    if (formData.email) {
      if (!validateEmail(formData.email)) {
        setFormErrors({ ...formErrors, email: 'Invalid email address' });
      }
    }
  };

  useEffect(() => {
    if (formData.password !== formData.confirmPassword) {
      setFormErrors({ ...formErrors, confirmPassword: 'Passwords do not match.' });
    } else {
      setFormErrors({ ...formErrors, confirmPassword: '' });
    }
  }, [formData.password, formData.confirmPassword]);

  const validateForm = () => {
    const errors: Partial<RegistrationFormData> = {};

    // Validate email when it loses focus
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Invalid email address';
    }

    // Check for other required fields
    if (!formData.name) {
      errors.name = 'Name is required';
    }
    if (!formData.surname) {
      errors.surname = 'Surname is required';
    }
    if (!formData.organizationType) {
      errors.organizationType = 'Organization Type is required';
    }
    if (!formData.organizationName) {
      errors.organizationName = 'Organization Name is required';
    }
    if (!formData.country) {
      errors.country = 'Country is required';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm Password is required';
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    ReactGA.event("click_register_btn", {
      category: "User Engagement",
      label: "Click Register Button",
    });
    e.preventDefault();

    if (validateForm() && !Object.values(remainingRequirements).some((requirement) => requirement)) {
      onSubmit(formData);
      // setFormErrors({});
      // setFormData({
      //   username: '',
      //   name: '',
      //   surname: '',
      //   email: '',
      //   organizationType: '',
      //   organizationName: '',
      //   country: 'ZA',
      //   password: '',
      //   confirmPassword: '',
      // });
    }
  };

  // Use the effect to set the user's country based on geolocation
  useEffect(() => {
    if (isOpen) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Get user's latitude and longitude
          const { latitude, longitude } = position.coords;

          // Use reverse geocoding to get the country based on coordinates
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then((response) => response.json())
            .then((data) => {
              if (data.address && data.address.country_code) {
                const userCountryCode = data.address.country_code.toUpperCase();
                setCountry(userCountryCode);
              }
            })
            .catch((error) => {
              console.error('Error fetching user location:', error);
            });
        },
        (error) => {
          console.error('Error getting user location:', error);
          // Set default country ,if geoLocation fails
          setCountry('ZA');
        }
      );
    }
  }, [isOpen]);

  const [applyDeviceStyles, setApplyDeviceStyles] = useState(false);

  //choose the screen size
  const handleResize = () => {
    if (window.innerWidth < 600) {
      setApplyDeviceStyles(true)
    } else {
      setApplyDeviceStyles(false)
    }
  };

  // create an event listener
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    handleResize();
  });



return (
  <>
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          /* On mobile we slightly reduce the left translation so the modal
             appears a bit shifted-right, and we make width fit the screen */
          transform: applyDeviceStyles ? 'translate(-45%, -50%)' : 'translate(-50%, -50%)',
          background: 'white',
          border: 'none',
          borderRadius: '0px 25px 25px 25px',
          overflowY: 'auto',
          /* mobile: almost full width with small gutters; desktop: keep original behavior */
          width: applyDeviceStyles ? 'calc(100% - 32px)' : undefined,
          maxWidth: applyDeviceStyles ? 'none' : undefined,
          /* always limit height so it doesn't overflow the viewport */
          maxHeight: '90vh',
          boxSizing: 'border-box',
          /* smaller padding on mobile */
          padding: applyDeviceStyles ? '20px' : '32px',
        },
      }}
    >
      {Registrationloading ? (
        <div style={{ width: applyDeviceStyles? '180px':'535px'}}>
          <LinearProgress color="success" />
        </div>
      ) : registrationInProgress ? (
        <div>
          <h3
              style={{
                fontFamily: 'Raleway',
                fontStyle: 'normal',
                fontWeight: 700,
                alignItems: 'flex-start',
                fontSize: '24px',
                lineHeight: '136.4%',
                color: '#539987',
              }}
            >
              Registration in progress
            </h3>
            <br />
          <Typography>
            To complete your registration, please click on the activation link sent to the email you provided. Please note that it may take a few minutes for the email to arrive. We appreciate your patience.
          </Typography>


          <br />
          <Button
              className="cursor-pointer rounded-bl-[10px] rounded-br-[10px] rounded-tr-[10px] text-center text-lg tracking-[0.81px] w-[156px]"
              color="blue_gray_500"
              size="xs"
              variant="fill"
              style={{ marginLeft: "77%" }}
              onClick={onClose}
            >
              Ok
            </Button>
        </div>
      ) : (


      isOpen && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '32px',
            gap: '18px',
            position: 'relative',
            overflowY: 'auto',
            height: applyDeviceStyles?'50vh': ''
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: applyDeviceStyles? 'column':'row',
              alignItems: 'flex-start',
              padding: '0px',
              gap: '55%',
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
              }}
            >
              Registration Form
            </h3>
            <Img
                className="h-6 w-6 common-pointer"
                src={`${globalVariables.staticPath}img_icbaselineclose.svg`}
                alt="close"
                onClick={onClose}
                style={{marginLeft: '100px'}}
              />
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'start',
              gap: '10px',
              marginTop: '5px'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: applyDeviceStyles ? 'column' : 'row',
                gap: applyDeviceStyles ? '10px' : '40px'
              }}
            >
              <div style={{flex: 1, flexDirection: 'column'}}>
                <label>Email:</label><br/>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleEmailBlur}
                  placeholder="Email"
                  style={{borderRadius: '4px'}}
                />
                <br/>
                {formErrors.email && <span style={{color: 'red'}}>{formErrors.email}</span>}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: applyDeviceStyles ? 'column' : 'row',
                gap: applyDeviceStyles ? '10px' : '40px'
              }}
            >
              <div style={{}}>
                <label>Name:</label><br/>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Name"
                  style={{borderRadius: '4px'}}
                />
                <br/>
                {formErrors.name && <span style={{color: 'red'}}>{formErrors.name}</span>}
              </div>
              <div style={{}}>
                <label>Surname:</label><br/>
                <input
                  type="text"
                  name="surname"
                  value={formData.surname}
                  onChange={handleInputChange}
                  placeholder="Surname"
                  style={{borderRadius: '4px'}}
                />
                <br/>
                {formErrors.surname && <span style={{color: 'red'}}>{formErrors.surname}</span>}
              </div>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: applyDeviceStyles ? 'column' : 'row',
              gap: applyDeviceStyles ? '10px' : '40px'
            }}>
              <div style={{flex: 1, flexDirection: 'column', marginLeft: '0px'}}>
                <label>Organisation Name:</label><br/>
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  placeholder="Organization Name"
                  style={{borderRadius: '4px'}}
                />
                <br/>
                {formErrors.organizationName && <span style={{color: 'red'}}>{formErrors.organizationName}</span>}
              </div>
              <div style={{height: '20px'}}>
                <label>Organisation Type:</label>
                <br/>
                <Select
                  name="organizationType"
                  placeholder="Select an organization"
                  value={organisationOptions.find(option => option.value === formData.organizationType)}
                  onChange={(selectedOption) => {
                    setFormErrors({...formErrors, organizationType: ''});
                    setFormData({...formData, organizationType: selectedOption.value});
                  }}
                  options={organisationOptions}
                  styles={customStyles}
                />
                {formErrors.organizationType && <span style={{color: 'red'}}>{formErrors.organizationType}</span>}
              </div>
            </div>
            {applyDeviceStyles && (<><br/><br/></>)}

            <div style={{
              display: 'flex',
              flexDirection: applyDeviceStyles ? 'column' : 'row',
              gap: applyDeviceStyles ? '10px' : '40px',
              width: '200px'
            }}>
              <div style={{}}>
                <label>Password:</label><br/>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  style={{borderRadius: '4px'}}
                />
                <br/>
                {formErrors.password && <span style={{color: 'red'}}>{formErrors.password}</span>}
                {formData.password && (
                  <div style={{}}>
                    {remainingRequirements.uppercase &&
                      <span style={{color: 'red'}}>At least one uppercase letter is required.<br/></span>}
                    {remainingRequirements.lowercase &&
                      <span style={{color: 'red'}}>At least one lowercase letter is required.<br/></span>}
                    {remainingRequirements.digit &&
                      <span style={{color: 'red'}}>At least one digit is required.<br/></span>}
                    {remainingRequirements.specialCharacter &&
                      <span style={{color: 'red'}}>At least one special character is required.<br/></span>}
                    {remainingRequirements.length &&
                      <span style={{color: 'red'}}>Password must be at least 6 characters long.<br/></span>}
                  </div>
                )}
              </div>
              <div style={{}}>
                <label>Confirm Password:</label><br/>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm Password"
                  style={{borderRadius: '4px'}}
                />
                <br/>
                {formErrors.confirmPassword && <span style={{color: 'red'}}>{formErrors.confirmPassword}</span>}
              </div>
            </div>
            <div style={{width: '230px'}}>
              <label>Country:</label>
              <CountrySelector
                id={"country-selector"}
                open={isCountrySelectorOpen}
                onToggle={() => setIsCountrySelectorOpen(!isCountrySelectorOpen)}
                onChange={setCountry}
                selectedValue={COUNTRIES.find((option) => option.value === country)}
              />
              {formErrors.country && <span style={{color: 'red'}}>{formErrors.country}</span>}
            </div>

            <div style={{width: '446px'}}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="agree"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                }
                label={
                  <span>
                    I have read and agree to{' '}
                    <HashLink
                      to="/privacy-policy#privacy-policy-title"
                      style={{ color: '#0e4981', textDecoration: 'none' }}
                    >
                      Privacy Policy
                    </HashLink>
                  </span>
                }
              />
            </div>

            <div style={{}}>

            </div>

            {error_response && (
              <div style={{color: 'red'}}>{error_response}</div>
            )}
            <Button
              className="cursor-pointer rounded-bl-[10px] rounded-br-[10px] rounded-tr-[10px] text-center text-lg tracking-[0.81px] w-[156px]"
              color="blue_gray_500"
              size="xs"
              variant="fill"
              style={{marginLeft: applyDeviceStyles ? "" : "65%"}}
              onClick={handleSubmit}
              disabled={!agreed}
            >
              Register
            </Button>
          </form>
        </div>
      )
      )}
    </Modal>
  </>
);


};

export default RegistrationFormModal;
