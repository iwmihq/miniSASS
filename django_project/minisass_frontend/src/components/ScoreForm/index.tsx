import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Img, List, Text } from "../../components";
import UploadModal from "../../components/UploadFormModal";
import ManageImagesModal from "../../components/ManageImagesModal";
import { globalVariables } from "../../utils";
import Modal from 'react-modal';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import {useAuth} from "../../AuthContext";
import ConfirmationDialogRaw from "../../components/ConfirmationDialog";
import CircularProgress from '@mui/material/CircularProgress';
import FormStepIndicator from "../FormStepIndicator";

const FORM_STEPS = [
  { label: "Site Details" },
  { label: "Observations" },
  { label: "Measurements" },
  { label: "Assessment" },
  { label: "Submit" },
];


interface ScoreFormProps {
  onCancel: () => void;
  additionalData: {};
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setProceedToSavingData: React.Dispatch<React.SetStateAction<boolean>>;
  proceedToSavingData: boolean;
  setIsDisableNavigations: React.Dispatch<React.SetStateAction<boolean>>;
}


const ScoreForm: React.FC<ScoreFormProps> = ({ onCancel, additionalData, setSidebarOpen, setProceedToSavingData, proceedToSavingData, setIsDisableNavigations }) => {
  const [scoreGroups, setScoreGroups] = useState([]);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [buttonStates, setButtonStates] = useState([]);
  const [checkedGroups, setCheckedGroups] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [numberOfGroups ,setNumberOfGroups] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [openImagePestId, setOpenImagePestId] = useState(0);
  const [pestImages, setPestImages] = useState({});
  const [isSavingData, setIsSavingData] = useState(false);
  const [selectedPests, setSelectedPests] = useState('');
  const {dispatch, state} = useAuth();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [allowSaving, setAllowSaving] = useState(false);


  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
    handleCloseSidebar()
  };

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
  };

  useEffect(() => {
    const fetchScoreGroups = async () => {
        try {
            setIsSavingData(true);
            const response = await axios.get(`${globalVariables.baseUrl}/group-scores/`);
            if (response.status === 200) {
                setScoreGroups(response.data);
                setButtonStates(response.data.map(score => ({ id: score.id, showManageImages: false })));
                setIsSavingData(false);
            } else {
                setTimeout(fetchScoreGroups, 5000);
            }
        } catch (error) {
            console.error('Error fetching score groups:', error);
            setTimeout(fetchScoreGroups, 5000);
        }
    };

    fetchScoreGroups();
}, []);


  const [manageImagesModalData, setManageImagesModalData] = useState({
    groups: '',
    sensetivityScore: '',
    id: '',
    images: []
  });

  const handleButtonClick = (id) => {
    setIsAddMore(true);
    setOpenImagePestId(id);
    setRefetchImages(true); //trigger refetching of images
  };

  const [checkboxStates, setCheckboxStates] = useState(
    scoreGroups.reduce((acc, curr) => ({ ...acc, [curr.id]: false }), {})
  );

  // const [proceedToSavingData, setProceedToSavingData] = useState(false)
  const [observationId, setObservationId] = useState(0);
  const [siteId, setSiteId] = useState(0);

  // Function to log the state of checkboxes
  const handleSave = async (saveToExistingSite  = false) => {
    setIsSavingData(true)
    try {

      const storedState = localStorage.getItem('authState');
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        const user_email = parsedState.userData.email;
        const user_level = await axios.get(
          `${globalVariables.baseUrl}/authentication/api/user-profile/is-expert/${user_email}/`
        );

        if(user_level.data.is_expert){
          additionalData.flag = 'clean'
        }else additionalData.flag = 'dirty'
      }

      // check for empty measurement values
      const  datainput  = additionalData;

      // fields to check for empty values
      const fieldsToCheck = ['waterclaritycm', 'watertemperatureOne', 'ph', 'dissolvedoxygenOne', 'electricalconduOne', 'watertemperatureOne'];

      fieldsToCheck.forEach(field => {
        if (datainput[field] === '') {
          datainput[field] = null;
        }
      });

      // Create an object with the data to be saved
      const observationsData = {
        score:averageScore,
        datainput: additionalData,
      };

      scoreGroups.map((sg) => {
        observationsData[sg.db_field] = checkboxStates['' + sg.id]
      })

      var form_data = new FormData();
      additionalData?.images?.map((file, idx) => {
        form_data.append('image_' + idx, file);
      })
      if (![null, "none", "0"].includes(localStorage.getItem('siteId'))) {
        form_data.append('create_site_or_observation', JSON.stringify(false));
        setCreateNewSiteOrObservation(false);
      } else if (additionalData.selectedSite && additionalData.selectedSite !== "none") {
        if(additionalData.selectedSite.value)
          localStorage.setItem('siteId', additionalData.selectedSite.value)
        else
          localStorage.setItem('siteId', additionalData.selectedSite)
        form_data.append('create_site_or_observation', JSON.stringify(false));
        setCreateNewSiteOrObservation(false);
      } else {
        form_data.append('create_site_or_observation', JSON.stringify(true));
        setCreateNewSiteOrObservation(true);
      }
      form_data.append('data', JSON.stringify(observationsData));
      const obs_id = localStorage.getItem('observationId') || observationId;
      const site_id = localStorage.getItem('siteId') || siteId;
      form_data.append('observationId', JSON.stringify(obs_id));
      form_data.append('siteId', JSON.stringify(site_id));
      if(saveToExistingSite === true){
        form_data.append('saveToSite', JSON.stringify(true));
      }else form_data.append('saveToSite', JSON.stringify(false));

      axios.defaults.headers.common['Authorization'] = `Bearer ${state.user.access_token}`;
      const response = await axios.post(
        `${globalVariables.baseUrl}/monitor/observations/`,
        form_data,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          validateStatus: function (status) {
            return status < 500 || status == 400; // Don't throw for status codes less than 500 or error 400
          }
        }
      );

      if(response.status == 201){
        setIsSavingData(false)
        setIsCloseDialogOpen(false)
        localStorage.setItem('observationId', JSON.stringify(0))
        localStorage.setItem('siteId', JSON.stringify(0))
        setProceedToSavingData(false);
        setIsSuccessModalOpen(true);
        setIsDisableNavigations(false);
      } else {
        if (response.data.status.includes('error')) {
          if("Site name already exists" === response.data.message){
            setIsCloseSiteDialogOpen(true);
          }else {
            if(response.data.message === "")
              setErrorMessage("something unexpectedly went wrong, please try again. If the issue should persist ,contact the system administrator via the contact us form describing the problem you're facing.");
            else setErrorMessage(response.data.message)
            setIsErrorModalOpen(true);
          }
          setIsSavingData(false);
        }else {
          setProceedToSavingData(false);
          setIsSavingData(false);
        }
      }
    } catch (exception) {
      setIsSavingData(false);
      setErrorMessage(exception.message + (exception.response?.data?.message ? ": " + exception.response.data.message : ""));
      setIsErrorModalOpen(true);
    }
  };

  // Function to handle checkbox changes
  const handleCheckboxChange = (id) => {
    setCheckboxStates((prevState) => {
      const updatedCheckboxStates = {
        ...prevState,
        [id]: !prevState[id],
      };

      const temp_checkedGroups = scoreGroups.filter((group) => updatedCheckboxStates[group.id]);
      // Find the newly added group
      const newlyAddedGroup = scoreGroups.find((group) => group.id === id);
      const temp_totalScore = temp_checkedGroups.reduce((acc, curr) => acc + parseFloat(curr.sensitivity_score), 0);
      const temp_numberOfGroups = temp_checkedGroups.length;
      const temp_averageScore = temp_numberOfGroups !== 0 ? temp_totalScore / temp_numberOfGroups : 0;

      setCheckedGroups(temp_checkedGroups)
      if(temp_checkedGroups.length > 0){
        setSelectedPests(newlyAddedGroup.name)
        setAllowSaving(true)
      }else setAllowSaving(false)

      // disabled upload buttons
      const newCheckedState = [...isCheckboxChecked];
      newCheckedState[id] = !newCheckedState[id];
      setIsCheckboxChecked(newCheckedState);

      if(temp_checkedGroups.length > 0)
        if (additionalData.selectedSite && additionalData.date)
          setProceedToSavingData(true)
        else if (additionalData.latitude && additionalData.longitude && additionalData.riverName && additionalData.siteName && additionalData.siteDescription && additionalData.date)
          setProceedToSavingData(true)
        else setProceedToSavingData(false)
      else setProceedToSavingData(false)
      setAverageScore(temp_averageScore)
      setNumberOfGroups(temp_numberOfGroups)
      setTotalScore(temp_totalScore)

      return updatedCheckboxStates;
    });
  };

  const [isManageImagesModalOpen, setIsManageImagesModalOpen] = useState(false);
  const [isAddMore, setIsAddMore] = useState(false);
  // disabled upload buttons
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(Array(13).fill(false));

  const closeUploadModal = () => {
    setOpenImagePestId(0)
  };

  const openManageImagesModal = (id, groups, sensetivityScore, pest_images) => {
    setIsManageImagesModalOpen(true);
    setRefetchImages(true)
    // console.log('assigning ', groups, ' ', sensetivityScore, ' ', ' ', id, ' and and images ',pest_images)

    setManageImagesModalData({
      'groups': groups,
      'sensetivityScore': sensetivityScore,
      'id': id,
      'images': pest_images
    });
  };


  const closeManageImagesModal = () => {
    setIsManageImagesModalOpen(false);
    setRefetchImages(false)
  };

  const [createSiteOrObservation, setCreateNewSiteOrObservation] = useState(true);
  const [refetchImages, setRefetchImages] = useState(false);

  const uploadImages = async (pestImages, callback) => {
    setIsUploadingImage(true)

    for (const key in pestImages) {
      if (Object.prototype.hasOwnProperty.call(pestImages, key)) {
        const currentArray = pestImages[key];

        if (currentArray.length > 0) {
          var data = new FormData();

          for (const key in pestImages) {
            if (Object.prototype.hasOwnProperty.call(pestImages, key)) {
                pestImages[key].map((file, idx) => {
                  data.append('pest_' + idx + ':' + key, file);
                });
            }
          }

          data.append('observationId', JSON.stringify(observationId));

          if (typeof additionalData.selectedSite !== 'undefined' && additionalData.selectedSite !== null && additionalData.selectedSite !== "") {
            if(additionalData.selectedSite.value)
              data.append('siteId', JSON.stringify(additionalData.selectedSite.value));
            else data.append('siteId', JSON.stringify(additionalData.selectedSite));
          } else
            {
              data.append('siteId', JSON.stringify(siteId));
              data.append('siteName',additionalData?.siteName)
              data.append('riverName',additionalData?.riverName)
              data.append('siteDescription',additionalData?.siteDescription)
              data.append('rivercategory',additionalData?.rivercategory)
              data.append('latitude',additionalData?.latitude)
              data.append('longitude',additionalData?.longitude)
            }

            axios.defaults.headers.common['Authorization'] = `Bearer ${state.user.access_token}`;

          try{
            setRefetchImages(false)

            const response = await axios.post(
              `${globalVariables.baseUrl}/monitor/upload-pest-images/`,
              data,
              {
                headers: {
                  'Content-Type': 'multipart/form-data'
                },
                validateStatus: function (status) {
                  return status < 500 || status == 400; // Don't throw for status codes less than 500 or error 400
                }
              }
            );

            if(response.status == 201){
              setIsUploadingImage(false)
              setObservationId(response.data.observation_id)
              setSiteId(response.data.site_id)
              setCreateNewSiteOrObservation(false)
              localStorage.setItem('observationId', JSON.stringify(response.data.observation_id));
              localStorage.setItem('siteId', JSON.stringify(response.data.site_id));
              setRefetchImages(true)
              console.log('call callback')
              callback()
            } else {
              if (response.data.status.includes('error')) {
                if("Site name already exists" === response.data.message){
                  setIsCloseSiteDialogOpen(true);
                }else {
                  if(response.data.message === "")
                    setErrorMessage("Something unexpectedly went wrong, please try again. If the issue should persist ,contact the system administrator via the contact us form describing the problem you're facing.");
                  else setErrorMessage(response.data.message)
                  setIsErrorModalOpen(true);
                }
              }else {
                setProceedToSavingData(false);
              }
              setIsSavingData(false);
              setIsUploadingImage(false);
            }
          }catch( exception ){
            setIsSavingData(false);
            setIsUploadingImage(false);
            setErrorMessage(exception.message + (exception.response?.data?.message ? ": " + exception.response.data.message : ""));
            setIsErrorModalOpen(true);
          }
          setPestImages({});
        }
      }
    }
  }

  useEffect(() => {
      const handleUnload = () => {
          const storedObservationId = localStorage.getItem('observationId') || 0;
          deleteObservation(parseInt(storedObservationId));
      };

      window.addEventListener('unload', handleUnload);

      return () => {
          window.removeEventListener('unload', handleUnload);
      };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (proceedToSavingData) {
        const message = "You have unsaved data, are you sure you want to leave?";
        event.returnValue = message;
        return message;

      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
}, [proceedToSavingData]);

  const deleteObservation = async (observationId) => {
    try {
      await axios.delete(`monitor/observations/${observationId}/`);
    } catch (error) {
      setError(error);
    }
  };

  const [isCloseDialogOpen, setIsCloseDialogOpen] = React.useState(false);
  const [isCloseSiteDialogOpen, setIsCloseSiteDialogOpen] = React.useState(false);

  const handleCloseSidebar = () => {
    if(proceedToSavingData)
      setIsCloseDialogOpen(true)
    else
      setSidebarOpen(false)
  };

  const handleCloseConfirm = () => {
    const storedObservationId = localStorage.getItem('observationId') || 0;
    deleteObservation(parseInt(storedObservationId));
    setIsCloseDialogOpen(false);
    setSidebarOpen(false);
    setIsDisableNavigations(false)
  };

  const handleDialogCancel = () => {
    setIsCloseDialogOpen(false)
  };

  const handleSiteDialogCancel = () => {
    setIsCloseSiteDialogOpen(false)
  };

  const handleSiteCloseConfirm = () => {
    handleSave(true)
    setIsCloseSiteDialogOpen(false)
  };



  return (
    <>

      <ConfirmationDialogRaw
        id="logout-dialog"
        keepMounted
        value="logout"
        open={isCloseDialogOpen}
        onClose={handleDialogCancel}
        onConfirm={handleCloseConfirm}
        title="Confirm Close"
        message="You have unsaved data ,are you sure want to close?"
      />

      <ConfirmationDialogRaw
        id="site-dialog"
        keepMounted
        value="SiteError"
        open={isCloseSiteDialogOpen}
        onClose={handleSiteDialogCancel}
        onConfirm={handleSiteCloseConfirm}
        title="Cannot Save Observation"
        message="You chose create new site but the Site name you provided already exists, should the observation be saved to this site instead?"
      />

      <div className="flex flex-col font-raleway items-center justify-start mx-auto p-0.5 w-full"
        style={{
          height: '75vh',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        <FormStepIndicator steps={FORM_STEPS} currentStep={3} className="mb-2 w-full" />
        {isSavingData ? (
          <div className=" flex flex-col gap-3  items-start justify-start p-3 md:px-5 rounded-bl-[10px] rounded-br-[10px] rounded-tr-[10px] shadow-bs w-[568px] sm:w-full">
            <div className="flex flex-row gap-80 w-auto sm:w-full" style={{marginLeft: '0px'}}>
              <div style={{ width: '535px'}}>
                <LinearProgress color="success" />
              </div>
            </div>
          </div>

        ) :
        (

        <div className=" flex flex-col gap-3  items-start justify-start p-3 md:px-5 rounded-bl-[10px] rounded-br-[10px] rounded-tr-[10px] shadow-bs w-[568px] sm:w-full">
          <div className="flex items-center justify-between w-full">
            <Text className="text-2xl md:text-[22px] text-blue-900 sm:text-xl w-auto" size="txtRalewayBold24">
              Score
            </Text>
            <Img
              className="h-6 w-6 common-pointer"
              src={`${globalVariables.staticPath}img_icbaselineclose.svg`}
              alt="close"
              onClick={handleCloseSidebar}
            />
          </div>
          {/* Group cards */}
          <div className="flex flex-col gap-2 w-full">
            {scoreGroups.map((props, index) => {
              const isChecked = !!checkboxStates[props.id];
              return (
                <div
                  key={`Row${index}`}
                  className={`flex flex-col rounded-xl border-2 p-3 transition-all cursor-pointer ${
                    isChecked
                      ? 'border-accent bg-accent/5 shadow-sm'
                      : 'border-surface-subtle bg-white hover:border-accent/30'
                  }`}
                  onClick={() => handleCheckboxChange(props.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      id={`checkbox-${props.id}`}
                      checked={isChecked}
                      onChange={(e) => { e.stopPropagation(); handleCheckboxChange(props.id); }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-5 w-5 rounded accent-[#539987] flex-shrink-0"
                    />
                    {/* Group name */}
                    <span className={`flex-1 text-base font-medium ${isChecked ? 'text-primary' : 'text-text'}`}>
                      {props?.name}
                    </span>
                    {/* Sensitivity score badge */}
                    <span className={`inline-flex items-center justify-center rounded-full px-3 py-0.5 text-sm font-bold ${
                      isChecked
                        ? 'bg-accent text-white'
                        : 'bg-surface-muted text-text-muted'
                    }`}>
                      {props.sensitivity_score}
                    </span>
                  </div>

                  {/* Upload / Manage images row — only when checked */}
                  {isChecked && (
                    <div className="mt-2 flex items-center gap-2 pl-8" onClick={(e) => e.stopPropagation()}>
                      {buttonStates.map((buttonState, btnIndex) => {
                        if (buttonState.id !== props.id) return null;
                        return (
                          <React.Fragment key={`Button-${btnIndex}`}>
                            {!buttonState.showManageImages && (
                              <>
                                <Button
                                  id={`button-${props.id}`}
                                  type="button"
                                  className="!text-white-A700 cursor-pointer font-raleway text-sm tracking-[0.81px]"
                                  shape="round"
                                  color="blue_gray_500"
                                  size="xs"
                                  variant="fill"
                                  onClick={() => handleButtonClick(props.id)}
                                >
                                  Upload images
                                  {pestImages[props.id]?.length ? <span className="ml-1 text-xs">({pestImages[props.id]?.length})</span> : null}
                                </Button>
                                <UploadModal
                                  key={`image-${props.id}`}
                                  isOpen={openImagePestId === props.id && isAddMore}
                                  onClose={closeUploadModal}
                                  onSubmit={files => {
                                    pestImages[props.id] = files;
                                    setOpenImagePestId(0);
                                    const callback = () => {
                                      const updatedButtonStates = buttonStates.map(bs => {
                                        if (bs.id === props.id) return { ...bs, showManageImages: !bs.showManageImages };
                                        return bs;
                                      });
                                      setButtonStates(updatedButtonStates);
                                      setPestImages({ ...pestImages });
                                      setIsAddMore(false);
                                    };
                                    uploadImages(pestImages, callback);
                                  }}
                                />
                              </>
                            )}
                            {buttonState.showManageImages && (
                              <>
                                {isUploadingImage ? (
                                  <CircularProgress size={24} style={{ color: '#288b31' }} />
                                ) : (
                                  <>
                                    <Button
                                      type="button"
                                      className="!text-white-A700 cursor-pointer font-raleway text-sm tracking-[0.81px]"
                                      shape="round"
                                      color="red_500"
                                      size="xs"
                                      variant="fill"
                                      onClick={() => openManageImagesModal(props.id, props.name, props.sensitivity_score, pestImages[props.id])}
                                    >
                                      Manage Images
                                      {pestImages[props.id]?.length ? <span className="ml-1 text-xs">({pestImages[props.id]?.length})</span> : null}
                                    </Button>
                                    <UploadModal
                                      key={`image-${props.id}`}
                                      isOpen={openImagePestId === props.id && isAddMore}
                                      onClose={closeUploadModal}
                                      onSubmit={files => {
                                        pestImages[props.id] = files;
                                        setOpenImagePestId(0);
                                        const callback = () => {
                                          setPestImages({ ...pestImages });
                                          setIsAddMore(false);
                                          setManageImagesModalData({
                                            'groups': props.name,
                                            'sensetivityScore': props.sensitivity_score,
                                            'id': props.id,
                                            'images': pestImages[props.id],
                                            'saved_group_prediction': {}
                                          });
                                        };
                                        uploadImages(pestImages, callback);
                                      }}
                                    />
                                  </>
                                )}
                              </>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Score summary */}
          <div className="grid grid-cols-3 gap-2 w-full rounded-xl bg-surface-muted/50 p-3">
            <div className="flex flex-col items-center">
              <span className="text-caption text-text-muted font-medium">Total Score</span>
              <span className="text-xl font-bold text-primary">{isNaN(totalScore) ? 0 : totalScore.toFixed(2)}</span>
            </div>
            <div className="flex flex-col items-center border-x border-surface-subtle">
              <span className="text-caption text-text-muted font-medium">Groups</span>
              <span className="text-xl font-bold text-primary">{numberOfGroups}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-caption text-text-muted font-medium">Average</span>
              <span className="text-xl font-bold text-accent">{isNaN(averageScore) ? 0 : averageScore.toFixed(2)}</span>
            </div>
          </div>

          {/* Save and Cancel Buttons */}
          <div className="flex flex-row gap-3 items-start justify-start w-auto">
            <Button
              className="!text-white-A700 cursor-pointer font-raleway min-w-[105px] text-center text-lg tracking-[0.81px]"
              shape="round"
              color="blue_gray_500"
              size="xs"
              variant="fill"
              onClick={handleSave}
              style={{
                opacity: (proceedToSavingData && allowSaving) ? 1 : 0.5,
              }}
              disabled={(!proceedToSavingData && !allowSaving)}
            >
              Save
            </Button>
            <Button
              className="!text-white-A700 cursor-pointer font-raleway min-w-[105px] text-center text-lg tracking-[0.81px]"
              shape="round"
              color="red_500"
              size="xs"
              variant="fill"
              onClick={onCancel}
            >
              Back
            </Button>
          </div>

        </div>
      )}
        {/* Success Modal */}
        <Modal
          isOpen={isSuccessModalOpen}
          onRequestClose={closeSuccessModal}
          style={{
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              maxWidth: '400px',
              background: 'white',
              border: 'none',
              borderRadius: '0px 25px 25px 25px',
            },
          }}
        >
          {isSuccessModalOpen && (
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
                  Observation Saved.
                </h3>
                <br />
              <Typography>
                The record was saved successfully.
              </Typography>

              <Button
                  className="cursor-pointer rounded-bl-[10px] rounded-br-[10px] rounded-tr-[10px] text-center text-lg tracking-[0.81px] w-[156px]"
                  color="blue_gray_500"
                  size="xs"
                  variant="fill"
                  style={{ marginLeft: "55%" }}
                  onClick={closeSuccessModal}
                >
                  Ok
                </Button>
            </div>
          )}
        </Modal>

        {/* Error Modal */}
        <Modal
          isOpen={isErrorModalOpen}
          onRequestClose={closeErrorModal}
          style={{
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              maxWidth: '400px',
              background: 'white',
              border: 'none',
              borderRadius: '0px 25px 25px 25px',
            },
          }}
        >
          {isErrorModalOpen && (
            <div>
              <h3
                  style={{
                    fontFamily: 'Raleway',
                    fontStyle: 'normal',
                    fontWeight: 700,
                    alignItems: 'flex-start',
                    fontSize: '24px',
                    lineHeight: '136.4%',
                    color: '#d00501',
                  }}
                >
                  Error.
              </h3>
                
              <br />
            <Text size="txtRalewayBold18" className="text-red-500">
              {errorMessage ? (
                <div>
                  <Text size="txtRalewayBold18" className="text-red-500">
                    {errorMessage}
                  </Text>
                </div>
              ) : <div>
                <Text size="txtRalewayBold18" className="text-red-500">
                  Something unexpectedly went wrong. Please try again.
                </Text>
                <Text size="txtRalewayBold18" className="text-red-500">
                  If the problem persists, kindly contact the system administrator via the contact form.
                </Text>
                <Text size="txtRalewayBold18" className="text-red-500">
                  We apologize for the inconvenience.
                </Text>
              </div>
              }
            </Text>
              <Button
                className="!text-white-A700 cursor-pointer font-raleway min-w-[105px] text-center text-lg tracking-[0.81px]"
                shape="round"
                color="red_500"
                size="xs"
                variant="fill"
                style={{marginLeft: "70%"}}
                onClick={closeErrorModal}
              >
                Close
              </Button>
            </div>
          )}
        </Modal>

        <ManageImagesModal
          title={manageImagesModalData.groups}
          isOpen={isManageImagesModalOpen}
          onClose={closeManageImagesModal}
          onSubmit={null}
          id={manageImagesModalData.id}
          sensivityScore={manageImagesModalData.sensetivityScore}
          handleButtonClick={handleButtonClick}
          refetchImages={refetchImages}
        />
      </div>
    </>
  );
};

export default ScoreForm;
