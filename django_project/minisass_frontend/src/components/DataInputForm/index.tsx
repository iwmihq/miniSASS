import React, {useEffect, useState} from "react";

import {Button, Img, Text} from "../../components";
import Tooltip from '@mui/material/Tooltip';
import UploadModal from "../../components/UploadFormModal";
import {Instance} from '@popperjs/core';
import {Field, Form, Formik} from 'formik';
import ScoreForm from "../../components/ScoreForm";
import axios from "axios";
import {globalVariables} from "../../utils";
import CoordinatesInputForm from "../CoordinatesInputForm";
import Select from 'react-select';
import {FormControlLabel, Radio, RadioGroup} from "@mui/material";
import {debounce} from '@mui/material/utils';
import LinearProgress from '@mui/material/LinearProgress';
import {parse} from "wkt";
import ConfirmationDialogRaw from "../../components/ConfirmationDialog";
import FormStepIndicator from "../FormStepIndicator";

const FORM_STEPS = [
  { label: "Site Details" },
  { label: "Observations" },
  { label: "Measurements" },
  { label: "Assessment" },
  { label: "Submit" },
];

type DataInputFormProps = Omit<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
  | "datainputform"
  | "sitedetails"
  | "uploadSiteImages"
  | "rivername"
  | "sitename"
  | "sitedescriptionOne"
  | "defaultslot"
  | "rivercategory"
  | "sitelocation"
  | "selectKnownSite"
  | "selectOnMap"
  | "typeInCoordinates"
  | "observationdetaOne"
  | "date"
  | "collectorsname"
  | "notes"
  | "defaultslotOne"
  | "measurements"
  | "waterclaritycm"
  | "watertemperatureOne"
  | "ph"
  | "dissolvedoxygenOne"
  | "electricalconduOne"
  | "next"
  | "setSidebarOpen"
  | "toggleMapSelection"
  | "handleMapClick"
  | "selectingOnMap"
  | "selectedCoordinates"
  | "resetMap"
  | "siteDetails"
  | "resetSiteDetails"
  | "useSelectOnSite"
  | "setIsDisableNavigations"
> &
  Partial<{
    datainputform: string;
    sitedetails: string;
    uploadSiteImages: string;
    rivername: string;
    sitename: string;
    sitedescriptionOne: string;
    defaultslot: JSX.Element | string;
    rivercategory: string;
    sitelocation: string;
    selectKnownSite: string;
    selectOnMap: string;
    typeInCoordinates: string;
    observationdetaOne: string;
    date: string;
    collectorsname: string;
    notes: string;
    defaultslotOne: JSX.Element | string;
    measurements: string;
    waterclaritycm: string;
    watertemperatureOne: string;
    ph: string;
    dissolvedoxygenOne: string;
    electricalconduOne: string;
    next: string;
    setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    toggleMapSelection: () => void;
    handleMapClick: (latitude: number, longitude: number) => void;
    selectedCoordinates:{longitude: number, latitude: number};
    selectingOnMap: boolean;
    resetMap: () => void;
    siteDetails: {};
    resetSiteDetails: (details: {}) => void;
    useSelectOnSite: (isSelectOnSite: boolean) => void;
    setCursor: (cursor: string) => void;
    setIsDisableNavigations: React.Dispatch<React.SetStateAction<boolean>>;
  }>;

const inputOptionsList = [
  { label: "Rocky", value: "rocky" },
  { label: "Sandy", value: "sandy" },
];

const inputOxygenUnitsList = [
  { label: "mg/l", value: "mgl" },
  { label: "%DO", value: "%DO" },
  { label: "PPM", value: "PPM" },
  { label: "Unknown", value: "na" },
];

const inputElectricConductivityUnitsList = [
  { label: "S/m", value: "S/m" },
  { label: "µS/cm", value: "µS/cm" },
  { label: "m S/m", value: "mS/m" },
  { label: "Unknown", value: "na" },
];

const SiteSelectionModes = {
    SELECT_KNOWN_SITE: 'Select known site',
    SELECT_ON_MAP: 'Select on map',
    TYPE_IN_COORDINATES: 'Type in coordinates',
    NONE: 'None'
} as const;

type SiteSelectionMode = keyof typeof SiteSelectionModes;

const FETCH_SITES = globalVariables.baseUrl + '/monitor/sites/';

