// services/supabaseService.ts

import { supabase } from "../config/supabase";

/** ------------------------------------
 * SAVE DOMAIN REGISTRATION
 * ------------------------------------ */
export const saveDomainRegistration = async ({
  full_name,
  email,
  phone,
  domain_name,
  registrar_name,
}: {
  full_name: string;
  email: string;
  phone: string;
  domain_name: string;
  registrar_name: string;
}) => {
  const { data, error } = await supabase
    .from("domain_registrations")
    .insert({
      full_name,
      email,
      phone,
      domain_name,
      registrar_name,
    });

  return { data, error };
};

/** ------------------------------------
 * SAVE ORDER (Checkout / M-Pesa Payment)
 * ------------------------------------ */
export const saveOrder = async ({
  user_id,
  full_name,
  email,
  phone,
  items,
  total_amount,
  payment_method = "mpesa",
  payment_status = "pending",
}: {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  items: string;
  total_amount: number;
  payment_method?: string;
  payment_status?: string;
}) => {
  const { data, error } = await supabase.from("orders").insert({
    user_id,
    full_name,
    email,
    phone,
    items,
    total_amount,
    payment_method,
    payment_status,
  });

  return { data, error };
};


/** ------------------------------------
 * CHECK EXISTING DOMAIN BOOKING
 * ------------------------------------ */
export const checkExistingBooking = async (domain_name: string) => {
  const { data, error } = await supabase
    .from("domain_bookings")
    .select("*")
    .eq("domain_name", domain_name)
    .maybeSingle(); // returns null if not found

  return { data, error };
};


/** ------------------------------------
 * SAVE DOMAIN BOOKING (7-DAY EXPIRY)
 * ------------------------------------ */
export const saveDomainBooking = async ({
  user_id,
  full_name,
  phone,
  email,
  domain_name,
}: {
  user_id: string;      // MUST be UUID from auth user
  full_name: string;
  phone: string;
  email: string;
  domain_name: string;  // example: myname.co.ke
}) => {
  const { data, error } = await supabase
    .from("domain_bookings")
    .insert({
      user_id,
      full_name,
      phone,
      email,
      domain_name,
      // booked_at and expires_at are auto-generated
    });

  return { data, error };
};

/** ------------------------------------
 * GET USER DOMAIN BOOKINGS
 * ------------------------------------ */
