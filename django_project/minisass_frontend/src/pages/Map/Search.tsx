import React, { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { debounce } from '@mui/material/utils';
import { CircularProgress } from "@mui/material";
import {globalVariables} from "../../utils";
import { parse } from "wkt";


interface PlaceType {
  value: string
  source: string
  label: string
  data: {
    osm_id: number,
    osm_type: string,
  }
}

interface Interface {
  searchEntityChanged: (geojson) => void,
}

const NOMINATIM = 'nominatim'
const SITES = 'sites'
let lastQuery = ''
let lastValue = ''

/** Search input */
export default function Search(props: Interface) {
  const [value, setValue] = useState<PlaceType | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<readonly PlaceType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Fetching results
  const fetchResults = React.useMemo(
    () =>
      debounce(
        (
          query: string,
          callback: (query: string, results?: readonly PlaceType[],) => void,
        ) => {
          setLoading(true);
          lastQuery = query;
          (
            async () => {
              try {
                const responseSite = fetch(`${globalVariables.baseUrl}/monitor/sites/?site_name=${query}`);
                const responseNominatim = fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json`);

                Promise.all([ responseSite, responseNominatim ]).then(([siteResponse, nominatimResponse]) => {
                  let results: PlaceType[] = [];
                  siteResponse.json().then((response) => {
                    response.map(row => {
                      results.push({
                        value: row.gid,
                        source: SITES,
                        label: `${row.site_name} (Site)`,
                        data: row
                      })
                    })

                    nominatimResponse.json().then((response) => {
                      response.map(row => {
                        results.push({
                          value: row.place_id,
                          source: NOMINATIM,
                          label: row.display_name,
                          data: row
                        })
                      })
                      callback(query, results);
                    });

                  });
                });
              } catch (error) {

              }
            }
          )()
        },
        400,
      ),
    [],
  );

  /**
   * Use effect when input changed.
   * Do fetching request
   *  */
  useEffect(() => {
    if (inputValue === '') {
      setOptions(value ? [value] : []);
      return undefined;
    }

    fetchResults(inputValue, (query: string, results?: readonly PlaceType[]) => {
      if (query !== lastQuery) {
        return
      }
      let newOptions: PlaceType[] = [];
      if (value) {
        newOptions = [value];
      }
      if (results) {
        newOptions = [...newOptions, ...results];
      }
      setOptions(newOptions);
      setLoading(false);
    });
  }, [value, inputValue, fetch]);

  /**
   * Use effect when value changed.
   * If nominatim, get the detail
   * */
  useEffect(() => {
    lastValue = JSON.stringify(value)

    if (value) {
      setLoadingData(true);
      switch (value.source) {
        case NOMINATIM: {
          (
            async () => {
              const response = await fetch(`https://nominatim.openstreetmap.org/lookup?osm_ids=${value.data.osm_type[0].toUpperCase()}${value.data.osm_id}&format=geojson&polygon_geojson=1`);
              const json = await response.json();
              if (JSON.stringify(value) === lastValue) {
                props.searchEntityChanged(json);
                setLoadingData(false);
              }
            }
          )()
          break
        }
        case SITES: {
          const geojson = parse(value.data.the_geom);
          props.searchEntityChanged(geojson);
          setLoadingData(false);
          break
        }
      }
    } else {
      props.searchEntityChanged({
        type: 'FeatureCollection',
        features: []
      });
    }
  }, [value]);

  return (
    <Autocomplete
      className='Search'
      sx={{ width: '100%', maxWidth: 300, height: 41 }}
      filterOptions={(x) => x}
      getOptionLabel={(option) => option.label}
      options={options}
      autoComplete
      includeInputInList
      filterSelectedOptions
      loading={loading}
      value={value}
      noOptionsText="Not found"
      onChange={(event: any, newValue: PlaceType | null) => {
        setOptions(newValue ? [newValue, ...options] : options);
        setValue(newValue);
      }}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      popupIcon={loadingData ? <CircularProgress size={20}/> : null}
      renderInput={(params) => {
        return <TextField
          {...params}
          placeholder="Search sites or place"
          fullWidth
        />
      }}
      renderOption={(props, option) => {
        return (
          <li {...props} key={option.value}>
            <Grid container alignItems="center">
              <Grid item sx={{
                width: '100% ',
                wordWrap: 'break-word'
              }}>
                <Typography variant="body2" color="text.secondary">
                  {option.label}
                </Typography>
              </Grid>
            </Grid>
          </li>
        );
      }}
    />
  );
}