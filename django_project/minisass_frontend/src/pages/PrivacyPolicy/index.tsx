import React from "react";

import {Text} from "../../components";
import AppShell from "../../components/AppShell";
import {Box, Container, List, ListItem, ListItemIcon, ListItemText, Paper, Typography} from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';

import "../../pages/PrivacyPolicy/styles.css"


const PrivacyPolicyPage: React.FC = () => {
  return (
    <AppShell activePage="privacy-policy">
      <div className="bg-white-A700 flex flex-col font-raleway items-center justify-start mx-auto pb-[5px] w-full">
        <div className="h-[282px] md:px-5 relative w-full">
          <div
            id={"privacy-policy-title"}
            className="bg-gray-200 h-[20px] flex flex-col items-start justify-end mt-auto mx-auto p-12 md:px-10 sm:px-5
            relative rounded-br-[65px] md:top-[-105px] sm:top-[-80px] top-[50px] md:w-[102%]w-full
            ">
            <div className="flex flex-col items-center justify-start md:ml-[0] mt-[61px]">
              <Text
                className="sm:text-[32px] md:text-[38px] text-[42px] text-blue-900 ml-[185px] sm:ml-[0px]"
                size="txtRalewayRomanBold42"
                style={{marginBottom: '-30px'}}
              >
                Privacy Policy
              </Text>
            </div>
          </div>
        </div>

        <Container maxWidth="lg">
          <Paper elevation={3} sx={{ p: 4, my: 4 }}>

            <Typography variant="body1" paragraph sx={{ fontWeight: 'bold' }}>
              READ THIS POLICY CAREFULLY BEFORE INTERACTING WITH THE MINISASS WEBSITE OR APP.
              YOUR CONTINUED USE OF THE WEBSITE OR APP INDICATES THAT YOU HAVE BOTH READ AND
              AGREE TO THE TERMS OF THIS PRIVACY POLICY.
            </Typography>

            <Box my={3}>
              <Typography variant="h5" component="h2" gutterBottom color="primary" fontWeight="bold">
                1. Introduction
              </Typography>
              <Typography variant="body1" paragraph>
                Welcome to miniSASS. We are committed to protecting your personal information and your right to privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use
                our website and app. If you have any questions or concerns about this policy or our practices with regard
                to your personal information, please contact us at info@minisass.org.
              </Typography>
            </Box>

            <Box my={3}>
              <Typography variant="h5" component="h2" gutterBottom color="primary" fontWeight="bold">
                2. Information We Collect When You Register
              </Typography>
              <Typography variant="body1" paragraph>
                We collect personal information that you voluntarily provide to us when you register on the website or app,
                express an interest in obtaining information about us or our products and services, participate in activities
                on the website or app, or otherwise contact us. This may include your:
              </Typography>
              <List>
                {[
                  'Full name.',
                  'Email address.',
                  'Phone number.',
                  'Usage data.',
                  'Organisation name and type.',
                  'Location details (i.e., country from which you register).',
                  'SASS5 or similar qualification status.'
                ].map((item, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <CircleIcon sx={{ fontSize: 8 }} />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box my={3}>
              <Typography variant="h5" component="h2" gutterBottom color="primary" fontWeight="bold">
                3. Information We Collect When You Submit an Observation / Survey
              </Typography>
              <Typography variant="body1" paragraph>
                When you submit a miniSASS survey or observation via the miniSASS website or app, we gather and store all
                the data you have voluntarily input and submitted via the survey, as well as meta-data information associated
                with the observation or survey. This may include your:
              </Typography>
              <List>
                {[
                  'Full name.',
                  'Email address.',
                  'Phone number.',
                  'Usage data.',
                  'Organisation name and type.',
                  'Precise location details of your submitted survey / observation.',
                  'SASS5 or similar qualification status to determine \'expert status\'.',
                  'The date.',
                  'Name of the river or stream surveyed.',
                  'Name of the sample site.',
                  'Description of the site.',
                  'miniSASS river category.',
                  'Water quality measurement data (i.e., water clarity, temperature, pH, dissolved oxygen, and electrical conductivity) and the instruments used to collect those data.',
                  'miniSASS macroinvertebrate groups sampled.',
                  'miniSASS score and category.',
                  'Photos submitted from the survey / observation.'
                ].map((item, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <CircleIcon sx={{ fontSize: 8 }} />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box my={3}>
              <Typography variant="h5" component="h2" gutterBottom color="primary" fontWeight="bold">
                4. How We Use Your Information
              </Typography>
              <Typography variant="body1" paragraph>
                We use personal information collected via our app for a variety of business purposes described below.
                We process your personal information for these purposes in reliance on our legitimate business interests,
                to enter or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
                We use the information we collect or receive to:
              </Typography>
              <List>
                {[
                  'Facilitate account creation and logon process.',
                  'Send administrative information to you.',
                  'Fulfil and manage your orders.',
                  'Request feedback.',
                  'Protect our services.',
                  'Enforce our terms, conditions, and policies.',
                  'Respond to legal requests and prevent harm.'
                ].map((item, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <CircleIcon sx={{ fontSize: 8 }} />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box my={3}>
              <Typography variant="h5" component="h2" gutterBottom color="primary" fontWeight="bold">
                5. Cookies and Tracking Technologies
              </Typography>
              <Typography variant="body1" paragraph>
                miniSASS uses cookies and similar tracking technologies to collect data on how you use our website and app.
                Cookies are small data files stored on your device to help us improve your experience and track your preferences.
              </Typography>
              <Typography variant="body1" paragraph>
                Types of cookies we use:
              </Typography>
              <List>
                {[
                  'Essential cookies: These cookies are necessary for the functioning of the website and cannot be disabled.',
                  'Performance cookies: These cookies collect information about how users interact with our website and app to help improve its performance.',
                  'Functional cookies: These cookies allow us to remember choices you make and enhance your experience on our site.',
                  'Targeting cookies: These cookies are used to track your browsing across websites and are often used for advertising purposes.'
                ].map((item, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <CircleIcon sx={{ fontSize: 8 }} />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
              <Typography variant="body1" paragraph>
                You can control the use of cookies through your browser settings. However, please note that disabling certain
                cookies may affect your ability to use some features of the website and app.
              </Typography>
            </Box>

            <Box my={3}>
              <Typography variant="h5" component="h2" gutterBottom color="primary" fontWeight="bold">
                6. Third-Party Data Processors
              </Typography>
              <Typography variant="body1" paragraph>
                We may share your information with third-party service providers to help us operate and maintain the website
                and app, such as hosting services, analytics providers, and payment processors. These third-party services
                are contractually obligated to keep your personal data secure and confidential.
              </Typography>
              <Typography variant="body1" paragraph>
                We may also share your information with our affiliates, in which case we will require those affiliates to
                honour this privacy policy.
              </Typography>
            </Box>

            <Box my={3}>
              <Typography variant="h5" component="h2" gutterBottom color="primary" fontWeight="bold">
                7. Data Retention
              </Typography>
              <Typography variant="body1" paragraph>
                We retain your personal data only as long as necessary to fulfil the purposes outlined in this Privacy Policy,
                unless a longer retention period is required or permitted by law. When your personal data are no longer necessary
                for the purposes for which they were collected, we will delete or anonymize those data in a secure manner.
              </Typography>
            </Box>

            <Box my={3}>
              <Typography variant="h5" component="h2" gutterBottom color="primary" fontWeight="bold">
                8. Sharing Your Information
              </Typography>
              <Typography variant="body1" paragraph>
                We only share information with your consent, to comply with laws, to provide you with services, to protect your
                rights, or to fulfil business obligations. The data shared publicly on the miniSASS website and app may include your:
              </Typography>
              <List>
                {[
                  'First name.',
                  'Organisation name and type.',
                  'Location details of your submitted survey / observation.',
                  'The date.',
                  'Name of the river or stream surveyed.',
                  'Name of the sample site.',
                  'Description of the site.',
                  'Location details of your submitted survey / observation.',
                  'miniSASS river category.',
                  'Water quality measurement data (i.e., water clarity, temperature, pH, dissolved oxygen, and electrical conductivity) and the instruments used to collect those data.',
                  'miniSASS macroinvertebrate groups sampled.',
                  'miniSASS score and category.',
                  'Photos submitted from the survey / observation.',
                  'Any additional comments written and submitted.'
                ].map((item, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <CircleIcon sx={{ fontSize: 8 }} />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
              <Typography variant="body1" paragraph>
                By registering for miniSASS and using the miniSASS website or app to submit data, you consent to the above
                data being shared and available publicly.
              </Typography>
              <Typography variant="body1" paragraph>
                We may also need to process or share your data in the following situations:
              </Typography>
              <List>
                {[
                  'Business Transfers: We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.',
                  'Affiliates: We may share your information with our affiliates, in which case we will require those affiliates to honour this privacy policy.',
                  'Youth Agency Marketplace (Yoma): We may be required to share all your information with the Yoma platform to verify credentials and submissions, cross-validating against the Yoma registered platform. All data shared must comply with this privacy policy or the privacy policy of Yoma.'
                ].map((item, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <CircleIcon sx={{ fontSize: 8 }} />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
              <Typography variant="body1" paragraph>
                Data we will not share publicly on the miniSASS website and app includes your:
              </Typography>
              <List>
                {[
                  'Full name.',
                  'Email address.',
                  'Phone number.',
                  'SASS5 or similar qualification status to determine \'expert status\'.'
                ].map((item, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <CircleIcon sx={{ fontSize: 8 }} />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
              <Typography variant="body1" paragraph>
                Your personal information will be protected in alignment with the Protection of Personal Information Act 4 of 2013
                and General Data Protection Regulation (GDPR) compliance.
              </Typography>
            </Box>

            <Box my={3}>
              <Typography variant="h5" component="h2" gutterBottom color="primary" fontWeight="bold">
                9. Personal Information and Data Security
              </Typography>
              <Typography variant="body1" paragraph>
                We store your Personal Information directly, or alternatively, store your Personal Information on, and transfer
                your Personal Information to, a central database. The Personal Information we collect from users shall only be
                accessed by miniSASS administrators on a need-to-know basis and subject to reasonable confidentiality obligations
                binding such persons. Your passwords are stored in an encrypted format and are not available for any interaction
                by anyone. If your password is forgotten, a password reset can be requested, the details of the previous password
                are not available and cannot be shared. We will not sell, share, or rent your Personal Information to any third
                party or use your e-mail address for unsolicited mail. Any emails sent by us will only be in connection with the
                provision of our services and/or the marketing thereof.
              </Typography>
              <Typography variant="body1" paragraph>
                We have implemented appropriate technical and organizational security measures designed to protect the security
                of any personal information we process. However, please also remember that we cannot guarantee that the internet
                itself, and thus your personal information, is 100% secure. Although we will do our best to protect your personal
                information, transmission of personal information to and from our website or app is at your own risk. You should
                only access the services within a secure environment.
              </Typography>
            </Box>

            <Box my={3}>
              <Typography variant="h5" component="h2" gutterBottom color="primary" fontWeight="bold">
                10. Links from the Website and App
              </Typography>
              <Typography variant="body1" paragraph>
                The services available through the Website, may contain links to other third party websites, including (without
                limitation) social media platforms, payment gateways, appointment scheduling and/or live chat platforms ("Third
                Party Websites"). If you select a link to any Third Party Website, you may be subject to such Third Party Website's
                terms and conditions and/or other policies, which are not under our control, nor are we responsible therefore.
              </Typography>
              <Typography variant="body1" paragraph>
                Hyperlinks to Third Party Websites are provided "as is", and we do not necessarily agree with, edit or sponsor
                the content on Third Party Websites.
              </Typography>
              <Typography variant="body1" paragraph>
                We do not monitor or review the content of any Third Party Website. Opinions expressed or material appearing on
                such websites are not necessarily shared or endorsed by us and we should not be regarded as the publisher of such
                opinions or material. Please be aware that we are not responsible for the privacy practices, or content, of other
                websites, either.
              </Typography>
              <Typography variant="body1" paragraph>
                Users should evaluate the security and trustworthiness of any Third Party Website before disclosing any personal
                information to them. We do not accept any information to them. We do not accept any responsibility for any loss or damage in whatever manner, howsoever
                caused, resulting from your disclosure to third parties of personal information.
              </Typography>
            </Box>

            <Box my={3}>
              <Typography variant="h5" component="h2" gutterBottom color="primary" fontWeight="bold">
                11. Your Privacy Rights
              </Typography>
              <Typography variant="body1" paragraph>
                Depending on where you are located geographically, the applicable privacy law may mean you have certain rights
                regarding your personal information. Under the GDPR, you have the following rights:
              </Typography>
              <List>
                {[
                  'The right to access – You have the right to request copies of your personal data.',
                  'The right to rectification – You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.',
                  'The right to erasure – You have the right to request that we erase your personal data, under certain conditions.',
                  'The right to restrict processing – You have the right to request that we restrict the processing of your personal data, under certain conditions.',
                  'The right to object to processing – You have the right to object to our processing of your personal data, under certain conditions.',
                  'The right to data portability – You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.'
                ].map((item, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <CircleIcon sx={{ fontSize: 8 }} />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box my={3}>
              <Typography variant="h5" component="h2" gutterBottom color="primary" fontWeight="bold">
                12. Contact Us
              </Typography>
              <Typography variant="body1" paragraph>
                If you have questions or comments about this Privacy Policy, you may email us at{' '}
                <a href="mailto:info@minisass.org" style={{ color: '#0e4981', textDecoration: 'none' }}>
                  info@minisass.org
                </a>.
              </Typography>
            </Box>
          </Paper>
        </Container>

      </div>
    </AppShell>
  );
};

export default PrivacyPolicyPage;
