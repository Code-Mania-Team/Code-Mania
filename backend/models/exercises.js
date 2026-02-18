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
                badgeKey
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
                    badgeKey,
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
                .single();
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
                .order('created_at', { ascending: true });
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
                badgeKey
            } = exerciseData;

            const { data, error } = await this.db
                .from('quests')
                .update({
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
                    badgeKey,
                    updated_at: new Date().toISOString()
                })
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
}

export default ExerciseModel;

