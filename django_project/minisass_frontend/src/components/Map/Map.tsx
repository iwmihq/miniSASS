import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState
} from "react";
import maplibregl, { AddLayerObject, SourceSpecification } from 'maplibre-gl';
import { bbox } from '@turf/turf';

import LayerSelector from "./Layer/Selector";
import { BasemapConfiguration } from "./Layer/Basemap"
import { layerConfiguration } from "./Layer/Overlay";
import { hasLayer, hasSource, removeLayer, removeSource } from "./utils"
import { minisassObservationId } from "./Layer/MinisassLayer";
import {getLocalStorageWithExpiry, globalVariables, setLocalStorageWithExpiry} from "../../utils";
import { nearestPoint, point, featureCollection, distance } from "@turf/turf";

import 'maplibre-gl/dist/maplibre-gl.css';
import axios from "axios";


interface Interface {
  basemaps: BasemapConfiguration[],
  overlayLayers: layerConfiguration[],
  handleSelect: (latitude: number, longitude: number) => void;
  selectingOnMap: boolean;
  resetMap: boolean;
  selectedCoordinates: {latitude: number, longitude: number};
  idxActive: number;
  setIdxActive: React.Dispatch<React.SetStateAction<number>>;
  openObservationForm: (siteWithObservations: {site: {}, observations: []}) => void;
  setSiteDetails: (details: {}) => void;
  isSelectSiteOnMap: boolean;
  cursor: string
}

const HIGHLIGHT_ID = 'highlight'
const HIGHLIGHT_COLOR = `rgb(255, 0, 0)`
const HIGHLIGHT_OPACITY = 0.3
const HIGHLIGHT_WIDTH = 3
const HIGHLIGHT_CIRCLE_ID = HIGHLIGHT_ID + '-circle'
const HIGHLIGHT_LINE_ID = HIGHLIGHT_ID + '-line'
const HIGHLIGHT_POLYGON_ID = HIGHLIGHT_ID + '-polygon'

const initialMapConfig = {
  container: 'map',
  style: [],
  zoom: 5.3695883239884745,
  attributionControl: false,
  maxZoom: 19,
};

/**
 * Map component using maplibre
 * @param props
 * @constructor
 */
