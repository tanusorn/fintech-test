import join from "joi";
import Joi from "joi";
export const schemas = {
  register: join.object({
    email: join.string().email().required(),
    password: join.string().min(8).required(),
  }),
  login: join.object({
    email: join.string().email().required(),
    password: join.string().required(),
    recaptchaToken: Joi.string().optional(),
  }),
  order: join
    .object({
      token: join.string().required(),
      side: join.string().valid("BUY", "SELL").required(),
      type: join.string().valid("MARKET", "LIMIT").required(),
      price: join.string().optional(),
      amount: join.string().required(),
    })
    .when(join.object({ type: "LIMIT" }).unknown(), {
      then: join.object({ price: join.string().required() }),
    })
    .when(join.object({ type: "MARKET" }).unknown(), {
      then: join.object({ price: join.forbidden() }),
    }),
};
