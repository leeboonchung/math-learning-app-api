const Joi = require('joi');

const submitAnswersSchema = Joi.object({
  lesson_id: Joi.string().uuid().required(),
  user_id: Joi.string().uuid().required(),
  answers: Joi.array().items(
    Joi.object({
      problem_id: Joi.string().uuid().required(),
      selected_option_id: Joi.string().uuid().allow(null)
    })
  ).required().min(1)
});

const userRegistrationSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

module.exports = {
  submitAnswersSchema,
  userRegistrationSchema,
  userLoginSchema
};
