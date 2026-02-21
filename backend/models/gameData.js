import { supabase } from "../core/supabaseClient.js";   



class GameData {

    constructor() {

        this.db = supabase;

    }



    async getUserGameData(user_id, programming_language) {

        const { data, error } = await this.db

            .from("users_game_data")

            .select("exercise_id, xp_earned, programming_language")

            .eq("user_id", user_id)

            .eq("programming_language", programming_language);



        if (error) throw error;

        return data;

        }





    async createUserGameData({ user_id, xp_earned, exercise_id , programming_language}) {

        const { data, error } = await this.db

            .from("users_game_data")

            .insert({

                user_id,

                xp_earned,

                exercise_id,

                programming_language: programming_language,

                created_at: new Date().toISOString()

            })

            .select("*")

            .maybeSingle();



        if (error) throw error;

        return data;

    }



    async updateUserGameData({ user_id, game_id, xp_earned, exercise_id }) {

        const { data, error } = await this.db

            .from("users_game_data")

            .update({

                xp_earned,

                exercise_id,

            })

            .eq("user_id", user_id)

            .eq("game_id", game_id)

            .select("*")

            .maybeSingle();



        if (error) throw error;

        return data;

    }


}

export default GameData;