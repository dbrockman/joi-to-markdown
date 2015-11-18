/**
 * Validation schema for UBI trip end message.
 */
const joi = require('joi');
const number = joi.number();
const positiveNumber = number.positive();
const positiveInteger = positiveNumber.integer();

const some_schema = joi.object().keys({
  another_property: positiveInteger.optional(),

});

module.exports = joi.object().keys({
  some_property: some_schema.required(),
});
