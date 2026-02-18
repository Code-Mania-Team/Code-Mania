import { supabase } from '../core/supabaseClient.js';

class ExerciseModel {
    constructor() {
        this.db = supabase;
    }

    // Create a new exercise (quest)
    async createExercise(exerciseData) {
        try {
            const {
                title,
                description,
                task,
                lesson_header,
                lesson_example,
                starting_code,
                requirements,
                expected_output,
                validation_mode,
                experience,
                programming_language_id,
                dialogue_id,
                grants,
                achievements_id,
                mapKey
            } = exerciseData;

            const { data, error } = await this.db
                .from('quests')
                .insert([{
                    title,
                    description,
                    task,
                    lesson_header,
                    lesson_example,
                    starting_code,
                    requirements: requirements ? JSON.stringify(requirements) : null,
                    expected_output,
                    validation_mode,
                    experience,
                    programming_language_id,
                    dialogue_id,
                    grants,
                    achievements_id,
                    mapKey,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) {
                console.error('Error creating exercise:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error in createExercise:', error);
            throw error;
        }
    }

    async getNextExercise(languageId, currentOrder) {
        const { data, error } = await this.db
            .from("quests")
            .select("*")
            .eq("programming_language_id", languageId)
            .gt("order_index", currentOrder)
            .order("order_index", { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("Error getting next exercise:", error);
            throw error;
        }

        return data || null;
    }


    async getLatestUnlockedQuest(userId, languageId) {
        // 1️⃣ Get all completed quests for this language
        const { data: completed, error } = await this.db
            .from('users_game_data')
            .select(`
                exercise_id,
                quests (
                    id,
                    order_index,
                    programming_language_id
                )
            `)
            .eq('user_id', userId)
            .eq('quests.programming_language_id', languageId)

        if (error) {
            console.error("Error fetching completed quests:", error);
            throw error;
        }

        // Filter only this language
        const completedForLanguage = (completed || [])
            .filter(q => q.quests?.programming_language_id === languageId);

        // 2️⃣ If no completed → unlock first quest only
        if (completedForLanguage.length === 0) {
            const { data: first } = await this.db
                .from('quests')
                .select('*')
                .eq('programming_language_id', languageId)
                .order('order_index', { ascending: true })
                .limit(1)
                .single();

            return first;
        }

        // 3️⃣ Find highest completed order
        const maxOrder = Math.max(
            ...completedForLanguage.map(q => q.quests.order_index)
        );

        // 4️⃣ Unlock next quest
        const { data: next } = await this.db
            .from('quests')
            .select('*')
            .eq('programming_language_id', languageId)
            .eq('order_index', maxOrder + 1)
            .maybeSingle();

        return next; // can be null if finished
    }




    // Get all exercises
    async getAllExercises() {
        try {
            const { data, error } = await this.db
                .from('quests')
                .select(`
                    *,
                    programming_languages (
                        id,
                        name,
                        slug
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error getting exercises:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error in getAllExercises:', error);
            throw error;
        }
    }

    // Get exercise by ID
    async getExerciseById(id) {
        try {
            const { data, error } = await this.db
                .from('quests')
                .select(`
                    *,
                    programming_languages (
                        id,
                        name,
                        slug
                    )
                `)
                .eq('id', id)
                .maybeSingle();

            if (error) {
                console.error('Error getting exercise by ID:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error in getExerciseById:', error);
            throw error;
        }
    }

    // Get exercises by programming language
    async getExercisesByLanguage(programmingLanguageId) {
        try {
            const { data, error } = await this.db
                .from('quests')
                .select(`
                    *,
                    programming_languages (
                        id,
                        name,
                        slug
                    )
                `)
                .eq('programming_language_id', programmingLanguageId)
                .order('order_index', { ascending: true });

            if (error) {
                console.error('Error getting exercises by language:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error in getExercisesByLanguage:', error);
            throw error;
        }
    }

    // Update exercise
    async updateExercise(id, exerciseData) {
        try {
            // Build update object with only provided fields
            const updateObject = {};
            
            const {
                title,
                description,
                task,
                lesson_header,
                lesson_example,
                starting_code,
                requirements,
                expected_output,
                validation_mode,
                experience,
                programming_language_id,
                dialogue_id,
                grants,
                achievements_id
            } = exerciseData;

            // Only include fields that are provided
            if (title !== undefined) updateObject.title = title;
            if (description !== undefined) updateObject.description = description;
            if (task !== undefined) updateObject.task = task;
            if (lesson_header !== undefined) updateObject.lesson_header = lesson_header;
            if (lesson_example !== undefined) updateObject.lesson_example = lesson_example;
            if (starting_code !== undefined) updateObject.starting_code = starting_code;
            if (requirements !== undefined) updateObject.requirements = requirements ? JSON.stringify(requirements) : null;
            if (expected_output !== undefined) updateObject.expected_output = expected_output;
            if (validation_mode !== undefined) updateObject.validation_mode = validation_mode;
            if (experience !== undefined) updateObject.experience = experience;
            if (programming_language_id !== undefined) updateObject.programming_language_id = programming_language_id;
            if (dialogue_id !== undefined) updateObject.dialogue_id = dialogue_id;
            if (grants !== undefined) updateObject.grants = grants;
            if (achievements_id !== undefined) updateObject.achievements_id = achievements_id;

            // Always include updated_at
            updateObject.updated_at = new Date().toISOString();

            const { data, error } = await this.db
                .from('quests')
                .update(updateObject)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error updating exercise:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error in updateExercise:', error);
            throw error;
        }
    }

    // Delete exercise
    async deleteExercise(id) {
        try {
            const { data, error } = await this.db
                .from('quests')
                .delete()
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error deleting exercise:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error in deleteExercise:', error);
            throw error;
        }
    }

    async isQuestCompleted(userId, questId) {
        const { data } = await this.db
            .from('users_game_data')
            .select('*')
            .eq('user_id', userId)
            .eq('exercise_id', questId)
            .maybeSingle();

        return !!data;
    }

    async getPreviousQuest(currentQuest) {
        if (!currentQuest.order_index) return null;

        const { data } = await this.db
            .from('quests')
            .select('*')
            .eq('programming_language_id', currentQuest.programming_language_id)
            .lt('order_index', currentQuest.order_index)
            .order('order_index', { ascending: false })
            .limit(1)
            .maybeSingle();

        return data;
    }

    async markQuestComplete(userId, questId) {
        await this.db
            .from('users_game_data')
            .insert({
                user_id: userId,
                exercise_id: questId,
                created_at: new Date().toISOString()
            });
    }

    async addXp(userId, xp) {
        await this.db.rpc('increment_xp', {
            user_id_input: userId,
            xp_input: xp
        });
    }

    async grantAchievement(userId, achievementId) {
        await this.db
            .from('users_achievements')
            .insert({
                user_id: userId,
                achievement_id: achievementId,
                created_at: new Date().toISOString()
            });
    }

}

export default ExerciseModel;
