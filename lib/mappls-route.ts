// =============================================================
// Mappls (MapmyIndia) Route Helper
// Fetches real road-based route from Mappls Route API and
// draws it as a Polyline on the map.
// API: https://apis.mappls.com/advancedmaps/v1/{key}/route_adv/driving/
// =============================================================

interface LatLng { lat: number; lng: number }

interface MapplsRouteStep {
  geometry: {
    coordinates: [number, number][];
  };
}

interface MapplsRouteResponse {
  routes?: {
    geometry?: { coordinates: [number, number][] };
    legs?: { steps?: MapplsRouteStep[] }[];
    distance?: number;
    duration?: number;
  }[];
  code?: string;
}

/**
 * Fetch a real road route from Mappls between two points.
 * Returns an array of LatLng points for drawing a Polyline.
 */
export async function fetchMapplsRoute(
  from: LatLng,
  to: LatLng
): Promise<LatLng[]> {
  const key = process.env.NEXT_PUBLIC_MAPPLS_KEY;
  if (!key) return [from, to]; // fallback: straight line

  try {
    const url = `https://apis.mappls.com/advancedmaps/v1/${key}/route_adv/driving/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=polyline&overview=full`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Route API ${res.status}`);

    const data: MapplsRouteResponse = await res.json();

    if (data.code !== "Ok" || !data.routes?.[0]) {
      return [from, to]; // fallback
    }

    const route = data.routes[0];

    // Use full overview geometry if available
    if (route.geometry?.coordinates?.length) {
      return route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
        lat,
        lng,
      }));
    }

    // Fallback: concatenate all step geometries
    const points: LatLng[] = [];
    route.legs?.[0]?.steps?.forEach((step) => {
      step.geometry.coordinates.forEach(([lng, lat]: [number, number]) => {
        points.push({ lat, lng });
      });
    });

    return points.length > 1 ? points : [from, to];
  } catch (err) {
    console.warn("Mappls route fetch failed:", err);
    return [from, to]; // always fall back to straight line
  }
}
