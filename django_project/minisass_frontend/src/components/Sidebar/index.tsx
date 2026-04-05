import React from "react";
import DataInputForm from "../../components/DataInputForm";
import ObservationDetails from "../../components/ObservationDetails";

interface SidebarProps {
  isOpen: boolean;
  isObservationDetails: boolean;
  siteWithObservations: { site: {}; observations: [] };
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  observation: string;
  toggleMapSelection: () => void;
  handleMapClick: (longitude: number, latitude: number) => void;
  selectingOnMap: boolean;
  selectedCoordinates: { longitude: number; latitude: number };
  resetMap: () => void;
  siteDetails: {};
  resetSiteDetails: (details: {}) => void;
  useSelectOnSite: (isSelectOnSite: boolean) => void;
  setCursor: (cursor: string) => void;
  setIsDisableNavigations: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isObservationDetails,
  siteWithObservations,
  setSidebarOpen,
  observation,
  toggleMapSelection,
  handleMapClick,
  selectingOnMap,
  selectedCoordinates,
  resetMap,
  siteDetails,
  resetSiteDetails,
  useSelectOnSite,
  setCursor,
  setIsDisableNavigations,
}) => {
  return (
    <div className="flex h-full flex-col">
      {/* Header — only for Add Record; ObservationDetails has its own */}
      {!isObservationDetails && (
        <div className="flex items-center justify-between border-b border-surface-subtle px-4 py-3">
          <h2 className="text-body font-bold text-primary">Add Record</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-primary"
            aria-label="Close sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isObservationDetails ? (
          <ObservationDetails
            classname="flex flex-col gap-4 items-start justify-start p-4 w-full"
            observation_id={observation}
            setSidebarOpen={setSidebarOpen}
            handleMapClick={handleMapClick}
            siteWithObservations={siteWithObservations}
            resetMap={resetMap}
          />
        ) : (
          isOpen && (
            <DataInputForm
              className="bg-white-A700 flex flex-col gap-6 items-start justify-start pb-3 px-3 rounded-bl-[10px] rounded-br-[10px] rounded-tr-[10px] shadow-bs w-full"
              setSidebarOpen={setSidebarOpen}
              toggleMapSelection={toggleMapSelection}
              handleMapClick={handleMapClick}
              selectingOnMap={selectingOnMap}
              selectedCoordinates={selectedCoordinates}
              resetMap={resetMap}
              siteDetails={siteDetails}
              resetSiteDetails={resetSiteDetails}
              useSelectOnSite={useSelectOnSite}
              setCursor={setCursor}
              setIsDisableNavigations={setIsDisableNavigations}
            />
          )
        )}
      </div>
    </div>
  );
};

export default Sidebar;
