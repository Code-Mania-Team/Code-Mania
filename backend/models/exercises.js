import { supabase } from '../core/supabaseClient.js';

class ExerciseModel {
    constructor() {
        this.db = supabase;
    }

    normalizeExercise(row) {
        if (!row) return row;

        // Backwards-compatible: some older rows stored JSONB as a string.
        if (typeof row.requirements === 'string') {
            const trimmed = row.requirements.trim();
            if (trimmed) {
                try {
                    row.requirements = JSON.parse(trimmed);
                } catch {
                    // leave as-is if not valid JSON
                }
            }
        }

        return row;
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
                hints,
                requirements,
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
                    hints: hints || null,
                    requirements: requirements ?? null,
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
                throw error;
            }
            return this.normalizeExercise(data);
        } catch (error) {
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
            throw error;
        }

        return data || null;
    }

    async startQuest(userId, questId) {
        const { data } = await this.db
            .from('users_game_data')
            .select('user_id, exercise_id, status, created_at, completed_at')
            .eq('user_id', userId)
            .eq('exercise_id', questId)
            .maybeSingle();

        if (data) return data; // already started

        const { error } = await this.db
            .from('users_game_data')
            .insert({
                user_id: userId,
                exercise_id: questId,
                status: 'active',
                created_at: new Date().toISOString()
            });

        if (error?.code === '23505') {
            // Race condition / duplicate insert from parallel events
            return { user_id: userId, exercise_id: questId, status: 'active' };
        }

        if (error) throw error;
    }

    async getQuestState(userId, questId) {
        const { data } = await this.db
            .from('users_game_data')
            .select('*')
            .eq('user_id', userId)
            .eq('exercise_id', questId)
            .maybeSingle();

        return data;
    }

    async isAdminUser(userId) {
        if (!userId) return false;

        const { data, error } = await this.db
            .from('users')
            .select('role')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            return false;
        }

        return data?.role === 'admin';
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
            .eq('status', 'completed')
            .eq('quests.programming_language_id', languageId)

        if (error) {
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
                throw error;
            }
        } catch (error) {
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
                    ),
                    achievements:achievements_id (
                        id,
                        title,
                        description,
                        badge_key
                    )
                `)
                .eq('id', id)
                .maybeSingle();

            if (error) {
                throw error;
            }

            return this.normalizeExercise(data);
        } catch (error) {
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
                throw error;
            }
            return (data || []).map((row) => this.normalizeExercise(row));
        } catch (error) {
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
                hints,
                requirements,
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
            if (hints !== undefined) updateObject.hints = hints;
            if (requirements !== undefined) updateObject.requirements = requirements ?? null;
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
                throw error;
            }
            return this.normalizeExercise(data);
        } catch (error) {
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
                throw error;
            }
            return data;
        } catch (error) {
            throw error;
        }
    }

    async isQuestCompleted(userId, questId) {
        const { data } = await this.db
            .from('users_game_data')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'completed')
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

    async getCompletedSideQuestTags(userId, programmingLanguageId) {
        if (!userId || !programmingLanguageId) return [];

        const { data, error } = await this.db
            .from('user_side_quests')
            .select('side_quests!inner(tag, programming_language_id)')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .eq('side_quests.programming_language_id', programmingLanguageId);

        if (error) throw error;

        const tags = new Set();
        (data || []).forEach((row) => {
            const tag = String(row?.side_quests?.tag || '').trim().toLowerCase();
            if (tag) tags.add(tag);
        });

        return Array.from(tags);
    }

    async markQuestComplete(userId, questId) {
        const { error } = await this.db
            .from('users_game_data')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('exercise_id', questId);

        if (error) throw error;
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
