import React, { useState } from "react";
import { Button, Img, List, Text } from "../../components";
import AppShell from "../../components/AppShell";
import CollapsibleTable from "../../components/CollapsibleTable";
import Sidebar from "../../components/DownloadsSideBar";
import Observations from "../../components/Observations";

import "react-circular-progressbar/dist/styles.css";

interface Report {
  title: string;
  date: string;
  description: string;
  link: string;
  size: string;
}

type Column = {
  id: string;
  label: string;
};

type Row = {
  [key: string]: any;
  field_sheets: string;
  size: string;
  customContent: {
    title: string;
    content: string[];
  };
};




const Downloads: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const columns: Column[] = [
    { id: 'field_sheets', label: 'Field sheets' },
    { id: 'size', label: 'Size' },
    { id: 'Action', label: 'Action' },
  ];

   // TODO these values will come from the api
   const ObservationsPropList = [
    {
      usernamejimtaylOne: "Username: S_Abrahams",
      userimage: "images/img_image2_24x30.png",
      username: "Liesbeek-Upper Liesbeek",
      score1: "5.57",
      organisation: "Organisation: Centre For Conservation Education",
    },
    {
      usernamejimtaylOne: "Username: S_Abrahams",
      userimage: "images/img_image2_24x30.png",
      username: "Liesbeek-Upper Liesbeek",
      score1: "5.57",
      organisation: "Organisation: Centre For Conservation Education",
    },
    {
      usernamejimtaylOne: "Username: S_Abrahams",
      userimage: "images/img_image2_24x30.png",
      username: "Liesbeek-Upper Liesbeek",
      score1: "5.57",
      organisation: "Organisation: Centre For Conservation Education",
    },
    {
      usernamejimtaylOne: "Username: S_Abrahams",
      userimage: "images/img_image2_24x30.png",
      username: "Tinashe",
      score1: "3.57",
      organisation: "Organisation: Centre For Conservation Education",
    },
    {
      usernamejimtaylOne: "Username: S_Abrahams",
      userimage: "images/img_image2_24x30.png",
      username: "Amy",
      score1: "7.57",
      organisation: "Organisation: Centre For Conservation Education",
    },
    {
      usernamejimtaylOne: "Username: S_Abrahams",
      userimage: "images/img_image2_24x30.png",
      username: "Team",
      score1: "9.57",
      organisation: "Organisation: Centre For Conservation Education",
    },
  ];

  // Function to handle advancing to the next set of observations
  const handleNextObservations = () => {
    // Calculate the next index to display (looping back to 0 if necessary)
    const nextIndex = (currentIndex + 4) % ObservationsPropList.length;
    setCurrentIndex(nextIndex);
  };
  
  // example object from api to populate tables
  const rows: Row[] = [
    {
      field_sheets: 'Fieldsheet 1',
      size: '23 KB',
      customContent: {
        title: 'Custom Title 1',
        content: [
          'Custom Content Line 1 for Fieldsheet 1',
          'Custom Content Line 2 for Fieldsheet 1',
        ],
      },
    },
    {
      field_sheets: 'Fieldsheet 2',
      size: '23 MB',
      customContent: {
        title: 'Mkomazi River Environmental Survey and Expedition',
        content: [
          'Seven G.A.P Post Matric learners from Treverton Collage have successfully walked the Mkhomazi Catchment from the source all the way to the coast. This environmental survey and expedition was 298km long and was divided into eight sites where they performed miniSASS tests, physico-chemical tests and general environmental assessments including smell, invasive plants and soil erosion. This multidimensional expedition was not only fun but very educational for the learners and now increased the state of knowledge for many.',
        ],
      },
    },
    {
      field_sheets: 'Fieldsheet 3',
      size: '2.3 GB',
      customContent: {
        title: 'Custom Title 3',
        content: [
          'Custom Content Line 1 for Fieldsheet 3',
          'Custom Content Line 2 for Fieldsheet 3',
        ],
      },
    },
  ];
  
  
  
  

  const tableData = [
    { name: 'Item 1', fieldSheetLink: '/fieldSheet1.pdf', fileSize: '1 MB' },
    { name: 'Item 2', fieldSheetLink: '/fieldSheet2.pdf', fileSize: '2 MB' },
    { name: 'Item 3', fieldSheetLink: '/fieldSheet1.pdf', fileSize: '1 MB' },
    { name: 'Item 4', fieldSheetLink: '/fieldSheet2.pdf', fileSize: '2 MB' },
    { name: 'Item 5', fieldSheetLink: '/fieldSheet1.pdf', fileSize: '1 MB' },
    // Add more data rows as needed
  ];


  const reportsData: Report[] = [
    {
      title: 'Makana Ntsika Howison River',
      date: '13 April 2014',
      description: 'Description of the report...',
      link: 'URL_to_the_report.pdf',
      size: '36kb'
    },
    {
      title: 'Mkomazi River Environmental Survey and Expedition',
      date: 'Date of the report...',
      description: 'Description of the report...',
      link: 'URL_to_the_report.pdf',
      size: '50mb'
    },
  ];
  

  const desktopThreeColumnscorePropList = [
    {},
    {
      usernamejimtaylOne: "Username: S_Abrahams",
      imagetwo: "images/img_image2_24x30.png",
      inzingainzinga: "Liesbeek-Upper Liesbeek",
      sixhundredfifty: "5.57",
      organisationukzOne: "Organisation: Centre For Conservation Education",
    },
    {
      imagetwo: "images/img_image2_24x30.png",
      inzingainzinga: "Liesbeek-Upper Liesbeek",
      sixhundredfifty: "5.57",
    },
    {
      imagetwo: "images/img_image2_24x30.png",
      inzingainzinga: "Liesbeek-Upper Liesbeek",
      sixhundredfifty: "5.57",
    },
  ];
  

  return (
    <AppShell activePage="downloads">
      <div className="bg-white-A700 flex flex-col font-raleway items-center justify-start mx-auto w-full">
        <div className="flex flex-col items-center justify-start w-full">

          <div className="h-[537px] md:px-5 relative w-full">
          </div>
          

          {/* sidebar */}
          <Sidebar />

          
          <div 
          style={{marginTop: '-350px', width: '60%'}}>
            <Text
              className="flex-1 sm:text-4xl md:text-[38px] text-[40px] text-blue-900 w-auto"
              size="txtRalewayRomanBold40"
            >
              miniSASS resources for download
            </Text>

            {/* TODO should be able to pass different props to the tables so they can be rendered differently eg borders spacing expandable rows show checkbox etc */}
            <section id="fieldSheetsSection">
              <CollapsibleTable columns={columns} rows={rows} title="Field Sheets" showCollapseIcon={false}  showBorders={true} />;
            </section>

            <section id="newslettersSection">
              <CollapsibleTable columns={columns} rows={rows} title="NewsLetters" showCollapseIcon={false}  showBorders={true} />;
            </section>

            <section id="educationalResourcesSection">
              <CollapsibleTable columns={columns} rows={rows} title="Educational Resources" showCollapseIcon={false}  showBorders={true} />;
            </section>

            <section id="projectreportsSection">
              <CollapsibleTable columns={columns} rows={rows} title="Project Reports" showCollapseIcon={false}  showBorders={true} />;
            </section>

            <section id="literaturereferencesSection">
              <CollapsibleTable columns={columns} rows={rows} title="Literature references" showCollapseIcon={true}  showBorders={true} />;
            </section>

            <section id="mediaInterviewsSection">
              <CollapsibleTable columns={columns} rows={rows} title="Media interviews" showCollapseIcon={false}  showBorders={true} />;
            </section>    

            
          </div>
          
          

          <div className="flex sm:flex-col flex-row md:gap-10 items-center justify-between max-w-[1179px] mt-[66px] mx-auto md:px-5 md:relative md:top-[15px] sm:top-[60px] w-full">
            <Text
              className="flex-1 sm:text-4xl md:text-[38px] text-[40px] text-blue-900 w-auto"
              size="txtRalewayRomanBold40"
            >
              Recent Observations
            </Text>
            <Button
              className="flex h-10 sm:hidden items-center justify-center rounded-[5px] w-10"
              color="blue_gray_500"
              size="sm"
              variant="fill"
              onClick={handleNextObservations}
            >
              <Img src="images/img_arrowright.svg" alt="arrowright" />
            </Button>
          </div>
          <List
            className="sm:flex-col flex-row gap-5 grid sm:grid-cols-1 md:grid-cols-2 grid-cols-4 sm:h-[60vh] md:h-[] md:justify-center justify-start sm:m-[] max-w-[1180px] sm:ml-[] mt-[51px] mx-auto sm:overflow-scroll md:px-5 sm:relative sm:top-5 w-full"
            orientation="horizontal"
          >
            {ObservationsPropList.slice(currentIndex, currentIndex + 4).map((props, index) => (
              <React.Fragment key={`DesktopThreeColumnscore${index}`}>
                <Observations
                  className="border border-blue_gray-100 border-solid flex flex-col gap-2 h-[237px] md:h-auto items-start justify-between sm:px-5 px-6 py-5 rounded-bl-[25px] rounded-br-[25px] rounded-tr-[25px] w-[280px]"
                  {...props}
                />
              </React.Fragment>
            ))}
          </List>

          


        </div>
      </div>
    </AppShell>
  );
};

export default Downloads;
