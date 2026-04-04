import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppShell from "../../components/AppShell";
import PageTransition from "../../components/PageTransition";
import YouTubeVideo from "../../components/YoutubeEmbedded";
import { globalVariables } from "../../utils";

interface AccordionSectionProps {
  title: string;
  stepNumber: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  stepNumber,
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-tr-2xl rounded-bl-2xl rounded-br-2xl border border-surface-subtle">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-surface-muted/50"
        aria-expanded={open}
      >
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-body-sm font-bold text-text-inverse">
          {stepNumber}
        </span>
        <h2 className="flex-1 font-raleway text-heading font-bold text-primary">
          {title}
        </h2>
        <svg
          className={`h-5 w-5 flex-shrink-0 text-primary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="border-t border-surface-subtle px-6 py-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const VideoGrid: React.FC<{ videoIds: string[] }> = ({ videoIds }) => (
  <div className={`grid gap-4 ${videoIds.length === 1 ? "max-w-2xl" : "grid-cols-1 md:grid-cols-2"}`}>
    {videoIds.map((id) => (
      <div key={id} className="overflow-hidden rounded-tr-2xl rounded-bl-2xl rounded-br-2xl">
        <YouTubeVideo videoId={id} width="100%" height="300px" playButtonColor="green" />
      </div>
    ))}
  </div>
);

interface ResourceLink {
  label: string;
  size: string;
  file: string;
}

const ResourceCard: React.FC<ResourceLink> = ({ label, size, file }) => (
  <a
    href={`${globalVariables.docsPath}${file}`}
    target="_blank"
    rel="noreferrer"
    className="flex items-center gap-3 rounded-tr-xl rounded-bl-xl rounded-br-xl border border-white/20 px-4 py-3 text-text-inverse transition-colors hover:bg-white/10"
  >
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <span className="flex-1 text-body-sm">{label}</span>
    <span className="text-caption opacity-70">{size}</span>
  </a>
);

const fieldSheets: ResourceLink[] = [
  { label: "miniSASS Dichotomous Key", size: "804.6 KB", file: "minisass_dichotomous_key_pg_4_5.pdf" },
  { label: "miniSASS Method Information", size: "443.2 KB", file: "minisass_info_pamphlet_pg_1_8_1.pdf" },
  { label: "miniSASS Background Information", size: "317.1 KB", file: "minisass_info_pamphlet_pg_2_3_1.pdf" },
  { label: "miniSASS Macroinvertebrate Groups", size: "599.5 KB", file: "minisass_microinvertebrate_groups_pg_6_7.pdf" },
];

const educationalResources: ResourceLink[] = [
  { label: "miniSASS Grade 5", size: "1.9 MB", file: "minisass_grade_5.pdf" },
  { label: "miniSASS Grade 7", size: "610.9 KB", file: "minisass_grade_7.pdf" },
  { label: "miniSASS Grade 9", size: "357.7 KB", file: "minisass_grade_9.pdf" },
  { label: "miniSASS Grade 11", size: "1.7 MB", file: "minisass_grade_11.pdf" },
];

const HowtoPage: React.FC = () => {
  return (
    <AppShell activePage="howto">
      <PageTransition>
        {/* Hero banner */}
        <section className="bg-surface-muted px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-content">
            <h1 className="font-raleway text-display-lg text-primary">
              How to do a miniSASS survey
            </h1>
            <p className="mt-3 max-w-2xl text-body-lg text-text-muted">
              Follow these steps to collect, identify, and upload your miniSASS observations.
              Each section includes instructional videos and detailed guidance.
            </p>
          </div>
        </section>

        {/* Step-by-step accordion */}
        <section className="mx-auto max-w-content px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            {/* Step 1 */}
            <AccordionSection title="The miniSASS Equipment" stepNumber={1} defaultOpen>
              <p className="mb-4 text-body leading-relaxed text-text">
                What will you need?
              </p>
              <ul className="mb-6 list-disc space-y-2 pl-6 text-body text-text">
                <li>Download the miniSASS app! It includes a map to help navigate to sites, background information, reference videos, and helps with identifying aquatic macroinvertebrates, generating your score, and uploading your data.</li>
                <li>If you do not want to use the app, make sure to have a miniSASS field sheet (for score calculations and dichotomous key for identifications) with a pencil. Find resources under the 'For Educators' section below.</li>
                <li>A miniSASS net (or a suitable home-made net). Bend wire into a net shape and tie netting material that catches creatures but lets fine sand and water through.</li>
                <li>A white tray for sorting the macroinvertebrates (a simple white ice-cream tub works).</li>
                <li>Gumboots or waders, a cap or hat, sunscreen, and drinking water.</li>
                <li>Soap or hand wash for after handling samples. Protective gloves may help.</li>
                <li>A magnifying glass — some critters are very small.</li>
                <li>A charged cellphone in case of emergencies.</li>
                <li>
                  Consider a clarity tube to measure stream clarity. While not part of miniSASS, low clarity indicates lots of suspended solids.
                </li>
                <li>
                  You may also want to measure water temperature, pH, dissolved oxygen, or electrical conductivity. The app and website allow recording these.
                </li>
                <li>
                  Get equipment from{" "}
                  <a href="https://www.groundtruth.co.za/our-products" target="_blank" rel="noreferrer" className="font-semibold text-primary underline">
                    groundtruth.co.za
                  </a>
                  , or create your own home-made kit!
                </li>
              </ul>
              <VideoGrid videoIds={["XJLcJMutXP8", "_-L-Xs4QJRg"]} />
            </AccordionSection>

            {/* Step 2 */}
            <AccordionSection title="How to Stay Safe" stepNumber={2}>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="lg:w-1/2">
                  <VideoGrid videoIds={["yGbi7P8RYoU"]} />
                </div>
                <p className="text-body leading-relaxed text-text lg:w-1/2">
                  Safety first! MiniSASS is better with a friend or group. Be sure to let people
                  know where you will be. Rivers may contain various toxins, harmful pollutants,
                  or dangerous animals. Wear appropriate clothing and be watchful for dangers.
                  Gumboots, waders, or wellingtons will protect your feet. Life jackets are recommended.
                </p>
              </div>
            </AccordionSection>

            {/* Step 3 */}
            <AccordionSection title="Choosing a Site to Sample" stepNumber={3}>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="lg:w-1/2">
                  <VideoGrid videoIds={["WX_DkYyfnmk"]} />
                </div>
                <div className="space-y-3 text-body leading-relaxed text-text lg:w-1/2">
                  <p>
                    Find a suitable site at your stream or river. MiniSASS cannot be done on stagnant water
                    like ponds, dams, and wetlands. Check that your sample area has flowing water.
                  </p>
                  <p>
                    Remember, the best site is a safe site! Pick a spot with as many habitats (rocks,
                    vegetation, gravel, sand, and mud) as possible. A "Rocky" section has loose rocks
                    instream (often closer to the source). "Sandy" sections have no loose rocks (often
                    closer to the mouth).
                  </p>
                  <p>
                    Note down your exact location — save it on a phone or GPS. Your location is very
                    important information!
                  </p>
                </div>
              </div>
            </AccordionSection>

            {/* Step 4 */}
            <AccordionSection title="How to Take a miniSASS Sample" stepNumber={4}>
              <VideoGrid videoIds={["XY_p8usHx4Q", "8RATZXY2jyo"]} />
              <div className="mt-6 space-y-3 text-body leading-relaxed text-text">
                <p>
                  Sample as many habitats as possible for a total of 5 minutes. Kick up rocks, gravel,
                  sand, and mud to dislodge macroinvertebrates. Pick up and search under rocks, washing
                  creatures into your net. Scoop in and around vegetation. Watch for clams, mussels,
                  crabs, and snails.
                </p>
                <p>
                  Run water through your net to filter out mud and grit. Add river water to your tray
                  and empty your net into it. Identify all different macroinvertebrates using the
                  dichotomous key. Once done, put everything back into the stream.
                </p>
              </div>
            </AccordionSection>

            {/* Step 5 */}
            <AccordionSection title="How to Calculate Your miniSASS Score" stepNumber={5}>
              <VideoGrid videoIds={["hKdPiSSVL0s", "O_deXdCQIfM"]} />
              <div className="mt-6 space-y-3 text-body leading-relaxed text-text">
                <p>
                  Each group of macroinvertebrates has a sensitivity score. High scores mean the group
                  does not tolerate pollution. Low scores indicate greater resistance.
                </p>
                <p>
                  Add up your total score and divide by the number of groups found. This average is your
                  miniSASS score, indicating the Ecological Condition. Note: even "Unmodified / Natural"
                  does not mean the water is drinkable — chemical and microbial analysis is still needed.
                </p>
              </div>
            </AccordionSection>

            {/* Step 6 */}
            <AccordionSection title="Walkthrough and Uploading Your Score" stepNumber={6}>
              <VideoGrid videoIds={["C1CbzcWwHiM", "eUAr6n5gSqE"]} />
              <div className="mt-4">
                <VideoGrid videoIds={["uUJTrkZKL6U"]} />
              </div>
              <p className="mt-6 text-body leading-relaxed text-text">
                Upload your data! Register on the miniSASS website if you haven't already and upload
                your data by clicking the 'Submit Results' button and filling in all the fields.
              </p>
            </AccordionSection>

            {/* Step 7 */}
            <AccordionSection title="Using miniSASS for Monitoring" stepNumber={7}>
              <VideoGrid videoIds={["uU7hOj4zjG0", "illWM9BhL-0"]} />
              <p className="mt-6 text-body leading-relaxed text-text">
                View your submission on the map and check your site is in the right place. The crab
                colour corresponds to stream health at your site. Visit the same site every 5–6 weeks
                to build a time series. Head to other sites to keep contributing vital data for
                monitoring and managing freshwater resources worldwide.
              </p>
            </AccordionSection>
          </div>
        </section>

        {/* Resources section */}
        <section
          id="howto-resources"
          className="bg-primary px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-content">
            <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
              {/* Images */}
              <div className="flex gap-4 lg:w-1/3 lg:flex-col">
                <img
                  className="h-48 w-1/2 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl object-cover lg:h-56 lg:w-full"
                  src={`${globalVariables.staticPath}download-1.jpg`}
                  alt="Students doing miniSASS"
                />
                <img
                  className="h-48 w-1/2 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl object-cover lg:h-56 lg:w-full"
                  src={`${globalVariables.staticPath}download-2.jpg`}
                  alt="Macroinvertebrate sampling"
                />
              </div>

              {/* Resources content */}
              <div className="lg:w-2/3">
                <h2 className="font-raleway text-display text-text-inverse">
                  For Educators
                </h2>
                <p className="mt-3 text-body text-text-inverse/80">
                  Educational resources developed as part of the Share-Net partnership between WESSA
                  and the Water Research Commission. These materials are copyright-free for educational
                  purposes.
                </p>

                <h3 className="mb-3 mt-8 text-body-lg font-bold text-text-inverse">
                  miniSASS Field Sheets
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {fieldSheets.map((r) => (
                    <ResourceCard key={r.file} {...r} />
                  ))}
                </div>

                <p className="mt-8 text-body text-text-inverse/80">
                  Below are packages aimed at learners in different grades, containing activities
                  for learning in natural sciences, environmental health, and freshwater ecology.
                  We encourage you to adapt these materials and acknowledge Share-Net as the original source.
                </p>

                <h3 className="mb-3 mt-6 text-body-lg font-bold text-text-inverse">
                  Educational Resources
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {educationalResources.map((r) => (
                    <ResourceCard key={r.file} {...r} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Further Reading */}
        <section className="mx-auto max-w-content px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-6 font-raleway text-display text-primary">Further Reading</h2>
          <div className="space-y-4 text-body leading-relaxed text-text">
            <p>
              Graham, P. M. (2012). Reassessment of the miniSASS biomonitoring tools as a resource for environmental education. WRC Report No. KV 240/12.{" "}
              <a href="https://www.wrc.org.za/wp-content/uploads/mdocs/KV%20240%20web.pdf" className="text-primary underline" target="_blank" rel="noreferrer">Link</a>
            </p>
            <p>
              Graham, P. M., Burton, S., & Gibixego, A. (2015). miniSASS Data Management: Development of an online map-based data portal. WRC Report No. TT 639/15.{" "}
              <a href="https://www.wrc.org.za/wp-content/uploads/mdocs/TT%20639-15.pdf" className="text-primary underline" target="_blank" rel="noreferrer">Link</a>
            </p>
            <p>
              Graham, P. M., Dickens, C. W. S., & Taylor, J. (2004). miniSASS—A novel technique for community participation in river health monitoring. <em>African Journal of Aquatic Science</em>, 29(1), 25–35.{" "}
              <a href="https://doi.org/10.2989/16085910409503789" className="text-primary underline" target="_blank" rel="noreferrer">DOI</a>
            </p>
            <p>
              Graham, P. M., & Taylor, J. (2018). Development of citizen science water resource monitoring tools and communities of practice. WRC Report No. TT 763/18.{" "}
              <a href="https://www.wrc.org.za/wp-content/uploads/mdocs/TT%20763%20web.pdf" className="text-primary underline" target="_blank" rel="noreferrer">Link</a>
            </p>
            <p>
              Koen, R. C. J., & Koen, F. J. (2023). Aquatic macroinvertebrate image dataset. <em>Harvard Dataverse</em>.{" "}
              <a href="https://doi.org/10.7910/DVN/1QQPJ5" className="text-primary underline" target="_blank" rel="noreferrer">DOI</a>
            </p>
            <p>
              Koen, R. C. J., et al. (2023). Digitally improving the identification of aquatic macroinvertebrates for indices used in biomonitoring. IWMI / CGIAR.{" "}
              <a href="https://hdl.handle.net/10568/138246" className="text-primary underline" target="_blank" rel="noreferrer">Link</a>
            </p>
            <p>
              Pattinson, N. B., Koen, R. C. J., & Koen, F. J. (2022). Artificial intelligence-based biomonitoring of water quality. IWMI / CGIAR.{" "}
              <a href="https://hdl.handle.net/10568/128025" className="text-primary underline" target="_blank" rel="noreferrer">Link</a>
            </p>
            <p>
              Pattinson, N. B., et al. (2023). Digital innovation with miniSASS, a citizen science biomonitoring tool. IWMI / CGIAR.{" "}
              <a href="https://hdl.handle.net/10568/134498" className="text-primary underline" target="_blank" rel="noreferrer">Link</a>
            </p>
            <p>
              Pattinson, N. B., et al. (2023). Digital innovation in citizen science water quality monitoring in developing countries. IWMI / CGIAR.{" "}
              <a href="https://doi.org/10.5337/2024.201" className="text-primary underline" target="_blank" rel="noreferrer">DOI</a>
            </p>
            <p>
              Russell, C., et al. (2024). Citizen science online training and learning system. WRC Report No. TT 933/23.{" "}
              <a href="https://www.wrc.org.za/wp-content/uploads/mdocs/TT%20933%20final%20web.pdf" className="text-primary underline" target="_blank" rel="noreferrer">Link</a>
            </p>
            <p>
              Taylor, J., et al. (2022). Social change innovations, citizen science, miniSASS and the SDGs. <em>Water Policy</em>, 24(5), 708–717.{" "}
              <a href="https://doi.org/10.2166/wp.2021.264" className="text-primary underline" target="_blank" rel="noreferrer">DOI</a>
            </p>
            <p>
              Tengö, M., et al. (2021). Creating synergies between citizen science and Indigenous and local knowledge. <em>BioScience</em>, 71(5), 503–518.{" "}
              <a href="https://doi.org/10.1093/biosci/biab023" className="text-primary underline" target="_blank" rel="noreferrer">DOI</a>
            </p>
            <p>
              UNEP. (2021). Progress on ambient water quality. Tracking SDG 6 series. See page 16: "FOCUS BOX 2. MINISASS".{" "}
              <a href="https://www.unwater.org/sites/default/files/app/uploads/2021/09/SDG6_Indicator_Report_632_Progress-on-Ambient-Water-Quality_2021_EN.pdf" className="text-primary underline" target="_blank" rel="noreferrer">Link</a>
            </p>
          </div>
        </section>
      </PageTransition>
    </AppShell>
  );
};

export default HowtoPage;
