
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Import shared CORS headers
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { candidateId, resumeText, analysisData } = await req.json();
    
    if (!candidateId) {
      throw new Error('No candidate ID provided');
    }
    
    console.log(`Processing data for candidate: ${candidateId}`);
    
    // Update candidate with PDF text and analysis data
    const { data, error } = await supabase
      .from('candidates')
      .update({
        resume_text: resumeText || null,
        analysis_summary: analysisData || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', candidateId)
      .select();
      
    if (error) {
      console.error('Error updating candidate data:', error);
      throw error;
    }
    
    console.log('Candidate data updated successfully');
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    console.error('Error in save-candidate-data function:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
