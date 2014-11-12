```js
joi.object().keys({
  a: joi.any().required(),
  b: joi.any().optional(),
  c: joi.any().forbidden()
})
```

| path | type   | presence  |
|------|--------|-----------|
| -    | object | optional  |
| a    | any    | required  |
| b    | any    | optional  |
| c    | any    | forbidden |
