const joi = require('joi');
const rmdt = require('reformat-markdown-table');
const internals = {};


internals.headers = [
  'path',
  'type',
  'presence',
  'description',
  'default',
  'conforms',
  'unit',
  'allowed',
  'valids',
  'invalids',
  'dependencies',
  'renames',
  'examples',
  'notes',
  'tags',
];


exports.convertSchema = function(schema) {
  const records = internals.convertSchemaToRecords(schema);
  const table = internals.convertRecordsToMarkdownTable(records, internals.headers);

  return {
    md: table,
    records: records,
  };
};


internals.convertSchemaToRecords = function(schema) {
  const rows = [];

  if (!schema || !schema.isJoi) {
    return [];
  }

  internals.appendRecordsFromSchema(rows, schema, undefined, {
    presence: 'optional',
  });

  return rows;
};


internals.appendRecordsFromSchema = function(rows, schema, key, parent_settings) {
  const row = {
    path: key,
    type: schema._type,
    description: schema._description,
    unit: schema._unit,
    examples: internals.codeList(schema._examples),
    notes: internals.codeList(schema._notes),
    tags: internals.codeList(schema._tags),
  };

  const settings = internals.mergeObjects(parent_settings, schema._settings);

  rows.push(row);

  if ('default' in schema._flags) {
    row.default = `\`${JSON.stringify(schema._flags.default)}\``;
  }

  row.presence = schema._flags.presence || settings.presence;

  row.conforms = schema._tests.slice();
  if (schema._flags.format) {
    row.conforms.push({
      name: 'format',
      arg: schema._flags.format === joi.date().iso()._flags.format ? 'iso' : schema._flags.format,
    });
  }
  if (schema._flags.insensitive) {
    row.conforms.push({
      name: 'insensitive',
    });
  }
  row.conforms = row.conforms.map(test => {
    let s = test.name;
    const v = test.arg;
    if (v !== undefined) {
      s += ': ';
      s += v.toISOString ? v.toISOString() : v;
    }
    return `\`${s}\``;
  }).join(', ');

  if (schema._valids._set.length) {
    row[
        schema._flags.allowOnly ? 'valids' : 'allowed'
        ] = internals.codeList(schema._valids._set, true);
  }

  if (schema._invalids._set.length) {
    row.invalids = internals.codeList(schema._invalids._set, true);
  }

  if (schema._inner.dependencies && schema._inner.dependencies.length) {
    row.dependencies = schema._inner.dependencies.map(dep => {
      const peers = internals.codeList(dep.peers, false, ', ');
      switch (dep.type) {
        case 'and':
          return `If one is present, all are required: ${peers}.}`;
        case 'nand':
          return `If one is present, the others may not all be present: ${peers}.}`;
        case 'or':
          return `At least one must appear: ${peers}.}`;
        case 'xor':
          return `One and only one must appear: ${peers}.}`;
        case 'with':
          return `If \`${dep.key}\` is present, ${peers} must appear.}`;
        case 'without':
          return `If \`${dep.key}\` is present, ${peers} must not appear.}`;
        default:
          return '';
      }
    }).join(' ');
  }

  if (schema._inner.renames && schema._inner.renames.length) {
    row.renames = schema._inner.renames.map(rename => {
      let s = `${rename.from} -> ${rename.to}`;
      let opt = [];
      if (rename.options.alias) {
        opt.push('alias');
      }
      if (rename.options.multiple) {
        opt.push('multiple');
      }
      if (rename.options.override) {
        opt.push('override');
      }
      opt = opt.join(',');
      if (opt) {
        s += ` (${opt})`;
      }
      return `\`${s}\``;
    }).join(' ');
  }

  if (schema._inner.matches) {
    schema._inner.matches.forEach(match => {
      if (match.schema) {
        internals.appendRecordsFromSchema(rows, match.schema, key, settings);
      }
    });
  }

  if (schema._inner.inclusions) {
    schema._inner.inclusions.forEach((sub_schema, i) => {
      const k = `${(key || '')} [+${i} ]`;
      internals.appendRecordsFromSchema(rows, sub_schema, k, settings);
    });
  }
  if (schema._inner.exclusions) {
    schema._inner.exclusions.forEach((sub_schema, i) => {
      const k = `${(key || '')} [-${i} ]`;
      internals.appendRecordsFromSchema(rows, sub_schema, k, settings);
    });
  }

  if (schema._inner.children) {
    schema._inner.children.forEach(child => {
      const k = key ? `${key}.${child.key}` : child.key;
      internals.appendRecordsFromSchema(rows, child.schema, k, settings);
    });
  }

  if (schema._type === 'object' && Array.isArray(schema._inner.patterns)) {
    schema._inner.patterns.forEach(pattern => {
      const k = key ? `${key} ` : '';
      internals.appendRecordsFromSchema(rows, pattern.rule, k + pattern.regex, settings);
    });
  }
};


internals.codeList = (inarr, to_json, insep) => {
  let arr = inarr;
  let sep = insep;
  if (!arr || !arr.length) {
    return undefined;
  }
  if (to_json) {
    arr = arr.map(v => {
      return JSON.stringify(v);
    });
  }
  sep = sep || ' ';
  return `\`${arr.join(`\`${sep}\``)}\``;
};


internals.convertRecordsToMarkdownTable = (records, inheaders) => {
  let table;
  let body;
  let headers = inheaders;

  headers = headers.filter(k => {
    let i;
    let v;
    for (i = records.length - 1; i >= 0; i--) {
      v = records[i][k];
      if (v !== null && v !== undefined && v !== '') {
        return true;
      }
    }
    return false;
  });

  body = records.map(rec => {
    return headers.map((k, i) => {
      let v = rec[k];
      if (v === null || v === undefined) {
        return i > 0 ? '' : '-';
      }
      if (v instanceof Date) {
        v = v.toISOString();
      }
      return String(v).replace(/\|/g, '');
    }).join('|');
  }).join('\n');

  table = `${headers.join('|')}\n\n${body}`;
  table = rmdt.reformat(table);

  return table;
};


internals.mergeObjects = function() {
  const result = {};
  const args = arguments;
  let arg_i = 0;
  const args_l = args.length;
  let arg;
  let keys;
  let key_i;
  let key;

  for (; arg_i < args_l; arg_i++) {
    arg = args[arg_i];
    if (arg) {
      keys = Object.keys(arg);
      for (key_i = keys.length - 1; key_i >= 0; key_i--) {
        key = keys[key_i];
        result[key] = arg[key];
      }
    }
  }
  return result;
};
