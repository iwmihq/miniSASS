import React, { useEffect, useState } from "react";
import { Img, Text } from "..";
import { CircularProgressbar } from "react-circular-progressbar";
import axios from "axios";
import TabbedContent from "../TabbedContent";
import { globalVariables } from "../../utils";
import LinearProgress from '@mui/material/LinearProgress';
import DownloadObservationForm from '../DownloadObservationModal/index';
import LineChart from '../Charts/LineChart';
import dayjs from 'dayjs';
import { FaAngleDown, FaAngleUp } from 'react-icons/fa';
import { FiMapPin, FiCalendar, FiUser, FiMessageSquare, FiDownload, FiBarChart2 } from 'react-icons/fi';
import { BiWater, BiGlobe } from 'react-icons/bi';
import { MdOutlineScience, MdElectricBolt } from 'react-icons/md';
import { TbTemperature } from 'react-icons/tb';
import { HiOutlineLocationMarker, HiOutlineOfficeBuilding } from 'react-icons/hi';

interface ObservationDetailsProps {
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  observation_id: string;
  classname: string;
  handleMapClick: (longitude: number, latitude: number) => void;
  siteWithObservations: { site: {}, observations: []};
  resetMap: () => void;
}

interface Observation {
  observation: number;
  site: string;
  username: string;
  organisation: string;
  time_stamp: string;
  obs_date: string;
  score: string;
}

const OBSERVATION_LIST_URL = globalVariables.baseUrl + '/monitor/observations/recent-observations'

