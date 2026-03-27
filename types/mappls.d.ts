/* eslint-disable @typescript-eslint/no-explicit-any */
// =============================================================
// Mappls (MapmyIndia) Web Maps JS SDK — Type Declarations
// SDK loaded via CDN: https://sdk.mappls.com/map/sdk/web?v=3.0
// =============================================================

export {};

declare global {
  interface Window {
    mappls: typeof mappls;
  }

  namespace mappls {
    // ---- Map --------------------------------------------------
    interface MapOptions {
      center?: LatLng;
      zoom?: number;
      minZoom?: number;
      maxZoom?: number;
      zoomControl?: boolean;
      scrollWheel?: boolean;
      draggable?: boolean;
      location?: boolean;
      search?: boolean;
      hybrid?: boolean;
      traffic?: boolean;
      geolocation?: boolean;
      clickableIcons?: boolean;
      disableDoubleClickZoom?: boolean;
      heading?: number;
      tilt?: number;
      backgroundColor?: string;
    }

    interface LatLng {
      lat: number;
      lng: number;
    }

    class Map {
      constructor(container: string | HTMLElement, options?: MapOptions);
      setCenter(latlng: LatLng): void;
      setZoom(zoom: number): void;
      getCenter(): LatLng;
      getZoom(): number;
      panTo(latlng: LatLng): void;
      fitBounds(bounds: any, options?: any): void;
      getBounds(): any;
      addListener(event: string, callback: (...args: any[]) => void): void;
      removeLayer(layer: any): void;
    }

    // ---- Marker ------------------------------------------------
    interface MarkerOptions {
      map: Map;
      position: LatLng;
      icon?: MarkerIcon;
      draggable?: boolean;
      popupHtml?: string;
      fitbounds?: boolean;
      fitboundOptions?: any;
      html?: string;
      offset?: [number, number];
      width?: number;
      height?: number;
      clusters?: boolean;
      clustersOptions?: any;
      cType?: number;
    }

    interface MarkerIcon {
      url: string;
      width?: number;
      height?: number;
    }

    class Marker {
      constructor(options: MarkerOptions);
      setPosition(latlng: LatLng): void;
      getPosition(): LatLng;
      setIcon(icon: MarkerIcon): void;
      setDraggable(draggable: boolean): void;
      setPopup(html: string): void;
      remove(): void;
      addListener(event: string, callback: (...args: any[]) => void): void;
    }

    // ---- Polyline ----------------------------------------------
    interface PolylineOptions {
      map: Map;
      path: LatLng[];
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      fitbounds?: boolean;
      fitboundOptions?: any;
      dasharray?: number[];
      editable?: boolean;
      gradient?: any[];
    }

    class Polyline {
      constructor(options: PolylineOptions);
      setPath(path: LatLng[]): void;
      getPath(): LatLng[];
      remove(): void;
    }

    // ---- InfoWindow --------------------------------------------
    interface InfoWindowOptions {
      map: Map;
      position: LatLng;
      content?: string;
      maxWidth?: number;
    }

    class InfoWindow {
      constructor(options: InfoWindowOptions);
      setContent(content: string): void;
      setPosition(latlng: LatLng): void;
      open(map: Map, marker?: Marker): void;
      close(): void;
    }

    // ---- Utility -----------------------------------------------
    function remove(options: { map: Map; layer: any }): void;
  }
}
