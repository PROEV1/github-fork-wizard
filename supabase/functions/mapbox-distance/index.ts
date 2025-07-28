import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const MAPBOX_ACCESS_TOKEN = Deno.env.get('MAPBOX_ACCESS_TOKEN')

interface DistanceRequest {
  origins: string[]
  destinations: string[]
}

interface DistanceResponse {
  distances: number[][]
  durations: number[][]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!MAPBOX_ACCESS_TOKEN) {
      throw new Error('MAPBOX_ACCESS_TOKEN not configured')
    }

    const { origins, destinations }: DistanceRequest = await req.json()
    
    console.log('Mapbox Distance API called with:', { origins, destinations })
    
    if (!origins?.length || !destinations?.length) {
      throw new Error('Origins and destinations are required')
    }
    
    if (origins.length === 0 || destinations.length === 0) {
      throw new Error('Not enough input sources and destinations given')
    }

    // Convert postcodes to coordinates using Mapbox Geocoding API
    const coordinatesCache = new Map<string, [number, number]>()
    
    const getCoordinates = async (postcode: string): Promise<[number, number]> => {
      if (coordinatesCache.has(postcode)) {
        return coordinatesCache.get(postcode)!
      }
      
      const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(postcode)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=GB&types=postcode`
      
      const response = await fetch(geocodeUrl)
      const data = await response.json()
      
      if (!data.features?.length) {
        throw new Error(`Could not geocode postcode: ${postcode}`)
      }
      
      const [lng, lat] = data.features[0].center
      const coordinates: [number, number] = [lng, lat]
      coordinatesCache.set(postcode, coordinates)
      
      return coordinates
    }

    // Get coordinates for all unique postcodes
    const allPostcodes = [...new Set([...origins, ...destinations])]
    await Promise.all(allPostcodes.map(getCoordinates))

    // Prepare coordinates for Matrix API
    const originCoords = origins.map(postcode => coordinatesCache.get(postcode)!)
    const destinationCoords = destinations.map(postcode => coordinatesCache.get(postcode)!)
    
    // Format coordinates for Mapbox Matrix API
    const allCoords = [...originCoords, ...destinationCoords]
    const coordinatesParam = allCoords.map(coord => coord.join(',')).join(';')
    
    // Specify which points are sources (origins) and destinations
    const sources = originCoords.map((_, index) => index).join(';')
    const destinationsParam = destinationCoords.map((_, index) => index + originCoords.length).join(';')
    
    // Call Mapbox Matrix API
    const matrixUrl = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordinatesParam}?sources=${sources}&destinations=${destinationsParam}&access_token=${MAPBOX_ACCESS_TOKEN}`
    
    console.log('Matrix API URL:', matrixUrl)
    console.log('Coordinates:', { originCoords, destinationCoords, sources, destinationsParam })
    
    const matrixResponse = await fetch(matrixUrl)
    const matrixData = await matrixResponse.json()
    
    console.log('Matrix API response:', { status: matrixResponse.status, data: matrixData })
    
    if (!matrixResponse.ok) {
      throw new Error(`Mapbox API error: ${matrixData.message || matrixData.error}`)
    }

    // Convert distances from meters to miles and durations from seconds to minutes
    const distances = matrixData.distances.map((row: number[]) => 
      row.map((distance: number) => Math.round((distance / 1609.34) * 10) / 10) // meters to miles, rounded to 1 decimal
    )
    
    const durations = matrixData.durations.map((row: number[]) => 
      row.map((duration: number) => Math.round(duration / 60)) // seconds to minutes
    )

    const result: DistanceResponse = {
      distances,
      durations
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error calculating distances:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})