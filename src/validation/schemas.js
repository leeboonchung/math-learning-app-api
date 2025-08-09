const Joi = require('joi');

const submitAnswersSchema = Joi.object({
  attempt_id: Joi.string().uuid().required(),
  answers: Joi.object().pattern(
    Joi.number().integer().positive(), // problem_id
    Joi.string().required() // answer
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
