declare module '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions' {
    import mapboxgl from 'mapbox-gl';
  
    class MapboxDirections {
      constructor(options: {
        accessToken: string;
        unit?: 'metric' | 'imperial';
        profile?: string;
        controls?: {
          inputs?: boolean;
          instructions?: boolean;
        };
      });
  
      setOrigin(coordinates: [number, number]): void;
      setDestination(coordinates: [number, number]): void;
    }
  
    export default MapboxDirections;
  }