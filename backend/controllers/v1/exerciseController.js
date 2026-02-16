import ExerciseModel from '../../models/exercises.js';

class ExerciseController {
    constructor() {
        this.exerciseModel = new ExerciseModel();
    }

    // Create a new exercise (admin only)
    async createExercise(req, res) {
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
            } = req.body;

            // Validate required fields
            if (!title || !description || !task || !programming_language_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: title, description, task, programming_language_id'
                });
            }

            // Validate programming_language_id is a number
            if (isNaN(programming_language_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'programming_language_id must be a valid number'
                });
            }

            const exerciseData = {
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
                programming_language_id: parseInt(programming_language_id),
                dialogue_id,
                grants,
                badgeKey
            };

            const newExercise = await this.exerciseModel.createExercise(exerciseData);

            res.status(201).json({
                success: true,
                message: 'Exercise created successfully',
                data: {
                    id: newExercise.id,
                    title: newExercise.title,
                    description: newExercise.description,
                    task: newExercise.task,
                    programming_language_id: newExercise.programming_language_id,
                    experience: newExercise.experience,
                    created_at: newExercise.created_at
                }
            });

        } catch (error) {
            console.error('Error in createExercise:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while creating exercise',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Get all exercises (admin only)
    async getAllExercises(req, res) {
        try {
            const exercises = await this.exerciseModel.getAllExercises();

            res.status(200).json({
                success: true,
                message: 'Exercises retrieved successfully',
                data: exercises
            });

        } catch (error) {
            console.error('Error in getAllExercises:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving exercises',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Get exercise by ID (admin only)
    async getExerciseById(req, res) {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid exercise ID'
                });
            }

            const exercise = await this.exerciseModel.getExerciseById(id);

            if (!exercise) {
                return res.status(404).json({
                    success: false,
                    message: 'Exercise not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Exercise retrieved successfully',
                data: exercise
            });

        } catch (error) {
            console.error('Error in getExerciseById:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving exercise',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Update exercise (admin only)
    async updateExercise(req, res) {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid exercise ID'
                });
            }

            // Check if exercise exists
            const existingExercise = await this.exerciseModel.getExerciseById(id);
            if (!existingExercise) {
                return res.status(404).json({
                    success: false,
                    message: 'Exercise not found'
                });
            }

            // Get only the fields that are provided in the request body
            const updateFields = {};
            const allowedFields = [
                'title',
                'description', 
                'task',
                'lesson_header',
                'lesson_example',
                'starting_code',
                'requirements',
                'expected_output',
                'validation_mode',
                'experience',
                'programming_language_id',
                'dialogue_id',
                'grants',
                'badgeKey'
            ];

            // Build update object with only provided fields
            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    updateFields[field] = req.body[field];
                }
            });

            // Check if at least one field is being updated
            if (Object.keys(updateFields).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields provided for update'
                });
            }

            const updatedExercise = await this.exerciseModel.updateExercise(id, updateFields);

            res.status(200).json({
                success: true,
                message: 'Exercise updated successfully',
                data: updatedExercise
            });

        } catch (error) {
            console.error('Error in updateExercise:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while updating exercise',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Delete exercise (admin only)
    async deleteExercise(req, res) {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid exercise ID'
                });
            }

            // Check if exercise exists
            const existingExercise = await this.exerciseModel.getExerciseById(id);
            if (!existingExercise) {
                return res.status(404).json({
                    success: false,
                    message: 'Exercise not found'
                });
            }

            const deletedExercise = await this.exerciseModel.deleteExercise(id);

            res.status(200).json({
                success: true,
                message: 'Exercise deleted successfully',
                data: deletedExercise
            });

        } catch (error) {
            console.error('Error in deleteExercise:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while deleting exercise',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Get exercises by programming language (admin only)
    async getExercisesByLanguage(req, res) {
        try {
            const { programming_language_id } = req.params;

            if (isNaN(programming_language_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid programming language ID'
                });
            }

            const exercises = await this.exerciseModel.getExercisesByLanguage(programming_language_id);

            res.status(200).json({
                success: true,
                message: 'Exercises retrieved successfully',
                data: exercises
            });

        } catch (error) {
            console.error('Error in getExercisesByLanguage:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving exercises',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

export default ExerciseController;