const DRAFT_STORAGE_KEY = 'minisass-observation-draft';

const loadDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

const saveDraft = debounce((values: Record<string, any>) => {
  try {
    // Don't save file objects or selected site objects
    const { images, selectedSite, ...saveable } = values;
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(saveable));
  } catch {}
}, 1000);

const clearDraft = () => {
  try { localStorage.removeItem(DRAFT_STORAGE_KEY); } catch {}
};

const DataInputForm: React.FC<DataInputFormProps> = (props) => {

  // Zoom to location
  const handleSelectSiteFromOption = React.useMemo(
    () =>
      debounce(
        (
          latitude: number,
          longitude: number,
        ) => {
          props.handleMapClick(latitude, longitude);
        },
        2000,
      ),
    [],
  );


  // State to store form values (restore from draft if available)
  const [formValues, setFormValues] = useState(() => {
    const draft = loadDraft();
    const defaults = {
    riverName: '',
    siteName: '',
    siteDescription: '',
    rivercategory: 'rocky',
    sitelocation: '',
    selectKnownSite: '',
    selectOnMap: '',
    typeInCoordinates: '',
    observationdetaOne: '',
    date: '',
    collectorsname: '',
    notes: '',
    measurements: '',
    waterclaritycm: '',
    watertemperatureOne: '',
    ph: '',
    dissolvedoxygenOne: '',
    electricalconduOne: '',
    dissolvedoxygenOneUnit: 'mgl',
    electricalconduOneUnit: 'S/m',
    latitude: 0,
    longitude: 0,
    selectedSite: '',
    flag: 'dirty'
    };
    return draft ? { ...defaults, ...draft } : defaults;
  });

  const [hasDraft] = useState(() => !!loadDraft());

  // Auto-save form values on change
  useEffect(() => {
    if (formValues.riverName || formValues.siteName || formValues.date) {
      saveDraft(formValues);
    }
  }, [formValues]);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectSiteMode, setSelectSiteMode] = useState<SiteSelectionMode | undefined>();
  const [isFetchingSites, setIsFetchingSites] = useState(false);
  const [sites, setSitesList] = useState([]);
  const [enableSiteFields, setEnableSiteFields] = useState(true);
  const [isCreateSite, setIsCreateSite] = useState('createsite');
  const [type, setType] = useState<string>('');
  const [siteUserValues, setSiteUserValues] = useState({
    rivercategory: 'rocky',
    riverName: '',
    siteName: '',
    siteDescription: ''
  });

  // Tooltips positioning
  const positionRef = React.useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const popperRef = React.useRef<Instance>(null);
  const areaRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: React.MouseEvent) => {
    positionRef.current = { x: event.clientX, y: event.clientY };

    if (popperRef.current != null) {
      popperRef.current.update();
    }
  };

  const sitePopperRef = React.useRef<Instance>(null);
  const sitePositionRef = React.useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const siteAreaRef = React.useRef<HTMLDivElement>(null);

  const siteHandleMouseMove = (event: React.MouseEvent) => {
    sitePositionRef.current = { x: event.clientX, y: event.clientY };

    if (sitePopperRef.current != null) {
      sitePopperRef.current.update();
    }
  };
  
  const openUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleSelectOnMapClick = () => {
    if (selectSiteMode === 'SELECT_ON_MAP') return;
    props.toggleMapSelection()
    setSelectSiteMode("SELECT_ON_MAP");
  };

  const handleSelectOnTypeCoordinateClick = () => {
    if (selectSiteMode === 'SELECT_ON_MAP') {
      props.toggleMapSelection()
    }
    setSelectSiteMode("TYPE_IN_COORDINATES");
  };

  const handleShowScoreForm = () => {
    setShowScoreForm(true)
  }

  const handleHideScoreForm = () => {
    setShowScoreForm(false)
  }

  const [showScoreForm, setShowScoreForm] = useState(false);

  function handleSelectKnownSite(): void {
    if (selectSiteMode === 'SELECT_KNOWN_SITE') {
      props.resetSiteDetails({})
      setSelectSiteMode('NONE')
      props.useSelectOnSite(false)
    }else {
      props.setCursor('crosshair')
      props.useSelectOnSite(true)
      setSelectSiteMode('SELECT_KNOWN_SITE')
    } 
  }

  const getSites = async () => {
    try {
      if (Object.keys(props.siteDetails).length === 0) {
        setIsFetchingSites(true)
        const response = await axios.get(`${FETCH_SITES}`);
        if (response.status === 200) {
          const sitesList = [
            {
              label: 'None',
              value: 'none',
              rivercategory: '',
              siteName: '',
              siteDescription: '',
              riverName: '',
            },
            ...response.data.map((site) => ({
              label: site.site_name,
              value: site.gid.toString(),
              rivercategory: site.river_cat,
              siteName: site.site_name,
              siteDescription: site.description,
              riverName: site.river_name,
              longitude: parse(site.the_geom).coordinates[0],
              latitude: parse(site.the_geom).coordinates[1],
            })),
          ];
          setSitesList(sitesList);
        }
      } else {
        const sitesList = [
          {
            label: props.siteDetails.sitename,
            value: props.siteDetails.gid,
            rivercategory: props.siteDetails.rivercategory,
            siteName: props.siteDetails.sitename,
            siteDescription: props.siteDetails.sitedescription,
            riverName: props.siteDetails.rivername,
          },
        ];
        setSitesList(sitesList);

        setFormValues({
          ...formValues,
          selectedSite: props.siteDetails.gid
        });
      }
      setIsFetchingSites(false);
    } catch (error) {
      console.log(error.message);
    }
  };
  
  useEffect(() => {
    if (selectSiteMode === 'SELECT_KNOWN_SITE') {
      getSites();
    }

    // validations check if object is not empty
    function isObjectEmpty(obj) {
      return Object.keys(obj).length === 0 && obj.constructor === Object;
    }
    
    if (!isObjectEmpty(props.siteDetails)) {
      setProceedToSavingData(true)
    }

  }, [selectSiteMode, props.siteDetails]);

  useEffect(() => {
    if (showScoreForm) {
      props.setCursor('')
    } else if(selectSiteMode === 'SELECT_KNOWN_SITE') {
      props.setCursor('crosshair')
    }
  }, [showScoreForm]);

  // Helper function to format date
  const formatDate = (date) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  const customStyles = {
    control: (styles, { isFocused }) => ({
      ...styles,
      borderRadius: '6px',
      width: '100%',
      borderColor: isFocused ? '#539987' : 'rgba(0, 0, 0, 0.23)',
    }),
    option: (styles, { isFocused }) => ({
      ...styles,
      backgroundColor: isFocused ? '#539987' : 'transparent',
      color: isFocused ? 'white' : 'black',
    }),
    menu: (styles) => ({
      ...styles,
      width: '100%',
    }),
  };


  // form validations
  const [proceedToSavingData, setProceedToSavingData] = useState(false);
  const updateHighlightedFields = () => {
    if (
      formValues.riverName &&
      formValues.siteName &&
      formValues.siteDescription &&
      formValues.date
    ) {
      setProceedToSavingData(true);
    } else if(enableSiteFields){
      setProceedToSavingData(false);
    }
  };

  // form validations
  useEffect(() => {
    if(!proceedToSavingData && enableSiteFields)
      handleSelectOnTypeCoordinateClick()
  }, [proceedToSavingData]);


  const transformSiteDetails = (siteDetails) => {
    if (!siteDetails) {
      return {};
    }

    formValues.selectedSite = siteDetails?.gid ?? null;
  
    return {
      label: siteDetails.sitename || '',
      riverName: siteDetails.rivername || '',
      rivercategory: siteDetails.rivercategory || '',
      siteDescription: siteDetails.sitedescription || '',
      siteName: siteDetails.sitename || '',
      value: siteDetails.gid || 0,
    };
  };

  const [charCountSite, setCharCountSite] = useState(0);
  const [charCountRiver, setCharCountRiver] = useState(0);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = React.useState(false);
  const maxCharLimit = 50;

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if(formValues.riverName ||
        formValues.siteName ||
        formValues.siteDescription ||
        formValues.date || 
        proceedToSavingData) {
        const message = "You have unsaved data, are you sure you want to leave?";
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [proceedToSavingData,formValues]);


  const handleCloseSidebar = () => {
    props.setIsDisableNavigations(false)
    if(formValues.riverName || formValues.siteName || formValues.siteDescription || formValues.date || proceedToSavingData){
      setIsCloseDialogOpen(true)
    }
    else {
      props.setSidebarOpen(false);
      props.resetMap();
      props.setCursor('');
      setProceedToSavingData(false)
    }
  };

  const handleCloseConfirm = () => {
    setIsCloseDialogOpen(false)
    props.setSidebarOpen(false)
    props.setIsDisableNavigations(false);
    clearDraft();
  };

  const handleDialogCancel = () => {
    setIsCloseDialogOpen(false)
    setIsDisableNavigations(true)
  };


  const fieldStyle = {
    width: '100%',
    height: '44px',
    border: '1px solid rgba(0, 0, 0, 0.23)',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '15px',
  };

  const fieldErrorStyle = (hasError: boolean) => ({
    ...fieldStyle,
    border: `1px solid ${hasError ? '#ef4444' : 'rgba(0, 0, 0, 0.23)'}`,
  });

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
      {!showScoreForm ? (
      <div className={props.className} style={{
        height: '75vh',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        <FormStepIndicator steps={FORM_STEPS} currentStep={0} className="mb-3 -mx-3" />

        {/* Header */}
        <div className="flex items-center justify-between w-full mb-4">
          <h2 className="font-raleway text-xl font-bold text-primary">
            {props?.datainputform}
          </h2>
          <button
            onClick={handleCloseSidebar}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-primary"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {hasDraft && (
          <div className="mb-3 flex items-center justify-between rounded-lg bg-accent/10 px-3 py-2">
            <span className="text-caption text-accent-dark">Draft restored from previous session</span>
            <button type="button" onClick={() => { clearDraft(); window.location.reload(); }} className="text-caption font-semibold text-accent hover:underline">Discard</button>
          </div>
        )}

        <div className="flex flex-col gap-5 w-full">

          <Formik
            initialValues={formValues}
            onSubmit={(values) => {
              setFormValues(values)
              handleShowScoreForm()
            }}
          >
            {({ values, handleChange, setFieldValue }) => (
              <Form className="flex flex-col gap-5">

          {/* ── Section: Site Details ── */}
          <div className="rounded-xl border border-surface-subtle bg-white p-4">
            <Tooltip
              title={
                <React.Fragment>
                  <p style={{ color: 'inherit' }}>
                    <strong>A. Upload Images:</strong> Upload site images to an existing site or on a new one.
                    Just click the "Upload Images" button and proceed.
                  </p>
                  <p style={{ color: 'inherit', marginBottom: '1rem' }}>
                    <strong>B. Select Site on Map:</strong> When enabled, click an area on the map with an existing site,
                    and the site information will reflect in the form. When disabled, all saved sites appear in the
                    select dropdown, and you can choose by clicking the choice, and its info will be reflected in the form.
                  </p>
                </React.Fragment>
              }
              placement="top"
              arrow
              PopperProps={{
                popperRef,
                anchorEl: {
                  getBoundingClientRect: () => {
                    return new DOMRect(
                      sitePositionRef.current.x,
                      siteAreaRef.current!.getBoundingClientRect().y,
                      0,
                      0,
                    );
                  },
                },
              }}
            >
              <div className="flex items-center gap-1.5 mb-3"
                ref={siteAreaRef}
                onMouseMove={siteHandleMouseMove}
              >
                <h3 className="font-raleway text-lg font-bold text-primary">
                  {props?.sitedetails}
                </h3>
                <Img
                  className="h-3.5 w-3.5 cursor-pointer"
                  src={`${globalVariables.staticPath}information.png`}
                  alt="Information Icon"
                />
              </div>
            </Tooltip>

                {/* Create / Existing toggle */}
                <RadioGroup
                  value={isCreateSite}
                  onClick={(evt) => {
                    const newValue = evt.target.value;
                    setType((prevType) => (prevType === newValue ? null : newValue));
                    if(newValue === 'createsite'){
                      props.resetSiteDetails({})
                      setSitesList([])
                      setEnableSiteFields(true)
                      setIsCreateSite('createsite')
                    }
                    else {
                      setIsCreateSite('useexistingsite')
                      setEnableSiteFields(false)
                      getSites()
                      setSelectSiteMode('NONE')
                      if(selectSiteMode === 'SELECT_ON_MAP')
                        props.toggleMapSelection()
                    }
                    setFieldValue('selectedSite', 'none');
                    setFieldValue('riverName', '');
                    setFieldValue('siteName', '');
                    setFieldValue('riverCategory', '');
                    setFieldValue('siteDescription', '');
                    setProceedToSavingData(false)
                    formValues.riverName = ''
                    formValues.siteName = ''
                    formValues.siteDescription = ''
                  }}
                  row
                  sx={{ gap: 1 }}
                >
                  <FormControlLabel value="createsite" control={<Radio size="small" />} label="Create New Site" />
                  <FormControlLabel value="useexistingsite" control={<Radio size="small" />} label="Use Existing Site" />
                </RadioGroup>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="!text-white-A700 cursor-pointer font-raleway text-center text-sm tracking-[0.81px]"
                    shape="round"
                    color="blue_gray_500"
                    size="xs"
                    variant="fill"
                    onClick={openUploadModal}
                  >
                    {props?.uploadSiteImages}
                  </Button>
                  {values.images?.length > 0 && (
                    <span className="inline-flex items-center text-sm text-accent font-medium">
                      {values.images.length} image{values.images.length !== 1 ? 's' : ''} selected
                    </span>
                  )}
                  {!enableSiteFields && (
                    <Button
                      type="button"
                      className="!text-white-A700 cursor-pointer font-raleway text-center text-sm tracking-[0.81px]"
                      shape="round"
                      color={selectSiteMode === 'SELECT_KNOWN_SITE' ? 'blue_900' : 'blue_gray_500'}
                      size="xs"
                      variant="fill"
                      onClick={() => {
                        handleSelectKnownSite()
                        setFieldValue('riverName', '');
                        setFieldValue('siteName', '');
                        setFieldValue('riverCategory', '');
                        setFieldValue('siteDescription', '');
                        setProceedToSavingData(false)
                      }}
                    >
                      {selectSiteMode === 'SELECT_KNOWN_SITE' ? 'Disable' : 'Select site on map'}
                    </Button>
                  )}
                </div>

                {/* Existing site selector */}
                {!enableSiteFields && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text">Sites</label>
                    {isFetchingSites ? (
                      <LinearProgress color="success" />
                    ) : (
                      <Select
                        name="selectedSite"
                        options={sites}
                        className="!text-black-900_99 font-raleway text-base text-left"
                        placeholder="Search sites..."
                        isSearchable
                        styles={customStyles}
                        value={(() => {
                          const selectedOption = sites.find((option) => {
                            const isMatch = parseInt(option.value) === parseInt(values.selectedSite.value);
                            return isMatch;
                          });
                          if(selectSiteMode === 'SELECT_KNOWN_SITE')
                            return transformSiteDetails(props.siteDetails)
                          return selectedOption
                        })()}
                        onChange={(selectedOption) => {
                          handleChange({ target: { name: 'selectedSite', value: selectedOption.value } });
                          const selectedValue = selectedOption.value;
                          if (selectedValue === 'none') {
                            setFieldValue('selectedSite', 'none');
                            setFieldValue('riverName', '');
                            setFieldValue('siteName', '');
                            setFieldValue('rivercategory', '');
                            setFieldValue('siteDescription', '');
                            setIsCreateSite('useexistingsite');
                            setProceedToSavingData(false);
                          } else {
                            const selectedSite = sites.find((site) => site.value === selectedValue);
                            if (selectedSite) {
                              setIsCreateSite('useexistingsite');
                              setFieldValue('selectedSite', selectedSite);
                              setFieldValue('riverName', selectedSite.riverName);
                              setFieldValue('siteName', selectedSite.siteName);
                              setFieldValue('rivercategory', selectedSite.rivercategory);
                              setFieldValue('siteDescription', selectedSite.siteDescription);
                              setProceedToSavingData(true);
                              handleSelectSiteFromOption(selectedOption.latitude, selectedOption.longitude)
                            }
                          }
                        }}
                      />
                    )}
                  </div>
                )}

                <UploadModal
                  isOpen={isUploadModalOpen}
                  onClose={closeUploadModal}
                  onSubmit={(files) =>{
                    setFieldValue('images', files)
                    closeUploadModal()
                  }} />

                {/* Form fields — stacked label-above-input */}
                <div className="flex flex-col gap-3">
                  {/* River name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-text">{props?.rivername}</label>
                    <Field
                      name="riverName"
                      placeholder="River name"
                      style={fieldErrorStyle(!proceedToSavingData && !formValues.riverName && enableSiteFields)}
                      value={(() => {
                        const siteRiverName = props.siteDetails?.rivername;
                        return siteRiverName ? siteRiverName : values.riverName;
                      })()}
                      onChange={(e) => {
                        handleChange(e);
                        setSiteUserValues((prevValues) => ({ ...prevValues, riverName: e.target.value }));
                        formValues.riverName = e.target.value
                        updateHighlightedFields()
                        setCharCountRiver(e.target.value.length);
                        if (e.target.value.length >= maxCharLimit) { e.preventDefault(); return; }
                      }}
                      disabled={!enableSiteFields}
                    />
                    {charCountRiver >= maxCharLimit && <span className="text-xs text-danger">Max characters reached!</span>}
                    {!proceedToSavingData && !formValues.riverName && enableSiteFields && (
                      <span className="text-xs text-danger">River name is required</span>
                    )}
                  </div>

                  {/* Site name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-text">{props?.sitename}</label>
                    <Field
                      name="siteName"
                      placeholder="Site name"
                      style={fieldErrorStyle(!proceedToSavingData && !formValues.siteName && enableSiteFields)}
                      value={(() => {
                        const siteSiteName = props.siteDetails?.sitename;
                        return siteSiteName ? siteSiteName : values.siteName;
                      })()}
                      onChange={(e) => {
                        handleChange(e);
                        setSiteUserValues((prevValues) => ({ ...prevValues, siteName: e.target.value }));
                        formValues.siteName = e.target.value
                        updateHighlightedFields()
                        setCharCountSite(e.target.value.length);
                        if (e.target.value.length >= maxCharLimit) { e.preventDefault(); return; }
                      }}
                      disabled={!enableSiteFields}
                    />
                    {charCountSite >= maxCharLimit && <span className="text-xs text-danger">Max characters reached!</span>}
                    {!proceedToSavingData && !formValues.siteName && enableSiteFields && (
                      <span className="text-xs text-danger">Site name is required</span>
                    )}
                  </div>

                  {/* Site description */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-text">{props?.sitedescriptionOne}</label>
                    <textarea
                      name="siteDescription"
                      style={{
                        ...fieldErrorStyle(!proceedToSavingData && !formValues.siteDescription && enableSiteFields),
                        height: '80px',
                        resize: 'vertical',
                      }}
                      placeholder="e.g. downstream of industry."
                      value={(() => {
                        const siteSiteDescription = props.siteDetails?.sitedescription;
                        return siteSiteDescription ? siteSiteDescription : values.siteDescription;
                      })()}
                      onChange={(e) => {
                        handleChange(e);
                        setSiteUserValues((prevValues) => ({ ...prevValues, siteDescription: e.target.value }));
                        formValues.siteDescription = e.target.value
                        updateHighlightedFields()
                      }}
                      disabled={!enableSiteFields}
                    />
                    {!proceedToSavingData && !formValues.siteDescription && enableSiteFields && (
                      <span className="text-xs text-danger">Site description is required</span>
                    )}
                  </div>

                  {/* River category */}
                  <div className="flex flex-col gap-1">
                    <Tooltip
                      title={
                        <React.Fragment>
                          <div style={{ color: 'inherit' }}>
                            <p>
                              <strong>Classifying your stream / river:</strong> A: "Rocky" section of a stream / river has loose rocks instream and is often found closer to the source of the river.
                              Sections of stream / rivers without any loose rocks instream are termed "Sandy" and are often found towards the mouth of the stream / river.
                            </p>
                          </div>
                        </React.Fragment>
                      }
                      placement="top"
                      arrow
                      PopperProps={{
                        popperRef,
                        anchorEl: {
                          getBoundingClientRect: () => {
                            return new DOMRect(
                              positionRef.current.x,
                              areaRef.current!.getBoundingClientRect().y,
                              0,
                              0,
                            );
                          },
                        },
                      }}
                    >
                      <div className="flex items-center gap-1"
                        ref={areaRef}
                        onMouseMove={handleMouseMove}
                      >
                        <label className="text-sm font-medium text-text">{props?.rivercategory}</label>
                        <Img className="h-3.5 w-3.5 cursor-pointer" src={`${globalVariables.staticPath}information.png`} alt="Info" />
                      </div>
                    </Tooltip>
                    <Field as="select" name="rivercategory"
                      style={fieldStyle}
                      disabled={!enableSiteFields}
                    >
                      {inputOptionsList.map((option) => (
                        <option
                          key={option.value}
                          value={(() => {
                            const siteRivercategory = props.siteDetails?.rivercategory;
                            return siteRivercategory ? siteRivercategory : option.value;
                          })()}
                          selected={option.value === values.rivercategory}
                        >
                          {option.label}
                        </option>
                      ))}
                    </Field>
                  </div>
                </div>

                {/* ── Site Location ── */}
                <div className="flex flex-col gap-3">
                  <h3 className="font-raleway text-lg font-bold text-primary">{props?.sitelocation}</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="!text-white-A700 cursor-pointer font-raleway text-center text-sm tracking-[0.81px]"
                      shape="round"
                      color={selectSiteMode === 'SELECT_ON_MAP' ? 'blue_900': 'blue_gray_500'}
                      size="xs"
                      variant="fill"
                      onClick={handleSelectOnMapClick}
                      disabled={!enableSiteFields}
                      style={{ opacity: enableSiteFields ? 1 : 0.5 }}
                    >
                      {props?.selectOnMap}
                    </Button>
                    <Button
                      type="button"
                      className="!text-white-A700 cursor-pointer font-raleway text-center text-sm tracking-[0.81px]"
                      shape="round"
                      color={selectSiteMode === 'TYPE_IN_COORDINATES' ? 'blue_900': 'blue_gray_500'}
                      size="xs"
                      variant="fill"
                      onClick={handleSelectOnTypeCoordinateClick}
                      disabled={!enableSiteFields}
                      style={{ opacity: enableSiteFields ? 1 : 0.5 }}
                    >
                      {props?.typeInCoordinates}
                    </Button>
                  </div>
                </div>

                {(selectSiteMode === 'TYPE_IN_COORDINATES' || selectSiteMode === 'SELECT_ON_MAP') && enableSiteFields && (
                  <CoordinatesInputForm
                    values={values}
                    setFieldValue={setFieldValue}
                    defaultType={'Degree'}
                    handleMapClick={props.handleMapClick}
                    selectedCoordinates={props.selectedCoordinates}
                    selectOnMap={props.selectingOnMap}
                    disabled={selectSiteMode !== 'TYPE_IN_COORDINATES'}
                  />
                )}

          </div>{/* end site details card */}

                {/* ── Section: Observation Details ── */}
                <div className="rounded-xl border border-surface-subtle bg-white p-4">
                  <h3 className="font-raleway text-lg font-bold text-primary mb-3">{props?.observationdetaOne}</h3>
                  <div className="flex flex-col gap-3">
                    {/* Date */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-text">{props?.date}</label>
                      {values.date && (
                        <span className="text-xs text-text-muted">{formatDate(new Date(values.date))}</span>
                      )}
                      <Field
                        type="date"
                        name="date"
                        style={fieldErrorStyle(!formValues.date)}
                        min={'2010-01-01'}
                        max={(new Date()).toISOString().split('T')[0]}
                        value={values.date}
                        onChange={(e) => {
                          handleChange(e);
                          setSiteUserValues((prevValues) => ({ ...prevValues, date: e.target.value }));
                          formValues.date = e.target.value
                          updateHighlightedFields()
                        }}
                      />
                      {!formValues.date && <span className="text-xs text-danger">Date is required</span>}
                    </div>

                    {/* Collector's name */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-text">{props?.collectorsname}</label>
                      <Field
                        name="collectorsname"
                        placeholder="Collector's name"
                        style={fieldStyle}
                        value={values.collectorsname}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-text">{props?.notes}</label>
                      <textarea
                        name="notes"
                        style={{ ...fieldStyle, height: '80px', resize: 'vertical' }}
                        placeholder="e.g. downstream of industry."
                        value={values.notes}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section: Measurements ── */}
                <div className="rounded-xl border border-surface-subtle bg-white p-4">
                  <h3 className="font-raleway text-lg font-bold text-primary mb-3">{props?.measurements}</h3>
                  <div className="flex flex-col gap-3">
                    {/* Water clarity */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-text">{props?.waterclaritycm}</label>
                      <Field name="waterclaritycm" placeholder="0" type="number" min="0" style={fieldStyle} value={values.waterclaritycm} onChange={handleChange} />
                    </div>

                    {/* Water temperature */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-text">{props?.watertemperatureOne}</label>
                      <Field name="watertemperatureOne" placeholder="0" type="number" min="-100" max="100" style={fieldStyle} value={values.watertemperatureOne} onChange={handleChange} />
                    </div>

                    {/* pH */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-text">{props?.ph}</label>
                      <Field name="ph" placeholder="7.0" type="number" min="0" max="14" step={0.1} style={fieldStyle} value={values.ph} onChange={handleChange} />
                    </div>

                    {/* Dissolved oxygen */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-text">{props?.dissolvedoxygenOne}</label>
                      <div className="flex gap-2">
                        <Field name="dissolvedoxygenOne" type="number" min="0" max="20" placeholder="0.00" style={{ ...fieldStyle, flex: 1 }} value={values.dissolvedoxygenOne} onChange={handleChange} />
                        <Field as="select" name="dissolvedoxygenOneUnit" style={{ ...fieldStyle, width: '100px', flex: 'none' }} value={values.dissolvedoxygenOneUnit} onChange={handleChange}>
                          {inputOxygenUnitsList.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </Field>
                      </div>
                    </div>

                    {/* Electrical conductivity */}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-text">{props?.electricalconduOne}</label>
                      <div className="flex gap-2">
                        <Field name="electricalconduOne" min="0" max="100" placeholder="0.00" type="number" style={{ ...fieldStyle, flex: 1 }} value={values.electricalconduOne} onChange={handleChange} />
                        <Field as="select" name="electricalconduOneUnit" style={{ ...fieldStyle, width: '100px', flex: 'none' }} value={values.electricalconduOneUnit} onChange={handleChange}>
                          {inputElectricConductivityUnitsList.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </Field>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Validation warning */}
                {!proceedToSavingData && (
                  <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2">
                    <svg className="h-4 w-4 flex-shrink-0 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm text-danger">Please complete all required fields above.</span>
                  </div>
                )}

                {/* Submit */}
                <Button
                  className={`!text-white-A700 cursor-pointer font-raleway rounded-bl-[10px] rounded-br-[10px] rounded-tr-[10px] text-center text-lg tracking-[0.81px] w-full mb-4 ${proceedToSavingData ? 'hover:opacity-90' : 'opacity-50'}`}
                  color="blue_gray_500"
                  size="xl"
                  variant="fill"
                  type="submit"
                  disabled={!proceedToSavingData}
                >
                  Next: Assessment
                </Button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
      ): (
        <ScoreForm
          onCancel={handleHideScoreForm}
          additionalData={formValues}
          setSidebarOpen={props.setSidebarOpen}
          proceedToSavingData={proceedToSavingData}
          setProceedToSavingData={setProceedToSavingData}
          setIsDisableNavigations={props.setIsDisableNavigations}
        />
      )}
    </>
  );
};


// TODO make form dynamic
DataInputForm.defaultProps = {
  datainputform: "Data Input Form",
  sitedetails: "Site Details",
  uploadSiteImages: "Upload site images",
  rivername: "River name:",
  sitename: "Site name:",
  sitedescriptionOne: "Site description:",
  defaultslot: (
    <>
      e.g. downstream of industry. <br />
      Max 255 characters
    </>
  ),
  rivercategory: "River category",
  sitelocation: "Site location",
  selectKnownSite: SiteSelectionModes.SELECT_KNOWN_SITE,
  selectOnMap: SiteSelectionModes.SELECT_ON_MAP,
  typeInCoordinates: SiteSelectionModes.TYPE_IN_COORDINATES,
  observationdetaOne: "Observation details",
  date: "Date:",
  collectorsname: "Collector's name:",
  notes: "Notes:",
  defaultslotOne: (
    <>
      e.g. downstream of industry. <br />
      Max 255 characters
    </>
  ),
  measurements: "Measurements",
  waterclaritycm: "Water clarity (cm):",
  watertemperatureOne: "Water temperature (°C):",
  ph: "pH:",
  dissolvedoxygenOne: "Dissolved oxygen",
  electricalconduOne: "Electrical conductivity",
};

export default DataInputForm;
