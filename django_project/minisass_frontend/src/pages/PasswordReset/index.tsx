import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Text } from "../../components";
import AppShell from "../../components/AppShell";
import { ForgotPasswordForm } from "../../components/ForgotPasswordForm";
import PasswordResetForm from "../../components/PasswordResetForm";



const PasswordResetPage: React.FC = () => {

  // State to control which form to display
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const uid = params.get("uid");
  const token = params.get("token");
  const navigate = useNavigate();

  const [isForgotPassword, setIsForgotPassword] = useState(!uid && !token);


  return (
    <AppShell>
      <div className="bg-white-A700 flex flex-col font-raleway items-center justify-start mx-auto pb-[5px] w-full">
        <div className="h-[282px] md:px-5 relative w-full">

          <div className="bg-gray-200 flex flex-col items-start justify-end mt-auto mx-auto p-12 md:px-10 sm:px-5 relative rounded-br-[65px] md:top-[-105px] sm:top-[-80px] top-[0px] md:w-[102%] sm:w-[144%] w-full">
            <div className="flex flex-col items-center justify-start md:ml-[0] ml-[79px] mt-[61px]">
              <Text
                className="sm:text-[32px] md:text-[38px] text-[42px] text-blue-900"
                size="txtRalewayRomanBold42"
              >
                {isForgotPassword ? ( `Forgot Password` ) : ( `Update Password`)}
              </Text>
            </div>
          </div>
        </div>


        <div className="flex flex-col gap-9 items-start justify-start w-auto sm:w-full">
          {/* Display the appropriate form based on the state and token validation. */
          isForgotPassword ? (
            <ForgotPasswordForm />
          ) :  (
            <PasswordResetForm uid={uid} token={token} />
          )}
        </div>

       <br />
        <p style={{ textAlign: 'center' }}>
          <span className="common-pointer" style={{ color: '#539987' }} onClick={() => (window.location.href = "/")}>Go Back</span>
        </p>


      </div>
    </AppShell>
  );
};

export default PasswordResetPage;
