import shutil
import requests
import os
import zipfile
from django.conf import settings


def safe_copy(file_path, out_dir, dst=None) -> str:
    """Safely copy a file to the specified directory. If a file with the same name already
    exists, the copied file name is altered to preserve both.

    :param str file_path: Path to the file to copy.
    :param str out_dir: Directory to copy the file into.
    :param str dst: New name for the copied file. If None, use the name of the original
        file.
    """
    name = dst or os.path.basename(file_path)
    final_name = name
    if not os.path.exists(os.path.join(out_dir, name)):
        destination = os.path.join(out_dir, name)
        shutil.copy(file_path, destination)
        final_name = destination
    else:
        base, extension = os.path.splitext(name)
        i = 1
        while os.path.exists(os.path.join(out_dir, '{}_{}{}'.format(base, i, extension))):
            i += 1
        destination = os.path.join(out_dir, '{}_{}{}'.format(base, i, extension))
        shutil.copy(file_path, destination)
        final_name = destination
    return final_name


def zip_directory(directory_path, zip_path):
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        for root, dirs, files in os.walk(directory_path):
            for file in files:
                zipf.write(
                    os.path.join(root, file),
                    os.path.relpath(
                        os.path.join(root, file),
                        os.path.join(directory_path, '..')
                    )
                )



def get_country_from_coordinates_nominatim(latitude, longitude):
    """Extract country lookup logic"""
    if not getattr(settings, 'ENABLE_GEOCODING', True):
        return ''

    try:
        geocoder = Nominatim(user_agent="minisass")
        location = geocoder.reverse(f"{latitude}, {longitude}").raw
        return location.get('address', {}).get('country_code', 'N/A').upper()
    except (AttributeError, Exception):
        return ''


def get_country_from_coordinates_kartoza_maps(latitude, longitude):
    """Extract country lookup logic"""
    if not getattr(settings, 'ENABLE_GEOCODING', True):
        return ''

    url = "https://maps.kartoza.com/geoserver/kartoza/ows"
    params = {
        "SERVICE": "WFS",
        "VERSION": "1.1.0",
        "REQUEST": "GetFeature",
        "TYPENAME": "kartoza:world",
        "SRSNAME": "EPSG:4326",
        "OUTPUTFORMAT": "application/json",
        "PROPERTYNAME": "ISO_A2,ADMIN",
        "CQL_FILTER": f"INTERSECTS(the_geom,POINT({latitude} {longitude}))"
    }
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data.get('numberReturned', 0) == 0:
            raise ValueError("Site is located in the ocean!")
        else:
            return data['features'][0]['properties']['ISO_A2'].upper()
    except requests.exceptions.Timeout:
        raise ValueError("Ocean validation timed out. Please try again later.")
    except requests.exceptions.ConnectionError:
        raise ValueError("Could not connect to validation service. Please check your network connection.")
    except requests.exceptions.HTTPError as e:
        raise ValueError(f"Ocean validation service error: {e}")
    except ValueError:
        raise
    except Exception:
        raise ValueError(f"Unexpected error during ocean validation!")
