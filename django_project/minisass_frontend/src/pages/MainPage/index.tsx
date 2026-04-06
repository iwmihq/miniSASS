import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button, Img } from "../../components";
import AppShell from "../../components/AppShell";
import PageTransition from "../../components/PageTransition";
import Observations from "../../components/Observations";
import Slideshow from "../../components/SlideShow";
import axios from "axios";
import UploadModal from "../../components/UploadFormModal";
import SearchBar from "../../components/SearchBar";
import { globalVariables } from "../../utils";
import Modal from "react-modal";
import YouTubeVideo from "../../components/YoutubeEmbedded";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { FiMapPin } from "react-icons/fi";
import { BiGlobe } from "react-icons/bi";
import "react-circular-progressbar/dist/styles.css";

/** Animated counter that ticks up from 0 to target */
const AnimatedStat: React.FC<{
  value: number;
  label: string;
  suffix?: string;
  icon?: React.ReactNode;
}> = ({ value, label, suffix = "", icon }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value <= 0) return;
    const duration = 1500;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <div className="flex flex-col items-center p-4">
      {icon && (
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
          {icon}
        </div>
      )}
      <span className="font-raleway text-display-lg font-bold text-accent">
        {count.toLocaleString()}{suffix}
      </span>
      <span className="mt-1 text-body-sm font-medium uppercase tracking-wider text-text-muted">
        {label}
      </span>
    </div>
  );
};

