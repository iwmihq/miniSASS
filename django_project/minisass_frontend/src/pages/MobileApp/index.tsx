import BaseContainer from '../../components/BaseContainer/';
import React, {useEffect, useState} from "react";
import ReactGA from "react-ga4";
import {Grid} from '@mui/material'
import {Text} from "../../components";
import Button from '@mui/material/Button';
import Box from "@mui/material/Box"
import Alert from "@mui/material/Alert"
import DownloadIcon from '@mui/icons-material/Download';
import {globalVariables} from "../../utils";
import axios from "axios";
import './index.css'

const MobileApp: React.FC = () => {
  const [mobileApp, setMobileApp] = useState<any>(null);

  useEffect(() => {
    axios.get(`${globalVariables.baseUrl}/mobile-app/`)
      .then(response => {
        setMobileApp(response.data?.file);
      })
      .catch(error => {
        console.error('Error fetching videos:', error);
      });
  }, []);

  return (
    <BaseContainer>
      <Grid container flexDirection={'column'}>
        <Grid item>
          <Text
            className="sm:flex-1 ml-2 sm:ml-[0] sm:mt-0 mt-[3px] sm:text-[32px] md:text-[38px] text-[42px] text-blue-900 w-[28%] sm:w-full"
            size="txtRalewayRomanBold42"
          >
            Mobile Apps
          </Text>
        </Grid>
        <Grid item>
          <Box>
            <Box style={{ width:"100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <Button
                onClick={() => {
                  ReactGA.event("download_mobile_app_btn_click", {
                    category: "User Engagement",
                    label: "Clicked Download miniSASS Mobile App Button",
                  });
                  if (mobileApp) {
                    window.open(mobileApp, '_blank')
                  } else {
                    alert('Mobile App is not yet available!')
                  }
                }}
                className="cursor-pointer font-semibold text-base text-center download-btn"
                variant="contained"
                style={{height: 70, backgroundColor: '#0e4981', paddingLeft: 50, paddingRight: 50}}
              >
                <DownloadIcon style={{fontSize: '20pt'}}/> Download miniSASS App here
              </Button>
            </Box>
            <Box className="mt-[50px] mb-[50px]">
              <Text
                className="sm:flex-1 ml-2 sm:ml-[0] sm:mt-0 mt-[3px] sm:text-[32px] md:text-[38px] text-[42px] text-blue-900 sm:w-full"
                size="txtRalewayRomanBold42"
              >
                How to Manually Install the MiniSASS App APK
              </Text>
            </Box>
            <Box>
              Welcome to our guide on installing the MiniSASS app through an APK file! This guide provides step-by-step instructions on how to manually install the MiniSASS app on your Android device using its APK file.
              <Alert severity="warning">
                  Note: APK (Android Package Kit) files are the raw files of an Android app. Installing apps via APK files can be useful, but it’s important to proceed with caution. APKs downloaded from outside the Google Play Store can sometimes pose security risks. Therefore, it’s crucial to download APK files from trusted sources and ensure your device’s security settings are correctly configured.
                  Follow these simple steps to safely install the MiniSASS app on your device
              </Alert>
            </Box>
            <ol>
              <li>
                <strong>Enable Installation from Unknown Sources:</strong>
                <ul style={{listStyleType: 'disc', marginLeft: '20px'}}>
                  <li>Go to your device's <em>Settings</em>.</li>
                  <li>Scroll down and select <em>Security</em> or <em>Privacy</em> (the name varies by device).</li>
                  <li>Find the option that says <em>Install apps from unknown sources</em> or <em>Unknown sources</em>,
                    and enable it. This allows the installation of apps from sources other than the Google Play Store.
                  </li>
                </ul>
              </li>
              <li>
                <strong>Download the MiniSASS APK:</strong>
                <ul style={{listStyleType: 'disc', marginLeft: '20px'}}>
                  <li>Using your device's browser, navigate to a trusted website where you can download the MiniSASS
                    APK. It's crucial to use a reputable source to avoid malware.
                  </li>
                  <li>Once you've found the APK, download it. You may receive a warning message about downloading APKs,
                    so you'll need to confirm that you understand the risks.
                  </li>
                </ul>
              </li>
              <li>
                <strong>Locate the Downloaded File:</strong>
                <ul style={{listStyleType: 'disc', marginLeft: '20px'}}>
                  <li>Open your device's <em>File Manager</em> or <em>Downloads</em> folder.</li>
                  <li>Look for the MiniSASS APK file you just downloaded.</li>
                </ul>
              </li>
              <li>
                <strong>Install the APK:</strong>
                <ul style={{listStyleType: 'disc', marginLeft: '20px'}}>
                  <li>Tap on the MiniSASS APK file.</li>
                  <li>Your device may ask for permissions to install the app; grant them.</li>
                  <li>Follow the on-screen instructions to install the app.</li>
                </ul>
              </li>
              <li>
                <strong>Launch the MiniSASS App:</strong>
                <ul style={{listStyleType: 'disc', marginLeft: '20px'}}>
                  <li>Once the installation is complete, you can open the app directly or find it in your device's app
                    drawer.
                  </li>
                </ul>
              </li>
              <li>
                <strong>Restore Your Security Settings:</strong>
                <ul style={{listStyleType: 'disc', marginLeft: '20px'}}>
                  <li>After installing the MiniSASS app, it's a good idea to go back to your security settings and
                    disable the option to install from unknown sources. This helps to keep your device secure.
                  </li>
                </ul>
              </li>
              <li>
                <strong>Regularly Update the App:</strong>
                <ul style={{listStyleType: 'disc', marginLeft: '20px'}}>
                  <li>Since you're installing the app manually, it won't update automatically. Check the source of your
                    APK file regularly for updates to ensure you have the latest version of the MiniSASS app.
                  </li>
                </ul>
              </li>
            </ol>
          </Box>
        </Grid>
      </Grid>
    </BaseContainer>
  );
};

export default MobileApp;