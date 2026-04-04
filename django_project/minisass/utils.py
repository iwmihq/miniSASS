import os

# Absolute filesystem path to the Django project directory:
DJANGO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def absolute_path(*args):
    """Return absolute path of django project."""
    return os.path.join(DJANGO_ROOT, *args)


def delete_file_field(file_field):
    """Delete actual file via storage backend."""
    if file_field:
        try:
            file_field.delete(save=False)
        except Exception:
            pass


def get_path_string(string: str):
    """
    Get string in all lowercase, and space converted to udnerscore.
    Example: True flies will be converted to true_flies
    """
    return string.lower().replace(' ', '_')


def dicts_equal(d1, d2, ignore_keys=None):
    if ignore_keys is None:
        ignore_keys = []

    # Remove ignored keys
    d1_filtered = {k: v for k, v in d1.items() if k not in ignore_keys}
    d2_filtered = {k: v for k, v in d2.items() if k not in ignore_keys}

    return d1_filtered == d2_filtered