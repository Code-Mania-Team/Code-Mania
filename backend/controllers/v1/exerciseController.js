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
                achievements_id,
                mapKey
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
                achievements_id,
                mapKey
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
                    mapKey: newExercise.mapKey,
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
            const userId = res.locals.user_id;
            const isAdmin = res.locals.role === "admin" || await this.exerciseModel.isAdminUser(userId);

            // Validate ID
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid exercise id"
                });
            }

            const exercise = await this.exerciseModel.getExerciseById(id);

            // ❌ Quest does not exist
            if (!exercise) {
                return res.status(404).json({
                    success: false,
                    message: "Exercise not found"
                });
            }

            if (isAdmin) {
                return res.status(200).json({
                    success: true,
                    data: exercise
                });
            }

            // If not logged in → allow first quest only
            if (!userId) {
                if (exercise.order_index === 1) {
                    return res.status(200).json({
                        success: true,
                        data: exercise
                    });
                }

                return res.status(403).json({
                    success: false,
                    message: "Authentication required"
                });
            }

            // 🟢 First quest always allowed
            if (exercise.order_index === 1) {
                return res.status(200).json({
                    success: true,
                    data: exercise
                });
            }

            const isCompleted = await this.exerciseModel.isQuestCompleted(userId, id);

            if (isCompleted) {
                return res.status(200).json({
                    success: true,
                    data: exercise
                });
            }

            const latestAllowed = await this.exerciseModel.getLatestUnlockedQuest(
                userId,
                exercise.programming_language_id
            );

            if (!latestAllowed) {
                return res.status(403).json({
                    success: false,
                    message: "Quest locked"
                });
            }

            if (latestAllowed.id === exercise.id) {
                return res.status(200).json({
                    success: true,
                    data: exercise
                });
            }

            return res.status(403).json({
                success: false,
                message: "Quest locked",
                redirectTo: latestAllowed.id
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }





    async getNextExercise(req, res) {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid exercise ID"
                });
            }

            const current = await this.exerciseModel.getExerciseById(id);

            if (!current) {
                return res.status(404).json({
                    success: false,
                    message: "Exercise not found"
                });
            }

            const next = await this.exerciseModel.getNextExercise(
                current.programming_language_id,
                current.order_index
            );

            if (!next) {
                return res.status(200).json({
                    success: true,
                    data: null, // 🔥 IMPORTANT
                    message: "No more exercises"
                });
            }

            return res.status(200).json({
                success: true,
                data: next
            });

        } catch (error) {
            console.error("getNextExercise error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
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
                'achievements_id'
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

    async getLatestUnlocked(req, res) {
        try {
            const userId = res.locals.user_id;
            const { programming_language_id } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized"
                });
            }

            const latest = await this.exerciseModel.getLatestUnlockedQuest(
                userId,
                parseInt(programming_language_id)
            );

            return res.status(200).json({
                success: true,
                data: latest
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }


    // Validate quest output
    async validateExercise(req, res) {
        try {
            const { questId, output, code } = req.body;
            const userId = res.locals.user_id;
            const isAdmin = res.locals.role === "admin" || await this.exerciseModel.isAdminUser(userId);

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }

            if (!questId || typeof output !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "questId and output are required"
                });
            }

            // 1️⃣ Get quest
            const quest = await this.exerciseModel.getExerciseById(questId);

            if (!quest) {
                return res.status(404).json({
                    success: false,
                    message: "Quest not found"
                });
            }

            // 2️⃣ Check quest state (must be active)
            if (!isAdmin) {
                const questState = await this.exerciseModel.getQuestState(userId, questId);

                if (!questState || questState.status !== "active") {
                    return res.status(403).json({
                        success: false,
                        message: "You must start this quest first"
                    });
                }
            }

            // Normalize helper
            const normalize = (text) =>
                (text ?? "")
                    .toString()
                    .replace(/\r\n/g, "\n")
                    .split("\n")
                    .map(line => line.trim())
                    .join("\n")
                    .trim();

            const actual = normalize(output);
            const expected = normalize(quest.expected_output);
            const mode = (quest.validation_mode || "").toUpperCase();

            let validationResult = { success: true };

            // ==================================================
            // 🧠 MULTI OBJECTIVE MODE
            // ==================================================
            if (mode === "MULTI_OBJECTIVE") {
                const results = {};
                let allPassed = true;

                const normalizedOutput = normalize(output);

                for (const obj of quest.requirements.objectives) {
                    let passed = false;

                    if (obj.type === "output_contains") {
                        passed = normalizedOutput.includes(obj.value);
                    }

                    else if (obj.type === "output_equals") {
                        passed = normalizedOutput === obj.value;
                    }

                    else if (obj.type === "output_regex") {
                        const regex = new RegExp(obj.value, "m");
                        passed = regex.test(normalizedOutput);
                    }

                    else if (obj.type === "code_contains") {
                        passed = code.includes(obj.value);
                    }

                    else if (obj.type === "code_regex") {
                        const regex = new RegExp(obj.value, "m");
                        passed = regex.test(code);
                    }

                    else if (obj.type === "min_print_count") {
                        const matches = code.match(/\bprint\s*\(/g);
                        const count = matches ? matches.length : 0;
                        passed = count >= obj.value;
                    }

                    results[obj.id] = {
                        passed,
                        label: obj.label,
                        expected: obj.value
                    };

                    if (!passed) allPassed = false;
                }


                if (!allPassed) {
                    return res.status(200).json({
                        success: false,
                        objectives: results
                    });
                }

                // Store results for final response
                validationResult.objectives = results;
            }

            // ==================================================
            // 🧱 FUNDAMENTALS MODE
            // ==================================================
            else if (mode === "FUNDAMENTALS") {
                if (quest.requirements?.mustInclude) {
                    const missing = quest.requirements.mustInclude.find(keyword =>
                        !code.includes(keyword)
                    );

                    if (missing) {
                        return res.status(200).json({
                            success: false,
                            message: `Code must include "${missing}"`
                        });
                    }
                }
            }

            // ==================================================
            // 🔥 HYBRID MODE
            // ==================================================
            else if (mode === "HYBRID") {

                if (quest.requirements?.mustInclude) {
                    const missing = quest.requirements.mustInclude.find(keyword =>
                        !code.includes(keyword)
                    );

                    if (missing) {
                        return res.status(200).json({
                            success: false,
                            message: `Code must include "${missing}"`
                        });
                    }
                }

                if (expected !== actual) {
                    return res.status(200).json({
                        success: false,
                        message: "Output incorrect"
                    });
                }
            }

            // ==================================================
            // 🎮 PROGRESSION CHECK
            // ==================================================

            if (!isAdmin) {
                const previousQuest =
                    await this.exerciseModel.getPreviousQuest(quest);

                if (previousQuest) {
                    const prevCompleted =
                        await this.exerciseModel.isQuestCompleted(userId, previousQuest.id);

                    if (!prevCompleted) {
                        return res.status(403).json({
                            success: false,
                            message: "Complete previous quest first"
                        });
                    }
                }
            }

            // ==================================================
            // 🏆 MARK COMPLETE
            // ==================================================

            if (!isAdmin) {
                await this.exerciseModel.markQuestComplete(userId, questId);
                await this.exerciseModel.addXp(userId, quest.experience);

                if (quest.achievements_id) {
                    await this.exerciseModel.grantAchievement(
                        userId,
                        quest.achievements_id
                    );
                }
            }

            return res.status(200).json({
                success: true,
                message: isAdmin ? "Quest validated (admin preview)" : "Quest completed",
                xp: isAdmin ? 0 : quest.experience,
                objectives: validationResult.objectives || null
            });

        } catch (error) {
            console.error("validateExercise error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }


    async startExercise(req, res) {
        try {
            const userId = res.locals.user_id;
            const isAdmin = res.locals.role === "admin" || await this.exerciseModel.isAdminUser(userId);
            const { questId } = req.body;

            if (!userId)
                return res.status(401).json({ success: false });

            if (isAdmin) {
                return res.status(200).json({ success: true });
            }

            await this.exerciseModel.startQuest(userId, questId);

            return res.status(200).json({ success: true });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false });
        }
    }



}

export default ExerciseController;
