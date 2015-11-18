const file_system = require('fs');
const path_util = require('path');
const convertSchema = require('..').convertSchema;
// joi used in eval below
const joi = require('Joi');  //eslint-disable-line no-unused-vars

describe('Testing all examples', () => {
  forEachExample((file_name, schema, table) => {
    it(file_name, () => {
      convertSchema(schema).md.should.equal(table);
    });
  });
});

function forEachExample(iterator) {
  const examples_path = path_util.join(__dirname, '../examples');

  file_system.readdirSync(examples_path).forEach(file_name => {
    if (/\.md$/.test(file_name) === false) {
      return;
    }
    const file_path = path_util.join(examples_path, file_name);
    let str = file_system.readFileSync(file_path, 'utf8');
    const code_begins = '```js';
    const code_ends = '```';
    let i = str.indexOf(code_begins);
    if (i < 0) {
      throw new Error(`No code block in ${file_name}`);
    }
    str = str.substr(i + code_begins.length);
    i = str.indexOf(code_ends);
    if (i < 0) {
      throw new Error(`No end of code block in ${file_name}`);
    }
    const schema_str = str.substr(0, i).trim();
    if (/^[Jj]oi\./.test(schema_str) === false) {
      throw new Error(`No joi schema in ${file_name}`);
    }
    const table = str.substr(i + code_ends.length).trim();
    if (!table) {
      throw new Error(`No table in ${file_name}`);
    }
    let schema;
    try {
      schema = eval(schema_str); //eslint-disable-line no-eval
    }
    catch (err) {
      throw new Error(`Unable to eval schema in ${file_name}. Error: ${err}`);
    }
    if (!schema || !schema.isJoi) {
      throw new Error(`No schema in ${file_name}`);
    }
    iterator(file_name, schema, `${table}\n`);
  });
}
