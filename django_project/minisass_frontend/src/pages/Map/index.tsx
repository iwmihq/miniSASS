import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button, Img, Input, Text } from "../../components";
import Footer from "../../components/Footer";
import NavigationBar from "../../components/NavigationBar";
import Sidebar from "../../components/Sidebar";
import { Map } from "../../components/Map"

import Search from './Search';
import basemapsData from './config/basemaps.config.json';
import overlayLayersData from './config/overlay.config.json';
import { useAuth, OPEN_LOGIN_MODAL } from "../../AuthContext";
import { globalVariables } from "../../utils";
import HomeIcon from '@mui/icons-material/Home';

import "./style.css"

const MapPage: React.FC = () => {
  const mapRef = useRef(null);

  const { dispatch, state  } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isObservationDetails, setIsObservationDetails] = useState(false);
  const [isLoginFromThis, setIsLoginFromThis] = useState(false);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const details = params.get("details");
  const open_add_record = params.get("open_add_record");
  const [idxActive, setIdxActive] = useState(open_add_record ? 1 : 0);
  const [isDisableNavigations, setIsDisableNavigations] = useState(false);

  const handleSidebarToggle = () => {
    setIsObservationDetails(false);
    if (state.isAuthenticated) {
      setSidebarOpen(prev => {
        if(prev === false){
          setIdxActive(1)
        }
        setIsDisableNavigations(!prev);
        return !prev;
      });
    } else {
      setIsLoginFromThis(true)
      dispatch({ type: OPEN_LOGIN_MODAL, payload: true });
    }
  };

  useEffect(() => {
    if (state.isAuthenticated && isLoginFromThis) {
      setIdxActive(1)
      setSidebarOpen(true)
      setIsLoginFromThis(false)
    } else if(!state.isAuthenticated) {
      setSidebarOpen(false)
    }
  }, [state.isAuthenticated]);

  useEffect(() => {
    if(details){
      window.scrollTo(0, 0);
      setIsObservationDetails(true)
      setSidebarOpen((prev) => !prev);
    }else if(open_add_record){
      handleSidebarToggle()
    }
  }, [details, open_add_record]);

  const [showLegend, setShowLegend] = useState(true);

  const toggleLegend = () => {
    setShowLegend(prev => !prev);
  };

  const [selectingOnMap, setSelectingOnMap] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState({ latitude: null, longitude: null });

  const handleMapClick = (latitude, longitude) => {
    setSelectedCoordinates({
      latitude: latitude,
      longitude: longitude
    })
    // console.log(selectedCoordinates) // for testing coordinates accuracy
  };

  const toggleMapSelection = () => {
    setSelectingOnMap((prev) => !prev);
  };

  useEffect(() => {
    window.scrollTo(0, 0)
  }, []);

  useEffect(() => {
    if (!isSidebarOpen)
      setSelectedCoordinates({ latitude: null, longitude: null })
  }, [isSidebarOpen]);

  const [siteWithObservations, setSiteWithObservations] = useState({site:{}, observations: []});
  const [siteDetails, setSiteDetailsFromApi] = useState({});

  const openObservationForm = (siteWithObservations: {site: {}, observations: []}) => {
    
    if(siteWithObservations.observations.length > 0 && !isSelectSiteOnMap){
      setSiteWithObservations(siteWithObservations)
      setIsObservationDetails(true)
      setSidebarOpen(true);
      setSelectedCoordinates({
        latitude: siteWithObservations.site.latitude,
        longitude: siteWithObservations.site.longitude
      })
    }
  }

  const [resetMapToDefault, setResetMap] = useState(false);
  const [isSelectSiteOnMap, setIsSelectSiteOnMap] = useState(false);
  const [cursor, setCursor] = useState('');

  function resetMap(latitude=null, longitude=null): void {
    setSelectedCoordinates({latitude: latitude, longitude: longitude})
    setResetMap(true)
  }

  function setSiteDetails(details: {}): void {
    if(isSelectSiteOnMap)
      setSiteDetailsFromApi(details)
  }

  function useSelectOnSite(isSelectOnSite): void {
    setIsSelectSiteOnMap(isSelectOnSite)
  }

  function resetSiteDetails(details: {}): void {
    setSiteDetailsFromApi(details)
  }

  return (
    <>
      <div className="bg-white-A700 flex flex-col font-raleway items-center justify-start mx-auto w-full h-screen">

        <div className="h-[120px] md:px-5 relative w-full">

            {/* header section */}
            <div className="bg-white-A700 flex flex-col items-center justify-start mb-[-53px] mx-auto pb-[17px] pl-[17px] rounded-bl-[65px] w-full z-[1]">
              <div className="flex flex-col items-center justify-start w-[98%] md:w-full">
                <div className="flex md:flex-col flex-row gap-[30px] items-start justify-between w-full">

                  {/* minisass logo */}
                  <div className="bg-white-A700 flex flex-col h-[92px] md:h-auto items-start justify-start md:mt-0 mt-[17px] w-[77px]">
                    <Img
                      className="sm:bottom-[] md:h-auto h-full object-cover md:relative sm:right-[30px] sm:top-2.5 md:top-5 w-full"
                      src={`${globalVariables.staticPath}img_minisasslogo1.png`}
                      alt="minisasslogoOne"
                    />
                  </div>


                  {/* navigation bar */}
                  <div className="flex md:flex-1 flex-col gap-2 items-center justify-start mb-1.5 w-[100%] md:w-full">

                        <NavigationBar activePage="map" isDisableNavigations={isDisableNavigations} />

                  </div>
                </div>
              </div>
            </div>
            {/* end of section */}
          </div>

        <div className="grow md:px-5 relative md:w-[103.9%] w-full relative">
          <div className="flex flex-col h-full items-center justify-start m-auto w-full">
            <div className="bg-blue-900 sm:bottom-[50px] flex flex-row gap-[17px] justify-end p-[13px] sm:relative sm:top-[] w-full">
              <Button
                className="cursor-pointer rounded-bl-[10px] rounded-br-[10px] rounded-tr-[10px] text-center text-lg tracking-[0.81px] w-[156px]"
                color="blue_gray_500"
                size="xs"
                variant="fill"
                onClick={handleSidebarToggle}
              >
                Add Record
              </Button>
              <Search searchEntityChanged={geojson => mapRef?.current?.updateHighlighGeojson(geojson)}/>
            </div>
            <div className="grow relative w-full h-full syalala sm:mt-[-50px]">
              <Map
                basemaps={
                  basemapsData.map(data => {
                    return {
                      name: data.name,
                      config: data
                    }
                  })
                }
                overlayLayers={
                  overlayLayersData.map(data => {
                    return {
                      name: data.name,
                      activeByDefault: data.activeByDefault,
                      config: data,
                    }
                  })
                }
                ref={mapRef}
                handleSelect={handleMapClick}
                selectingOnMap={selectingOnMap}
                selectedCoordinates={selectedCoordinates}
                resetMap={resetMapToDefault}
                idxActive={idxActive}
                setIdxActive={setIdxActive}
                openObservationForm={openObservationForm}
                setSiteDetails={setSiteDetails}
                cursor={cursor}
                isSelectSiteOnMap={isSelectSiteOnMap}
              />
              {/* Sidebar */}
              <Sidebar
                isOpen={isSidebarOpen}
                isObservationDetails={isObservationDetails}
                setSidebarOpen={setSidebarOpen}
                observation={details}
                toggleMapSelection={toggleMapSelection}
                selectingOnMap={selectingOnMap}
                handleMapClick={handleMapClick}
                selectedCoordinates={selectedCoordinates}
                siteWithObservations={siteWithObservations}
                siteDetails={siteDetails}
                resetSiteDetails={resetSiteDetails}
                resetMap={resetMap}
                setCursor={setCursor}
                useSelectOnSite={useSelectOnSite}
                setIsDisableNavigations={setIsDisableNavigations}
              />
            </div>
          </div>


          {/* Toggle button to reset map */}
          <div
            // className="absolute top-0 left-0 m-4 p-2 bg-white top-[19.5%] rounded-md cursor-pointer"
            className="absolute top-0 left-0 m-4 p-2 bg-white sm:mt-[50px] md:mt-[0px] lg:mt-[0px]
            sm:ml-[30px] md:mr-[20px] lg:ml-[10px] top-[19.5%] rounded-md cursor-pointer"
            onClick={() => resetMap(-28.671882886975247, 24.679864950000024)}
            style={{
              transition: 'transform 0.6s ease-in-out', // Adding smooth rotation transition
              backgroundColor: 'white',
            }}
          >
            <HomeIcon className="w-35" />
          </div>

          {/* Toggle button to show legend */}
          <div
            className="show-hide-legend absolute top-0 left-0 m-4 p-2 bg-white top-[26%] sm:ml-[30px]
            md:ml-[10px] lg:ml-[10px] sm:mt-[50px] md:mt-[0px] lg:mt-[0px] rounded-md cursor-pointer"
            onClick={toggleLegend}
            style={{
              transition: 'transform 0.6s ease-in-out', // Adding smooth rotation transition
              backgroundColor: 'white',
              zIndex: 100
            }}
          >
            <svg
              width="12"
              height="16"
              viewBox="0 0 12 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transform ${showLegend ? 'rotate-180' : ''}`} // Apply rotation conditionally
            >
              <path
                d="M11 2L5 8L11 14"
                stroke="#000"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <Text className="text-base text-black-900" size="txtRalewayRomanBold16">
              L
            </Text>
          </div>

        <div
          className={`legend-placeholder absolute bg-white-A700 flex flex-col gap-2 items-start justify-center 
          left-[1%] px-[18px] py-5 rounded-bl-[10px] rounded-br-[10px] rounded-tr-[10px] top-[50%] 
          sm:top-[25px] w-auto transition-opacity duration-300 sm:ml-[20%] sm:w-[80%] ${
            showLegend ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >

          <Text className="text-base text-black-900" size="txtRalewayRomanBold16">
            Legend
          </Text>

          {showLegend && (
            <><div className="flex flex-row gap-3 items-center justify-center w-auto">
                <Img className="h-6 w-7" src={`${globalVariables.staticPath}img_alarm.svg`} alt="alarm" />
                <Text
                  className="text-base text-black-900 w-auto"
                  size="txtRalewayRomanRegular16"
                >
                  Unmodified (NATURAL condition)
                </Text>
              </div><div className="flex flex-row gap-3 items-center justify-center w-auto">
                  <Img
                    className="h-6 w-7"
                    src={`${globalVariables.staticPath}img_alarm_green_400.svg`}
                    alt="alarm_One" />
                  <Text
                    className="leading-[136.40%] max-w-[243px] md:max-w-full text-base text-black-900"
                    size="txtRalewayRomanRegular16"
                  >
                    Largely natural/few modifications (GOOD condition)
                  </Text>
                </div><div className="flex flex-row gap-3 items-center justify-center w-auto">
                  <Img
                    className="h-6 w-7"
                    src={`${globalVariables.staticPath}img_alarm_orange_a200.svg`}
                    alt="alarm_Two" />
                  <Text
                    className="text-base text-black-900 w-auto"
                    size="txtRalewayRomanRegular16"
                  >
                    Moderately modified (FAIR condition)
                  </Text>
                </div><div className="flex flex-row gap-3 items-center justify-center w-auto">
                  <Img
                    className="h-6 w-7"
                    src={`${globalVariables.staticPath}img_twitter.svg`}
                    alt="twitter" />
                  <Text
                    className="text-base text-black-900 w-auto"
                    size="txtRalewayRomanRegular16"
                  >
                    Largely modified (POOR condition)
                  </Text>
                </div><div className="flex flex-row gap-3 items-center justify-center w-auto">
                  <Img
                    className="h-6 w-7"
                    src={`${globalVariables.staticPath}img_alarm_deep_purple_400.svg`}
                    alt="alarm_Three" />
                  <Text
                    className="leading-[136.40%] max-w-[268px] md:max-w-full text-base text-black-900"
                    size="txtRalewayRomanRegular16"
                  >
                    Seriously/critically modified(VERY POOR condition)
                  </Text>
                </div><div className="flex flex-row gap-3 items-center justify-center w-auto">
                  <Img
                    className="h-6 w-7"
                    src={`${globalVariables.staticPath}img_settings.svg`}
                    alt="settings" />
                  <Text
                    className="text-base text-black-900 w-auto"
                    size="txtRalewayRomanRegular16"
                  >
                    No groups present
                  </Text>
                </div><div className="flex flex-row gap-3 items-center justify-center w-auto">
                  <Img
                    className="h-6 w-7"
                    src={`${globalVariables.staticPath}img_arrowdown.svg`}
                    alt="arrowdown" />
                  <Text
                    className="text-base text-black-900 w-auto"
                    size="txtRalewayRomanRegular16"
                  >
                    Exclamation mark: unverified
                  </Text>
                </div></>
                    )}
          </div>
          </div>
      </div>
      <Footer className="flex items-center justify-center mt-[107px] md:px-5 w-full" />
    </>
  );
};

export default MapPage;
