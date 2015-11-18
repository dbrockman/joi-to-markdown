| path                           | type   | presence | conforms              | invalids      |
|--------------------------------|--------|----------|-----------------------|---------------|
| -                              | object | optional |                       |               |
| some_property                  | object | required |                       |               |
| some_property.another_property | number | optional | `positive`, `integer` | `null` `null` |