const QUICK_ACTIONS = [
  { label: "Explore the map", icon: "img_bxmapalt.svg", path: "/map", crab: "img_notov1crab.svg" },
  { label: "How to do miniSASS", icon: "img_bxbookreader.svg", path: "/howto", crab: "img_notov1crab_blue_gray_100.svg" },
  { label: "Submit results", icon: "img_bxbong.svg", path: "/map?open_add_record=1", crab: "img_notov1crab_blue_gray_100_72x72.svg" },
  { label: "Resources", icon: "img_bxclouddownload.svg", path: "/howto#howto-resources", crab: "img_notov1crab_blue_gray_100_72x46.svg" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.35, ease: "easeOut" },
  }),
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [observations, setObservations] = useState<any[]>([]);
  const [activationComplete, setActivationComplete] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [stats, setStats] = useState({ observations: 0, sites: 0, countries: 0 });

  const FETCH_RECENT_OBSERVATIONS =
    globalVariables.baseUrl + "/monitor/observations/recent-observations/";

  const fetchHomePageData = async (retryCount = 0) => {
    try {
      const response = await axios.get(FETCH_RECENT_OBSERVATIONS);
      if (response.data && Array.isArray(response.data)) {
        const list = response.data.map((item: any) => {
          const d = new Date(item.time_stamp);
          const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December",
          ];
          return {
            observation: item.observation,
            usernamejimtaylOne: `Observer name: ${item.username}`,
            userimage: "",
            username: item.site,
            score1: item.score,
            score: item.score,
            rivercategory: item.river_category,
            organisation: `Organisation: ${item.organisation}`,
            dateadded: `Date added: ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
          };
        });
        setObservations(list);
      } else if (retryCount < 3) {
        setTimeout(() => fetchHomePageData(retryCount + 1), 3000);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchStats = async () => {
    try {
      const [obsRes, sitesRes] = await Promise.allSettled([
        axios.get(globalVariables.baseUrl + "/monitor/observations/count/"),
        axios.get(globalVariables.baseUrl + "/monitor/sites/count/"),
      ]);
      setStats({
        observations: obsRes.status === "fulfilled" ? (obsRes.value.data?.count ?? 0) : 0,
        sites: sitesRes.status === "fulfilled" ? (sitesRes.value.data?.count ?? 0) : 0,
        countries: 18, // Known count from miniSASS documentation
      });
    } catch {
      // Stats are non-critical, fail silently
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const uidParam = urlParams.get("uid");
    const tokenParam = urlParams.get("token");
    const activation_complete = urlParams.get("activation_complete");

    if (activation_complete) setActivationComplete(true);
    if (uidParam && tokenParam) navigate(`/password-reset?uid=${uidParam}&token=${tokenParam}`);

    fetchHomePageData();
    fetchStats();
  }, []);

  const ITEMS_PER_PAGE = 5;

  const handleNextObservations = () => {
    setCurrentIndex((prev) => (prev + ITEMS_PER_PAGE) % observations.length);
  };

  const handlePrevObservations = () => {
    setCurrentIndex((prev) => {
      let next = prev - ITEMS_PER_PAGE;
      if (next < 0) next = observations.length - (observations.length % ITEMS_PER_PAGE);
      return next;
    });
  };

  const closeActivationModal = () => {
    setActivationComplete(false);
    window.location.href = "/";
  };

  return (
    <AppShell activePage="home">
      <PageTransition>
        {/* Hero / Slideshow */}
        <section className="relative w-full overflow-hidden">
          <Slideshow />
        </section>

        {/* Quick action cards */}
        <section className="mx-auto -mt-8 max-w-content px-4 sm:-mt-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {QUICK_ACTIONS.map((card, i) => (
              <motion.button
                key={card.label}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                onClick={() => navigate(card.path)}
                className="group relative flex flex-col items-center justify-center rounded-tr-2xl rounded-bl-2xl rounded-br-2xl bg-accent p-6 text-center transition-shadow hover:shadow-card-hover sm:p-8"
              >
                <Img className="mb-2 h-8 w-8" src={`${globalVariables.staticPath}${card.icon}`} alt="" />
                <span className="text-body-sm font-extrabold uppercase tracking-wider text-text-inverse">
                  {card.label}
                </span>
                <Img
                  className="absolute right-0 top-0 h-12 w-12 opacity-30 sm:h-16 sm:w-16"
                  src={`${globalVariables.staticPath}${card.crab}`}
                  alt=""
                />
              </motion.button>
            ))}
          </div>
        </section>

        <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onSubmit={null} />

        {/* Stats counter */}
        {(stats.observations > 0 || stats.sites > 0) && (
          <section className="mx-auto mt-12 max-w-content px-4 sm:mt-16 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-3 divide-x divide-surface-subtle rounded-tr-2xl rounded-bl-2xl rounded-br-2xl border border-surface-subtle bg-surface py-4"
            >
              <AnimatedStat value={stats.observations} label="Submissions" icon={<HiOutlineClipboardDocumentList size={22} />} />
              <AnimatedStat value={stats.sites} label="Surveyed Sites" icon={<FiMapPin size={22} />} />
              <AnimatedStat value={stats.countries} label="Countries" suffix="+" icon={<BiGlobe size={22} />} />
            </motion.div>
          </section>
        )}

        {/* Search bar */}
        <section className="mx-auto mt-8 max-w-content px-4 sm:mt-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <SearchBar variant="prominent" />
          </div>
        </section>

        {/* What is miniSASS */}
        <section className="mx-auto mt-12 max-w-content px-4 sm:mt-16 sm:px-6 lg:px-8">
          <h2 className="mb-6 font-raleway text-display-lg text-primary">What is miniSASS?</h2>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="w-full overflow-hidden rounded-tr-2xl rounded-bl-2xl rounded-br-2xl lg:w-1/2">
              <YouTubeVideo videoId="hRgO80-427w" width="100%" height="300px" playButtonColor="green" />
            </div>
            <div className="lg:w-1/2">
              <p className="text-body-lg leading-relaxed text-text">
                The mini stream assessment scoring system (miniSASS) is a simple and accessible citizen science tool
                for monitoring the water quality and health of stream and river systems. You collect a sample of
                aquatic macroinvertebrates (small, but large enough to see animals with no internal skeletons) from
                a site in a stream or river. The community of these aquatic macroinvertebrates present then tells
                you about the water quality and health of the stream or river based on the concept that different
                groups of aquatic macroinvertebrates have different tolerances and sensitivities to disturbance and
                pollution.
              </p>
            </div>
          </div>
        </section>

        {/* Recent Observations */}
        <section className="mx-auto mt-12 max-w-content px-4 sm:mt-16 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-raleway text-display-lg text-primary">Recent Observations</h2>
            <div className="flex gap-2">
              {currentIndex > 0 && (
                <Button
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  color="blue_gray_500"
                  size="sm"
                  variant="fill"
                  onClick={handlePrevObservations}
                >
                  <Img src={`${globalVariables.staticPath}img_arrowleft.svg`} alt="Previous" />
                </Button>
              )}
              {currentIndex + ITEMS_PER_PAGE < observations.length && (
                <Button
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  color="blue_gray_500"
                  size="sm"
                  variant="fill"
                  onClick={handleNextObservations}
                >
                  <Img src={`${globalVariables.staticPath}img_arrowright.svg`} alt="Next" />
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {observations
              .slice(currentIndex, currentIndex + ITEMS_PER_PAGE)
              .map((props, index) => (
                <motion.div
                  key={`observation-${currentIndex + index}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.3 }}
                >
                  <Observations
                    className="flex h-full flex-col gap-2 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl border border-surface-subtle p-5 transition-shadow hover:shadow-card"
                    {...props}
                  />
                </motion.div>
              ))}
          </div>
          {observations.length === 0 && (
            <div className="flex h-48 items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-text-muted">
                <div className="h-8 w-8 animate-pulse rounded-full bg-surface-muted" />
                <span className="text-body-sm">Loading observations...</span>
              </div>
            </div>
          )}
        </section>

        {/* miniSASS Map promo */}
        <section className="mt-12 bg-primary px-4 py-16 sm:mt-16 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-content flex-col items-center gap-8 lg:flex-row lg:gap-16">
            <Img
              className="h-56 w-full max-w-xs rounded-tr-2xl rounded-bl-2xl rounded-br-2xl object-cover lg:h-72 lg:max-w-sm"
              src={`${globalVariables.staticPath}img_rectangle6.png`}
              alt="miniSASS Map"
            />
            <div className="text-center lg:text-left">
              <h2 className="font-raleway text-display-lg text-text-inverse">miniSASS Map</h2>
              <p className="mt-4 text-body-lg leading-relaxed text-text-inverse">
                The most important feature of the new website is the miniSASS Map, which allows you to explore
                your catchment, find your river, look at any existing miniSASS results and then upload your own
                miniSASS results! The map also lets you explore your catchment to see the land uses and activities
                that might be improving or worsening water quality.
              </p>
              <Button
                className="mt-6 inline-flex cursor-pointer items-center"
                rightIcon={
                  <Img
                    className="ml-2 h-4 w-4"
                    src={`${globalVariables.staticPath}img_arrowright_white_a700.svg`}
                    alt=""
                  />
                }
                shape="round"
                color="blue_gray_500"
                size="sm"
                variant="fill"
                onClick={() => navigate("/map")}
              >
                See the map
              </Button>
            </div>
          </div>
        </section>

        {/* Activation modal */}
        <Modal
          isOpen={activationComplete}
          onRequestClose={closeActivationModal}
          style={{
            content: {
              top: "50%",
              left: "50%",
              right: "auto",
              bottom: "auto",
              marginRight: "-50%",
              transform: "translate(-50%, -50%)",
              width: "100%",
              maxWidth: "500px",
              background: "white",
              border: "none",
              borderRadius: "0px 25px 25px 25px",
            },
          }}
        >
          {activationComplete && (
            <div>
              <h3 className="font-raleway text-heading font-bold text-accent">Registration successful</h3>
              <p className="mt-4 text-body text-text">
                You have been successfully registered. Please proceed with logging in.
              </p>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeActivationModal}
                  className="rounded-tr-xl rounded-bl-xl rounded-br-xl bg-accent px-6 py-2 text-body-sm font-semibold text-text-inverse transition-colors hover:bg-accent-dark"
                >
                  Ok
                </button>
              </div>
            </div>
          )}
        </Modal>
      </PageTransition>
    </AppShell>
  );
};

export default Home;