export const getUserDomainBookings = async (user_id: string) => {
  try {
    const { data, error } = await supabase
      .from("domain_bookings")
      .select("*")
      .eq("user_id", user_id)
      .order("booked_at", { ascending: false });

    if (error) return { data: null, error };

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};

/** ------------------------------------
 * SAVE OR UPDATE A BID FOR A DOMAIN
 * ------------------------------------ */
export const saveBid = async ({
  user_id,
  full_name,
  email,
  phone,
  domain_name,
  bid_amount,
  start_date,
  end_date,
}: {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  domain_name: string;
  bid_amount: number;
  start_date: string;
  end_date: string;
}) => {
  try {
    // 1️⃣ Check if user already has a bid for this domain
    const { data: existingBid, error: checkError } = await supabase
      .from("bids")
      .select("*")
      .eq("user_id", user_id)
      .eq("domain_name", domain_name)
      .maybeSingle();

    if (checkError) {
      return { data: null, error: checkError };
    }

    // 2️⃣ If bid exists → update IF new amount is higher
    if (existingBid) {
      if (bid_amount <= existingBid.bid_amount) {
        return {
          data: null,
          error: {
            message:
              "Your new bid must be higher than your previous bid.",
          },
        };
      }

      const { data: updated, error: updateError } = await supabase
        .from("bids")
        .update({
          bid_amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingBid.id)
        .select()
        .single();

      return { data: updated, error: updateError };
    }

    // 3️⃣ If no previous bid → insert a new one
    const { data: inserted, error: insertError } = await supabase
      .from("bids")
      .insert({
        user_id,
        full_name,
        email,
        phone,
        domain_name,
        bid_amount,
        start_date,
        end_date,
      })
      .select()
      .single();

    return { data: inserted, error: insertError };
  } catch (err) {
    return { data: null, error: err };
  }
};

/** ------------------------------------
 * GET ALL BIDS FOR A SPECIFIC DOMAIN
 * ------------------------------------ */
export const getBidsForDomain = async (domain_name: string) => {
  try {
    const { data, error } = await supabase
      .from("bids")
      .select("full_name, bid_amount, placed_at")
      .eq("domain_name", domain_name)
      .order("bid_amount", { ascending: false }); // highest bids first

    if (error) return { data: null, error };

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};



/** ------------------------------------
 * SAVE ADVERTISEMENT REQUEST
 * ------------------------------------ */
export const saveAdvertisement = async ({
  user_id,
  full_name,
  email,
  phone,
  package_type,
  slot_number,
}: {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  package_type: string;
  slot_number: number;
}) => {
  const { data, error } = await supabase.from("advertisements").insert({
    user_id,
    full_name,
    email,
    phone,
    package_type,
    slot_number,
  });

  return { data, error };
};

/** ------------------------------------
 * GET USER ADVERTISEMENTS
 * ------------------------------------ */
export const getUserAdvertisements = async (user_id: string) => {
  const { data, error } = await supabase
    .from("advertisements")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  return { data, error };
};


/** ------------------------------------
 * GET USER ORDERS
 * ------------------------------------ */
export const getUserOrders = async (user_id: string) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*") // fetch all columns, you can customize
      .eq("user_id", user_id)
      .order("created_at", { ascending: false }); // latest orders first

    if (error) {
      console.error("Error fetching orders:", error);
      return { orders: [], error };
    }

    return { orders: data || [], error: null };
  } catch (err) {
    console.error("Unexpected error fetching orders:", err);
    return { orders: [], error: err };
  }
};


export const saveSearchedDomain = async ({
  user_id,
  full_name,
  email,
  phone,
  domain,
}: {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  domain: string;
}) => {
  const { data, error } = await supabase
    .from("searched_domains")
    .insert({
      user_id,
      full_name,
      email,
      phone,
      domain,
    });

  return { data, error };
};

export const getUserSearchedDomains = async (user_id: string) => {
  const { data, error } = await supabase
    .from("searched_domains")
    .select("*")
    .eq("user_id", user_id)
    .order("searched_at", { ascending: false });

  return { data, error };
};


/** ------------------------------------
 * LIKE A POST
 * ------------------------------------ */
export const likePost = async ({
  user_id,
  user_name, // new
  post_id,
}: {
  user_id: string;
  user_name: string; // new
  post_id: string;
}) => {
  const { data, error } = await supabase
    .from("likes")
    .insert({ user_id, user_name, post_id })
    .select()
    .single();

  return { data, error };
};

/** ------------------------------------
 * UNLIKE A POST
 * ------------------------------------ */
export const unlikePost = async ({
  user_id,
  post_id,
}: {
  user_id: string;
  post_id: string;
}) => {
  const { data, error } = await supabase
    .from("likes")
    .delete()
    .eq("user_id", user_id)
    .eq("post_id", post_id);

  return { data, error };
};

/** ------------------------------------
 * TOGGLE LIKE (SMART)
 * ------------------------------------ */
export const toggleLike = async ({
  user_id,
  user_name, // new
  post_id,
}: {
  user_id: string;
  user_name: string; // new
  post_id: string;
}) => {
  // Check if already liked
  const { data: existing, error: checkErr } = await supabase
    .from("likes")
    .select("*")
    .eq("user_id", user_id)
    .eq("post_id", post_id)
    .maybeSingle();

  if (checkErr) return { data: null, error: checkErr };

  // If liked → remove like
  if (existing) {
    const { data, error } = await unlikePost({ user_id, post_id });
    return { data, error, liked: false };
  }

  // If not liked → like it
  const { data, error } = await likePost({ user_id, user_name, post_id });
  return { data, error, liked: true };
};

/** ------------------------------------
 * GET LIKE COUNT FOR A POST
 * ------------------------------------ */
export const getLikeCount = async (post_id: string) => {
  const { count, error } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", post_id);

  return { count, error };
};

/** ------------------------------------
 * CHECK IF USER LIKED POST
 * ------------------------------------ */
export const userLikedPost = async ({
  user_id,
  post_id,
}: {
  user_id: string;
  post_id: string;
}) => {
  const { data, error } = await supabase
    .from("likes")
    .select("*")
    .eq("user_id", user_id)
    .eq("post_id", post_id)
    .maybeSingle();

  return { liked: !!data, error };
};

/** ------------------------------------
 * ADD COMMENT (Top-level)
 * ------------------------------------ */
export const addComment = async ({
  user_id,
  user_name, // new
  post_id,
  comment,
}: {
  user_id: string;
  user_name: string; // new
  post_id: string;
  comment: string;
}) => {
  const { data, error } = await supabase
    .from("comments")
    .insert({
      user_id,
      user_name, // new
      post_id,
      comment,
      parent_comment_id: null,
    })
    .select()
    .single();

  return { data, error };
};

/** ------------------------------------
 * ADD REPLY TO A COMMENT
 * ------------------------------------ */
export const addReply = async ({
  user_id,
  user_name, // new
  post_id,
  comment,
  parent_comment_id,
}: {
  user_id: string;
  user_name: string; // new
  post_id: string;
  comment: string;
  parent_comment_id: string;
}) => {
  const { data, error } = await supabase
    .from("comments")
    .insert({
      user_id,
      user_name, // new
      post_id,
      comment,
      parent_comment_id,
    })
    .select()
    .single();

  return { data, error };
};

/** ------------------------------------
 * GET ALL COMMENTS FOR A POST
 * (INCLUDING TOP-LEVEL + REPLIES)
 * ------------------------------------ */
export const getCommentsForPost = async (post_id: string) => {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", post_id)
    .order("created_at", { ascending: true });

  return { data, error };
};

/** ------------------------------------
 * GET REPLIES FOR ONE COMMENT
 * ------------------------------------ */
export const getRepliesForComment = async (parent_comment_id: string) => {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("parent_comment_id", parent_comment_id)
    .order("created_at", { ascending: true });

  return { data, error };
};

/** ------------------------------------
 * DELETE A COMMENT OR REPLY
 * ------------------------------------ */
export const deleteComment = async (comment_id: string) => {
  const { data, error } = await supabase
    .from("comments")
    .delete()
    .eq("id", comment_id);

  return { data, error };
};

/** ------------------------------------
 * EDIT COMMENT
 * ------------------------------------ */
export const editComment = async ({
  comment_id,
  comment,
}: {
  comment_id: string;
  comment: string;
}) => {
  const { data, error } = await supabase
    .from("comments")
    .update({
      comment,
    })
    .eq("id", comment_id)
    .select()
    .single();

  return { data, error };
};
