const fs = require('fs');
const path = require('path');
const joiToMarkdown = require('../index.js');
const resources = fs.readdirSync(path.join(__dirname, '../resources'));

describe(__filename, () => {
  resources.forEach(resourceName => {
    describe(`test.${resourceName}.markdown.generation.matches.fixture`, () => {
      it('should create a markdown representation of the schema matching the fixture', () => {
        const fixtureName = `${path.basename(resourceName, '.js')}.md`;
        const expected = readFixture(fixtureName);
        const schema = require(path.join(__dirname, '../resources', resourceName)); //eslint-disable-line global-require
        const actual = joiToMarkdown.convertSchema(schema).md;
        actual.should.equal(expected);
      });
    });
  });
});

function readFixture(fixtureName) {
  const fixturePath = path.join(__dirname, '../fixtures', fixtureName);
  return fs.readFileSync(fixturePath, 'utf8');
}