const ObservationDetails: React.FC<ObservationDetailsProps> = ({ 
  setSidebarOpen, 
  classname, 
  observation_id,
  handleMapClick, 
  siteWithObservations,
  resetMap  
}) => {

  const [openFromHomePage, setOpenFromHomePage] = useState(true);

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    // resetMap();
    setOpenFromHomePage(false);
  };

  const GET_OBSERVATION = globalVariables.baseUrl + `/monitor/observations/observation-details/${observation_id}/`

  const [loading, setLoading] = useState(true);
  const [observationDetails, setObservationDetails] = useState({});
  const [titleColor, setTitleColor] = useState<string>('');
  const [classification, setClassification] = useState<string>('');
  const [progressBarColor, setProgressBarColor] = useState<string>('');
  const [renderCrab, setRenderCrab] = useState<string>('');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);
  const [isChartHidden, setIsChartHidden] = useState<boolean>(true);
  const [observationList, setObservationList] = useState<Observation[]>([]);

  let minDate = dayjs().format('YYYY-MM-DD');
  let maxDate = dayjs().format('YYYY-MM-DD');
  
  if (observationList.length == 1) {
    minDate = dayjs(observationList[0].obs_date).format('YYYY-MM-DD');
    maxDate = dayjs(observationList[0].obs_date).format('YYYY-MM-DD');
  } else if (observationList.length > 1) {
    
    // Loop through the observation list to find the minimum and maximum dates
    minDate = dayjs(observationList[0].obs_date).format('YYYY-MM-DD');
    maxDate = dayjs(observationList[0].obs_date).format('YYYY-MM-DD');

    for (let i = 1; i < observationList.length; i++) {
        const currentDate = dayjs(observationList[i].obs_date).format('YYYY-MM-DD');
        if (dayjs(currentDate).isBefore(minDate)) {
            minDate = currentDate;
        }
        if (dayjs(currentDate).isAfter(maxDate)) {
            maxDate = currentDate;
        }
    }
  }

  const fetchObservations = async () => {
    if (observationDetails.site?.gid) {
      const url = `${OBSERVATION_LIST_URL}/?site_id=${observationDetails.site?.gid}&recent=False`
      axios.get(url).then((response) => {
        if (response.data) {
            setObservationList(response.data as Observation[])
        }
      }).catch((error) => {
          console.log(error)
      })
    }
  }

  useEffect(() => {
    if ((Array.isArray(observationDetails) && observationDetails.length > 0) ||
      (typeof observationDetails === 'object' && Object.keys(observationDetails).length > 0)) {
      fetchObservations();
    }
  }, [observationDetails]);

  const closeDownloadModal = () => {
    setIsDownloadModalOpen(false);
  };

  const [observations, setObservations] = useState([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [imageTabIndex, setImageTabIndex] = useState<number>(0);
  const [siteDetails, setSiteDetails] = useState({});
  const [tabsData, setTabsData] = useState([]);
  const [imageTabsData, setImageTabsData] = useState({});
  const [isSiteDetailsOpen, setIsSiteDetailsOpen] = useState(true);
  const [isObservationDetailsOpen, setIsObservationDetailsOpen] = useState(true);
  const [isMeasurementsOpen, setIsMeasurementsOpen] = useState(true);

  const updateScoreDisplay = (riverCategory, score) => {
    if (riverCategory === 'sandy') {
      if (score > 6.8) {
        setTitleColor("text-blue-600");
        setProgressBarColor("blue");
        setRenderCrab(`${globalVariables.staticPath}crab_blue.svg`);
        setClassification('NATURAL');
      } else if (score > 5.8 && score <= 6.8) {
        setTitleColor("text-green-600");
        setProgressBarColor("green");
        setRenderCrab(`${globalVariables.staticPath}crab_green.svg`);
        setClassification('GOOD');
      } else if (score > 5.3 && score <= 5.8) {
        setTitleColor("text-orange-600");
        setProgressBarColor("orange");
        setRenderCrab(`${globalVariables.staticPath}crab_orange.svg`);
        setClassification('FAIR');
      } else if (score > 4.8 && score <= 5.3) {
        setTitleColor("text-red-600");
        setProgressBarColor("red");
        setRenderCrab(`${globalVariables.staticPath}crab_red.svg`);
        setClassification('POOR');
      } else if (score <= 4.8 && score !== '') {
        setTitleColor("text-purple-600");
        setProgressBarColor("purple");
        setRenderCrab(`${globalVariables.staticPath}crab_purple.svg`);
        setClassification('VERY POOR');
      } else {
        setTitleColor("text-purple-600");
        setProgressBarColor("purple");
        setRenderCrab(`${globalVariables.staticPath}crab_purple.svg`);
        setClassification('N/A');
      }
    } else {
      if (score > 7.2) {
        setTitleColor("text-blue-600");
        setProgressBarColor("blue");
        setRenderCrab(`${globalVariables.staticPath}crab_blue.svg`);
        setClassification('NATURAL');
      } else if (score > 6.1 && score <= 7.2) {
        setTitleColor("text-green-600");
        setProgressBarColor("green");
        setRenderCrab(`${globalVariables.staticPath}crab_green.svg`);
        setClassification('GOOD');
      } else if (score > 5.6 && score <= 6.1) {
        setTitleColor("text-orange-600");
        setProgressBarColor("orange");
        setRenderCrab(`${globalVariables.staticPath}crab_orange.svg`);
        setClassification('FAIR');
      } else if (score > 5.3 && score <= 5.6) {
        setTitleColor("text-red-600");
        setProgressBarColor("red");
        setRenderCrab(`${globalVariables.staticPath}crab_red.svg`);
        setClassification('POOR');
      } else if (score <= 5.3 && score !== '') {
        setTitleColor("text-purple-600");
        setProgressBarColor("purple");
        setRenderCrab(`${globalVariables.staticPath}crab_purple.svg`);
        setClassification('VERY POOR');
      } else {
        setTitleColor("text-purple-600");
        setProgressBarColor("purple");
        setRenderCrab(`${globalVariables.staticPath}crab_purple.svg`);
        setClassification('N/A');
      }
    }
  };

  useEffect(() => {
    if (siteWithObservations.observations && siteWithObservations.observations.length > 0) {
      setTabbedImages(observations);
    }
  }, [observations]);

  useEffect(() => {
    if (observationDetails.site && siteWithObservations.observations.length == 0) {
      setTabbedImages([observationDetails]);
    }
  }, [observationDetails]);

  useEffect(() => {
    setImageTabIndex(0);
  }, [activeTabIndex]);

  useEffect(() => {
    if (parseInt(observation_id) > 0 && openFromHomePage && Object.keys(observationDetails).length > 0) {
      updateTabs([observationDetails]);
    } else {
      if (siteWithObservations.observations && siteWithObservations.observations.length > 0) {
        updateTabs(observations)
      }
    }
  }, [imageTabsData, imageTabIndex]);

  const setTabbedImages = (observations) => {
    let imagesPerDate = {}
    observations.map((observation) => {
      const images = [].concat(observation.site.images, observation.images);
      let imagesPerPest = {};
      images.forEach((image) => {
        const key = image.pest_name ? image.pest_name : 'Site'
        if (Object.keys(imagesPerPest).includes(key)) {
          imagesPerPest[key].push(image)
        } else {
          imagesPerPest[key] = [image]
        }
      });

      let allImages = Object.keys(imagesPerPest).map((key, index) => ({
        id: `tab-image-${observation.obs_date}-${index + 1}`,
        label: key,
        content: (
          <div className="flex flex-row gap-2.5 items-start justify-start overflow-auto w-full alabasta" style={{ marginTop: '10%' }}>
            {
              // Render images if there are any
              imagesPerPest[key].map((image, index) => (
                <img
                  key={`image_${index}`}
                  className="h-[152px] md:h-auto object-cover w-[164px]"
                  src={image.image}
                  alt={`img_${index}`}
                  loading='lazy'
                />
              ))
            }
          </div>
        )
      }));

      if (images.length === 0) {
        allImages = [{
          id: `tab-image-${observation.obs_date}-1`,
          label: 'No Images',
          content: (
            <div className="flex items-center justify-center w-full h-[152px] md:h-auto overflow-hidden">
              <span className="text-gray-500">No Images available for site</span>
            </div>
          )
        }]
      }
      imagesPerDate[observation.obs_date] = allImages
    })

    setImageTabsData(imagesPerDate);
  }

  const updateTabs = (observations) => {
    setTabsData(
      observations.map((observation, index) => ({
        id: `tab${index + 1}`,
        label: observation.obs_date,
        content: (
          <div className="flex flex-row gap-2.5 items-start justify-start overflow-hidden w-full" style={{ marginTop: '10%' }}>
            <TabbedContent
              tabsData={imageTabsData[observation.obs_date] ? imageTabsData[observation.obs_date] : []}
              activeTabIndex={imageTabIndex}
              onTabChange={(index) => {
                setImageTabIndex(index);
              }}
            />
          </div>
        )        
      }))
    );
  }

  const fetchObservation = async () => {
    try {
      const response = await axios.get(`${GET_OBSERVATION}`);
      
      if (response.status === 200) {
        setLoading(false);
        setObservationDetails(response.data);
        setSiteDetails({})
        setObservations([])
        
        setTimeout(() => {
          handleMapClick(response.data.latitude,response.data.longitude);
        }, 1200);

        updateScoreDisplay(response.data.site.river_cat, response.data.score);

      } else { }
    } catch (error) {
      console.log(error.message)
     }
  };

  useEffect(() => {
    if (parseInt(observation_id) > 0 && openFromHomePage) {
      fetchObservation();
    } else {
      if (siteWithObservations.observations && siteWithObservations.observations.length > 0) {
        setLoading(false);
        updateScoreDisplay(siteWithObservations.site.rivercategory, siteWithObservations.observations[0].score); // on intial load
        setObservationDetails(siteWithObservations.observations[0]); // on intial load
        setObservationList(siteWithObservations.observations)

        setObservations(siteWithObservations.observations)
        setSiteDetails(siteWithObservations.site)
      } 
    }
  }, [observation_id, siteWithObservations]);

  const toggleSiteDetails = () => {
    setIsSiteDetailsOpen(!isSiteDetailsOpen);
  };

  const toggleObservationDetails = () => {
    setIsObservationDetailsOpen(!isObservationDetailsOpen);
  };

  const toggleMeasurements = () => {
    setIsMeasurementsOpen(!isMeasurementsOpen);
  };


  // Helper: render a detail row with icon, label, value, and alternating bg
  const DetailRow = ({ icon, label, value, odd = false }: { icon: React.ReactNode; label: string; value: React.ReactNode; odd?: boolean }) => (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${odd ? 'bg-gray-50' : ''}`}>
      <span className="text-blue-900 shrink-0">{icon}</span>
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="ml-auto text-sm font-medium text-gray-800 text-right">{value || 'N/A'}</span>
    </div>
  );

  // Helper: get measurement value or N/A
  const getMeasurement = (field: string, unit?: string) => {
    const val = observationDetails[field] !== undefined
      ? observationDetails[field]
      : (siteWithObservations.observations.length > 0 ? siteWithObservations.observations[0][field] : undefined);
    if (val === undefined || parseFloat(val) === 999 || parseFloat(val) === -9999) return 'N/A';
    const unitVal = unit ? (observationDetails[unit] || (siteWithObservations.observations.length > 0 ? siteWithObservations.observations[0][unit] : '')) : '';
    return unitVal ? `${val} ${unitVal}` : val;
  };

  return (
    <div className={classname} style={{ overflowX: 'hidden' }}>
    {/* Header */}
    <div className="flex items-center justify-between w-full pb-2 border-b border-gray-200">
      <span className="text-lg text-blue-900 font-bold">Observation Details</span>
      <div className="flex items-center gap-1.5">
        <button onClick={() => setIsDownloadModalOpen(true)} className="rounded-lg p-1.5 text-blue-900 hover:bg-blue-50" title="Download">
          <FiDownload size={18} />
        </button>
        <DownloadObservationForm
          isOpen={isDownloadModalOpen}
          onClose={closeDownloadModal}
          siteId={observationDetails.site?.gid}
          dateRange={[minDate, maxDate]}
        />
        <button onClick={() => setIsChartHidden(!isChartHidden)} className="rounded-lg p-1.5 text-blue-900 hover:bg-blue-50" title="Chart">
          <FiBarChart2 size={18} />
        </button>
        <button onClick={handleCloseSidebar} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Close">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    {/* Chart */}
    <div style={{ width: '100%' }}>
      <LineChart
        data={observationList.map((obs) => obs.score)}
        labels={observationList.map((obs) => obs.obs_date)}
        xLabel={'Date'}
        yLabel={'Average Score'}
        hidden={isChartHidden}
      />
    </div>

    {loading ? (
      <div className="w-full max-w-[350px] ml-2"><LinearProgress color="success" /></div>
    ) : (
    <>
      {/* Date / image tabs */}
      <TabbedContent
        tabsData={tabsData}
        activeTabIndex={activeTabIndex}
        onTabChange={(index) => {
          updateScoreDisplay(observations[index].site.river_cat, observations[index].score);
          setObservationDetails(observations[index]);
          setActiveTabIndex(index);
        }}
      />

      {/* Score card */}
      <div className="flex items-center justify-between w-full rounded-xl bg-gradient-to-r from-blue-50 to-white p-3 mt-1">
        <span className={`${titleColor} text-base font-bold`}>Average score</span>
        <div className="flex items-center gap-3">
          <div className="h-[60px] relative w-[60px]">
            <div className="h-[60px] m-auto w-[60px]">
              <div className={`!w-[60px] border-solid h-[60px] m-auto overflow-visible`}>
                <CircularProgressbar
                  className={`!w-[60px] border-solid h-[60px] m-auto overflow-visible ${progressBarColor}`}
                  value={parseFloat(observationDetails.score !== undefined && observationDetails.score !== null
                    ? observationDetails.score
                    : (siteWithObservations.observations.length > 0
                      ? siteWithObservations.observations[0].score
                      : '0')) * 10}
                  strokeWidth={3}
                  styles={{
                    trail: { strokeWidth: 3, stroke: "#e5e7eb" },
                    path: { strokeLinecap: "square", stroke: progressBarColor },
                  }}
                />
              </div>
              <Img
                className="absolute h-5 inset-x-[0] mx-auto object-cover top-[19%] w-[45%]"
                src={renderCrab}
                alt="crab" />
            </div>
            <span className={`${titleColor} absolute bottom-[16%] inset-x-[0] mx-auto text-sm font-semibold w-max`}>
              {observationDetails.score !== undefined && observationDetails.score !== null
                ? observationDetails.score
                : (siteWithObservations.observations.length > 0
                  ? siteWithObservations.observations[0].score
                  : '0')}
            </span>
          </div>
          <span className={`${titleColor} text-sm font-bold uppercase tracking-wide`}>{classification}</span>
        </div>
      </div>

      {/* Site Details */}
      <div className="w-full mt-2">
        <button onClick={toggleSiteDetails} className="flex items-center gap-2 w-full py-2 text-left">
          <FiMapPin className="text-blue-900" size={18} />
          <span className="text-base font-bold text-blue-900 flex-1">Site Details</span>
          {isSiteDetailsOpen ? <FaAngleDown className="text-blue-900" /> : <FaAngleUp className="text-blue-900" />}
        </button>
        {isSiteDetailsOpen && (
          <div className="flex flex-col gap-0.5 mt-1">
            <DetailRow icon={<BiWater size={16} />} label="River name" value={observationDetails.rivername || siteDetails.river_name} odd />
            <DetailRow icon={<FiMapPin size={16} />} label="Site name" value={observationDetails.sitename || siteDetails.site_name} />
            <div className="px-3 py-2 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-blue-900 shrink-0"><FiMessageSquare size={16} /></span>
                <span className="text-sm text-gray-500">Description</span>
              </div>
              <div className="overflow-y-auto max-h-[60px] pl-7">
                <span className="text-sm text-gray-800">{observationDetails.sitedescription || siteDetails.description || 'N/A'}</span>
              </div>
            </div>
            <DetailRow icon={<BiGlobe size={16} />} label="Country" value={
              observationDetails.site?.country
                || (siteWithObservations.observations.length > 0 ? siteWithObservations.observations[0].site.country : 'N/A')
            } />
            <DetailRow icon={<HiOutlineLocationMarker size={16} />} label="Latitude" value={
              observationDetails.latitude != null ? Number(observationDetails.latitude).toFixed(6)
                : (siteWithObservations.observations.length > 0 ? Number(siteWithObservations.observations[0].latitude).toFixed(6) : '0')
            } odd />
            <DetailRow icon={<HiOutlineLocationMarker size={16} />} label="Longitude" value={
              observationDetails.longitude != null ? Number(observationDetails.longitude).toFixed(6)
                : (siteWithObservations.observations.length > 0 ? Number(siteWithObservations.observations[0].longitude).toFixed(6) : '0')
            } />
            <DetailRow icon={<BiWater size={16} />} label="River category" value={observationDetails.rivercategory || siteDetails.river_cat} odd />
          </div>
        )}
      </div>

      {/* Observation Details */}
      <div className="w-full mt-1">
        <button onClick={toggleObservationDetails} className="flex items-center gap-2 w-full py-2 text-left">
          <FiCalendar className="text-blue-900" size={18} />
          <span className="text-base font-bold text-blue-900 flex-1">Observation Details</span>
          {isObservationDetailsOpen ? <FaAngleDown className="text-blue-900" /> : <FaAngleUp className="text-blue-900" />}
        </button>
        {isObservationDetailsOpen && (
          <div className="flex flex-col gap-0.5 mt-1">
            <DetailRow icon={<FiCalendar size={16} />} label="Date" value={
              observationDetails.obs_date ?? (siteWithObservations.observations.length > 0 ? siteWithObservations.observations[0].obs_date : 'dd/mm/yyyy')
            } odd />
            <DetailRow icon={<FiUser size={16} />} label="Collector" value={
              observationDetails.collectorsname ?? (siteWithObservations.observations.length > 0 ? siteWithObservations.observations[0].collectorsname : '')
            } />
            <DetailRow icon={<HiOutlineOfficeBuilding size={16} />} label="Organisation" value={
              observationDetails.organisationname ?? (siteWithObservations.observations.length > 0 ? siteWithObservations.observations[0].organisationname : 'N/A')
            } odd />
            <DetailRow icon={<FiMessageSquare size={16} />} label="Note" value={
              observationDetails.comment ?? (siteWithObservations.observations.length > 0 ? siteWithObservations.observations[0].comment : '')
            } />
          </div>
        )}
      </div>

      {/* Measurements */}
      <div className="w-full mt-1 mb-4">
        <button onClick={toggleMeasurements} className="flex items-center gap-2 w-full py-2 text-left">
          <MdOutlineScience className="text-blue-900" size={18} />
          <span className="text-base font-bold text-blue-900 flex-1">Measurements</span>
          {isMeasurementsOpen ? <FaAngleDown className="text-blue-900" /> : <FaAngleUp className="text-blue-900" />}
        </button>
        {isMeasurementsOpen && (
          <div className="flex flex-col gap-0.5 mt-1">
            <DetailRow icon={<BiWater size={16} />} label="Water Clarity" value={getMeasurement('water_clarity')} odd />
            <DetailRow icon={<TbTemperature size={16} />} label="Temperature" value={getMeasurement('water_temp')} />
            <DetailRow icon={<MdOutlineScience size={16} />} label="pH" value={getMeasurement('ph')} odd />
            <DetailRow icon={<BiWater size={16} />} label="Dissolved Oxygen" value={getMeasurement('diss_oxygen', 'diss_oxygen_unit')} />
            <DetailRow icon={<MdElectricBolt size={16} />} label="Elec. Conductivity" value={getMeasurement('elec_cond', 'elec_cond_unit')} odd />
          </div>
        )}
      </div>
    </>
    )}
  </div>
  );
};

export default ObservationDetails;
