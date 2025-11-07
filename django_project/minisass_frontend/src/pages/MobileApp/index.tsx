import BaseContainer from '../../components/BaseContainer/';
import React from "react";
import {Grid} from '@mui/material'
import {Text} from "../../components";
import Button from '@mui/material/Button';
import Box from "@mui/material/Box"
import DownloadIcon from '@mui/icons-material/Download';
import './index.css'

const MobileApp: React.FC = () => {

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
                    window.open('https://play.google.com/store/apps/details?id=com.rk.amii', '_blank')
                }}
                className="cursor-pointer font-semibold text-base text-center download-btn"
                variant="contained"
                style={{height: 70, backgroundColor: '#0e4981', paddingLeft: 50, paddingRight: 50}}
              >
                <DownloadIcon style={{fontSize: '20pt'}}/> Download miniSASS App here
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </BaseContainer>
  );
};

export default MobileApp;