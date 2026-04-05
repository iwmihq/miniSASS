import os
import json

from django import template
from django.conf import settings
from django.utils.safestring import mark_safe

register = template.Library()

@register.simple_tag
def render_vite_bundle():
    """
    Template tag to render a Vite bundle.
    Supposed to only be used in production.
    For development, see other files.
    """
  
    # Construct the path to the manifest file
    # Vite 5+ moved the manifest to .vite/manifest.json
    manifest_path = os.path.join(settings.FRONTEND_PATH, 'src', 'dist', '.vite', 'manifest.json')
    if not os.path.exists(manifest_path):
        manifest_path = os.path.join(settings.FRONTEND_PATH, 'src', 'dist', 'manifest.json')

    try:
        # Open and read the manifest file
        with open(manifest_path, "r") as fd:
            manifest = json.load(fd)
    except Exception as e:
        # Handle exceptions when the manifest file is not found or invalid
        raise Exception("Vite manifest file not found or invalid. Error: {0}".format(str(e)))

    # Generate HTML for importing JavaScript and CSS files
    imports_files = "".join([
        '<script type="module" src="/static/{0}"></script>'.format(manifest[file]["file"])
        for file in manifest["index.html"]["dynamicImports"]
    ])

    # Create the HTML content to include in the template
    html_content = """<script type="module" src="/static/{0}"></script>
        <link rel="stylesheet" type="text/css" href="/static/{1}" />
        {2}""".format(manifest['index.html']['file'], manifest['index.html']['css'][0], imports_files)

    # Return the HTML content marked as safe to prevent auto-escaping
    return mark_safe(html_content)