export const Map = forwardRef((props: Interface, ref) => {
    const [map, setMap] = useState<maplibregl.Map>(null);

    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);

    /** Update highlight geosjon **/
    useImperativeHandle(ref, () => ({
      updateHighlighGeojson(geojson) {
        addHighlight(geojson)
      },
      getMap() {
        return map;
      }
    }));

    useEffect(() => {
      if (!map && latitude && longitude) {
        (
          async () => {
            const response = await fetch('https://raw.githubusercontent.com/kartoza/miniSASS/main/django_project/webmapping/styles/minisass_style_v1.json');
            const styles = await response.json();
            const urlTile = new URL(styles.sources[minisassObservationId].tiles[0])
            const currUrl = new URL(window.location)
            currUrl.pathname = urlTile.pathname
            styles.sources[minisassObservationId].tiles[0] = decodeURIComponent(currUrl.href)

            // Just using 'MiniSASS Observations' source
            for (const [key, value] of Object.entries(styles.sources)) {
              if (key !== minisassObservationId) {
                delete styles.sources[key]
              }
            }
            styles.layers = styles.layers.filter(layer => layer.source === minisassObservationId)

            const newMap = new maplibregl.Map(
              {
                container: 'map',
                style: styles,
                center: [longitude, latitude],
                zoom: 5.3695883239884745,
                attributionControl: false,
                maxZoom: 19
              }
            ).addControl(
              new maplibregl.AttributionControl({ compact: true })
            );
            newMap.once("load", () => {
              newMap.resize();
              setMap(newMap)
              newMap.flyTo({
                center: [longitude, latitude],
                zoom: initialMapConfig.zoom,
                essential: true,
              });
            })
            newMap.addControl(new maplibregl.NavigationControl(), 'top-left');
          }
        )();
      }
    }, [latitude, longitude]);

    /** First initiate */
    useEffect(() => {
      const userPosition = getLocalStorageWithExpiry('user-location');
      if (!userPosition || !userPosition.latitude) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Get user's latitude and longitude
            // set location expire after 7 days
            setLocalStorageWithExpiry(
              'user-location',
              {latitude: position.coords.latitude, longitude: position.coords.longitude},
              604800000);
            setLatitude(position.coords.latitude);
            setLongitude(position.coords.longitude);
          },
          (error) => {
            console.error('Error getting user location:', error);
            // Set default country ,if geoLocation fails
            setLocalStorageWithExpiry(
              'user-location',
              {latitude: -28.671882886975247, longitude: 24.679864950000024},
              604800000
            )
            setLatitude(-28.671882886975247);
            setLongitude(24.679864950000024);
          }
        );
      } else {
        setLatitude(userPosition.latitude);
        setLongitude(userPosition.longitude);
      }
    }, []);

    /** Set cursor */
    useEffect(() => {
      if (map) {
        map.getCanvas().style.cursor = props.cursor;
      }
    }, [props.cursor]);

    /*** Show layer to maplibre */
    const showLayer = (
      id: string, source: SourceSpecification, layer: AddLayerObject,
      before: string = null, rerender: boolean = false
    ) => {
      removeLayer(map, id)
      if (!hasSource(map, id) || rerender) {
        removeSource(map, id)
        map.addSource(id, source)
      }
      map.addLayer(layer, before);
    }

    /*** Hide layer to maplibre */
    const hideLayer = (id: string) => {
      removeLayer(map, id)
    }


    /*** Add highlight */
    const addHighlight = (geojson) => {
      if (!map) {
        return
      }
      try {
        // Remove highlight layer
        if (hasLayer(map, HIGHLIGHT_CIRCLE_ID)) {
          map.removeLayer(HIGHLIGHT_CIRCLE_ID)
        }
        if (hasLayer(map, HIGHLIGHT_LINE_ID)) {
          map.removeLayer(HIGHLIGHT_LINE_ID)
        }
        if (hasLayer(map, HIGHLIGHT_POLYGON_ID)) {
          map.removeLayer(HIGHLIGHT_POLYGON_ID)
        }
        if (hasSource(map, HIGHLIGHT_ID)) {
          map.removeSource(HIGHLIGHT_ID)
        }
        // Remove source
        map.addSource('highlight', {
          'type': 'geojson',
          'data': geojson
        });
        // CREATE HIGHLIGHT LAYER
        map.addLayer(
          {
            id: HIGHLIGHT_CIRCLE_ID,
            type: 'circle',
            source: HIGHLIGHT_ID,
            filter: ['==', '$type', 'Point'],
            paint: {
              'circle-color': `black`,
              'circle-opacity': 0,
              'circle-radius': 12,
              'circle-stroke-color': HIGHLIGHT_COLOR,
              'circle-stroke-opacity': HIGHLIGHT_OPACITY,
              'circle-stroke-width': HIGHLIGHT_WIDTH
            }
          }
        )
        map.addLayer(
          {
            id: HIGHLIGHT_LINE_ID,
            type: 'line',
            source: HIGHLIGHT_ID,
            filter: ['==', '$type', 'LineString'],
            paint: {
              'line-color': HIGHLIGHT_COLOR,
              'line-opacity': HIGHLIGHT_OPACITY,
              'line-width': HIGHLIGHT_WIDTH
            }
          },
          HIGHLIGHT_CIRCLE_ID
        )
        map.addLayer(
          {
            id: HIGHLIGHT_POLYGON_ID,
            type: 'line',
            source: HIGHLIGHT_ID,
            filter: ['==', '$type', 'Polygon'],
            paint: {
              'line-color': HIGHLIGHT_COLOR,
              'line-opacity': HIGHLIGHT_OPACITY,
              'line-width': HIGHLIGHT_WIDTH
            }
          },
          HIGHLIGHT_LINE_ID
        )
        var bounds = bbox(geojson);
        map.fitBounds(bounds, {
          padding: 50,
          duration: 3000
        });
      } catch (e) {

      }
    }

    // navigating to different locations on the map
    useEffect(() => {
      if (!map) {
        // Map not initialized yet, return
        return;
      }
      let mapInstance = map;
    
      const moveMapToCoordinates = (longitude, latitude) => {
        const geojson = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
              },
              properties: {
                name: 'Selected Point'
              }
            }
          ]
        };

        if (mapInstance.getLayer('selected-point-layer')) {
          mapInstance.removeLayer('selected-point-layer')
        }
        if (mapInstance.getSource('selected-point')) {
          mapInstance.removeSource('selected-point')
        }
        mapInstance.addSource('selected-point', {
          type: 'geojson',
          data: geojson
        });
        mapInstance.addLayer({
          id: 'selected-point-layer',
          type: 'circle',
          source: 'selected-point',
          paint: {
            'circle-color': `#ff0000`,
            'circle-opacity': 0,
            'circle-radius': 20,
            'circle-stroke-color': HIGHLIGHT_COLOR,
            'circle-stroke-opacity': HIGHLIGHT_OPACITY,
            'circle-stroke-width': HIGHLIGHT_WIDTH
          }
        });

        mapInstance.flyTo({
          center: [longitude, latitude],
          zoom: 24,
          essential: true
        });
      };
    
      if (
        props.selectedCoordinates.longitude !== null &&
        props.selectedCoordinates.latitude !== null &&
        props.selectedCoordinates.longitude !== 0 &&
        props.selectedCoordinates.latitude !== 0
      ) {
        const { longitude, latitude } = props.selectedCoordinates;
        moveMapToCoordinates(longitude, latitude);
      } else {
        if (map.getLayer('selected-point-layer')) {
          map.removeLayer('selected-point-layer')
        }
        if (map.getSource('selected-point')) {
          map.removeSource('selected-point')
        }
      }
    
      const handleSelectOnMapClick = (e) => {
        const lngLat = e.lngLat;
        const latitude = lngLat.lat;
        const longitude = lngLat.lng;
    
        props.handleSelect(latitude, longitude);
    
        const geojson = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
              },
              properties: {
                name: 'Selected Point'
              }
            }
          ]
        };
    
        // Check if the source already exists
        if (mapInstance.getSource('selected-point')) {
          // Update the data of the existing source
          mapInstance.getSource('selected-point').setData(geojson);
        } else {
          // Add a new source
          mapInstance.addSource('selected-point', {
            type: 'geojson',
            data: geojson
          });
    
          // Add a layer to display the selected point
          mapInstance.addLayer({
            id: 'selected-point-layer',
            type: 'circle',
            source: 'selected-point',
            paint: {
              'circle-color': `#ff0000`,
              'circle-opacity': 0,
              'circle-radius': 12,
              'circle-stroke-color': HIGHLIGHT_COLOR,
              'circle-stroke-opacity': HIGHLIGHT_OPACITY,
              'circle-stroke-width': HIGHLIGHT_WIDTH
            }
          });
        }
    
        // Move the map's center to the selected point and adjust zoom level
        mapInstance.flyTo({
          center: [longitude, latitude],
          zoom: 10,
          essential: true // ensures a smooth transition
        });
    
        mapInstance.getCanvas().style.cursor = '';
      };

      const handleMapClick = (e) => {
        const { lng, lat } = e.lngLat;
        captureCoordinatesAndQuery(lat, lng, e);
      };

    
      const addClickEventListener = () => {
        if (mapInstance && props.selectingOnMap) {
          mapInstance.on('click', handleSelectOnMapClick);
          mapInstance.getCanvas().style.cursor = 'crosshair';
        }else {
          mapInstance.on('click', handleMapClick);
        }
      };
    
      const removeClickEventListener = () => {
        if (mapInstance) {
          mapInstance.off('click', handleSelectOnMapClick);
          mapInstance.off('click', handleMapClick);
          mapInstance.getCanvas().style.cursor = props.cursor;
        }
      };
    
      addClickEventListener();
    
      return () => {
        removeClickEventListener();
      };
    
    }, [props.handleSelect, props.selectingOnMap, props.selectedCoordinates, map]);

    useEffect(() => {
      if (props.resetMap === true) {
        let mapInstance = map;
  
        if (mapInstance) {
          mapInstance.flyTo({
            center: [longitude, latitude],
            zoom: initialMapConfig.zoom,
            essential: true,
          });
        }
        // props.resetCoordinates()
      }
    }, [props.resetMap]);


    useEffect(() => {
        let mapInstance = map;
        if(mapInstance)
          if (props.isSelectSiteOnMap)
            mapInstance.getCanvas().style.cursor = 'crosshair';
          else mapInstance.getCanvas().style.cursor = '';

      }, [props.isSelectSiteOnMap]);


    const captureCoordinatesAndQuery = async (latitude, longitude, e) => {
      const bbox = [
        [e.point.x - 5, e.point.y - 5], // top-left of bbox (in pixels)
        [e.point.x + 5, e.point.y + 5]  // bottom-right of bbox (in pixels)
      ];

      // get features on the clicked coordinate
      const features = map.queryRenderedFeatures(bbox);

      const gid = features.length > 0 ? features[0].properties.sites_gid : 0;

      try {

        const response = await axios.get(`${globalVariables.baseUrl}/monitor/site-observations/${latitude}/${longitude}/?gid=${gid}`);
    
        if (response.data) {
          window.history.replaceState(null, "", window.location.pathname);
          var data = response.data;
          if (data.observations.length === 0) {
            data.observations = [{
              "gid": 0,
              "site": {
                  "gid": data.site.gid,
                  "images": data.site.images,
                  "the_geom": `SRID=4326;POINT (${data.site.longitude} ${data.site.latitude})`,
                  "site_name": data.site.sitename,
                  "river_name": data.site.rivername,
                  "description": data.site.sitedescription,
                  "river_cat": data.site.rivercategory,
                  "time_stamp": "",
                  "user": 0,
                  "assessment": null
              },
              "sitename": data.site.sitename,
              "rivername": data.site.rivername,
              "sitedescription": data.site.sitedescription,
              "rivercategory": data.site.sitecategory,
              "longitude": data.site.longitude,
              "latitude": data.site.latitude,
              "collectorsname": "N/A",
              "organisationtype": {
                  "id": 0,
                  "rank": 0,
                  "description": "N/A",
                  "active": true,
                  "container": null
              },
              "images": [],
              "minisass_ml_score": null,
              "ml_model_version": null,
              "ml_model_type": null,
              "flatworms": false,
              "worms": false,
              "leeches": false,
              "crabs_shrimps": false,
              "stoneflies": true,
              "minnow_mayflies": false,
              "other_mayflies": false,
              "damselflies": false,
              "dragonflies": false,
              "bugs_beetles": false,
              "caddisflies": false,
              "true_flies": false,
              "snails": false,
              "collector_name": "",
              "score": "",
              "time_stamp": "",
              "comment": "",
              "obs_date": new Date().toISOString().split('T')[0],
              "flag": "",
              "is_validated": false,
              "water_clarity": "-9999.0",
              "water_temp": "-9999.0",
              "ph": "-9999.0",
              "diss_oxygen": "-9999.00",
              "diss_oxygen_unit": "mgl",
              "elec_cond": "-9999.00",
              "elec_cond_unit": "S/m",
              "user": 0
          }]
          }else if (data.observations[0].organisationtype == null){
            data.observations[0].organisationtype = {
                  "id": 0,
                  "rank": 0,
                  "description": "N/A",
                  "active": true,
                  "container": null
              }
          }

          if(!props.isSelectSiteOnMap)
            props.openObservationForm(data);
          else props.setSiteDetails(response.data.site);
        }

      } catch (error) {
        console.error('Error querying site:', error.message);
      }
    };

    return <div id="map" className="w-full h-full bg-slate-200">
      {
        map ?
          <LayerSelector
            map={map}
            basemaps={props.basemaps}
            overlayLayers={props.overlayLayers}
            showLayer={showLayer}
            hideLayer={hideLayer}
            idxActive={props.idxActive}
            setIdxActive={props.setIdxActive}
          /> :
          null
      }
    </div>
  }
)
