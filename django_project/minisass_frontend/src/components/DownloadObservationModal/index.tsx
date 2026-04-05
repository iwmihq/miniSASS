import React, {FormEvent, useState, useEffect} from 'react';
import {DownloadObservationFormData} from '../../components/ContactFormModal/types';
import {Button, Img} from "../../components";
import Modal from 'react-modal';
import axios from 'axios'
import {globalVariables} from '../../utils';
import Select from 'react-select';
import dayjs from 'dayjs';
import {DemoContainer} from '@mui/x-date-pickers/internals/demo';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import "./index.css";
import {useAuth} from "../../AuthContext";

export interface DownloadObservationFormData {
    type: string,
    includeImage: 'string',
    startDate: string,
    endDate: string,
}

interface DownloadObservationFormProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: number;
  dateRange: string[];
}

const DOWNLOAD_OBSERVATIONS_URL = globalVariables.baseUrl + '/monitor/observations/download-v2/'

const DownloadObservationForm: React.FC<DownloadObservationFormProps> = ({ isOpen, onClose,
                                                                           siteId, dateRange}) => {
  const initialState: DownloadObservationFormData = {
    type: 'csv',
    includeImage: 'yes',
    startDate: dayjs(dateRange[1]),
    endDate: dayjs(dateRange[1])
  };
  const typeOptions = [
    { value: 'csv', label: 'CSV' },
    { value: 'gpkg', label: 'GeoPackage' }
  ];
  const includeImageOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' }
  ];


  const [formData, setFormData] = useState<DownloadObservationFormData>(initialState);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);
  const [showHeading, setShowHeading] = useState<boolean>(true);
  const { dispatch, state  } = useAuth();

  useEffect(() => {
    setFormData({ ...formData, startDate: dayjs(dateRange[0]), endDate: dayjs(dateRange[1]) });
  }, [dateRange]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    downloadFile()
  };

  const downloadFile = async () => {
    try {
      const startDate = formData.startDate.format('YYYY-MM-DD');
      const endDate = formData.endDate.format('YYYY-MM-DD');
      const url = `${DOWNLOAD_OBSERVATIONS_URL}${siteId}/?type=${formData.type}&start_date=${startDate}&end_date=${endDate}&include_image=${formData.includeImage}`;
      // axios.defaults.headers.common['Authorization'] = `Bearer ${state.user.access_token}`;
      const response = await axios.get(url, { responseType: 'blob' });

      if (response.status === 200) {
        const href = URL.createObjectURL(response.data);

        // create "a" HTML element with href to file & click
        const link = document.createElement('a');
        link.href = href;
        const fileName = formData.includeImage === 'yes' ? 'observations.zip' : formData.type === 'csv' ? 'observations.csv' : 'observations.gpkg'
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();

        // clean up "a" element & remove ObjectURL
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
        setIsError(false);
        setShowHeading(false);
        setResponseMessage(null);
      } else {
        setIsError(true);
        setShowHeading(false);
        setResponseMessage('Error failed to download Observations');
      }
    } catch (error) {
      setIsError(true);
      setShowHeading(false);
      setResponseMessage('Error failed to download Observations');
    }
  };

  const resetForm = () => {
    setFormData(initialState);
    setShowHeading(true);
    setResponseMessage(null);
    setIsError(false);
  };

  const handleCloseModal = () => {
    resetForm();
    onClose();
  };


  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleCloseModal}
      style={{
        overlay: { zIndex: 50, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '605px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '0px 25px 25px 25px',
          border: 'none',
          background: 'white',
          padding: 0,
        },
      }}
    >
      {isOpen && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '24px',
            gap: '18px',
            position: 'relative',
            width: '100%',
            background: 'white',
            borderRadius: '0px 25px 25px 25px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              padding: '0px',
              gap: '10px',
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
                flex: '1',
              }}
            >
              {isError ? (
                <div className="bg-red-100 text-red-600 p-1 rounded">{responseMessage}</div>
              ) : <div>Download Observations</div>}
            </h3>
            <Img
                className="h-6 w-6 common-pointer"
                src={`${globalVariables.staticPath}img_icbaselineclose.svg`}
                alt="close"
                onClick={handleCloseModal}
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
          </div>
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '6px',
              width: '100%',
            }}
          >
        {showHeading && (
              <label>
                File Type:
              </label>
        )}
        <Select
          name="type"
          placeholder="Select File Type..."
          value={typeOptions.find(option => option.value === formData.type)}
          onChange={(selectedOption) => {
            setFormData({ ...formData, type: selectedOption.value });
          }}
          options={typeOptions}
          styles={{
            control: (styles, { isFocused }) => ({
              ...styles,
              borderRadius: '4px',
              width: '100%', maxWidth: '245px',
              borderColor: isFocused ? '#539987' : 'rgba(0, 0, 0, 0.23)',
            }),
            option: (styles, { isFocused }) => ({
              ...styles,
              backgroundColor: isFocused ? '#539987' : 'white',
              color: isFocused ? 'white' : 'black'
            }),
            menu: (styles) => ({
              ...styles,
              width: '100%', maxWidth: '245px',
            }),
          }}
        />
        {showHeading && (
          <label>
            Include Image:
          </label>
        )}
        <Select
          name="type"
          placeholder="Include Image..."
          value={includeImageOptions.find(option => option.value === formData.includeImage)}
          onChange={(selectedOption) => {
            setFormData({ ...formData, includeImage: selectedOption.value });
          }}
          options={includeImageOptions}
          styles={{
            control: (styles, { isFocused }) => ({
              ...styles,
              borderRadius: '4px',
              width: '100%', maxWidth: '245px',
              borderColor: isFocused ? '#539987' : 'rgba(0, 0, 0, 0.23)',
            }),
            option: (styles, { isFocused }) => ({
              ...styles,
              backgroundColor: isFocused ? '#539987' : 'white',
              color: isFocused ? 'white' : 'black'
            }),
            menu: (styles) => ({
              ...styles,
              width: '100%', maxWidth: '245px',
            }),
          }}
        />
        <label>
          Date Range (Inclusive):
        </label>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DemoContainer components={['DatePicker', 'DatePicker']}>
            <DatePicker
              label="Start Date"
              format="DD-MM-YYYY"
              value={formData.startDate}
              onChange={(newValue) => setFormData({ ...formData, startDate: newValue })}
              minDate={dayjs(dateRange[0])}
              maxDate={dayjs(dateRange[1])}
            />
            <DatePicker
              label="End Date"
              format="DD-MM-YYYY"
              value={formData.endDate}
              onChange={(newValue) => setFormData({ ...formData, endDate: newValue })}
              minDate={dayjs(dateRange[0])}
              maxDate={dayjs(dateRange[1])}
            />
          </DemoContainer>
        </LocalizationProvider>
      </form>
          <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '10px',
                width: '100%',
              }}
            >
              <Button
                className="cursor-pointer rounded-bl-[10px] rounded-br-[10px] rounded-tr-[10px] text-center text-lg tracking-[0.81px] w-[156px]"
                color="blue_gray_500"
                size="xs"
                variant="fill"
                onClick={handleSubmit}
              >
                Download
              </Button>
            </div>
        </div>
      )}
    </Modal>
  );
};

export default DownloadObservationForm;
