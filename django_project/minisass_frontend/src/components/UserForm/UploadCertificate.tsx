import React, {FormEvent, useEffect, useState} from 'react';
import {Button} from "../../components";
import {globalVariables} from '../../utils';
import axios from "axios";
import {useAuth} from "../../AuthContext";
import Box from '@mui/material/Box';
import {Grid} from "@mui/material";

interface FormDataInterface {
  certificate: string;
}

interface UploadCertiicateInterface {
  setLoading: (val: boolean) => void;
  setSuccess: (val: boolean) => void;
  setItemUpdated: (val: boolean) => void;
}

const UPLOAD_CERTIFICATE_URL = globalVariables.baseUrl + '/authentication/api/user/certificate/upload/'

const EditPassword: React.FC<UploadCertiicateInterface> = ({
  setLoading,
  setSuccess,
  setItemUpdated
}) => {
  const [formData, setFormData] = useState<FormDataInterface>({
    certificate: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<FormDataInterface>>({});
  // Default this to a country's code to preselect it
  const [errorResponse, setErrorResponse] = useState(null);
  const [certificate, setCertificate] = useState<null | string>(null);
  const {dispatch, state} = useAuth();

  const fetchCertificate = async () => {
    const headers = {'Authorization': `Bearer ${state.user.access_token}`};
    axios.get(UPLOAD_CERTIFICATE_URL, {headers}).then((response) => {
      if (response.data) {
        setCertificate(response.data.certificate)
      }
    }).catch((error) => {
      console.log(error)
      setErrorResponse(error)
    })
  }

  const handleUploadCertificate = async (data) => {
    try {
      let newFormData = new FormData();
      newFormData.append('certificate', data.certificate);
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.user.access_token}`;

      const response = await axios.post(UPLOAD_CERTIFICATE_URL, newFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        }
      );

      if (response.status === 200) {
        setCertificate(response.data.certificate)
        setLoading(true)
        // Simulate 2-second delay for update process
        setTimeout(() => {
          setLoading(false);
          setSuccess(true);
          setItemUpdated('Certificate');
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

  const validateForm = () => {
    const errors: Partial<FormDataInterface> = {};
    if (!formData.certificate) {
      errors.certificate = 'Certificate is required';
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      handleUploadCertificate(formData);
    }
  };

  const handleFileChange = (e: any) => {
    setFormData({ ...formData, 'certificate': e.target.files[0] });
  }

  useEffect(() => {
    fetchCertificate()
  }, []);

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
                <label>Certificate:</label><br/>
              </Grid>
              <Grid item>
                <input
                  type="file"
                  name="certificate"
                  onChange={handleFileChange}
                  placeholder="Certificate"
                  style={{borderRadius: '4px', width: '100%'}}
                />
              </Grid>
            </Grid>
          </Grid>
          { certificate && <Grid item>
            <a href={certificate} target={'_blank'}>See uploaded certificate</a>
            </Grid>}

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
                      Upload
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