import React, {ChangeEvent, FormEvent, useEffect, useState} from 'react';
import {Button} from "../../components";
import Select from "react-select";
import CountrySelector from "../../components/Countries/selector";
import {COUNTRIES} from "../../components/Countries/countries";
import {SelectMenuOption} from "../../components/Countries/types";
import {globalVariables} from '../../utils';
import axios from "axios";
import {useAuth} from "../../AuthContext";
import Box from '@mui/material/Box';
import {Grid} from "@mui/material";


interface FormData {
  username: string;
  name: string;
  surname: string;
  email: string;
  organisation_type: string;
  organisation_name: string;
  country: string;
  is_expert: boolean;
}

interface EditProfileInterface {
  setLoading: (val: boolean) => void;
  setSuccess: (val: boolean) => void;
  setItemUpdated: (val: boolean) => void;
}

const UPDATE_PROFILE = globalVariables.baseUrl + '/authentication/api/user/update/'

const EditProfile: React.FC<EditProfileInterface> = ({
  setLoading,
  setSuccess,
  setItemUpdated
}) => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    name: '',
    surname: '',
    email: '',
    organisation_type: '',
    organisation_name: '',
    country: 'ZA',
    is_expert: false
  });
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [isCountrySelectorOpen, setIsCountrySelectorOpen] = useState(false);
  // Default this to a country's code to preselect it
  const [errorResponse, setErrorResponse] = useState(null);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const {dispatch, state} = useAuth();

  const organisationOptions = [
    {value: 'School', label: 'School'},
    {value: 'NGO', label: 'NGO'},
    {value: 'Conservancy', label: 'Conservancy'},
    {value: 'Private Individual', label: 'Private Individual'},
    {value: 'Government Department', label: 'Government Department'},
    {value: 'Consultancy', label: 'Consultancy'},
    {value: 'University', label: 'University'},
    {value: 'Other', label: 'Other'},
  ]

  const customStyles = {
    control: (styles, {isFocused}) => ({
      ...styles,
      borderRadius: '4px',
      width: '100%',
      borderColor: isFocused ? '#539987' : 'rgba(0, 0, 0, 0.23)',

    }),
    option: (styles, {isFocused}) => ({
      ...styles,
      backgroundColor: isFocused ? '#539987' : 'transparent',
      color: isFocused ? 'white' : 'black',
    }),
    menu: (styles) => ({
      ...styles,
      width: '100%',
    }),
  };

  const fetchUserDetail = async () => {
    const headers = {'Authorization': `Bearer ${state.user.access_token}`};
    axios.get(UPDATE_PROFILE, {headers}).then((response) => {
      if (response.data) {
        const country = COUNTRIES.find((option) => option.value === response.data.country) ?
          COUNTRIES.find((option) => option.value === response.data.country).value : 'ZA'
        const newFormData = {
          ...response.data,
          country: country,
        }
        setFormData(newFormData)
      }
    }).catch((error) => {
      console.log(error)
      setErrorResponse(error)
    })
  }

  const handleUpdateProfile = async (data) => {
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.user.access_token}`;

      const response = await axios.post(UPDATE_PROFILE, data, {
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
          setItemUpdated('Profile')
          setErrorResponse(null);
        }, 1200);
      } else {
        setErrorResponse(JSON.stringify(response.data));
      }
    } catch (err) {
      if (err.response?.data) {
        setErrorResponse(err.response.data.error);
      } else {
        setErrorResponse(err.message);
      }
    }
  };

  useEffect(() => {
    fetchUserDetail()
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const errors: Partial<FormData> = {};

    // Validate email when it loses focus
    if (!formData.email) {
      errors.email = 'This field is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Invalid email address';
    }

    // Check for other required fields
    if (!formData.username) {
      errors.username = 'Username is required';
    }
    if (!formData.name) {
      errors.name = 'Name is required';
    }
    if (!formData.surname) {
      errors.surname = 'Surname is required';
    }
    if (!formData.organisation_type) {
      errors.organisation_type = 'Organization Type is required';
    }
    if (!formData.organisation_name) {
      errors.organisation_name = 'Organization Name is required';
    }
    if (!formData.country) {
      errors.country = 'Country is required';
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      if (validateForm()) {
        handleUpdateProfile(formData);
        setIsEdit(!isEdit);
      }
    } else {
      setIsEdit(!isEdit);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {name, value} = e.target;
    setFormData({...formData, [name]: value});
  };

  const handleEmailBlur = () => {
    if (formData.email) {
      if (!validateEmail(formData.email)) {
        setFormErrors({...formErrors, email: 'Invalid email address'});
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
                <label>Username:</label><br/>
              </Grid>
              <Grid item>
                <Grid container flexDirection={'column'}>
                  <Grid item>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Username"
                      style={{borderRadius: '4px', width: '100%'}}
                      disabled={!isEdit}
                    />
                  </Grid>
                  <Grid item>
                    {formErrors.username && <span style={{color: 'red'}}>{formErrors.username}</span>}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Grid item>
            <Grid container direction={'row'}>
              <Grid item className={'label'}>
                <label>Email:</label><br/>
              </Grid>
              <Grid item>
                <Grid container flexDirection={'column'}>
                  <Grid item>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleEmailBlur}
                      placeholder="Email"
                      style={{borderRadius: '4px', width: '100%'}}
                      disabled={!isEdit}
                    />
                  </Grid>
                  <Grid item>
                    {formErrors.email && <span style={{color: 'red'}}>{formErrors.email}</span>}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Grid item>
            <Grid container direction={'row'}>
              <Grid item className={'label'}>
                <label>Name:</label><br/>
              </Grid>
              <Grid item>
                <Grid container flexDirection={'column'}>
                  <Grid item>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Name"
                      style={{borderRadius: '4px', width: '100%'}}
                      disabled={!isEdit}
                    />
                  </Grid>
                  <Grid item>
                    {formErrors.name && <span style={{color: 'red'}}>{formErrors.name}</span>}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Grid item>
            <Grid container direction={'row'}>
              <Grid item className={'label'}>
                <label>Surname:</label><br/>
              </Grid>
              <Grid item>
                <Grid container flexDirection={'column'}>
                  <Grid item>
                    <input
                      type="text"
                      name="surname"
                      value={formData.surname}
                      onChange={handleInputChange}
                      placeholder="Surname"
                      style={{borderRadius: '4px', width: '100%'}}
                      disabled={!isEdit}
                    />
                  </Grid>
                  <Grid item>
                    {formErrors.surname && <span style={{color: 'red'}}>{formErrors.surname}</span>}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Grid item>
            <Grid container direction={'row'}>
              <Grid item className={'label'}>
                <label>Organisation Name:</label><br/>
              </Grid>
              <Grid item>
                <Grid container flexDirection={'column'}>
                  <Grid item>
                    <input
                      type="text"
                      name="organisation_name"
                      value={formData.organisation_name}
                      onChange={handleInputChange}
                      placeholder="Organization Name"
                      style={{borderRadius: '4px', width: '100%'}}
                      disabled={!isEdit}
                    />
                  </Grid>
                  <Grid item>
                    {formErrors.organisation_name && <span style={{color: 'red'}}>{formErrors.organisation_name}</span>}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Grid item>
            <Grid container direction={'row'}>
              <Grid item className={'label'}>
                <label>Organisation Type:</label>
              </Grid>
              <Grid item>
                <Grid container flexDirection={'column'}>
                  <Grid item>
                    <Select
                      name="organisation_type"
                      placeholder="Select an organization type..."
                      value={organisationOptions.find(option => option.value === formData.organisation_type)}
                      onChange={(selectedOption) => {
                        setFormErrors({...formErrors, organisation_type: ''});
                        setFormData({...formData, organisation_type: selectedOption.value});
                      }}
                      options={organisationOptions}
                      styles={customStyles}
                      isDisabled={!isEdit}
                    />
                  </Grid>
                  <Grid item>
                    {formErrors.organisation_type && <span style={{color: 'red'}}>{formErrors.organisation_type}</span>}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Grid item>
            <Grid container direction={'row'}>
              <Grid item className={'label'}>
                <label>Country:</label>
              </Grid>
              <Grid item style={{ width: '100%' }}>
                <Grid container flexDirection={'column'}>
                  <Grid item>
                    <CountrySelector
                      id={"country-selector"}
                      open={isCountrySelectorOpen}
                      onToggle={() => setIsCountrySelectorOpen(!isCountrySelectorOpen)}
                      onChange={(val: SelectMenuOption["value"]) => {
                        setFormData({...formData, ['country']: val});
                      }}
                      selectedValue={COUNTRIES.find((option) => option.value === formData.country)}
                      disabled={!isEdit}
                    />
                  </Grid>
                  <Grid item>
                    {formErrors.country && <span style={{color: 'red'}}>{formErrors.country}</span>}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Grid item>
            <Grid container direction={'row'}>
              <Grid item className={'label'}>
                <label>Expertise:</label><br/>
              </Grid>
              <Grid item>
                <Grid container flexDirection={'column'}>
                  <Grid item>
                    <input
                      type="text"
                      name="level"
                      value={formData.is_expert ? 'Expert' : 'Novice'}
                      onChange={handleInputChange}
                      placeholder="Level"
                      style={{borderRadius: '4px', width: '100%'}}
                      disabled
                    />
                  </Grid>
                  <Grid item>
                    {formErrors.surname && <span style={{color: 'red'}}>{formErrors.surname}</span>}
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
                      {isEdit ? 'Save' : 'Update Profile'}
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

export default EditProfile;