import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Buscar todos os admins
    const { data: admins, error: adminsError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    console.log("Admins query result:", { admins, adminsError });

    if (adminsError) {
      console.error("Error fetching admins:", adminsError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar administradores" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!admins || admins.length === 0) {
      console.log("No admins found in the system");
      return new Response(
        JSON.stringify({ error: "Nenhum administrador encontrado no sistema" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Buscar o usuário relacionado ao email usando listUsers
    let relatedUserId = null;
    try {
      const { data: userList, error: userLookupError } = await supabase
        .auth
        .admin
        .listUsers();

      if (userLookupError) {
        console.error("Error listing users:", userLookupError);
      } else {
        const targetUser = userList?.users?.find(u => u.email === email);
        relatedUserId = targetUser?.id ?? null;
      }
    } catch (error) {
      console.error("Error finding user by email:", error);
    }

    // Criar notificações para todos os admins
    const notifications = admins.map((admin) => ({
      user_id: admin.user_id,
      tipo: "password_reset_request",
      title: "Solicitação de Redefinição de Senha",
      message: `O usuário ${email} solicitou redefinição de senha.`,
      relacionado_id: relatedUserId,
    }));

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notificationError) {
      console.error("Error creating notifications:", notificationError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar notificações" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Solicitação enviada com sucesso" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in request-password-reset:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
