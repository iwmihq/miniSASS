import React from 'react';
import Modal from 'react-modal';
import { Button } from "../../components";
import { globalVariables } from '../../utils';
import Typography from '@mui/material/Typography';
import { useAuth } from "../../AuthContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const EnforcePasswordChangeModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { dispatch, state } = useAuth();

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
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'white',
            border: 'none',
            borderRadius: '0px 25px 25px 25px',
          },
        }}
      >
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
            Profile Update Required!
          </h3>
          <br />
          <Typography>
            Dear User,
            <br /><br />
            We have noticed that your profile requires updates. To continue using the site, please ensure the following:
            <ul>
              <li>Your password is updated with the new security constraints.</li>
              <li>Set your first name if it is currently set to "Anonymous".</li>
            </ul>
            Having a proper first name helps us attribute observations accurately to you.
          </Typography>
          <Button
            className="cursor-pointer rounded-bl-[10px] rounded-br-[10px] rounded-tr-[10px] text-center text-lg tracking-[0.81px] w-[156px]"
            color="blue_gray_500"
            size="xs"
            variant="fill"
            style={{ marginLeft: "auto", display: 'block' }}
            onClick={onClose}
          >
            Update
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default EnforcePasswordChangeModal;
