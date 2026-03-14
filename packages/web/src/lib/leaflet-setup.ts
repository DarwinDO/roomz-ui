/**
 * Leaflet icon fix for Vite/Webpack
 * Default marker icons break when bundled — this re-configures them.
 */
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Must delete _getIconUrl first — it overrides mergeOptions in Vite/Webpack builds
const defaultIcon = L.Icon.Default as unknown as {
    prototype: {
        _getIconUrl?: string;
    };
};

delete defaultIcon.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

export default L;
