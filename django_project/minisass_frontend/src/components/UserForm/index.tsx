import React, {useEffect} from 'react';
import Modal from 'react-modal';
import {Button, Img} from "../../components";
import {globalVariables} from '../../utils';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import EditProfile from './EditProfile'
import EditPassword from './EditPassword'
import UploadCertificate from './UploadCertificate'
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import './index.css'

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      style={{width: '100%'}}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `vertical-tab-${index}`,
    'aria-controls': `vertical-tabpanel-${index}`,
  };
}


interface FormModalProps {
  isOpen: boolean;
  onClose: void;
  defaultTab: number;
  loading: boolean;
  inProgress: boolean;
}


const UserFormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  defaultTab,
 }) => {
  const [value, setValue] = React.useState(defaultTab);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [itemUpdated, setItemUpdated] = React.useState<string>('');
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const closeSuccessMessage = () => {
    setSuccess(false);
  }

  useEffect(() => {
    setValue(defaultTab ? defaultTab : 0)
  }, [isOpen]);


  return (
    <>
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
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
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'white',
          border: 'none',
          borderRadius: '0px 25px 25px 25px',
          overflowX: 'hidden',
          padding: 0,
        },
      }}
    >
      {loading ? (
        <LinearProgress color="success" />
      ) : success ? (
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
              Success
            </h3>
            <br />
          <Typography>
            {`${itemUpdated} has been successfully updated.`}
          </Typography>

          <Button
              className="cursor-pointer rounded-bl-[10px] rounded-br-[10px] rounded-tr-[10px] text-center text-lg tracking-[0.81px] w-[156px]"
              color="blue_gray_500"
              size="xs"
              variant="fill"
              style={{ marginLeft: "auto", display: 'block' }}
              onClick={closeSuccessMessage}
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
            padding: '24px',
            gap: '18px',
            position: 'relative',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
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
                margin: 0,
              }}
            >
              Update Account
            </h3>
            <Img
              className="h-6 w-6 common-pointer"
              src={`${globalVariables.staticPath}img_icbaselineclose.svg`}
              alt="close"
              onClick={onClose}
            />
          </div>
          <Box
            sx={{
              bgcolor: 'background.paper',
              width: '100%',
              display: { xs: 'block', sm: 'flex' },
            }}
          >
            {/* Tabs — horizontal on mobile, vertical on desktop */}
            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={value}
              onChange={handleChange}
              aria-label="Account settings tabs"
              sx={{
                display: { xs: 'none', sm: 'flex' },
                borderRight: 1,
                borderColor: 'divider',
                minWidth: '180px',
                flexShrink: 0,
              }}
            >
              <Tab label="Profile" {...a11yProps(0)} />
              <Tab label="Change Password" {...a11yProps(2)} />
              <Tab label="Upload Certificate" {...a11yProps(3)} />
            </Tabs>
            <Tabs
              value={value}
              onChange={handleChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="Account settings tabs"
              sx={{
                display: { xs: 'flex', sm: 'none' },
                borderBottom: 1,
                borderColor: 'divider',
                mb: 1,
              }}
            >
              <Tab label="Profile" {...a11yProps(0)} />
              <Tab label="Password" {...a11yProps(2)} />
              <Tab label="Certificate" {...a11yProps(3)} />
            </Tabs>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <TabPanel value={value} index={0}>
                <EditProfile
                  setLoading={setLoading}
                  setSuccess={setSuccess}
                  setItemUpdated={setItemUpdated}
                />
              </TabPanel>
              <TabPanel value={value} index={1}>
                <EditPassword
                  setLoading={setLoading}
                  setSuccess={setSuccess}
                  setItemUpdated={setItemUpdated}
                />
              </TabPanel>
              <TabPanel value={value} index={2}>
                <UploadCertificate
                  setLoading={setLoading}
                  setSuccess={setSuccess}
                  setItemUpdated={setItemUpdated}
                />
              </TabPanel>
            </Box>
          </Box>
        </div>
      )
      )}
    </Modal>
  </>
  );
};

export default UserFormModal;