
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    console.log('Starting save-candidate-data function')
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      throw new Error('Error de configuración del servidor')
    }
    
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.error('Missing authorization header')
      throw new Error('Se requiere autenticación para esta operación')
    }
    
    // Initialize Supabase admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request body
    const requestBody = await req.json()
    const { candidateId, resumeText, analysisData } = requestBody
    
    console.log(`Processing data for candidate ${candidateId}`)
    console.log(`Resume text length: ${resumeText ? resumeText.length : 0} characters`)
    console.log(`Analysis data provided: ${analysisData ? 'Yes' : 'No'}`)
    
    // Validate required fields
    if (!candidateId) {
      console.error('Missing required candidateId')
      throw new Error('Se requiere ID de candidato')
    }
    
    // Prepare update data
    const updateData: Record<string, any> = {}
    
    if (resumeText) {
      updateData.resume_text = resumeText
    }
    
    if (analysisData) {
      updateData.analysis_summary = JSON.stringify(analysisData)
      
      // Extract skills if available in analysis data
      let skills = []
      try {
        // Try to parse the analysisData if it's a string
        const parsedData = typeof analysisData === 'string' ? JSON.parse(analysisData) : analysisData
        
        if (parsedData.habilidades && Array.isArray(parsedData.habilidades)) {
          skills = parsedData.habilidades.filter(Boolean)
        }
        
        // Also look at job-specific skills
        if (parsedData.compatibilidad && 
            parsedData.compatibilidad.fortalezas && 
            Array.isArray(parsedData.compatibilidad.fortalezas)) {
          // Add relevant job skills that aren't already in the skills array
          parsedData.compatibilidad.fortalezas.forEach((skill: string) => {
            if (skill && !skills.includes(skill)) {
              skills.push(skill)
            }
          })
        }
        
        // Extract experience years if available
        if (parsedData.experienciaLaboral && Array.isArray(parsedData.experienciaLaboral)) {
          // Estimate years of experience from work history
          let totalYears = 0
          parsedData.experienciaLaboral.forEach((exp: any) => {
            if (exp.fechas) {
              const match = exp.fechas.match(/\d+\s+años?\s+(\d+\s+meses?)?/i)
              if (match) {
                const years = parseInt(match[0], 10) || 0
                totalYears += years
              }
            }
          })
          
          if (totalYears > 0) {
            updateData.experience_years = totalYears
          }
        }
        
      } catch (e) {
        console.warn('Error parsing analysis data or extracting skills:', e)
      }
      
      // Only update skills if we found some
      if (skills.length > 0) {
        updateData.skills = skills
      }
    }
    
    // Update the candidate record
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString()
      
      console.log('Updating candidate with data:', JSON.stringify(updateData, null, 2))
      
      const { data, error } = await supabaseAdmin
        .from('candidates')
        .update(updateData)
        .eq('id', candidateId)
        .select()
        .single()
        
      if (error) {
        console.error('Error updating candidate:', error)
        throw new Error(`Error al actualizar datos del candidato: ${error.message}`)
      }
      
      console.log('Candidate data updated successfully')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Datos actualizados correctamente',
          data 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } else {
      console.log('No data to update')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No se proporcionaron datos para actualizar' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }
    
  } catch (error) {
    console.error('Error in save-candidate-data function:', error)
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Error interno del servidor',
        error: String(error)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
