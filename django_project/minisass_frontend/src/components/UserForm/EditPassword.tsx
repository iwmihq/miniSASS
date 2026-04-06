import React, {ChangeEvent, FormEvent, useEffect, useState} from 'react';
import {Button} from "../../components";
import {globalVariables} from '../../utils';
import axios from "axios";
import {useAuth} from "../../AuthContext";
import Box from '@mui/material/Box';
import {Grid} from "@mui/material";

interface FormData {
  password: string;
  confirm_password: string;
  old_password: string;
}

interface EditPasswordInterface {
  setLoading: (val: boolean) => void;
  setSuccess: (val: boolean) => void;
  setItemUpdated: (val: boolean) => void;
}

const UPDATE_PASSWORD_URL = globalVariables.baseUrl + '/authentication/api/user/password/update/'

const EditPassword: React.FC<EditPasswordInterface> = ({
  setLoading,
  setSuccess,
  setItemUpdated
}) => {
  const [formData, setFormData] = useState<FormData>({
    password: '',
    confirm_password: '',
    old_password: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  // Default this to a country's code to preselect it
  const [errorResponse, setErrorResponse] = useState(null);
  const [remainingRequirements, setRemainingRequirements] = useState({
    uppercase: true,
    lowercase: true,
    digit: true,
    specialCharacter: true,
    length: true,
  });
  const {dispatch, state} = useAuth();

  const handleUpdatePassword = async (data) => {
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.user.access_token}`;

      const response = await axios.post(UPDATE_PASSWORD_URL, data, {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        setLoading(true)
        // Simulate 2-second delay for update process
        setTimeout(() => {
          setLoading(false);
          setSuccess(true);
          setItemUpdated('Password');
          setErrorResponse(null);
        }, 1200);
      } else {
        setErrorResponse(JSON.stringify(response.data));
      }
    } catch (err) {
      if (err.response?.data) {
        setErrorResponse(err.response.data.error);
        const errors: Partial<FormData> = {};
        errors.old_password = err.response.data.old_password
        errors.password = err.response.data.password
        setFormErrors(errors);
      } else {
        setErrorResponse(err.message);
      }
    }
  };

  const validateForm = () => {
    const errors: Partial<FormData> = {};
    if (!formData.old_password) {
      errors.old_password = 'Old Password is required';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    if (!formData.confirm_password) {
      errors.confirm_password = 'Confirm Password is required';
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      handleUpdatePassword(formData);
    }
  };

  useEffect(() => {
    if (formData.password !== formData.confirm_password) {
      setFormErrors({ ...formErrors, confirm_password: 'Passwords do not match.' });
    } else {
      setFormErrors({ ...formErrors, confirm_password: '' });
    }
  }, [formData.password, formData.confirm_password]);

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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {name, value} = e.target;
    setFormData({...formData, [name]: value});

    if (name === 'password') {
      const newPassword = { ...formData, [name]: value };

      const remaining = validatePassword(newPassword.password, newPassword.confirm_password);
      setRemainingRequirements(remaining);
      if (formErrors.password == 'This password has been used before. Please choose a new and unique password.') {
        setFormErrors({});
      }
    }
  };

  return (
    <Box>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <Grid container flexDirection={'column'} spacing={1}>
          <Grid item>
            <Grid container direction={'row'}>
              <Grid item className={'label'}>
                <label>Old Password:</label>
              </Grid>
              <Grid item>
                <input
                  type="password"
                  name="old_password"
                  value={formData.old_password}
                  onChange={handleInputChange}
                  placeholder="Old Password"
                  style={{borderRadius: '4px', width: '100%'}}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            <Grid container direction={'row'}>
              <Grid item className={'label'}>
                <label>New Password:</label>
              </Grid>
              <Grid item>
                <Grid container flexDirection={'column'}>
                  <Grid item>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="New Password"
                      style={{borderRadius: '4px', width: '100%'}}
                    />
                  </Grid>
                  <Grid item style={{width: '100%'}}>
                    {remainingRequirements.uppercase && <span style={{ color: 'red' }}>At least one uppercase letter is required.<br /></span>}
                    {remainingRequirements.lowercase && <span style={{ color: 'red' }}>At least one lowercase letter is required.<br /></span>}
                    {remainingRequirements.digit && <span style={{ color: 'red' }}>At least one digit is required.<br /></span>}
                    {remainingRequirements.specialCharacter && <span style={{ color: 'red' }}>At least one special character is required.<br /></span>}
                    {remainingRequirements.length && <span style={{ color: 'red' }}>Password must be at least 6 characters long.<br /></span>}
                    {formErrors.password && <span style={{ color: 'red' }}>{formErrors.password}</span>}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            <Grid container direction={'row'}>
              <Grid item className={'label'}>
                <label>Confirm New Password:</label>
              </Grid>
              <Grid item>
                <Grid container flexDirection={'column'}>
                  <Grid item>
                    <input
                      type="password"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      placeholder="Confirm New password"
                      style={{borderRadius: '4px', width: '100%'}}
                    />
                  </Grid>
                  <Grid item>
                      {formErrors.confirm_password && <span style={{color: 'red'}}>{formErrors.confirm_password}</span>}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Grid item>
            <Grid container direction={'row'}>
              <Grid item className={'label'}>
              </Grid>
              <Grid item>
                <Grid container flexDirection={'column'}>
                  <Grid item>
                    {errorResponse && (
                      <div style={{color: 'red'}}>{errorResponse}</div>
                    )}
                  </Grid>
                  <Grid item>
                    <Button
                      className="cursor-pointer rounded-bl-[10px] rounded-br-[10px] rounded-tr-[10px] text-center text-lg tracking-[0.81px] w-[156px]"
                      color="blue_gray_500"
                      size="xs"
                      variant="fill"
                      style={{marginRight: "-80%"}}
                      onClick={handleSubmit}
                    >
                      Save
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

        </Grid>
      </form>
    </Box>
  )
}

export default EditPassword;